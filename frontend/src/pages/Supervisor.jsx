import { useCallback, useEffect, useState } from 'react'
import {
  getReadContract,
  getWriteContract,
  sendWithTightGas,
  shortAddress,
  shortHash,
  formatDate,
} from '../lib/contract'
import { useWallet } from '../hooks/useWallet'
import TxBanner from '../components/TxBanner'

function friendlyTxError(err) {
  if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
    return 'Transaction was rejected in the wallet'
  }
  if (err.reason) return `Contract said: ${err.reason}`
  if (err.shortMessage) return err.shortMessage
  return 'Transaction failed. Check your MON balance and try again.'
}

export default function Supervisor() {
  const { signer, account, connect, connecting, error: walletError } = useWallet()

  const [students, setStudents] = useState([]) // { address, profile, entries }
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [tx, setTx] = useState(null)
  const [approving, setApproving] = useState(null) // entry index in flight

  const refresh = useCallback(async () => {
    if (!account) return
    setLoading(true)
    setLoadError('')
    try {
      const contract = getReadContract()
      const addresses = await contract.getSupervisorStudents(account)
      // fetch in small batches: anyone can register naming any supervisor,
      // so this list is unbounded and a single burst of N*2 RPC calls
      // would wedge the page if someone spams it
      const rows = []
      for (let i = 0; i < addresses.length; i += 10) {
        const batch = await Promise.all(
          addresses.slice(i, i + 10).map(async (address) => ({
            address,
            profile: await contract.students(address),
            entries: await contract.getEntries(address),
          })),
        )
        rows.push(...batch)
      }
      setStudents(rows)
      setSelected((prev) => prev ?? rows[0]?.address ?? null)
    } catch {
      setLoadError('Could not load your students from the network.')
    } finally {
      setLoading(false)
    }
  }, [account])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function approve(studentAddress, entryIndex) {
    try {
      setApproving(entryIndex)
      setTx({ status: 'pending' })
      const contract = getWriteContract(signer)
      const sent = await sendWithTightGas(contract, 'approveEntry', [
        studentAddress,
        entryIndex,
      ])
      setTx({ status: 'pending', hash: sent.hash })
      await sent.wait()
      setTx({ status: 'confirmed', hash: sent.hash })
      await refresh()
    } catch (err) {
      setTx({ status: 'error', message: friendlyTxError(err) })
    } finally {
      setApproving(null)
    }
  }

  if (!account) {
    return (
      <div className="page">
        <div>
          <h1 className="page-title">Supervisor dashboard</h1>
          <p className="page-sub">
            Review and approve log entries for the students assigned to you.
            Each approval is a permanent onchain attestation.
          </p>
        </div>
        <div className="connect-box">
          {typeof window.ethereum === 'undefined' ? (
            <>
              <p className="muted">
                MetaMask is required to approve entries. Install it, then
                reload this page.
              </p>
              <a
                className="btn"
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
              >
                INSTALL METAMASK
              </a>
            </>
          ) : (
            <>
              <p className="muted">
                Connect the wallet your students registered as their supervisor.
              </p>
              <button className="btn" onClick={connect} disabled={connecting}>
                {connecting ? 'CONNECTING…' : 'CONNECT METAMASK'}
              </button>
              {walletError && <p className="error-note">{walletError}</p>}
            </>
          )}
        </div>
      </div>
    )
  }

  const current = students.find((s) => s.address === selected)
  const pendingOf = (row) => row.entries.filter((e) => !e.approved).length

  return (
    <div className="page">
      <div>
        <h1 className="page-title">Supervisor dashboard</h1>
        <p className="page-sub">
          Connected as {shortAddress(account)} ·{' '}
          {students.length === 1
            ? '1 student assigned'
            : `${students.length} students assigned`}
        </p>
      </div>

      <TxBanner tx={tx} />

      {loadError ? (
        <div className="connect-box">
          <p className="error-note">{loadError}</p>
          <button className="btn" onClick={refresh} disabled={loading}>
            {loading ? 'RETRYING…' : 'RETRY'}
          </button>
        </div>
      ) : loading && students.length === 0 ? (
        <p className="muted">Loading your students from the contract…</p>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <p className="big">NO STUDENTS YET</p>
          <p>
            When a student registers with your wallet address as supervisor,
            they will show up here.
          </p>
        </div>
      ) : (
        <div className="split">
          <section className="panel">
            <p className="panel-title">Your students</p>
            <ul className="student-list scroll-area">
              {students.map((row) => (
                <li key={row.address}>
                  <button
                    type="button"
                    className={row.address === selected ? 'selected' : ''}
                    onClick={() => setSelected(row.address)}
                  >
                    <span>
                      <span style={{ fontWeight: 600 }}>{row.profile.name}</span>
                      <br />
                      <span className="mono muted" style={{ fontSize: 11.5 }}>
                        {row.profile.matricNumber}
                      </span>
                    </span>
                    <span className={`count-chip ${pendingOf(row) === 0 ? 'zero' : ''}`}>
                      {pendingOf(row)} pending
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            {current && (
              <>
                <p className="panel-title">
                  {current.profile.name} · {current.entries.length} entries
                </p>
                {current.entries.length === 0 ? (
                  <p className="muted">No entries submitted yet.</p>
                ) : (
                  <ul className="entry-list scroll-area">
                    {current.entries.map((entry, i) => (
                      <li key={i}>
                        <div className="grow">
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                            {entry.weekLabel || `Entry ${i + 1}`}
                          </div>
                          <div className="mono muted" style={{ fontSize: 11 }}>
                            {formatDate(entry.timestamp)} · {shortHash(entry.contentHash)}
                          </div>
                        </div>
                        {entry.approved ? (
                          <span className="badge approved">✓ APPROVED</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-small"
                            disabled={approving !== null}
                            onClick={() => approve(current.address, i)}
                          >
                            {approving === i ? 'APPROVING…' : 'APPROVE'}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
