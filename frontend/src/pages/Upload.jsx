import { useState, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function Upload() {
    const { isAuthenticated } = useAuth()
    const [mode, setMode] = useState('text')
    const [text, setText] = useState('')
    const [file, setFile] = useState(null)
    const [expiryTime, setExpiryTime] = useState('')
    const [password, setPassword] = useState('')
    const [oneTimeView, setOneTimeView] = useState(false)
    const [maxViews, setMaxViews] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [copiedToken, setCopiedToken] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const fileInputRef = useRef(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setResult(null)

        try {
            const formData = new FormData()

            if (mode === 'text') {
                if (!text.trim()) throw new Error('Please enter some text to share')
                formData.append('text', text)
            } else {
                if (!file) throw new Error('Please select a file to upload')
                formData.append('file', file)
            }

            if (expiryTime) formData.append('expiresAt', expiryTime)
            if (password.trim()) formData.append('password', password)
            if (oneTimeView) formData.append('oneTimeView', 'true')
            if (maxViews && parseInt(maxViews) > 0) formData.append('maxViews', maxViews)

            const response = await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setResult(response.data)
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Upload failed')
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async () => {
        const fullUrl = window.location.origin + result.url
        await navigator.clipboard.writeText(fullUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleCopyToken = async () => {
        await navigator.clipboard.writeText(result.deleteToken)
        setCopiedToken(true)
        setTimeout(() => setCopiedToken(false), 2000)
    }

    const handleDragOver = (e) => { e.preventDefault(); setDragOver(true) }
    const handleDragLeave = () => setDragOver(false)
    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0])
    }

    const resetForm = () => {
        setResult(null)
        setText('')
        setFile(null)
        setExpiryTime('')
        setPassword('')
        setOneTimeView(false)
        setMaxViews('')
        setError('')
        setShowAdvanced(false)
    }

    const getMinDateTime = () => {
        const now = new Date()
        now.setMinutes(now.getMinutes() + 1)
        return now.toISOString().slice(0, 16)
    }

    if (result) {
        return (
            <div className="max-w-5xl mx-auto fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Left - Success Message */}
                    <div className="text-center lg:text-left">
                        <div className="w-20 h-20 mx-auto lg:mx-0 mb-6 rounded-3xl flex items-center justify-center text-3xl"
                            style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
                            ✓
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Link Created!</h2>
                        <p className="text-gray-500 mb-6">
                            Your {result.type === 'text' ? 'text' : 'file'} is ready to share. Anyone with this link can access it until it expires.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center lg:justify-start text-sm">
                            <span className="badge">{result.type === 'text' ? '📝 Text' : '📁 File'}</span>
                            <span className="badge">⏰ Expires: {new Date(result.expiresAt).toLocaleString()}</span>
                            {result.hasPassword && <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#b45309' }}>🔒 Password Protected</span>}
                            {result.oneTimeView && <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>👁 One-Time View</span>}
                            {result.maxViews > 0 && <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#7c3aed' }}>🔢 Max {result.maxViews} Views</span>}
                        </div>
                    </div>

                    {/* Right - Link Card */}
                    <div className="glass-card p-8">
                        <label className="block text-gray-500 text-sm font-medium mb-3">Shareable Link</label>
                        <div className="link-display mb-4">
                            <span className="text-purple-400">🔗</span>
                            <a href={result.url} target="_blank" rel="noopener noreferrer">
                                {window.location.origin}{result.url}
                            </a>
                            <button onClick={handleCopy} className={`copy-btn ${copied ? 'copied' : ''}`}>
                                {copied ? '✓ Copied' : 'Copy'}
                            </button>
                        </div>

                        {/* Delete Token */}
                        <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-red-600 text-xs font-medium">🗑️ Delete Token (save this!)</label>
                                <button onClick={handleCopyToken} className="text-xs text-red-500 hover:text-red-600">
                                    {copiedToken ? '✓ Copied' : 'Copy'}
                                </button>
                            </div>
                            <code className="text-xs text-gray-600 break-all">{result.deleteToken}</code>
                        </div>

                        <button onClick={resetForm} className="btn-primary w-full">
                            Create Another Link
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                {/* Left - Hero Section */}
                <div className="lg:sticky lg:top-32">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
                        style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))', color: '#a855f7' }}>
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                        Secure • Fast • Private
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight" style={{ letterSpacing: '-1px' }}>
                        Share anything,<br />
                        <span style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            securely.
                        </span>
                    </h1>

                    <p className="text-lg text-gray-500 mb-10 leading-relaxed">
                        Upload text or files and get a private link that auto-expires.
                        {!isAuthenticated && ' No account needed.'}
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="feature-card">
                            <div className="text-2xl mb-2">🔒</div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">Password</h3>
                            <p className="text-gray-400 text-xs">Protect links</p>
                        </div>
                        <div className="feature-card">
                            <div className="text-2xl mb-2">👁️</div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">One-Time</h3>
                            <p className="text-gray-400 text-xs">Self-destruct</p>
                        </div>
                        <div className="feature-card">
                            <div className="text-2xl mb-2">🔢</div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">Max Views</h3>
                            <p className="text-gray-400 text-xs">Limit access</p>
                        </div>
                    </div>
                </div>

                {/* Right - Upload Form */}
                <div className="glass-card p-8">
                    {/* Mode Toggle */}
                    <div className="toggle-container mb-6">
                        <button className={`toggle-btn ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>
                            📝 Text
                        </button>
                        <button className={`toggle-btn ${mode === 'file' ? 'active' : ''}`} onClick={() => setMode('file')}>
                            📁 File
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Text Input */}
                        {mode === 'text' && (
                            <div className="mb-5">
                                <label className="block text-gray-600 mb-2 text-sm font-medium">Your Content</label>
                                <textarea
                                    className="textarea-field"
                                    placeholder="Paste your text, code, or notes here..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    rows={6}
                                />
                            </div>
                        )}

                        {/* File Input */}
                        {mode === 'file' && (
                            <div className="mb-5">
                                <label className="block text-gray-600 mb-2 text-sm font-medium">Your File</label>
                                <div
                                    className={`file-drop-zone ${dragOver ? 'dragover' : ''}`}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                                    {file ? (
                                        <div>
                                            <div className="text-4xl mb-3">📄</div>
                                            <p className="font-medium text-gray-900">{file.name}</p>
                                            <p className="text-gray-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }}
                                                className="mt-3 text-red-400 hover:text-red-500 text-sm font-medium">
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400">
                                            <div className="text-4xl mb-3">📤</div>
                                            <p className="font-medium text-gray-600">Drop file or click to browse</p>
                                            <p className="text-xs mt-1">Max 50MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Expiry Time */}
                        <div className="mb-5">
                            <label className="block text-gray-600 mb-2 text-sm font-medium">
                                Expires At <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="datetime-local"
                                className="input-field"
                                value={expiryTime}
                                onChange={(e) => setExpiryTime(e.target.value)}
                                min={getMinDateTime()}
                            />
                            <p className="text-gray-400 text-xs mt-2">Default: 10 minutes from now</p>
                        </div>

                        {/* Advanced Options Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full mb-4 text-left text-sm font-medium text-purple-500 hover:text-purple-600 flex items-center gap-2"
                        >
                            <span style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▶</span>
                            Advanced Options
                        </button>

                        {/* Advanced Options */}
                        {showAdvanced && (
                            <div className="mb-5 p-5 rounded-xl" style={{ background: 'rgba(168, 85, 247, 0.03)', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                                {/* Password */}
                                <div className="mb-4">
                                    <label className="block text-gray-600 mb-2 text-sm font-medium">
                                        🔒 Password Protection <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Enter a password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                {/* One-Time View */}
                                <div className="mb-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={oneTimeView}
                                            onChange={(e) => setOneTimeView(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                                        />
                                        <div>
                                            <span className="text-gray-700 font-medium text-sm">👁️ One-Time View</span>
                                            <p className="text-gray-400 text-xs">Content deleted after first view</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Max Views */}
                                <div>
                                    <label className="block text-gray-600 mb-2 text-sm font-medium">
                                        🔢 Maximum Views <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="e.g., 5"
                                        value={maxViews}
                                        onChange={(e) => setMaxViews(e.target.value)}
                                        min="1"
                                        max="1000"
                                    />
                                    <p className="text-gray-400 text-xs mt-1">Leave empty for unlimited views</p>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mb-5 p-4 rounded-xl text-sm font-medium"
                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
                            {loading ? (
                                <><div className="loader" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Processing...</>
                            ) : (
                                '🚀 Generate Link'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Upload
