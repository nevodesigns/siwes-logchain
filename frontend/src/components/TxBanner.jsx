import { explorerTx, shortHash } from '../lib/contract'

// tx = { status: 'pending' | 'confirmed' | 'error', hash?, message? }
export default function TxBanner({ tx }) {
  if (!tx) return null

  if (tx.status === 'error') {
    return <div className="tx-banner err">{tx.message}</div>
  }

  return (
    <div className={`tx-banner ${tx.status === 'confirmed' ? 'ok' : ''}`}>
      <span>{tx.status === 'confirmed' ? '✓ Confirmed' : '… Waiting for confirmation'}</span>
      {tx.hash && (
        <a href={explorerTx(tx.hash)} target="_blank" rel="noreferrer">
          {shortHash(tx.hash)} ↗
        </a>
      )}
    </div>
  )
}
