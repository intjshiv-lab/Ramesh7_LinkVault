import { Routes, Route, Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Upload from './pages/Upload'
import View from './pages/View'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

function App() {
  const { user, isAuthenticated, loading, logout } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 no-underline group">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)' }}>
              R7
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                Ramesh7_LinkVault
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Secure Sharing</span>
            </div>
          </a>
          <nav className="flex items-center gap-3">
            <span className="badge hidden sm:flex">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Online
            </span>

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-purple-500 transition hidden sm:block">
                  My Links
                </Link>
                <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    @{user?.username}
                  </span>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-400 hover:text-red-500 transition ml-2"
                    title="Logout"
                  >
                    ↗
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-purple-500 transition px-3 py-2">
                  Login
                </Link>
                <Link to="/register" className="text-sm font-medium text-white px-4 py-2 rounded-lg transition"
                  style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-24 px-4 sm:px-6">
        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/v/:id" element={<View />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-gray-400 text-xs bg-white/60 backdrop-blur-xl border-t border-black/5">
        <p>Ramesh7_LinkVault © 2026 — Secure text & file sharing with auto-expiry</p>
      </footer>
    </div>
  )
}

export default App
