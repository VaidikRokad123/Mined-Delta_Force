import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth`

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Restore session on mount
    useEffect(() => {
        fetch(`${API}/me`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.success) setUser(data.user) })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const register = async ({ name, email, password, role, address, adminCode }) => {
        const res = await fetch(`${API}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role, address, adminCode }),
        })
        const data = await res.json()

        // Auto-login after successful registration
        if (data.success) {
            const loginData = await fetch(`${API}/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role }),
            }).then(r => r.json())

            if (loginData.success) {
                setUser(loginData.user)
                window.location.hash = loginData.user.role === 'admin' ? 'analytics' : 'menu'
            }
        }
        return data
    }

    const login = async ({ email, password, role = 'user' }) => {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
        })
        const data = await res.json()
        if (data.success) {
            setUser(data.user)
            window.location.hash = data.user.role === 'admin' ? 'analytics' : 'menu'
        }
        return data
    }

    const logout = async () => {
        await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' })
        setUser(null)
        window.location.hash = 'login'
    }

    const updateProfile = async ({ name, address }) => {
        const res = await fetch(`${API}/profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, address }),
        })
        const data = await res.json()
        if (data.success) setUser(data.user)
        return data
    }

    return (
        <AuthContext.Provider value={{ user, loading, register, login, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
