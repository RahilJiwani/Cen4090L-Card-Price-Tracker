import React from "react";

function AccountPage() {
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
                        <p className="account-text">Planeswalker_1</p>
                    </div>

                    <div className="account-info-group">
                        <label className="account-label">Email Address</label>
                        <p className="account-text">user@fsu.edu</p>
                    </div>

                    <div className="button-group">
                        <button className="secondary-button">Edit Profile</button>
                        <button className="secondary-button">Change Password</button>
                    </div>
                </section>

                <section className="danger-zone">
                    <h2 className="danger-title">Danger Zone</h2>
                    <p className="danger-text">Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="danger-button">Delete Account</button>
                </section>
            </div>
        </div>
    );
}

export default AccountPage;