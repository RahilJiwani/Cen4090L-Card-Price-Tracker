import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../Hooks/useAuth.js';

function Navbar() {
    // changed isLoggedIn to user to match auth hook
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (logout) {
            await logout();
        }
        navigate('/login', { replace: true });
    };

    return (
        <nav className="site-nav">
            <div className="site-brand">
                <span className="site-brand__eyebrow">Card price tracking</span>
                <Link to="/" className="site-brand__link">
                    MTG Price Tracker
                </Link>
            </div>

            <div className="site-nav-links">
                {user ? (
                    <>
                        <Link to="/dashboard" className="site-nav-link">Dashboard</Link>
                        <Link to="/search" className="site-nav-link">Search Cards</Link>
                        <Link to="/account" className="site-nav-link">Account</Link>
                        <button onClick={handleLogout} className="nav-button">
                            Log Out
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="site-nav-link">Login</Link>
                        <Link to="/signup" className="nav-button nav-button--primary">
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;