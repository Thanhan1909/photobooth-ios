# Photobooth — Windows + iPhone

## Windows
- Start Docker Desktop and run `docker compose up -d --build` from this repository.
- Open http://localhost:8085 from the Windows machine.
- Data, private media and settings live in `data/`, `private/`, and `config/` (not committed).

## iPhone (same trusted Wi-Fi / LAN)
- Open http://192.168.2.62:8085 in Safari, provided the PC is still on this IP.
- The local `config/my.config.inc.php` sets `ui.selfie_mode = true`.
- The **Take Selfie** button uses the native iOS camera/file picker, and uploads the picture.
- A separate, direct live camera preview with getUserMedia requires HTTPS and iOS testing.
- This project is **not hardened for public Internet access**. Do not forward port 8085 or open a public tunnel without an authenticated proxy and security review.

## GitHub CI/CD
- Push to `main`: GitHub Actions builds the Docker image and tests HTTP.
- Scheduled task `Photobooth-GitHub-CICD` checks GitHub every 5 minutes.
- Deploy only happens after the matching CI workflow succeeds; local uncommitted changes prevent update.
- Log: `deploy/deploy.log` (local only). Script: `deploy/update-windows.ps1`.
- Windows PC and Docker Desktop must be running for updates and iPhone access.
