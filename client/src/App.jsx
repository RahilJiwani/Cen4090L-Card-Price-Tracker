import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute, UnverifiedOnlyRoute } from './Components/RouteGuards.jsx'
import RootRedirect from './Components/RootRedirect.jsx' 
import Navbar from './Components/Navbar.jsx' 
import SignupPage from './Pages/Signup.jsx'
import SignupVerification from './Pages/SignupVerification.jsx'
import Verify from './Pages/Verify.jsx'
import LoginPage from './Pages/Login.jsx'
import DashboardPage from './Pages/Dashboard.jsx'
import SearchPage from './Pages/Search.jsx'
import AccountPage from './Pages/Account.jsx'
import CardDetailPage from './Pages/CardDetail.jsx'
import NotFoundPage from './Pages/NotFound.jsx'

function App() {
    return (
        <div className="app-shell">
            <Navbar />

            <main className="app-content">
                <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    {/* will add back protected routes after testing  */}
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
                        path="/signup-verification"
                        element={
                            <UnverifiedOnlyRoute>
                                <SignupVerification />
                            </UnverifiedOnlyRoute>
                        }
                    />
                    <Route
                        path="/verify"
                        element={
                            <UnverifiedOnlyRoute>
                                <Verify />
                            </UnverifiedOnlyRoute>
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
                    <Route
                        path="/card/:cardId"
                        element={
                            <ProtectedRoute>
                                <CardDetailPage />
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
