// In-page anchors must not reach the hash router, which owns `location.hash`.
export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
}

export function onAnchorClick(event, id) {
  event.preventDefault()
  scrollToId(id)
}
