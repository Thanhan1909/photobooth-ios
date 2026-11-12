# Bloom Booth Studio — Windows and iPhone

## Features
- Responsive warm/light redesign with 3 editor tabs: **43 color filters**, **11 backgrounds** and **11 frame styles**.
- Background replacement uses the local MediaPipe Selfie Segmentation WASM/TFLite bundle. The model runs in the browser; captured images are not uploaded for editing.
- Backgrounds: original, AI blur, rose, sky, lavender, mint, sunset, cream studio, illustrated garden, night stars, and custom user images.
- Frames: none, polaroid, film, rose, botanical, confetti, stars, sweetheart, classic, magazine, and user PNG overlay.
- Custom caption and JPEG download. Final JPG combines color grading, background and frame.
- iPhone on LAN HTTP: choose **Chụp bằng camera iPhone**. Live camera inside webpage requires HTTPS because getUserMedia needs a secure context.
- Export 1200 × 1500 JPEG, source image is processed at max 1600px for iPhone memory budget.
- Important: live video previews color filters, while background removal and frame composition are applied **after capture**. AI edge quality depends on the subject and lighting.

## Local setup
Docker Desktop required.
- Windows: `http://localhost:8085/mobile/`
- iPhone on same reachable Wi-Fi: `http://192.168.2.62:8085/mobile/`
- `docker compose up -d --build`

## CI/CD
- GitHub Actions builds, performs smoke and unit tests, then advances `deploy/windows` only on success.
- Windows Scheduled Task `Photobooth-GitHub-CICD` fetches Git refs every five minutes and deploys tested code. Local logs: `deploy/deploy.log`.

## Third-party components and licenses
- `mobile/vendor/mediapipe/`: `@mediapipe/selfie_segmentation` 0.1.1675465747 © Google, Apache License 2.0. Original package: https://www.npmjs.com/package/@mediapipe/selfie_segmentation
- Reference gallery of filter designs: `mobile/FILTER-SOURCES.md` (MIT repositories, no code copied).
- No user photo gets posted to any external API by the new mobile editor. Keep the Photobooth HTTP port on trusted LAN; don't expose admin functions publicly without authentication and HTTPS.
