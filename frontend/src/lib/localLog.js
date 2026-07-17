// Keeps a copy of the raw log text in this browser only, keyed by the
// keccak256 hash that went onchain. Nothing here ever leaves the device;
// the chain only stores the hash. If localStorage is unavailable the app
// still works, the student just has no local copy to re-read.

const key = (account, hash) => `siweslog:${account.toLowerCase()}:${hash}`

export function saveLogText(account, hash, text, label) {
  try {
    localStorage.setItem(
      key(account, hash),
      JSON.stringify({ text, label, savedAt: Date.now() }),
    )
  } catch {
    // storage full or disabled: submission must not fail because of this
  }
}

export function getLogText(account, hash) {
  try {
    const raw = localStorage.getItem(key(account, hash))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
