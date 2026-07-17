export default function StatusBadge({ approved }) {
  return approved ? (
    <span className="badge approved">✓ APPROVED</span>
  ) : (
    <span className="badge pending">● PENDING</span>
  )
}
