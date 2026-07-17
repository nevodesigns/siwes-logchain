import { useCallback, useEffect, useState } from 'react'
import { connectWallet } from '../lib/contract'

export function useWallet() {
  const [signer, setSigner] = useState(null)
  const [account, setAccount] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  const connect = useCallback(async () => {
    setConnecting(true)
    setError('')
    try {
      const s = await connectWallet()
      setSigner(s)
      setAccount(await s.getAddress())
    } catch (err) {
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setError('Connection request was rejected in the wallet')
      } else {
        setError(err.message || 'Could not connect wallet')
      }
    } finally {
      setConnecting(false)
    }
  }, [])

  // simplest safe behaviour: a wallet-level change restarts the page state
  useEffect(() => {
    if (!window.ethereum) return
    const reload = () => window.location.reload()
    window.ethereum.on('accountsChanged', reload)
    window.ethereum.on('chainChanged', reload)
    return () => {
      window.ethereum.removeListener('accountsChanged', reload)
      window.ethereum.removeListener('chainChanged', reload)
    }
  }, [])

  return { signer, account, connect, connecting, error }
}
