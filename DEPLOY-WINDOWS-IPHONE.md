# Photobooth on Windows and iPhone
- Windows: start Docker Desktop. Run `docker compose up -d --build` in this repository.
- Windows URL: http://localhost:8085
- iPhone on same LAN: http://<Windows LAN IP>:8085 (gallery/UI only; camera needs HTTPS).
- CI: push to main triggers Photobooth CI; updater scheduled task fetches only after the workflow has passed.
- HTTPS on iPhone: configure a Cloudflare named tunnel with access control, or a TLS reverse proxy and public domain. Do not expose /admin to anonymous Internet access.
- iOS Safari camera: requires browser permissions and a secure origin, and must be tested separately. Docker does not pass through the phone camera to the server.
- Data persistence: data/, private/, and config/ are local bind mounts, not committed to Git.
