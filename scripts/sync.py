import subprocess
import shutil
from pathlib import Path


def resolve_npm_command() -> str:
    candidates = ["npm", "npm.cmd", "npm.exe"]
    for candidate in candidates:
        npm_path = shutil.which(candidate)
        if npm_path:
            return npm_path
    raise FileNotFoundError(
        "npm was not found in PATH. Install Node.js and reopen your terminal/IDE."
    )

def check_for_dep(dep: str) -> bool:
    try:
        subprocess.run([dep, "--version"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def install_pyDeps():
    subprocess.run(["pip", "install", "-r", "requirements.txt"])

def install_nodeDeps():
    root_dir = Path(__file__).resolve().parent.parent
    client_dir = root_dir / "client"
    print(client_dir)
    npm_cmd = resolve_npm_command()
    subprocess.run([npm_cmd, "install"], cwd=client_dir)

if __name__ == "__main__":
    print("Checking for dependencies...")
    if not check_for_dep("pip"):
        print("pip not found.")
        exit()
    if not check_for_dep("node") or not check_for_dep(resolve_npm_command()):
        print("Node.js or npm not found.")
        exit()

    print("Installing node dependencies...")
    install_nodeDeps()
    print("Installing Python dependencies...")
    install_pyDeps()