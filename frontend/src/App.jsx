import { useState, useEffect } from 'react'
import './index.css'

import { AuthProvider as AdminAuthProvider } from './context/AdminAuthContext'
import { AuthProvider as CustomerAuthProvider } from './context/CustomerAuthContext'

// Owner Pages
import AdminLogin from './pages/AdminLogin'
import ProductAnalytics from './pages/ProductAnalytics'
import PricingDashboard from './pages/PricingDashboard'
import ComboGenerator from './pages/ComboGenerator'
import ManageCombos from './pages/ManageCombos'
import SuggestView from './pages/SuggestView'
import Orders from './pages/Orders'

// Customer Pages
import Menu from './pages/customer/Menu'
import ChatOrder from './pages/customer/ChatOrder'
import VoiceOrder from './pages/customer/VoiceOrder'
import CallOrder from './pages/customer/CallOrder'
import MyOrders from './pages/customer/MyOrders'
import Profile from './pages/customer/Profile'
import Login from './pages/customer/Login'
import Register from './pages/customer/Register'
import VerifyEmail from './pages/customer/VerifyEmail'

import { useAuth as useAdminAuth } from './context/AdminAuthContext'
import { useAuth as useCustomerAuth } from './context/CustomerAuthContext'

const API_BASE = 'http://localhost:3001/api'

// ─────────────────────────────────────────────
// OWNER PORTAL ROUTING
// ─────────────────────────────────────────────

const OWNER_NAV_ITEMS = [
  { id: 'owner-analytics', label: 'Analytics' },
  { id: 'owner-pricing', label: 'Pricing' },
  { id: 'owner-combos', label: 'Combos' },
  { id: 'owner-manage', label: 'Manage' },
  { id: 'owner-suggest', label: 'Upsell' },
  { id: 'owner-orders', label: 'Orders' },
]

function getOwnerTabFromHash() {
  const hash = window.location.hash.replace('#', '')
  return OWNER_NAV_ITEMS.some(n => n.id === hash) ? hash : 'owner-analytics'
}

function OwnerAppInner() {
  const { admin, loading, logout } = useAdminAuth()
  const [activeTab, setActiveTab] = useState(getOwnerTabFromHash)

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (OWNER_NAV_ITEMS.some(n => n.id === hash)) {
        setActiveTab(hash)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = (id) => {
    window.location.hash = id
    setActiveTab(id)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading admin session...</div>
      </div>
    )
  }

  if (!admin) {
    return <AdminLogin />
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <img src="/logo.jpeg" alt="PetPooja" className="brand-logo" />
          <h1>PetPooja<span>Revenue Intelligence</span></h1>
        </div>
        <nav className="nav-items">
          {OWNER_NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
          {/* Customer Portal Toggle Link */}
          <button
            className="nav-item"
            style={{ color: 'var(--accent)', marginLeft: 16 }}
            onClick={() => { window.location.hash = 'menu' }}
          >
            🏪 Customer View
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700
            }}>
              {admin.name.charAt(0).toUpperCase()}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{admin.name}</span>
          </div>
          <button onClick={logout} style={{
            padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border-medium)',
            background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 12,
            fontWeight: 600, cursor: 'pointer', transition: 'all var(--transition)'
          }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--negative)'; e.currentTarget.style.color = 'var(--negative)'; e.currentTarget.style.background = 'var(--negative-subtle)' }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-surface)' }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'owner-analytics' && <ProductAnalytics apiBase={API_BASE} />}
        {activeTab === 'owner-pricing' && <PricingDashboard apiBase={API_BASE} />}
        {activeTab === 'owner-combos' && <ComboGenerator apiBase={API_BASE} />}
        {activeTab === 'owner-manage' && <ManageCombos apiBase={API_BASE} />}
        {activeTab === 'owner-suggest' && <SuggestView apiBase={API_BASE} />}
        {activeTab === 'owner-orders' && <Orders apiBase={API_BASE} />}
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────
// CUSTOMER PORTAL ROUTING
// ─────────────────────────────────────────────

