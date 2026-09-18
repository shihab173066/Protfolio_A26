// Generates an ATS-friendly A4 résumé from the live portfolio content.
//
// DESIGN NOTES
// ------------
// * Everything is drawn with jsPDF's text API, never rasterised. Applicant
//   tracking systems read the PDF text layer; an html2canvas screenshot would
//   extract as zero characters and fail the whole point of the document.
// * Single column, no tables, no text boxes, conventional uppercase section
//   headings, core Helvetica. The photo is the only non-text element and sits
//   outside the text column so it can never interrupt the reading order.
// * Margins are enforced by one chokepoint: `ensure()`. It is the only thing
//   that advances `y` past a line, so no draw call can land outside the box.
// * Two-page cap: render at a density preset, count pages, retry tighter. The
//   last preset renders with a hard stop that refuses to open a third page.

const MAX_PAGES = 2

const PAGE = { w: 595.28, h: 841.89 } // A4 portrait, points
const M = { top: 40, right: 42, bottom: 44, left: 42 }
const CONTENT_W = PAGE.w - M.left - M.right
const RIGHT_EDGE = M.left + CONTENT_W

const PHOTO_PT = 74
const PHOTO_GAP = 14
const BULLET_INDENT = 11

const INK = [17, 24, 39]
const MUTED = [75, 85, 99]

// Ordered most generous → tightest. Per the brief: trim the oldest roles'
// bullets first, then the project list; job titles, employers and dates are
// never dropped.
const PRESETS = [
  { base: 9.8, lead: 1.32, gap: 9.0, bulletsRecent: 6, bulletsOlder: 3, projects: 8, tags: true },
  { base: 9.4, lead: 1.27, gap: 8.0, bulletsRecent: 5, bulletsOlder: 2, projects: 8, tags: true },
  { base: 9.0, lead: 1.23, gap: 7.0, bulletsRecent: 4, bulletsOlder: 2, projects: 6, tags: false },
  { base: 8.6, lead: 1.19, gap: 6.0, bulletsRecent: 4, bulletsOlder: 1, projects: 5, tags: false },
  { base: 8.2, lead: 1.16, gap: 5.0, bulletsRecent: 3, bulletsOlder: 1, projects: 4, tags: false },
]

/** Thrown by `ensure()` when the hard page cap is hit; unwinds to `render()`. */
class PageLimitReached extends Error {}

const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim()
const hasText = (v) => clean(v).length > 0

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''))
  if (!m) return [37, 99, 235]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// ---------------------------------------------------------------- photo

/**
 * Fetches the profile photo and returns a square, centre-cropped JPEG data URL.
 * Resolves against `document.baseURI` because vite is configured with
 * `base: './'` under hash routing — a bare './x.jpg' would otherwise resolve
 * against the current hash route and 404.
 * Returns null on any failure; a missing photo must never block the download.
 */
