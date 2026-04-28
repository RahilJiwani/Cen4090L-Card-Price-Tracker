import React from "react";
import useAuth from "../Hooks/useAuth.js";
import { useNavigate } from "react-router-dom";

function AccountPage() {
    const { user, logout } = useAuth(); 
    const navigate = useNavigate();

    const handleDeleteAccount = async () => {
        // 1. Confirm with the user
        const confirmed = window.confirm(
            "Are you absolutely sure you want to delete your account? This action cannot be undone."
        );

        if (confirmed) {
            try {
                // 2. Call your backend API
                const response = await fetch("/api/account/delete", {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}` 
                    }
                });

                if (response.ok) {
                    alert("Account successfully deleted.");
                    logout(); 
                    navigate("/"); 
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.message || "Failed to delete account"}`);
                }
            } catch (error) {
                console.error("Delete account error:", error);
                alert("An error occurred while trying to delete your account.");
            }
        }
    };

    return (
        <div className="page-shell">
            <div className="page-container account-stack">
                <section className="account-card page-card">
                    <div className="page-header">
                        <h1 className="page-title">Account Settings</h1>
                        <p className="page-subtitle">Manage your profile and security options.</p>
                    </div>

                    <div className="account-info-group">
                        <label className="account-label">Username</label>
                        <p className="account-text">{user?.username || "N/A"}</p>
                    </div>

                    <div className="account-info-group">
                        <label className="account-label">Email Address</label>
                        <p className="account-text">{user?.email || "N/A"}</p>
                    </div>

                    <div className="button-group">
                        <button className="secondary-button">Edit Profile</button>
                        <button className="secondary-button">Change Password</button>
                    </div>
                </section>

                <section className="danger-zone">
                    <h2 className="danger-title">Danger Zone</h2>
                    <p className="danger-text">Once you delete your account, there is no going back. Please be certain.</p>
                    <button 
                        className="danger-button" 
                        onClick={handleDeleteAccount}
                    >
                        Delete Account
                    </button>
                </section>
            </div>
        </div>
    );
}

export default AccountPage;