function getSessionId() {
  let sid = localStorage.getItem('petpooja_session')
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem('petpooja_session', sid)
  }
  return sid
}

const SESSION_ID = getSessionId()

const CUSTOMER_NAV_ITEMS = [
  { id: 'menu', label: 'Menu' },
  { id: 'chat', label: 'AI Chat' },
  { id: 'voice', label: 'Voice' },
  { id: 'call', label: 'Call' },
  { id: 'orders', label: 'My Orders' },
]

const AUTH_TABS = ['login', 'register', 'verify-email']
const ALL_CUSTOMER_TABS = [...CUSTOMER_NAV_ITEMS.map(n => n.id), 'profile']

function getCustomerTabFromHash() {
  const hash = window.location.hash.replace('#', '')
  const allTabs = [...ALL_CUSTOMER_TABS, ...AUTH_TABS]
  return allTabs.includes(hash) ? hash : null
}

function CustomerAppInner() {
  const { user, loading } = useCustomerAuth()
  const [activeTab, setActiveTab] = useState(() => getCustomerTabFromHash() || 'login')

  useEffect(() => {
    const handleHashChange = () => {
      const hash = getCustomerTabFromHash()
      if (hash) {
        setActiveTab(hash)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = (id) => {
    window.location.hash = id
    setActiveTab(id)
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="loading">
          <div className="spinner" />
          <span>Loading session...</span>
        </div>
      </div>
    )
  }

  // Auth pages (accessible when not logged in)
  if (!user) {
    if (activeTab === 'register') return <Register onNavigate={navigate} />
    if (activeTab === 'verify-email') return <VerifyEmail onNavigate={navigate} />
    return <Login onNavigate={navigate} />
  }

  const safeTab = ALL_CUSTOMER_TABS.includes(activeTab) ? activeTab : 'menu'

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <img src="/logo.jpeg" alt="PetPooja" className="brand-logo" />
          <h1>PetPooja<span>Order & Dine</span></h1>
        </div>

        <nav className="nav-items">
          {CUSTOMER_NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${safeTab === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
          {/* Owner Dashboard toggle link */}
          <button
            className="nav-item"
            style={{ color: 'var(--accent)', marginLeft: 16 }}
            onClick={() => { window.location.hash = 'owner-analytics' }}
          >
            🛡️ Admin Panel
          </button>
        </nav>

        {/* Profile info / Profile tab switch */}
        <button
          className={`topbar-profile-btn ${safeTab === 'profile' ? 'active' : ''}`}
          onClick={() => navigate('profile')}
          title="My Profile"
        >
          <span className="topbar-avatar">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="topbar-user-name">{user.name}</span>
        </button>
      </header>

      <main className="main-content">
        <div style={{ display: safeTab === 'menu' ? 'block' : 'none' }}>
          <Menu apiBase={API_BASE} />
        </div>
        <div style={{ display: safeTab === 'chat' ? 'block' : 'none' }}>
          <ChatOrder sessionId={SESSION_ID} />
        </div>
        <div style={{ display: safeTab === 'voice' ? 'flex' : 'none', flexDirection: 'column' }}>
          <VoiceOrder sessionId={SESSION_ID} />
        </div>
        <div style={{ display: safeTab === 'call' ? 'flex' : 'none', flexDirection: 'column' }}>
          <CallOrder />
        </div>
        <div style={{ display: safeTab === 'orders' ? 'block' : 'none' }}>
          <MyOrders apiBase={API_BASE} sessionId={SESSION_ID} />
        </div>
        <div style={{ display: safeTab === 'profile' ? 'block' : 'none' }}>
          <Profile />
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────
// TOP-LEVEL SWITCHER
// ─────────────────────────────────────────────

export default function App() {
  const [isOwnerView, setIsOwnerView] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return hash.startsWith('owner-')
  })

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '')
      setIsOwnerView(hash.startsWith('owner-'))
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  if (isOwnerView) {
    return (
      <AdminAuthProvider>
        <OwnerAppInner />
      </AdminAuthProvider>
    )
  }

  return (
    <CustomerAuthProvider>
      <CustomerAppInner />
    </CustomerAuthProvider>
  )
}
