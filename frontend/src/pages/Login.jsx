import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await login(email, password)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto fade-in">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                    🔐
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                <p className="text-gray-500">Sign in to manage your links</p>
            </div>

            <div className="glass-card p-8">
                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label className="block text-gray-600 mb-2 text-sm font-medium">Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-600 mb-2 text-sm font-medium">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="mb-5 p-4 rounded-xl text-sm font-medium"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
                        {loading ? (
                            <><div className="loader" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Signing in...</>
                        ) : (
                            '🚀 Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-purple-500 hover:text-purple-600 font-medium">
                            Create one
                        </Link>
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                    <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Login
