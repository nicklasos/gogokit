import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthCard } from '@/auth/AuthCard'
import { RequireRole, RequireSuperAdmin } from '@/auth/guards'
import LoginPage from '@/auth/LoginPage'
import { ROLE_ADMIN } from '@/auth/roles'
import { AppShell } from '@/layout/AppShell'

// Every page is its own chunk, loaded when its route is first opened. The login form is
// the exception: it is the first thing a signed-out visitor sees.
const ForgotPasswordPage = lazy(() => import('@/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/auth/VerifyEmailPage'))
const ProfilePage = lazy(() => import('@/features/account/ProfilePage'))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const ExampleEditorPage = lazy(() => import('@/features/examples/pages/ExampleEditorPage'))
const ExamplesPage = lazy(() => import('@/features/examples/pages/ExamplesPage'))
const FilesPage = lazy(() => import('@/features/uploads/pages/FilesPage'))
const AdminsPage = lazy(() => import('@/features/users/pages/AdminsPage'))
const SuperAdminsPage = lazy(() => import('@/features/users/pages/SuperAdminsPage'))
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'))
const NotFoundPage = lazy(() => import('@/shared/components/NotFoundPage'))

/** Signed-out routes. Every other URL shows the login form in place, so signing in lands on the page that was asked for. */
export function PublicRoutes() {
  return (
    <Routes>
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route
        path="verify-email"
        element={
          <AuthCard subtitle={null}>
            <VerifyEmailPage />
          </AuthCard>
        }
      />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="examples" element={<ExamplesPage />} />
        <Route path="examples/new" element={<ExampleEditorPage />} />
        <Route path="examples/:id/edit" element={<ExampleEditorPage />} />
        <Route path="files" element={<FilesPage />} />
        <Route
          path="users"
          element={
            <RequireRole roles={[ROLE_ADMIN]}>
              <UsersPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/super-admins"
          element={
            <RequireSuperAdmin>
              <SuperAdminsPage />
            </RequireSuperAdmin>
          }
        />
        <Route
          path="admin/admins"
          element={
            <RequireSuperAdmin>
              <AdminsPage />
            </RequireSuperAdmin>
          }
        />
        {/* Signed-out pages make no sense once signed in */}
        <Route path="forgot-password" element={<Navigate to="/" replace />} />
        <Route path="reset-password" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
