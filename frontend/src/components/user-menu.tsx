'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setShowMenu(false)
  }

  return (
    <details className="dropdown" style={{ position: 'relative' }}>
      <summary 
        style={{ 
          cursor: 'pointer',
          listStyle: 'none'
        }}
        onClick={(e) => {
          e.preventDefault()
          setShowMenu(!showMenu)
        }}
      >
        👤 {user?.email}
      </summary>
      
      {showMenu && (
        <ul 
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            backgroundColor: 'var(--pico-color-white)',
            border: '1px solid var(--pico-color-grey-200)',
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minWidth: '200px',
            zIndex: 1000,
            padding: '0.5rem 0',
            margin: 0,
            listStyle: 'none'
          }}
        >
          <li style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--pico-color-grey-100)' }}>
            <small style={{ color: 'var(--pico-color-grey-500)' }}>
              Signed in as<br />
              <strong>{user?.email}</strong>
            </small>
          </li>
          
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                // TODO: Navigate to profile settings
                setShowMenu(false)
              }}
              style={{
                display: 'block',
                padding: '0.5rem 1rem',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              ⚙️ Settings
            </a>
          </li>
          
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                // TODO: Navigate to billing
                setShowMenu(false)
              }}
              style={{
                display: 'block',
                padding: '0.5rem 1rem',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              💳 Billing
            </a>
          </li>
          
          <li style={{ borderTop: '1px solid var(--pico-color-grey-100)' }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleSignOut()
              }}
              style={{
                display: 'block',
                padding: '0.5rem 1rem',
                textDecoration: 'none',
                color: 'var(--pico-color-red-500)'
              }}
            >
              🚪 Sign Out
            </a>
          </li>
        </ul>
      )}
    </details>
  )
}
