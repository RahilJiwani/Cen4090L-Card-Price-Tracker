import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './Components/RouteGuards.jsx'
import RootRedirect from './Components/RootRedirect.jsx' 
import Navbar from './Components/Navbar.jsx' 
import SignupPage from './Pages/Signup.jsx'
import SignupVerification from './Pages/SignupVerification.jsx'
import LoginPage from './Pages/Login.jsx'
import DashboardPage from './Pages/Dashboard.jsx'
import SearchPage from './Pages/Search.jsx'
import AccountPage from './Pages/Account.jsx'
import NotFoundPage from './Pages/NotFound.jsx'

function App() {
    return (
        <div style={styles.appShell}>
            {}
            <Navbar />

            <main style={styles.content}>
                <Routes>
                    {}
                    <Route path="/" element={<RootRedirect />} />

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
                            <PublicOnlyRoute>
                                <SignupVerification />
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