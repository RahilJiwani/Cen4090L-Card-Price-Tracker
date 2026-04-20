import shutil
import socket
import subprocess
import time
import sys
from pathlib import Path


def resolve_npm_command() -> str:
    """Return a Windows-safe npm executable path, or raise if unavailable."""
    candidates = ["npm", "npm.cmd", "npm.exe"]
    for candidate in candidates:
        npm_path = shutil.which(candidate)
        if npm_path:
            return npm_path
    raise FileNotFoundError(
        "npm was not found in PATH. Install Node.js and reopen your terminal/IDE."
    )


def wait_for_port(host: str, port: int, process: subprocess.Popen, timeout: float = 30.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if process.poll() is not None:
            raise subprocess.CalledProcessError(process.returncode, process.args)

        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(1.0)
            try:
                if sock.connect_ex((host, port)) == 0:
                    return
            except OSError:
                pass

        time.sleep(0.25)

    raise TimeoutError(f"Flask did not open {host}:{port} within {timeout} seconds.")


if __name__ == "__main__":
    root_dir = Path(__file__).resolve().parent
    client_dir = root_dir / "client"

    # Always use the venv Python so Flask and dependencies are available
    venv_python = root_dir / ".venv" / "Scripts" / "python.exe"
    python_exe = str(venv_python) if venv_python.exists() else sys.executable

    # Prevent child processes from opening their own console windows on Windows
    startupinfo = None
    if sys.platform == "win32":
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = subprocess.SW_HIDE

    flask_process = subprocess.Popen(
        [python_exe, "-m", "flask", "--app", "new_app.app:app", "run", "--port", "5008"],
        cwd=root_dir,
        startupinfo=startupinfo,
    )

    try:
        wait_for_port("127.0.0.1", 5008, flask_process)
        npm_cmd = resolve_npm_command()
        npm_process = subprocess.Popen([npm_cmd, "run", "dev"], cwd=client_dir, startupinfo=startupinfo)

        try:
            while True:
                exit_code = npm_process.poll()
                if exit_code is not None:
                    if exit_code != 0:
                        raise subprocess.CalledProcessError(exit_code, npm_process.args)
                    break
                time.sleep(0.25)
        except KeyboardInterrupt:
            if npm_process.poll() is None:
                npm_process.terminate()
                npm_process.wait()
            raise SystemExit(130)
    finally:
        if flask_process.poll() is None:
            flask_process.terminate()