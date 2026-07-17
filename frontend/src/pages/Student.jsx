import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAddress, keccak256, toUtf8Bytes } from 'ethers'
import {
  getReadContract,
  getWriteContract,
  sendWithTightGas,
  shortAddress,
} from '../lib/contract'
import { useWallet } from '../hooks/useWallet'
import StatusBadge from '../components/StatusBadge'
import TxBanner from '../components/TxBanner'
import { formatDate, shortHash } from '../lib/contract'

function friendlyTxError(err) {
  if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
    return 'Transaction was rejected in the wallet'
  }
  if (err.reason) return `Contract said: ${err.reason}`
  if (err.shortMessage) return err.shortMessage
  return 'Transaction failed. Check your MON balance and try again.'
}

export default function Student() {
  const { signer, account, connect, connecting, error: walletError } = useWallet()

  const [profile, setProfile] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [tx, setTx] = useState(null)

  // registration form
  const [name, setName] = useState('')
  const [matric, setMatric] = useState('')
  const [institution, setInstitution] = useState('')
  const [supervisor, setSupervisor] = useState('')
  const [formError, setFormError] = useState('')

  // log entry form
  const [weekLabel, setWeekLabel] = useState('')
  const [logText, setLogText] = useState('')

  const logHash = useMemo(
    () => (logText.trim() ? keccak256(toUtf8Bytes(logText)) : null),
    [logText],
  )

  const refresh = useCallback(async () => {
    if (!account) return
    setLoading(true)
    try {
      const contract = getReadContract()
      const p = await contract.students(account)
      setProfile(p)
      setEntries(p.registered ? await contract.getEntries(account) : [])
    } finally {
      setLoading(false)
    }
  }, [account])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleRegister(e) {
    e.preventDefault()
    setFormError('')
    if (!name.trim() || !matric.trim() || !institution.trim()) {
      setFormError('All fields are required')
      return
    }
    if (!isAddress(supervisor.trim())) {
      setFormError('Supervisor wallet is not a valid address')
      return
    }
    try {
      setTx({ status: 'pending' })
      const contract = getWriteContract(signer)
      const sent = await sendWithTightGas(contract, 'register', [
        name.trim(),
        matric.trim(),
        institution.trim(),
        supervisor.trim(),
      ])
      setTx({ status: 'pending', hash: sent.hash })
      await sent.wait()
      setTx({ status: 'confirmed', hash: sent.hash })
      await refresh()
    } catch (err) {
      setTx({ status: 'error', message: friendlyTxError(err) })
    }
  }

  async function handleSubmitEntry(e) {
    e.preventDefault()
    setFormError('')
    if (!logText.trim()) {
      setFormError('Write your log entry first')
      return
    }
    if (!weekLabel.trim()) {
      setFormError('Add a week and day label, e.g. Week 3 - Day 2')
      return
    }
    try {
      setTx({ status: 'pending' })
      const contract = getWriteContract(signer)
      const sent = await sendWithTightGas(contract, 'submitEntry', [
        logHash,
        weekLabel.trim(),
      ])
      setTx({ status: 'pending', hash: sent.hash })
      await sent.wait()
      setTx({ status: 'confirmed', hash: sent.hash })
      setLogText('')
      setWeekLabel('')
      await refresh()
    } catch (err) {
      setTx({ status: 'error', message: friendlyTxError(err) })
    }
  }

  if (!account) {
    return (
      <div className="page">
        <div>
          <h1 className="page-title">Student dashboard</h1>
          <p className="page-sub">
            Submit your daily SIWES log as a hash on Monad. The text itself
            never leaves your browser.
          </p>
        </div>
        <div className="connect-box">
          <p className="muted">
            Connect the wallet you use for your SIWES logbook.
          </p>
          <button className="btn" onClick={connect} disabled={connecting}>
            {connecting ? 'CONNECTING…' : 'CONNECT METAMASK'}
          </button>
          {walletError && <p className="error-note">{walletError}</p>}
        </div>
      </div>
    )
  }

  if (loading && !profile) {
    return (
      <div className="page">
        <p className="muted">Loading your profile from the contract…</p>
      </div>
    )
  }

  // not registered yet: show the registration form
  if (profile && !profile.registered) {
    return (
      <div className="page">
        <div>
          <h1 className="page-title">Register as a SIWES student</h1>
          <p className="page-sub">
            One-time onchain registration. Your supervisor's wallet is linked
            so only they can approve your entries.
          </p>
        </div>
        <span className="wallet-chip">
          CONNECTED <b>{shortAddress(account)}</b>
        </span>
        <form className="panel" onSubmit={handleRegister} style={{ maxWidth: 560 }}>
          <div className="field">
            <label htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Adaeze Okafor"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-matric">Matric number</label>
            <input
              id="reg-matric"
              className="mono"
              value={matric}
              onChange={(e) => setMatric(e.target.value)}
              placeholder="e.g. 2025/B/SENG/0467"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-inst">Institution</label>
            <input
              id="reg-inst"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Miva Open University"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-sup">Supervisor wallet address</label>
            <input
              id="reg-sup"
              className="mono"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              placeholder="0x…"
              spellCheck="false"
            />
          </div>
          {formError && <p className="error-note">{formError}</p>}
          <TxBanner tx={tx} />
          <button className="btn" type="submit" disabled={tx?.status === 'pending'}>
            {tx?.status === 'pending' ? 'REGISTERING…' : 'REGISTER ONCHAIN'}
          </button>
        </form>
      </div>
    )
  }

  // registered: submit entries + history
  return (
    <div className="page">
      <div>
        <h1 className="page-title">
          {profile?.name} <span className="muted mono" style={{ fontSize: 13 }}>{profile?.matricNumber}</span>
        </h1>
        <p className="page-sub">
          {profile?.institution} · supervisor {shortAddress(profile?.supervisor || '')} · connected as{' '}
          {shortAddress(account)}
        </p>
      </div>

      <div className="split">
        <form className="panel" onSubmit={handleSubmitEntry}>
          <p className="panel-title">New log entry</p>
          <div className="field">
            <label htmlFor="entry-label">Week / day label</label>
            <input
              id="entry-label"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              placeholder="e.g. Week 3 - Day 2"
            />
          </div>
          <div className="field" style={{ flex: 1, minHeight: 0 }}>
            <label htmlFor="entry-text">What did you do today?</label>
            <textarea
              id="entry-text"
              rows={6}
              style={{ flex: 1 }}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              placeholder="Describe your work for the day. Only the keccak256 hash of this text goes onchain."
            />
          </div>
          {logHash && (
            <div className="hash-preview" title="keccak256 of your entry text">
              {logHash}
            </div>
          )}
          {formError && <p className="error-note">{formError}</p>}
          <TxBanner tx={tx} />
          <button className="btn" type="submit" disabled={tx?.status === 'pending'}>
            {tx?.status === 'pending' ? 'SUBMITTING…' : 'SUBMIT ENTRY'}
          </button>
        </form>

        <section className="panel">
          <p className="panel-title">
            Your entries ({entries.length})
          </p>
          {entries.length === 0 ? (
            <p className="muted">
              Nothing submitted yet. Your first entry will appear here.
            </p>
          ) : (
            <ul className="entry-list scroll-area">
              {[...entries].map((entry, i) => ({ entry, i })).reverse().map(({ entry, i }) => (
                <li key={i}>
                  <div className="grow">
                    <div className="entry-label" style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {entry.weekLabel || `Entry ${i + 1}`}
                    </div>
                    <div className="entry-date mono muted" style={{ fontSize: 11 }}>
                      {formatDate(entry.timestamp)} · {shortHash(entry.contentHash)}
                    </div>
                  </div>
                  <StatusBadge approved={entry.approved} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
