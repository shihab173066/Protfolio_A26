import { ref } from 'vue'
import { useContent } from './useContent'
import { generateResumePdf, resumeFileName } from '../utils/resumePdf'

// Drives the "Download resume" buttons. The PDF is built from live content at
// click time, so admin edits land in the next download without a rebuild.

const generating = ref(false)
const error = ref('')

/** An admin-supplied absolute URL wins over generation; a relative path does not. */
const externalResumeUrl = (profile) => {
  const url = String(profile?.resumeUrl || '').trim()
  return /^https?:\/\//i.test(url) ? url : ''
}

export function useResume() {
  const { state } = useContent()

  async function downloadResume() {
    if (generating.value) return
    error.value = ''

    const external = externalResumeUrl(state.content?.profile)
    if (external) {
      window.open(external, '_blank', 'noopener')
      return
    }

    generating.value = true
    try {
      const blob = await generateResumePdf(state.content)
      // Same download pattern as exportJson() in AdminView.vue.
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = resumeFileName(state.content?.profile)
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[resume] generation failed', err)
      error.value = 'Could not build the PDF. Please try again.'
    } finally {
      generating.value = false
    }
  }

  return { generating, error, downloadResume }
}
