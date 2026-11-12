# Photobooth — Windows + iPhone

## Windows
- Start Docker Desktop and run `docker compose up -d --build` from this repository.
- Open http://localhost:8085 from the Windows machine.
- Data, private media and settings live in `data/`, `private/`, and `config/` (not committed).

## iPhone (same trusted Wi-Fi / LAN)
- Open http://192.168.2.62:8085 in Safari, provided the PC is still on this IP.
- The local `config/my.config.inc.php` sets `ui.selfie_mode = true`.
- Open `http://192.168.2.62:8085/mobile/` to use 43 locally rendered photo effects with a Download button.
- On HTTP use **Chụp bằng camera iPhone**, then apply filters and download the processed JPEG without server upload.
- For live filtered camera preview, `getUserMedia` requires HTTPS and real iOS Safari testing.
- This project is **not hardened for public Internet access**. Do not forward port 8085 or open a public tunnel without an authenticated proxy and security review.

## GitHub CI/CD
- Push to `main`: GitHub Actions builds the Docker image and tests HTTP.
- GitHub Actions publishes the approved commit to `deploy/windows` only after build, HTTP and filter-engine tests pass.
- Scheduled task `Photobooth-GitHub-CICD` fetches `main` and `deploy/windows` every 5 minutes using Git, without REST API limits.
- Deploy only happens when the two branch SHAs match; local uncommitted tracked changes prevent update.
- Log: `deploy/deploy.log` (local only). Script: `deploy/update-windows.ps1`.
- Windows PC and Docker Desktop must be running for updates and iPhone access.
