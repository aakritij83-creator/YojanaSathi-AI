import React from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './frontend/context/AuthContext.tsx';
import { LanguageProvider, useLanguage } from './frontend/context/LanguageContext.tsx';
import { ThemeProvider } from './frontend/context/ThemeContext.tsx';
import { LoadingSkeleton } from './frontend/components/UiPrimitives.tsx';
import { PublicLayout } from './frontend/layouts/PublicLayout.tsx';
import { AdminDashboardPage } from './frontend/pages/AdminDashboardPage.tsx';
import { AiAssistantPage } from './frontend/pages/AiAssistantPage.tsx';
import { ApplicationTrackerPage, SavedSchemesPage } from './frontend/pages/ApplicationTrackerPage.tsx';
import { ForgotPasswordPage, LoginPage, RegisterPage } from './frontend/pages/AuthPages.tsx';
import { DashboardPage } from './frontend/pages/DashboardPage.tsx';
import { EligibilityCheckerPage } from './frontend/pages/EligibilityCheckerPage.tsx';
import { HomePage } from './frontend/pages/HomePage.tsx';
import { AboutPage, HowItWorksPage, PrivacyPolicyPage, TermsPage } from './frontend/pages/InfoPages.tsx';
import { NotificationsPage } from './frontend/pages/NotificationsPage.tsx';
import { ProfilePage } from './frontend/pages/ProfilePage.tsx';
import { RejectionAnalyzerPage } from './frontend/pages/RejectionAnalyzerPage.tsx';
import { SchemeDetailPage } from './frontend/pages/SchemeDetailPage.tsx';
import { SchemesPage } from './frontend/pages/SchemesPage.tsx';
import { SettingsPage } from './frontend/pages/SettingsPage.tsx';

function AuthLoadingScreen() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <LoadingSkeleton rows={4} />
      </div>
    </PublicLayout>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <AuthLoadingScreen />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) {
    return <AuthLoadingScreen />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'admin') {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="rounded-2xl border border-[#E6E1D6] bg-white p-8 dark:border-[#1F2E42] dark:bg-[#111C2B]">
            <h1 className="font-display text-2xl font-bold text-[#0F1D2E] dark:text-[#F4F1EA]">
              {t.errors.adminRestrictedTitle}
            </h1>
            <p className="mt-3 text-sm text-[#465362] dark:text-[#A9B4C2]">
              {t.errors.adminRestrictedDesc}
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex rounded-xl bg-[#0F1D2E] px-5 py-2.5 text-sm font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
            >
              {t.errors.returnDashboard}
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }
  return <>{children}</>;
}

function PublicOnlyAuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <AuthLoadingScreen />;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <PublicLayout>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#5B6777] dark:text-[#A9B4C2]">
          404
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#0F1D2E] dark:text-[#F4F1EA]">
          {t.errors.notFoundTitle}
        </h1>
        <p className="mt-3 text-sm text-[#465362] dark:text-[#A9B4C2]">
          {t.errors.notFoundDesc}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/"
            className="rounded-xl bg-[#0F1D2E] px-5 py-2.5 text-sm font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
          >
            {t.nav.home}
          </Link>
          <Link
            to="/schemes"
            className="rounded-xl border border-[#CFC7B6] px-5 py-2.5 text-sm font-semibold text-[#0F1D2E] dark:border-[#2A3B54] dark:text-[#F4F1EA]"
          >
            {t.nav.exploreSchemes}
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/schemes" element={<SchemesPage />} />
      <Route path="/schemes/:id" element={<SchemeDetailPage />} />
      <Route path="/eligibility" element={<EligibilityCheckerPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* Auth pages */}
      <Route
        path="/login"
        element={
          <PublicOnlyAuthRoute>
            <LoginPage />
          </PublicOnlyAuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyAuthRoute>
            <RegisterPage />
          </PublicOnlyAuthRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Authenticated citizen pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracker"
        element={
          <ProtectedRoute>
            <ApplicationTrackerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved"
        element={
          <ProtectedRoute>
            <SavedSchemesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <AiAssistantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rejection-analyzer"
        element={
          <ProtectedRoute>
            <RejectionAnalyzerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Console */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