async function loadPhoto(profile) {
  const candidates = []
  if (hasText(profile?.photoUrl)) candidates.push(clean(profile.photoUrl))
  candidates.push('Shihab_picture.jpg')

  for (const candidate of candidates) {
    try {
      const url = /^(https?:|data:|blob:)/i.test(candidate)
        ? candidate
        : new URL(candidate.replace(/^\.?\//, ''), document.baseURI).href

      const res = await fetch(url)
      if (!res.ok) continue
      const bitmap = await createImageBitmap(await res.blob())

      const side = Math.min(bitmap.width, bitmap.height)
      const out = 320
      const canvas = document.createElement('canvas')
      canvas.width = out
      canvas.height = out
      const ctx = canvas.getContext('2d')
      // Flatten onto white: JPEG has no alpha, and transparent PNGs would
      // otherwise come out black.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, out, out)
      ctx.drawImage(
        bitmap,
        (bitmap.width - side) / 2,
        (bitmap.height - side) / 2,
        side,
        side,
        0,
        0,
        out,
        out,
      )
      bitmap.close?.()
      return canvas.toDataURL('image/jpeg', 0.85)
    } catch {
      // Try the next candidate.
    }
  }
  return null
}

// ---------------------------------------------------------------- layout

/**
 * Wraps a sequence of styled runs into lines, merging adjacent words that share
 * a style into a single segment. The merge matters for ATS extraction: one text
 * operation per style run per line reads back as clean prose, where one op per
 * word can extract as f r a g m e n t e d text in weaker parsers.
 */
function layoutRuns(doc, runs, width) {
  const lines = []
  let cur = []
  let x = 0

  const flush = () => {
    if (cur.length) lines.push(cur)
    cur = []
    x = 0
  }

  /**
   * Splits a word that is wider than the whole column into pieces that fit.
   * Without this a long unbroken token — a URL, a hyphen-free identifier —
   * would be drawn straight through the right margin.
   */
  const hardBreak = (word, limit) => {
    if (doc.getTextWidth(word) <= limit) return [word]
    const pieces = []
    let piece = ''
    for (const ch of word) {
      if (piece && doc.getTextWidth(piece + ch) > limit) {
        pieces.push(piece)
        piece = ch
      } else {
        piece += ch
      }
    }
    if (piece) pieces.push(piece)
    return pieces
  }

  for (const run of runs) {
    const rawWords = clean(run.text).split(' ').filter(Boolean)
    if (!rawWords.length) continue
    doc.setFont('helvetica', run.style || 'normal')
    doc.setFontSize(run.size)
    const spaceW = doc.getTextWidth(' ')
    const words = rawWords.flatMap((w) => hardBreak(w, width))

    for (const word of words) {
      const wordW = doc.getTextWidth(word)
      const gap = x > 0 ? spaceW : 0

      if (x > 0 && x + gap + wordW > width) {
        flush()
        doc.setFont('helvetica', run.style || 'normal')
        doc.setFontSize(run.size)
      }

      const dx = x > 0 ? x + spaceW : 0
      const last = cur[cur.length - 1]
      if (last && last.style === (run.style || 'normal') && last.size === run.size) {
        last.text += ' ' + word
      } else {
        cur.push({ text: word, style: run.style || 'normal', size: run.size, x: dx, color: run.color })
      }
      x = dx + wordW
    }
  }

  flush()
  return lines
}

/** A render pass. One instance owns the cursor and the page budget. */
function createPass(doc, preset, hardStop) {
  let y = M.top
  let pages = 1

  const lh = (size = preset.base) => size * preset.lead

  function breakPage() {
    if (pages >= MAX_PAGES && hardStop) throw new PageLimitReached()
    doc.addPage()
    pages += 1
    y = M.top
  }

  function ensure(height) {
    if (y + height <= PAGE.h - M.bottom) return
    breakPage()
  }

  /** True if `height` still fits on the current page without breaking. */
  const fitsHere = (height) => y + height <= PAGE.h - M.bottom

  function setFont(size, style = 'normal', color = INK) {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(color[0], color[1], color[2])
  }

  /** Draws pre-laid-out lines, page-breaking between them as needed. */
  function drawLines(lines, { x = M.left, size = preset.base, indent = 0, bullet = null, color = INK }) {
    const step = lh(size)
    lines.forEach((segments, i) => {
      ensure(step)
      if (bullet && i === 0) {
        setFont(size, 'normal', color)
        doc.text(bullet, x, y + size * 0.85)
      }
      for (const seg of segments) {
        setFont(seg.size ?? size, seg.style ?? 'normal', seg.color ?? color)
        doc.text(seg.text, x + indent + seg.x, y + (seg.size ?? size) * 0.85)
      }
      y += step
    })
  }

  /** Wraps `runs` to `width` and draws them. Returns the height consumed. */
  function paragraph(runs, opts = {}) {
    const indent = opts.indent || 0
    const width = (opts.width ?? CONTENT_W) - indent
    const lines = layoutRuns(doc, runs, width)
    drawLines(lines, { ...opts, indent })
    return lines.length * lh(opts.size ?? preset.base)
  }

  /** Measures without drawing — used for widow control. */
  function measure(runs, opts = {}) {
    const indent = opts.indent || 0
    const width = (opts.width ?? CONTENT_W) - indent
    return layoutRuns(doc, runs, width).length * lh(opts.size ?? preset.base)
  }

  return {
    get y() {
      return y
    },
    set y(v) {
      y = v
    },
    get pages() {
      return pages
    },
    lh,
    ensure,
    breakPage,
    fitsHere,
    setFont,
    paragraph,
    measure,
    drawLines,
  }
}

// ---------------------------------------------------------------- sections

function drawHeader(pass, doc, profile, photo, accent, preset) {
  let hasPhoto = Boolean(photo)
  const textW = hasPhoto ? CONTENT_W - PHOTO_PT - PHOTO_GAP : CONTENT_W

  if (hasPhoto) {
    // Drawn before the text so a tall name block flows beside it, never over it.
    try {
      doc.addImage(photo, 'JPEG', RIGHT_EDGE - PHOTO_PT, M.top, PHOTO_PT, PHOTO_PT)
    } catch {
      hasPhoto = false
    }
  }

  const top = pass.y
  const nameSize = Math.max(17, preset.base + 8)

  pass.paragraph([{ text: profile.name || 'Resume', size: nameSize, style: 'bold' }], {
    size: nameSize,
    width: textW,
  })

  if (hasText(profile.role)) {
    pass.y += 1
    pass.paragraph([{ text: profile.role, size: preset.base + 1.2, color: accent }], {
      size: preset.base + 1.2,
      width: textW,
      color: accent,
    })
  }

  // Contact details as plain text — the format ATS parsers read most reliably.
  const contact = [profile.email, profile.phone, profile.location].filter(hasText).map(clean)
  if (contact.length) {
    pass.y += 2
    pass.paragraph([{ text: contact.join('  |  '), size: preset.base, color: MUTED }], {
      size: preset.base,
      width: textW,
      color: MUTED,
    })
  }

  const links = (profile.socials || [])
    .filter((s) => hasText(s?.url))
    .map((s) => clean(s.url).replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''))
  if (links.length) {
    pass.paragraph([{ text: links.join('  |  '), size: preset.base - 0.4, color: MUTED }], {
      size: preset.base - 0.4,
      width: textW,
      color: MUTED,
    })
  }

  // Keep the rule below the photo when the text block is shorter than it.
  if (hasPhoto) pass.y = Math.max(pass.y, top + PHOTO_PT)

  pass.y += 8
  doc.setDrawColor(accent[0], accent[1], accent[2])
  doc.setLineWidth(1.1)
  doc.line(M.left, pass.y, RIGHT_EDGE, pass.y)
  pass.y += preset.gap + 2
}

function drawHeading(pass, doc, text, accent, preset) {
  const size = preset.base + 1.2
  // Keep a heading with at least one line of its body.
  if (!pass.fitsHere(pass.lh(size) + pass.lh() + 6)) pass.breakPage()

  // Routed through paragraph() so an over-long custom section title wraps
  // rather than running past the right margin.
  pass.paragraph([{ text: String(text).toUpperCase(), size, style: 'bold' }], { size })
  pass.y -= 1

  doc.setDrawColor(accent[0], accent[1], accent[2])
  doc.setLineWidth(0.5)
  doc.line(M.left, pass.y, RIGHT_EDGE, pass.y)
  pass.y += preset.gap * 0.55
}

function drawExperience(pass, doc, items, preset) {
  items.forEach((item, index) => {
    const bulletCap = index < 2 ? preset.bulletsRecent : preset.bulletsOlder
    const bullets = (item.bullets || []).filter(hasText).slice(0, bulletCap)

    const roleSize = preset.base + 0.4
    const dates = clean(item.meta)

    // Widow control: never strand a role header at the foot of a page.
    const firstBulletH = bullets.length
      ? pass.measure([{ text: bullets[0], size: preset.base }], { indent: BULLET_INDENT })
      : 0
    const headerH = pass.lh(roleSize) + pass.lh()
    if (!pass.fitsHere(headerH + firstBulletH)) pass.breakPage()

    // Role on the left, dates right-aligned on the same line when they fit.
    pass.setFont(roleSize, 'bold')
    const roleW = doc.getTextWidth(clean(item.title))
    pass.setFont(preset.base, 'normal')
    const datesW = dates ? doc.getTextWidth(dates) : 0
    const sameLine = dates && roleW + datesW + 18 <= CONTENT_W

    // Reserve the line first so the right-aligned dates and the first line of
    // the role title share a baseline even if the title wraps below.
    pass.ensure(pass.lh(roleSize))
    if (sameLine) {
      pass.setFont(preset.base, 'normal', MUTED)
      doc.text(dates, RIGHT_EDGE, pass.y + roleSize * 0.85, { align: 'right' })
    }
    // paragraph() wraps and hard-breaks, so a very long role title cannot
    // overrun the dates or the right margin.
    pass.paragraph([{ text: item.title, size: roleSize, style: 'bold' }], {
      size: roleSize,
      width: sameLine ? CONTENT_W - datesW - 18 : CONTENT_W,
    })

    const org = [clean(item.subtitle), clean(item.badge)].filter(Boolean).join(' · ')
    const orgLine = sameLine ? org : [org, dates].filter(Boolean).join(' · ')
    if (orgLine) {
      pass.paragraph([{ text: orgLine, size: preset.base, style: 'bold', color: MUTED }], {
        size: preset.base,
        color: MUTED,
      })
    }

    if (hasText(item.description)) {
      pass.paragraph([{ text: item.description, size: preset.base - 0.4, style: 'italic', color: MUTED }], {
        size: preset.base - 0.4,
        color: MUTED,
      })
    }

    pass.y += 1.5
    for (const bullet of bullets) {
      pass.paragraph([{ text: bullet, size: preset.base }], {
        size: preset.base,
        indent: BULLET_INDENT,
        bullet: '•',
      })
    }

    if (preset.tags && (item.tags || []).length) {
      pass.paragraph(
        [
          { text: 'Tools:', size: preset.base - 0.5, style: 'bold', color: MUTED },
          { text: item.tags.filter(hasText).join(', '), size: preset.base - 0.5, color: MUTED },
        ],
        { size: preset.base - 0.5, indent: BULLET_INDENT, color: MUTED },
      )
    }

    if (index < items.length - 1) pass.y += preset.gap * 0.5
  })
}

function drawSkills(pass, items, preset) {
  for (const group of items) {
    const tags = (group.tags || []).filter(hasText)
    if (!tags.length && !hasText(group.description)) continue
    pass.paragraph(
      [
        { text: `${clean(group.title)}:`, size: preset.base, style: 'bold' },
        { text: tags.length ? tags.join(', ') : clean(group.description), size: preset.base },
      ],
      { size: preset.base },
    )
    pass.y += 1
  }
}

function drawProjects(pass, items, preset) {
  for (const item of items) {
    const runs = [{ text: clean(item.title), size: preset.base, style: 'bold' }]
    const detail = [clean(item.subtitle), clean(item.description)].filter(Boolean).join(' — ')
    if (detail) runs.push({ text: `— ${detail}`, size: preset.base })
    if (preset.tags && (item.tags || []).length) {
      runs.push({ text: `(${item.tags.filter(hasText).join(', ')})`, size: preset.base - 0.5, color: MUTED })
    }
    pass.paragraph(runs, { size: preset.base, indent: BULLET_INDENT, bullet: '•' })
    pass.y += 1
  }
}

function drawList(pass, items, preset) {
  for (const item of items) {
    const head = [{ text: clean(item.title), size: preset.base, style: 'bold' }]
    const tail = [clean(item.subtitle), clean(item.meta)].filter(Boolean).join(' · ')
    if (tail) head.push({ text: `— ${tail}`, size: preset.base, color: MUTED })
    pass.paragraph(head, { size: preset.base })

    if (hasText(item.description)) {
      pass.paragraph([{ text: item.description, size: preset.base - 0.4, color: MUTED }], {
        size: preset.base - 0.4,
        indent: BULLET_INDENT,
        color: MUTED,
      })
    }

    // Joined rather than stacked — these are short facts (course names,
    // languages, awards) and one wrapped line costs far less vertical space.
    const bullets = (item.bullets || []).filter(hasText)
    if (bullets.length) {
      pass.paragraph([{ text: bullets.join(' · '), size: preset.base - 0.4, color: MUTED }], {
        size: preset.base - 0.4,
        indent: BULLET_INDENT,
        color: MUTED,
      })
    }
    pass.y += 1.5
  }
}

const CANONICAL_HEADING = {
  skills: 'Technical Skills',
  timeline: 'Professional Experience',
  cards: 'Key Projects',
}

function render(doc, content, preset, photo, hardStop) {
  const profile = content.profile || {}
  const accent = hexToRgb(content?.theme?.accent)
  const pass = createPass(doc, preset, hardStop)

  try {
    drawHeader(pass, doc, profile, photo, accent, preset)

    // profile.summary exists purely for the résumé and is rendered nowhere on
    // the site; fall back to an about/text section body if it is empty.
    const sections = (content.sections || []).filter((s) => s && s.type !== 'contact')
    const aboutBody = sections.find((s) => s.type === 'about' || s.type === 'text')?.body
    const summary = hasText(profile.summary) ? profile.summary : clean(aboutBody).slice(0, 600)

    if (hasText(summary)) {
      drawHeading(pass, doc, 'Professional Summary', accent, preset)
      pass.paragraph([{ text: summary, size: preset.base }], { size: preset.base })
      pass.y += preset.gap
    }

    for (const section of sections) {
      if (section.type === 'about' || section.type === 'text') continue
      const items = (section.items || []).filter(Boolean)
      if (!items.length) continue

      const heading = CANONICAL_HEADING[section.type] || section.title || 'Additional'
      drawHeading(pass, doc, heading, accent, preset)

      if (section.type === 'skills') drawSkills(pass, items, preset)
      else if (section.type === 'timeline') drawExperience(pass, doc, items, preset)
      else if (section.type === 'cards') drawProjects(pass, items.slice(0, preset.projects), preset)
      else drawList(pass, items, preset)

      pass.y += preset.gap
    }
  } catch (err) {
    if (!(err instanceof PageLimitReached)) throw err
    // Hard cap hit: keep what fit and stop. Only reachable on the last preset.
  }

  return pass.pages
}

// ---------------------------------------------------------------- public API

export function resumeFileName(profile) {
  const base = clean(profile?.name) || 'Resume'
  return `${base.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}-Resume.pdf`
}

/**
 * Builds the résumé and returns a PDF Blob, guaranteed to be at most two A4
 * pages. Tries each density preset in turn and keeps the first that fits.
 */
export async function generateResumePdf(content) {
  const { jsPDF } = await import('jspdf')
  const photo = await loadPhoto(content?.profile)

  let fallback = null
  for (let i = 0; i < PRESETS.length; i += 1) {
    const isLast = i === PRESETS.length - 1
    const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })

    doc.setLanguage('en-US')
    doc.setProperties({
      title: `${clean(content?.profile?.name) || 'Résumé'} — Résumé`,
      author: clean(content?.profile?.name),
      subject: clean(content?.profile?.role),
      keywords: (content?.sections || [])
        .filter((s) => s?.type === 'skills')
        .flatMap((s) => (s.items || []).flatMap((it) => it.tags || []))
        .filter(hasText)
        .join(', '),
      creator: 'shihab-portfolio',
    })

    const pages = render(doc, content, PRESETS[i], photo, isLast)
    fallback = doc
    if (pages <= MAX_PAGES) return doc.output('blob')
  }

  // Unreachable in practice: the last preset renders with a hard stop.
  return fallback.output('blob')
}
