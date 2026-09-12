import uvicorn
import socket
import os


def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    local_ip = get_local_ip()
    print(
        f"\n{'='*50}\n"
        f"  Game Hub Server Starting...\n"
        f"{'='*50}\n"
        f"  Binding to: {host}:{port}\n"
        f"  LAN IP:     {local_ip}:{port}\n"
        f"  Players can connect to: http://{local_ip}:{port}\n"
        f"{'='*50}\n"
    )
    from server.app import app
    uvicorn.run(app, host=host, port=port, log_level="info")
