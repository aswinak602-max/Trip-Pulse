import os
import sys
import socket
import uvicorn

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Checks if the target host:port is already bound by another process."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        try:
            s.bind((host, port))
            return False
        except socket.error:
            return True

def get_process_on_port(port: int):
    """Finds the PID of the process listening on a given port on Windows."""
    try:
        import subprocess
        output = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True).decode('utf-8', errors='ignore')
        for line in output.strip().splitlines():
            parts = line.strip().split()
            if len(parts) >= 5 and "LISTENING" in parts:
                return parts[-1]
    except Exception:
        pass
    return None

if __name__ == "__main__":
    host = "127.0.0.1"
    port = 8000

    if is_port_in_use(port, host):
        pid = get_process_on_port(port)
        print("=" * 70)
        print(f" [CONFLICT NOTICE] Port {port} is already in use by another process!")
        if pid:
            print(f" Existing Process PID: {pid}")
            print(f" To stop the existing backend process in Windows CMD / PowerShell, run:")
            print(f"   taskkill /F /PID {pid}")
        else:
            print(f" Please terminate the process listening on port {port} before starting.")
        print("=" * 70)
        sys.exit(1)

    print("=" * 70)
    print(f" Starting TripPulse Backend on http://{host}:{port}")
    print("=" * 70)

    # Use uvicorn with single worker and standard reload on Windows
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        workers=1
    )
