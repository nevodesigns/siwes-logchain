import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isAddress } from 'ethers'
import {
  getReadContract,
  explorerAddress,
  shortHash,
  formatDate,
} from '../lib/contract'
import { CONTRACT_ADDRESS, APP_URL } from '../constants'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import StatusBadge from '../components/StatusBadge'
import InstallPrompt from '../components/InstallPrompt'

export default function Verify() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [address, setAddress] = useState(searchParams.get('address') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [record, setRecord] = useState(null)
  const [copied, setCopied] = useState(false)
  const [manualCopyUrl, setManualCopyUrl] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  // hidden black-on-white QR, captured into the PDF (the on-screen QR is neon
  // on transparent, which does not print or scan reliably on paper)
  const pdfQrRef = useRef(null)

  async function exportPdf() {
    if (!record || exporting) return
    setExporting(true)
    setExportError('')
    try {
      // jspdf is heavy, load it only when someone actually exports
      const { generateCertificatePdf } = await import('../lib/certificatePdf')
      const qrDataUrl = pdfQrRef.current
        ? pdfQrRef.current.toDataURL('image/png')
        : null
      generateCertificatePdf(record, qrDataUrl)
    } catch {
      setExportError('Could not generate the PDF. Try again.')
    } finally {
      setExporting(false)
    }
  }

  async function copyShareLink() {
    const url = `${APP_URL}/?address=${record.address}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard api unavailable (http, older browsers): show the url for manual copy
      setManualCopyUrl(url)
    }
  }

  async function runLookup(target) {
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
      // keep the address in the URL so the record is shareable as a link
      setSearchParams({ address: target }, { replace: true })
    } catch {
      setError('Could not reach the contract. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // support shareable links like /?address=0x...
  useEffect(() => {
    const fromUrl = searchParams.get('address')
    if (fromUrl) runLookup(fromUrl.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function lookup(e) {
    e.preventDefault()
    runLookup(address.trim())
  }

  const approvedCount = record
    ? record.entries.filter((entry) => entry.approved).length
    : 0

  // the contract cannot stop a student naming their own wallet as
  // supervisor, so surface it loudly to the institution viewing the record
  const selfSupervised =
    record &&
    record.profile.supervisor.toLowerCase() === record.address.toLowerCase()

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

      {loading && (
        <section className="certificate" aria-hidden="true">
          <div className="cert-head">
            <div>
              <p className="cert-label">Official SIWES Training Record</p>
              <div className="skeleton" style={{ width: 200, height: 28 }} />
              <div className="skeleton" style={{ width: 120, height: 16, marginTop: 8 }} />
              <div className="skeleton" style={{ width: 160, height: 14, marginTop: 6 }} />
            </div>
          </div>
          <div className="skeleton-rows">
            <div className="skeleton" style={{ width: '100%', height: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 12 }} />
          </div>
        </section>
      )}

      {!record && !error && !loading && (
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

          {selfSupervised && (
            <p className="self-flag">
              WARNING: this record is self-supervised. The supervisor wallet is
              the same as the student wallet, so the approvals below were made
              by the student themselves.
            </p>
          )}

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

          <div className="cert-bottom">
            <div className="qr-block">
              <QRCodeSVG
                value={`${APP_URL}/?address=${record.address}`}
                size={120}
                fgColor="#ADFF2F"
                bgColor="transparent"
                marginSize={0}
              />
              <p className="qr-label">Scan to verify this record</p>
            </div>
            {/* off-screen high-res QR captured into the PDF, black on white
                with a quiet zone so it prints and scans reliably */}
            <QRCodeCanvas
              ref={pdfQrRef}
              value={`${APP_URL}/?address=${record.address}`}
              size={256}
              fgColor="#000000"
              bgColor="#ffffff"
              marginSize={3}
              style={{ position: 'absolute', left: '-9999px', top: 0 }}
              aria-hidden="true"
            />
            <div className="cert-actions">
              <button
                type="button"
                className="btn"
                onClick={exportPdf}
                disabled={exporting}
              >
                {exporting ? 'Generating PDF...' : 'EXPORT CERTIFICATE AS PDF'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={copyShareLink}
              >
                {copied ? 'Link copied!' : 'Copy shareable link'}
              </button>
              {exportError && <p className="error-note">{exportError}</p>}
              {manualCopyUrl && (
                <input
                  className="manual-copy mono"
                  readOnly
                  value={manualCopyUrl}
                  onFocus={(e) => e.target.select()}
                />
              )}
            </div>
          </div>
        </section>
      )}

      <InstallPrompt />
    </div>
  )
}
