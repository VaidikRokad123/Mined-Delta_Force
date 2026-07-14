import { useState, useEffect } from 'react'
import './index.css'

import { AuthProvider, useAuth } from './context/AuthContext'

// Owner Pages
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

const API_BASE = 'http://localhost:3001/api'

// Generate or fetch user ordering session
function getSessionId() {
  let sid = localStorage.getItem('petpooja_session')
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem('petpooja_session', sid)
  }
  return sid
}

const SESSION_ID = getSessionId()

function MainAppInner() {
  const { user, loading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('')

  // Define tab navigation based on role
  const getNavItems = () => {
    if (!user) return []
    if (user.role === 'admin') {
      return [
        { id: 'analytics', label: 'Analytics' },
        { id: 'pricing', label: 'Pricing' },
        { id: 'combos', label: 'Combos' },
        { id: 'manage', label: 'Manage' },
        { id: 'suggest', label: 'Upsell' },
        { id: 'orders', label: 'Orders' },
        { id: 'menu', label: 'Menu Preview' },
      ]
    }
    return [
      { id: 'menu', label: 'Menu' },
      { id: 'chat', label: 'AI Chat' },
      { id: 'voice', label: 'Voice' },
      { id: 'call', label: 'Call' },
      { id: 'orders', label: 'My Orders' },
    ]
  }

  const navItems = getNavItems()

  useEffect(() => {
    if (loading) return

    const handleHash = () => {
      const hash = window.location.hash.replace('#', '')
      const validTabs = [...navItems.map(n => n.id), 'profile', 'login', 'register', 'verify-email']
      
      if (!user) {
        if (['register', 'verify-email'].includes(hash)) {
          setActiveTab(hash)
        } else {
          setActiveTab('login')
          window.location.hash = 'login'
        }
      } else {
        // Authenticated user routing
        if (validTabs.includes(hash) && hash !== 'login' && hash !== 'register') {
          setActiveTab(hash)
        } else {
          const defaultTab = user.role === 'admin' ? 'analytics' : 'menu'
          setActiveTab(defaultTab)
          window.location.hash = defaultTab
        }
      }
    }

    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [user, loading, navItems])

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

  // Not Logged In
  if (!user) {
    if (activeTab === 'register') return <Register onNavigate={navigate} />
    if (activeTab === 'verify-email') return <VerifyEmail onNavigate={navigate} />
    return <Login onNavigate={navigate} />
  }

  const safeTab = [...navItems.map(n => n.id), 'profile'].includes(activeTab) 
    ? activeTab 
    : (user.role === 'admin' ? 'analytics' : 'menu')

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <img src="/logo.jpeg" alt="PetPooja" className="brand-logo" />
          <h1>PetPooja<span>{user.role === 'admin' ? 'Revenue Intelligence' : 'Order & Dine'}</span></h1>
        </div>

        <nav className="nav-items">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${safeTab === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Profile menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
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
          <button 
            onClick={logout} 
            style={{
              padding: '6px 12px', 
              borderRadius: 'var(--radius)', 
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-surface)', 
              color: 'var(--text-secondary)', 
              fontSize: 12,
              fontWeight: 600, 
              cursor: 'pointer', 
              transition: 'all var(--transition)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--negative)'; e.currentTarget.style.color = 'var(--negative)'; e.currentTarget.style.background = 'var(--negative-subtle)' }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-surface)' }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Admin Pages */}
        {user.role === 'admin' && safeTab === 'analytics' && <ProductAnalytics apiBase={API_BASE} />}
        {user.role === 'admin' && safeTab === 'pricing' && <PricingDashboard apiBase={API_BASE} />}
        {user.role === 'admin' && safeTab === 'combos' && <ComboGenerator apiBase={API_BASE} />}
        {user.role === 'admin' && safeTab === 'manage' && <ManageCombos apiBase={API_BASE} />}
        {user.role === 'admin' && safeTab === 'suggest' && <SuggestView apiBase={API_BASE} />}
        {user.role === 'admin' && safeTab === 'orders' && <Orders apiBase={API_BASE} />}

        {/* Customer Pages */}
        {safeTab === 'menu' && <Menu apiBase={API_BASE} />}
        {user.role === 'user' && safeTab === 'chat' && <ChatOrder sessionId={SESSION_ID} />}
        {user.role === 'user' && safeTab === 'voice' && <VoiceOrder sessionId={SESSION_ID} />}
        {user.role === 'user' && safeTab === 'call' && <CallOrder />}
        {user.role === 'user' && safeTab === 'orders' && <MyOrders apiBase={API_BASE} sessionId={SESSION_ID} />}
        
        {/* Shared Pages */}
        {safeTab === 'profile' && <Profile />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppInner />
    </AuthProvider>
  )
}
