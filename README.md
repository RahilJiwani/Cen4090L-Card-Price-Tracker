# Cen4090L-Card-Price-Tracker
Software engineering Lab project based around making a python program and website that aims to notify users when the price of a Magic The Gathering card falls below a certain amount.

## Team Setup Instructions

If you are a team member cloning this repo for the first time, follow these steps to get your local environment running.

### Prerequisites
- Python 3.9+ installed
- PostgreSQL installed locally
- NodeJS and npm

### Step 1: Bootstrap the Environment
We have a fully automated bootstrap script that sets up your Python virtual environment, installs all dependencies, creates the database, and loads the schema.

1. Open a PowerShell terminal in the root of the project.
2. Run the bootstrap script:
   ```powershell
   .\scripts\bootstrap.ps1
   ```
3. The script will prompt you for your **postgres superuser password** (the one you set when installing PostgreSQL). Type it in the terminal and press Enter.
4. The script will automatically generate your `.env` file for you.

### Step 2: Run the Web App
Once bootstrap completes successfully, you can start the Flask development server:

```powershell
.\scripts\run.ps1
```

The app will now be running at `http://127.0.0.1:5174/`.

---
*Note: You only need to run `bootstrap.ps1` once. After that, just use `run.ps1` to start the app for development.*
