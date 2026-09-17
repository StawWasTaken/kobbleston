import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PublicLayout } from '@/components/layout/PublicLayout'
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
const Create = lazy(() => import('@/pages/Create'))
const Search = lazy(() => import('@/pages/Search'))
const Communities = lazy(() => import('@/pages/Communities'))
const CommunityPage = lazy(() => import('@/pages/CommunityPage'))
const NewSpace = lazy(() => import('@/pages/NewSpace'))
const EditSpace = lazy(() => import('@/pages/EditSpace'))
const CreateCommunity = lazy(() => import('@/pages/CreateCommunity'))
const Terms = lazy(() => import('@/pages/Policies').then((m) => ({ default: m.Terms })))
const Guidelines = lazy(() => import('@/pages/Policies').then((m) => ({ default: m.Guidelines })))
const Friends = lazy(() => import('@/pages/Friends'))
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
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/signup" element={<Auth mode="signup" />} />

              {/* the side of the site anyone can read without an account */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<RootRoute />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/guidelines" element={<Guidelines />} />
              </Route>

              <Route element={<AppShell />}>
                {/* open to guests so a shared link works logged out */}
                <Route path="/discover" element={<Discover />} />
                <Route path="/create" element={<Create />} />
                <Route path="/search" element={<Search />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/c/:slug" element={<CommunityPage />} />
                <Route path="/u/:username" element={<Profile />} />
                <Route path="/u/:username/:slug" element={<SpacePage />} />

                <Route element={<RequireAuth />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/spaces/new" element={<NewSpace />} />
                  <Route path="/spaces/:spaceId/edit" element={<EditSpace />} />
                  <Route path="/communities/new" element={<CreateCommunity />} />
                  <Route path="/friends" element={<Friends />} />
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
