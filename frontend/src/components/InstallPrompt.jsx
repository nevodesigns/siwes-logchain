import { useEffect, useState } from 'react'

const DISMISS_KEY = 'siweslog:install-dismissed'

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      // storage disabled: just never remember the dismissal
    }
    if (dismissed) return

    const onPrompt = (e) => {
      e.preventDefault()
      setPromptEvent(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!promptEvent) return null

  async function install() {
    promptEvent.prompt()
    await promptEvent.userChoice
    setPromptEvent(null)
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // fine, the banner just comes back next visit
    }
    setPromptEvent(null)
  }

  return (
    <div className="install-banner">
      <span>Install this app on your phone</span>
      <div className="install-actions">
        <button type="button" className="btn btn-small" onClick={install}>
          INSTALL
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={dismiss}
        >
          Not now
        </button>
      </div>
    </div>
  )
}
