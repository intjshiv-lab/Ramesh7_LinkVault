import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function Dashboard() {
    const { user, isAuthenticated, loading: authLoading } = useAuth()
    const [uploads, setUploads] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deletingId, setDeletingId] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login')
        }
    }, [authLoading, isAuthenticated, navigate])

    useEffect(() => {
        if (isAuthenticated) {
            fetchData()
        }
    }, [isAuthenticated])

    const fetchData = async () => {
        try {
            const [uploadsRes, statsRes] = await Promise.all([
                axios.get('/api/dashboard/uploads'),
                axios.get('/api/dashboard/stats')
            ])
            setUploads(uploadsRes.data.uploads)
            setStats(statsRes.data.stats)
        } catch (err) {
            setError('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this link?')) return

        setDeletingId(id)
        try {
            await axios.delete(`/api/content/${id}`)
            setUploads(uploads.filter(u => u.id !== id))
            if (stats) {
                setStats({
                    ...stats,
                    totalUploads: stats.totalUploads - 1,
                    activeUploads: stats.activeUploads - 1
                })
            }
        } catch (err) {
            alert('Failed to delete')
        } finally {
            setDeletingId(null)
        }
    }

    const copyLink = async (url) => {
        await navigator.clipboard.writeText(window.location.origin + url)
        alert('Link copied!')
    }

    if (authLoading || loading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="glass-card p-16 text-center">
                    <div className="loader mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">My Dashboard</h1>
                    <p className="text-gray-500">Welcome back, <span className="text-purple-500">@{user?.username}</span></p>
                </div>
                <Link to="/" className="btn-primary inline-flex items-center gap-2">
                    ➕ Create New Link
                </Link>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-5 text-center">
                        <div className="text-3xl font-bold text-gray-900">{stats.totalUploads}</div>
                        <div className="text-gray-400 text-sm">Total Uploads</div>
                    </div>
                    <div className="glass-card p-5 text-center">
                        <div className="text-3xl font-bold text-emerald-500">{stats.activeUploads}</div>
                        <div className="text-gray-400 text-sm">Active Links</div>
                    </div>
                    <div className="glass-card p-5 text-center">
                        <div className="text-3xl font-bold text-purple-500">{stats.totalViews}</div>
                        <div className="text-gray-400 text-sm">Total Views</div>
                    </div>
                    <div className="glass-card p-5 text-center">
                        <div className="text-3xl font-bold text-pink-500">{stats.protectedUploads}</div>
                        <div className="text-gray-400 text-sm">Protected</div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
                    {error}
                </div>
            )}

            {/* Uploads List */}
            <div className="glass-card">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Your Links</h2>
                </div>

                {uploads.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-5xl mb-4">📭</div>
                        <p className="text-gray-500 mb-4">No uploads yet</p>
                        <Link to="/" className="text-purple-500 hover:text-purple-600 font-medium">
                            Create your first link →
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {uploads.map(upload => (
                            <div key={upload.id} className={`p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${upload.isExpired ? 'opacity-50' : ''}`}>
                                {/* Icon & Info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                                        style={{
                                            background: upload.type === 'text'
                                                ? 'linear-gradient(135deg, #fce7f3, #fbcfe8)'
                                                : 'linear-gradient(135deg, #ddd6fe, #c4b5fd)'
                                        }}>
                                        {upload.type === 'text' ? '📝' : '📁'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-gray-900 truncate">
                                            {upload.type === 'text' ? 'Text Content' : upload.filename}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {upload.isExpired && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Expired</span>
                                            )}
                                            {upload.hasPassword && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">🔒 Protected</span>
                                            )}
                                            {upload.isOneTimeView && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">👁 One-Time</span>
                                            )}
                                            {upload.max_views > 0 && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                                                    {upload.current_views}/{upload.max_views} views
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Created: {new Date(upload.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {!upload.isExpired && (
                                        <>
                                            <button
                                                onClick={() => copyLink(upload.url)}
                                                className="px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                            >
                                                📋 Copy
                                            </button>
                                            <a
                                                href={upload.url}
                                                target="_blank"
                                                className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                            >
                                                🔗 Open
                                            </a>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDelete(upload.id)}
                                        disabled={deletingId === upload.id}
                                        className="px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                    >
                                        {deletingId === upload.id ? '...' : '🗑️'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
