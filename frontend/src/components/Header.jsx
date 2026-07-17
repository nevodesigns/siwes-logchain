import { NavLink } from 'react-router-dom'

function ChainIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

export default function Header() {
  return (
    <header className="header">
      <div className="brand">
        <span className="brand-icon">
          <ChainIcon />
        </span>
        <span className="brand-name">SIWES LogChain</span>
      </div>
      <nav className="nav">
        <NavLink to="/" end>
          Verify
        </NavLink>
        <NavLink to="/student">Student</NavLink>
        <NavLink to="/supervisor">Supervisor</NavLink>
      </nav>
      <span className="net-badge">Monad Testnet</span>
    </header>
  )
}
