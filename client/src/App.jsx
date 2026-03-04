import { Routes, Route, Link, Navigate } from 'react-router-dom'
import SignupPage from './Pages/Signup.jsx'
import LoginPage from './Pages/Login.jsx'
import DashboardPage from './Pages/Dashboard.jsx'
import SearchPage from './Pages/Search.jsx'
import AccountPage from './Pages/Account.jsx'
import NotFoundPage from './Pages/NotFound.jsx'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App