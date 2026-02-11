import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function View() {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const { isAuthenticated } = useAuth()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [copied, setCopied] = useState(false)
    const [downloading, setDownloading] = useState(false)

    // Password state
    const [requiresPassword, setRequiresPassword] = useState(false)
    const [password, setPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [verifying, setVerifying] = useState(false)

    // Delete state
    const [showDelete, setShowDelete] = useState(false)
    const [deleteToken, setDeleteToken] = useState(searchParams.get('delete') || '')
    const [deleting, setDeleting] = useState(false)

    useEffect(() => { fetchContent() }, [id])

    const fetchContent = async () => {
        try {
            const response = await axios.get(`/api/content/${id}`)

            if (response.data.requiresPassword) {
                setRequiresPassword(true)
                setData({
                    type: response.data.type,
                    filename: response.data.filename,
                    createdAt: response.data.createdAt,
                    expiresAt: response.data.expiresAt
                })
            } else {
                setData(response.data)
            }
        } catch (err) {
            setError({
                message: err.response?.data?.error || 'Content not found',
                expired: err.response?.data?.expired,
                oneTimeViewed: err.response?.data?.oneTimeViewed,
                maxViewsReached: err.response?.data?.maxViewsReached
            })
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        setVerifying(true)
        setPasswordError('')

        try {
            const response = await axios.post(`/api/content/${id}/verify`, { password })
            setData(response.data)
            setRequiresPassword(false)
        } catch (err) {
            setPasswordError(err.response?.data?.error || 'Incorrect password')
        } finally {
            setVerifying(false)
        }
    }

    const handleCopyText = async () => {
        await navigator.clipboard.writeText(data.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = async () => {
        setDownloading(true)
        try {
            const response = await axios.get(`/api/content/${id}/download`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', data.filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            // If one-time view, show message
            if (data.oneTimeView) {
                setError({ message: 'This was a one-time download. The file has been deleted.', oneTimeViewed: true })
                setData(null)
            }
        } catch (err) {
            alert('Download failed.')
        } finally {
            setDownloading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this content? This cannot be undone.')) return

        setDeleting(true)
        try {
            await axios.delete(`/api/content/${id}`, {
                data: { deleteToken }
            })
            setError({ message: 'Content has been deleted successfully.', deleted: true })
            setData(null)
        } catch (err) {
            alert(err.response?.data?.error || 'Delete failed. Check your delete token.')
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="glass-card p-16 text-center">
                    <div className="loader mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading content...</p>
                </div>
            </div>
        )
    }

    // Password prompt
    if (requiresPassword) {
        return (
            <div className="max-w-md mx-auto fade-in">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                        🔐
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Required</h2>
                    <p className="text-gray-500">This content is password protected</p>
                </div>

                <div className="glass-card p-8">
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="mb-5">
                            <label className="block text-gray-600 mb-2 text-sm font-medium">Enter Password</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {passwordError && (
                            <div className="mb-5 p-4 rounded-xl text-sm font-medium"
                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
                                {passwordError}
                            </div>
                        )}

                        <button type="submit" className="btn-primary w-full" disabled={verifying}>
                            {verifying ? 'Verifying...' : '🔓 Unlock Content'}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        const getErrorIcon = () => {
            if (error.deleted) return '✅'
            if (error.expired) return '⏰'
            if (error.oneTimeViewed) return '👁'
            if (error.maxViewsReached) return '🔢'
            return '🔒'
        }

        const getErrorTitle = () => {
            if (error.deleted) return 'Deleted'
            if (error.expired) return 'Content Expired'
            if (error.oneTimeViewed) return 'Already Viewed'
            if (error.maxViewsReached) return 'View Limit Reached'
            return 'Not Found'
        }

        return (
            <div className="max-w-5xl mx-auto fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left">
                        <div className="w-20 h-20 mx-auto lg:mx-0 mb-6 rounded-3xl flex items-center justify-center text-3xl"
                            style={{
                                background: error.deleted
                                    ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                                    : error.expired
                                        ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                                        : 'linear-gradient(135deg, #fee2e2, #fecaca)'
                            }}>
                            {getErrorIcon()}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            {getErrorTitle()}
                        </h2>
                        <p className="text-gray-500 mb-8">{error.message}</p>
                        <Link to="/" className="btn-primary inline-block">Create New Link</Link>
                    </div>
                    <div className="glass-card p-10 text-center">
                        <div className="text-6xl mb-4">{error.deleted ? '🗑️' : '🔐'}</div>
                        <p className="text-gray-400">
                            {error.deleted
                                ? 'This content has been permanently removed.'
                                : 'Links are set to auto-expire for your security.'}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                {/* Left - Info */}
                <div className="lg:sticky lg:top-32">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ background: data.type === 'text' ? 'linear-gradient(135deg, #fce7f3, #fbcfe8)' : 'linear-gradient(135deg, #ddd6fe, #c4b5fd)' }}>
                            {data.type === 'text' ? '📝' : '📁'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {data.type === 'text' ? 'Shared Text' : data.filename}
                            </h1>
                            <p className="text-gray-400 text-sm">Secure share</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-sm">
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>📅</span>
                            <div>
                                <p className="text-gray-400 text-xs">Created</p>
                                <p className="text-gray-700 font-medium">{new Date(data.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>⏰</span>
                            <div>
                                <p className="text-gray-400 text-xs">Expires</p>
                                <p className="text-gray-700 font-medium">{new Date(data.expiresAt).toLocaleString()}</p>
                            </div>
                        </div>
                        {data.maxViews > 0 && (
                            <div className="flex items-center gap-3 text-sm">
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>👁</span>
                                <div>
                                    <p className="text-gray-400 text-xs">Views</p>
                                    <p className="text-gray-700 font-medium">{data.viewCount} / {data.maxViews}</p>
                                </div>
                            </div>
                        )}
                        {data.oneTimeView && (
                            <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                <span className="text-red-600 font-medium">⚠️ One-Time View</span>
                                <p className="text-gray-500 text-xs mt-1">This content will be deleted after viewing</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Link to="/" className="text-purple-500 hover:text-purple-600 font-medium text-sm inline-flex items-center gap-1">
                            ← Create your own link
                        </Link>

                        {/* Delete Option */}
                        <div>
                            <button
                                onClick={() => setShowDelete(!showDelete)}
                                className="text-red-400 hover:text-red-500 font-medium text-sm"
                            >
                                🗑️ Delete this content
                            </button>

                            {showDelete && (
                                <div className="mt-3 p-4 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter delete token"
                                        className="input-field mb-3 text-sm"
                                        value={deleteToken}
                                        onChange={(e) => setDeleteToken(e.target.value)}
                                    />
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting || !deleteToken}
                                        className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition"
                                    >
                                        {deleting ? 'Deleting...' : 'Confirm Delete'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right - Content */}
                <div className="glass-card p-8">
                    {data.type === 'text' ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Content</span>
                                <button onClick={handleCopyText} className={`copy-btn ${copied ? 'copied' : ''}`}>
                                    {copied ? '✓ Copied' : '📋 Copy'}
                                </button>
                            </div>
                            <div className="content-display">{data.content}</div>
                        </>
                    ) : (
                        <>
                            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl mb-6" style={{ background: 'rgba(0,0,0,0.02)' }}>
                                <div className="text-5xl mb-4">📄</div>
                                <p className="text-gray-900 font-semibold text-lg">{data.filename}</p>
                                <p className="text-gray-400 text-sm mt-1">{data.mimetype}</p>
                                {data.fileSize && (
                                    <p className="text-gray-400 text-xs mt-1">
                                        {(data.fileSize / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                )}
                            </div>
                            <button onClick={handleDownload} disabled={downloading} className="btn-primary w-full flex items-center justify-center gap-2">
                                {downloading ? (
                                    <><div className="loader" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Downloading...</>
                                ) : (
                                    '⬇️ Download File'
                                )}
                            </button>
                            {data.oneTimeView && (
                                <p className="text-center text-red-500 text-xs mt-3">
                                    ⚠️ This file will be deleted after download
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default View
