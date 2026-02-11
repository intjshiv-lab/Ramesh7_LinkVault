import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    // Set axios default header when token changes
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            localStorage.setItem('token', token)
        } else {
            delete axios.defaults.headers.common['Authorization']
            localStorage.removeItem('token')
        }
    }, [token])

    // Verify token and get user on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setLoading(false)
                return
            }

            try {
                const response = await axios.get('/api/auth/me')
                setUser(response.data.user)
            } catch (error) {
                // Token invalid, clear it
                setToken(null)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        verifyToken()
    }, [])

    const login = async (email, password) => {
        const response = await axios.post('/api/auth/login', { email, password })
        setToken(response.data.token)
        setUser(response.data.user)
        return response.data
    }

    const register = async (email, username, password) => {
        const response = await axios.post('/api/auth/register', { email, username, password })
        setToken(response.data.token)
        setUser(response.data.user)
        return response.data
    }

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout')
        } catch (error) {
            // Ignore logout errors
        }
        setToken(null)
        setUser(null)
    }

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
