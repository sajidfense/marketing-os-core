import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { OrgGuard } from '@/components/shared/OrgGuard';

// Eager-loaded (critical path)
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';

// Lazy-loaded (non-critical)
const Landing = lazy(() => import('@/pages/Landing'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Campaigns = lazy(() => import('@/pages/Campaigns'));
const Bookings = lazy(() => import('@/pages/Bookings'));
const Workflows = lazy(() => import('@/pages/Workflows'));
const Skills = lazy(() => import('@/pages/Skills'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));
const Branding = lazy(() => import('@/pages/Branding'));
const SEOAnalyser = lazy(() => import('@/pages/SEOAnalyser'));
const AdminAccess = lazy(() => import('@/pages/AdminAccess'));
const AdminProvision = lazy(() => import('@/pages/AdminProvision'));
const Integrations = lazy(() => import('@/pages/Integrations'));
const GoogleAds = lazy(() => import('@/pages/GoogleAds'));
const Semrush = lazy(() => import('@/pages/Semrush'));
const VideoScripts = lazy(() => import('@/pages/VideoScripts'));
const SocialCaptions = lazy(() => import('@/pages/SocialCaptions'));
const BlogPlanner = lazy(() => import('@/pages/BlogPlanner'));
const BlogEditor = lazy(() => import('@/pages/BlogEditor'));
const Roadmap = lazy(() => import('@/pages/Roadmap'));
const ContentCalendar = lazy(() => import('@/pages/ContentCalendar'));
const Leads = lazy(() => import('@/pages/Leads'));
const SEOPlan = lazy(() => import('@/pages/SEOPlan'));
const CampaignStrategy = lazy(() => import('@/pages/CampaignStrategy'));
const CreativeLibrary = lazy(() => import('@/pages/CreativeLibrary'));
const AdCopy = lazy(() => import('@/pages/AdCopy'));
const SEOAnalyzerPage = lazy(() => import('@/pages/SEOAnalyzerPage'));
const SEOReportPage = lazy(() => import('@/pages/SEOReportPage'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const UpdatePassword = lazy(() => import('@/pages/UpdatePassword'));

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public marketing routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/admin-access" element={<AdminAccess />} />
        <Route path="/admin" element={<AdminProvision />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
        <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <OrgGuard>
                <AppLayout />
              </OrgGuard>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/branding" element={<Branding />} />
          <Route path="/seo" element={<SEOAnalyser />} />
          <Route path="/seo/analyzer" element={<SEOAnalyzerPage />} />
          <Route path="/seo/report" element={<SEOReportPage />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/google-ads" element={<GoogleAds />} />
          <Route path="/semrush" element={<Semrush />} />
          <Route path="/ai/ad-copy" element={<AdCopy />} />
          <Route path="/ai/video-scripts" element={<VideoScripts />} />
          <Route path="/ai/social-captions" element={<SocialCaptions />} />
          <Route path="/ai/blog-planner" element={<BlogPlanner />} />
          <Route path="/blog/:id" element={<BlogEditor />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/content-calendar" element={<ContentCalendar />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/seo-plan" element={<SEOPlan />} />
          <Route path="/campaign-strategy" element={<CampaignStrategy />} />
          <Route path="/creative-library" element={<CreativeLibrary />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
