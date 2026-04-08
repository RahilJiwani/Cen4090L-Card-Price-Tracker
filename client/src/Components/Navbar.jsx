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
        // redirect the user to the login page after logging out
        navigate('/login');
    };

    return (
        <nav style={styles.nav}>
            <div style={styles.brand}>
                <Link to="/" style={styles.brandLink}>
                    MTG Price Tracker
                </Link>
            </div>

            <div style={styles.navLinks}>
                {user ? (
                    <>
                        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
                        <Link to="/search" style={styles.link}>Search Cards</Link>
                        <Link to="/account" style={styles.link}>Account</Link>
                        <button onClick={handleLogout} style={styles.logoutButton}>
                            Log Out
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={styles.link}>Login</Link>
                        <Link to="/signup" style={styles.signupButton}>
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;

// Styling
const styles = {
    nav: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 40px",
        background: "#1b1b1b",
        borderBottom: "2px solid #d7a73f", // MTG Gold accent line
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        boxSizing: "border-box",
        zIndex: 1000,
        fontFamily: "Georgia, serif",
    },
    brand: {
        fontSize: "22px",
        fontWeight: "bold",
        letterSpacing: "1px",
    },
    brandLink: {
        color: "#f5f5f5",
        textDecoration: "none",
    },
    navLinks: {
        display: "flex",
        gap: "24px",
        alignItems: "center",
    },
    link: {
        color: "#bbb",
        textDecoration: "none",
        fontSize: "15px",
        transition: "color 0.2s",
    },
    signupButton: {
        background: "#d7a73f",
        color: "#111",
        padding: "8px 16px",
        borderRadius: "6px",
        textDecoration: "none",
        fontWeight: "bold",
        fontSize: "14px",
    },
    logoutButton: {
        background: "transparent",
        border: "1px solid #d7a73f",
        color: "#d7a73f",
        padding: "8px 16px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
        fontFamily: "inherit",
        fontSize: "14px",
    }
};