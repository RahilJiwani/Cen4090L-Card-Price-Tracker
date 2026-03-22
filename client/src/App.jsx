import { Routes, Route, Navigate } from 'react-router-dom'
import useAuth from './Hooks/useAuth.js'
import AuthLoading from './Pages/AuthLoading.jsx'
import { ProtectedRoute, PublicOnlyRoute } from './Components/RouteGuards.jsx'
import Navbar from './Components/NavBar.jsx'
import SignupPage from './Pages/Signup.jsx'
import LoginPage from './Pages/Login.jsx'
import DashboardPage from './Pages/Dashboard.jsx'
import SearchPage from './Pages/Search.jsx'
import AccountPage from './Pages/Account.jsx'
import NotFoundPage from './Pages/NotFound.jsx'

function App() {
  const { authChecked, isLoggedIn } = useAuth() // added in for root route auth (path="/")

  return (
    <div style={styles.appShell}>
      <main style={styles.content}>
        <Routes>
          <Route
            path="/"
            element={
              !authChecked
                ? <AuthLoading />
                : <Navigate to={isLoggedIn ? '/dashboard' : '/signup'} replace /> // l_a could we handle this differently to avoid the useAuth call in App?
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignupPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

const styles = {
  appShell: {
    minHeight: '100vh',
  },
  content: {
    paddingTop: '72px',
  },
}