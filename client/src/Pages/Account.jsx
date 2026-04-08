import React from "react";

function AccountPage() {
    return (
        <div style={styles.page}>
            <h1 style={styles.title}>Account Settings</h1>

            <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Profile Information</h2>

                <div style={styles.infoGroup}>
                    <label style={styles.label}>Username</label>
                    <p style={styles.text}>Planeswalker_1</p>
                </div>

                <div style={styles.infoGroup}>
                    <label style={styles.label}>Email Address</label>
                    <p style={styles.text}>user@fsu.edu</p>
                </div>

                <div style={styles.buttonGroup}>
                    <button style={styles.button}>Edit Profile</button>
                    <button style={styles.button}>Change Password</button>
                </div>
            </div>

            <div style={styles.dangerZone}>
                <h2 style={styles.dangerTitle}>Danger Zone</h2>
                <p style={styles.dangerText}>Once you delete your account, there is no going back. Please be certain.</p>
                <button style={styles.dangerButton}>Delete Account</button>
            </div>
        </div>
    );
}

export default AccountPage;

const styles = {
    page: {
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "600px",
        margin: "0 auto"
    },
    title: {
        fontSize: "1.5rem",
        marginBottom: "1.5rem",
    },
    card: {
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        marginBottom: "20px",
        backgroundColor: "#fff"
    },
    sectionTitle: {
        marginTop: 0,
        fontSize: "1.2rem",
        borderBottom: "1px solid #eee",
        paddingBottom: "10px",
        marginBottom: "15px"
    },
    infoGroup: {
        marginBottom: "15px",
    },
    label: {
        fontWeight: "bold",
        display: "block",
        marginBottom: "5px",
        color: "#333"
    },
    text: {
        margin: 0,
        padding: "10px",
        backgroundColor: "#f9f9f9",
        border: "1px solid #e0e0e0",
        borderRadius: "4px",
    },
    buttonGroup: {
        display: "flex",
        gap: "10px",
        marginTop: "20px"
    },
    button: {
        padding: "10px 15px",
        cursor: "pointer",
        backgroundColor: "#3498db",
        color: "white",
        border: "none",
        borderRadius: "4px",
    },
    dangerZone: {
        padding: "20px",
        border: "1px solid #e74c3c",
        borderRadius: "4px",
        backgroundColor: "#fdf0ef"
    },
    dangerTitle: {
        marginTop: 0,
        color: "#c0392b",
        fontSize: "1.2rem"
    },
    dangerText: {
        marginBottom: "15px",
        color: "#333"
    },
    dangerButton: {
        padding: "10px 15px",
        cursor: "pointer",
        backgroundColor: "#e74c3c",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontWeight: "bold"
    }
};