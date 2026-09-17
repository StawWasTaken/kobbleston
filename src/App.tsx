import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { CommunityShell } from '@/components/community/CommunityRail'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { ThemeProvider } from '@/hooks/useTheme'
import { Logomark } from '@/components/brand/Wordmark'
import Landing from '@/pages/Landing'
import Auth from '@/pages/Auth'
import Home from '@/pages/Home'
import Discover from '@/pages/Discover'
import NotFound from '@/pages/NotFound'

// Everything behind the front door loads on demand.
const SpacePage = lazy(() => import('@/pages/SpacePage'))
const CreateHub = lazy(() => import('@/pages/CreateHub'))
const AssetPage = lazy(() => import('@/pages/AssetPage'))
const CreateOverview = lazy(() => import('@/pages/CreateHub').then((m) => ({ default: m.CreateOverview })))
const CreateSpaces = lazy(() => import('@/pages/CreateHub').then((m) => ({ default: m.CreateSpaces })))
const CreateUploads = lazy(() => import('@/pages/CreateHub').then((m) => ({ default: m.CreateUploads })))
const CreateMarketplace = lazy(() => import('@/pages/CreateHub').then((m) => ({ default: m.CreateMarketplace })))
const CreateInventory = lazy(() => import('@/pages/CreateHub').then((m) => ({ default: m.CreateInventory })))
const CreateAnalytics = lazy(() => import('@/pages/CreateHub').then((m) => ({ default: m.CreateAnalytics })))
const CreatorPage = lazy(() => import('@/pages/CreatorPage'))
const EventPage = lazy(() => import('@/pages/EventPage'))
const People = lazy(() => import('@/pages/People'))
const Communities = lazy(() => import('@/pages/Communities'))
const CommunityPage = lazy(() => import('@/pages/CommunityPage'))
const NewSpace = lazy(() => import('@/pages/NewSpace'))
const EditSpace = lazy(() => import('@/pages/EditSpace'))
const ConfigureCommunity = lazy(() => import('@/pages/ConfigureCommunity'))
const Terms = lazy(() => import('@/pages/Policies').then((m) => ({ default: m.Terms })))
const Guidelines = lazy(() => import('@/pages/Policies').then((m) => ({ default: m.Guidelines })))
const Roadmap = lazy(() => import('@/pages/Roadmap'))
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
      <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<Booting />}>
            <Routes>
              <Route path="/terms" element={<Terms />} />
              <Route path="/guidelines" element={<Guidelines />} />
              <Route path="/roadmap" element={<Roadmap />} />

              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/signup" element={<Auth mode="signup" />} />

              {/* the side of the site anyone can read without an account */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<RootRoute />} />
              </Route>

              <Route element={<AppShell />}>
                {/* open to guests so a shared link works logged out */}
                <Route path="/discover" element={<Discover />} />
                <Route path="/create" element={<CreateHub />}>
                  <Route index element={<CreateOverview />} />
                  <Route path="spaces" element={<CreateSpaces />} />
                  <Route path="uploads" element={<CreateUploads />} />
                  <Route path="marketplace" element={<CreateMarketplace />} />
                  <Route path="inventory" element={<CreateInventory />} />
                  <Route path="analytics" element={<CreateAnalytics />} />
                  <Route path="creator/:username" element={<CreatorPage />} />
                  <Route path=":tag" element={<AssetPage />} />
                </Route>
                <Route path="/people" element={<People />} />
                <Route element={<CommunityShell />}>
                  <Route path="/communities" element={<Communities />} />
                  <Route
                    path="/communities/new"
                    element={<Navigate to="/communities?new=1" replace />}
                  />
                  <Route path="/c/:id/:name" element={<CommunityPage />} />
                  <Route path="/c/:slug" element={<CommunityPage />} />
                </Route>
                {/* The numbered addresses are the real ones; the older
                    name-only forms still answer and redirect. */}
                <Route path="/u/:id/:name" element={<Profile />} />
                <Route path="/u/:username" element={<Profile />} />
                <Route path="/s/:id/:name" element={<SpacePage />} />
                <Route path="/e/:id/:name" element={<EventPage />} />
                <Route path="/e/:id" element={<EventPage />} />
                <Route path="/u/:username/:slug" element={<SpacePage />} />

                <Route element={<RequireAuth />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/spaces/new" element={<NewSpace />} />
                  <Route path="/spaces/:spaceId/edit" element={<EditSpace />} />
                  <Route element={<CommunityShell />}>
                    <Route path="/c/:slug/configure" element={<ConfigureCommunity />} />
                  </Route>
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
    </ThemeProvider>
    </BrowserRouter>
  )
}
