import { useState } from 'react'
import { isAddress } from 'ethers'
import {
  getReadContract,
  explorerAddress,
  shortHash,
  formatDate,
} from '../lib/contract'
import { CONTRACT_ADDRESS } from '../constants'
import StatusBadge from '../components/StatusBadge'

export default function Verify() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [record, setRecord] = useState(null)

  async function lookup(e) {
    e.preventDefault()
    const target = address.trim()
    if (!isAddress(target)) {
      setError('That does not look like a valid wallet address')
      return
    }
    setLoading(true)
    setError('')
    setRecord(null)
    try {
      const contract = getReadContract()
      const profile = await contract.students(target)
      if (!profile.registered) {
        setError('No student is registered at this address')
        return
      }
      const entries = await contract.getEntries(target)
      setRecord({ address: target, profile, entries })
    } catch {
      setError('Could not reach the contract. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const approvedCount = record
    ? record.entries.filter((entry) => entry.approved).length
    : 0

  return (
    <div className="page">
      <div>
        <h1 className="page-title">Verify a training record</h1>
        <p className="page-sub">
          Paste a student wallet address to pull their SIWES logbook straight
          from the Monad blockchain. No account needed.
        </p>
      </div>

      <form className="lookup-bar" onSubmit={lookup}>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x student wallet address"
          spellCheck="false"
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'CHECKING…' : 'VERIFY'}
        </button>
      </form>

      {error && <p className="error-note">{error}</p>}

      {!record && !error && (
        <div className="empty-state">
          <p className="big">AWAITING LOOKUP</p>
          <p>
            Every record shown here is read directly from the SIWESLog contract.
            Entries cannot be edited or backdated after submission.
          </p>
        </div>
      )}

      {record && (
        <section className="certificate">
          <div className="cert-head">
            <div>
              <p className="cert-label">Official SIWES Training Record</p>
              <h2 className="cert-name">{record.profile.name}</h2>
              <p className="cert-matric">{record.profile.matricNumber}</p>
              <p className="cert-inst">{record.profile.institution}</p>
            </div>
            <div className="cert-stamp">
              ONCHAIN
              <br />
              VERIFIED
            </div>
          </div>

          <div className="cert-meta">
            <span>
              STUDENT{' '}
              <a
                href={explorerAddress(record.address)}
                target="_blank"
                rel="noreferrer"
              >
                {record.address}
              </a>
            </span>
            <span>SUPERVISOR {record.profile.supervisor}</span>
          </div>

          <div className="cert-stats">
            <div className="stat">
              <div className="stat-num">{record.entries.length}</div>
              <div className="stat-label">Entries</div>
            </div>
            <div className="stat">
              <div className="stat-num green">{approvedCount}</div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat">
              <div className="stat-num orange">
                {record.entries.length - approvedCount}
              </div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          {record.entries.length === 0 ? (
            <p className="muted">No log entries submitted yet.</p>
          ) : (
            <ol className="timeline scroll-area">
              {record.entries.map((entry, i) => (
                <li key={i}>
                  <div className="entry-when">
                    <div className="entry-label">{entry.weekLabel || `Entry ${i + 1}`}</div>
                    <div className="entry-date">{formatDate(entry.timestamp)}</div>
                  </div>
                  <span className="entry-hash" title={entry.contentHash}>
                    {shortHash(entry.contentHash)}
                  </span>
                  <StatusBadge approved={entry.approved} />
                </li>
              ))}
            </ol>
          )}

          <footer className="cert-foot">
            Verified against SIWESLog contract{' '}
            <a
              href={explorerAddress(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noreferrer"
            >
              {shortHash(CONTRACT_ADDRESS)}
            </a>{' '}
            on Monad Testnet · chain ID 10143
          </footer>
        </section>
      )}
    </div>
  )
}
