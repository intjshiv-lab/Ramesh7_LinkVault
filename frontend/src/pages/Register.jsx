import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { register } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (username.length < 3) {
            setError('Username must be at least 3 characters')
            return
        }

        setLoading(true)

        try {
            await register(email, username, password)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto fade-in">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    ✨
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                <p className="text-gray-500">Join LinkVault to manage your links</p>
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

                    <div className="mb-5">
                        <label className="block text-gray-600 mb-2 text-sm font-medium">Username</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="yourname"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                        />
                        <p className="text-gray-400 text-xs mt-1">At least 3 characters</p>
                    </div>

                    <div className="mb-5">
                        <label className="block text-gray-600 mb-2 text-sm font-medium">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <p className="text-gray-400 text-xs mt-1">At least 6 characters</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-600 mb-2 text-sm font-medium">Confirm Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                            <><div className="loader" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Creating account...</>
                        ) : (
                            '🚀 Create Account'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-purple-500 hover:text-purple-600 font-medium">
                            Sign in
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

export default Register
