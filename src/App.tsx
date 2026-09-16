import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Logomark } from '@/components/brand/Wordmark'
import Landing from '@/pages/Landing'
import Auth from '@/pages/Auth'
import Home from '@/pages/Home'
import Discover from '@/pages/Discover'
import NotFound from '@/pages/NotFound'

// Everything behind the front door loads on demand.
const SpacePage = lazy(() => import('@/pages/SpacePage'))
const CreateSpace = lazy(() => import('@/pages/CreateSpace'))
const Friends = lazy(() => import('@/pages/Friends'))
const Chat = lazy(() => import('@/pages/Chat'))
const Library = lazy(() => import('@/pages/Library'))
const Profile = lazy(() => import('@/pages/Profile'))
const Settings = lazy(() => import('@/pages/Settings'))

function Booting() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink">
      <Logomark className="h-10 animate-bob" />
      <span className="sr-only">Loading Kobbleston</span>
    </div>
  )
}

/** Signed-out visitors get the landing page rather than a bounce to a form. */
function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <Booting />
  return session ? <Outlet /> : <Navigate to="/" replace />
}

function RootRoute() {
  const { session, loading } = useAuth()
  if (loading) return <Booting />
  return session ? <Navigate to="/home" replace /> : <Landing />
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<Booting />}>
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/signup" element={<Auth mode="signup" />} />

              <Route element={<AppShell />}>
                {/* public inside the shell so a shared link works logged out */}
                <Route path="/discover" element={<Discover />} />
                <Route path="/u/:username" element={<Profile />} />
                <Route path="/u/:username/:slug" element={<SpacePage />} />

                <Route element={<RequireAuth />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/create" element={<CreateSpace />} />
                  <Route path="/friends" element={<Friends />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/chat/:conversationId" element={<Chat />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
