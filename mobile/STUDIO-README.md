# BloomBooth — Camera + Filters + Download

## UX
- The public page is BloomBooth: **Open camera → Choose color filter and decorative frame → Take photo → Download JPG**.
- Both the 43 color filter cards and 10 decorative frame cards preview the user's current camera photo (or last capture); they use a sample portrait when camera is off.
- Frame is previewed over the live camera, can be changed after capture and is embedded in the downloaded JPG.
- No background replacement, AI segmentation, uploads, photo pickers, or legacy navigation. Decorative frames are available.
- 43 filter presets with CSS preview on live video; Canvas pixel processing generates the final JPEG without submitting photos to the server.
- On Windows desktop: `http://localhost:8085/mobile/`; on iPhone **Safari live camera needs HTTPS**.

## HTTPS on iPhone (local LAN)
A private, LAN-only HTTPS proxy was created **on Windows outside this Git repository** at `C:\Projects\BloomBoothTLS`.
- Secure page: `https://192.168.2.62:8443/`
- Download CA profile on iPhone: `http://192.168.2.62:8444/bloombooth-ca.cer`
- On iPhone Safari, download CA. Then Settings → General → VPN & Device Management → Profile Downloaded → Install. Then Settings → General → About → Certificate Trust Settings → enable full trust for **BloomBooth Local Camera CA**. Reopen HTTPS page and grant Camera permission.
- This is a **development-only private CA**. Trusting a CA certificate gives it authority on that device; install only when you personally control the Windows machine and remove it when finished. NEVER share `C:\Projects\BloomBoothTLS\ca.key` or `server.key`.
- The certificate is valid for the static LAN IP `192.168.2.62` only (and localhost). Update certificates if the Windows IP changes. The firewall permits HTTPS and CA download only from the local subnet.
- Scheduled task `BloomBooth-HTTPS` starts the proxy at Windows login; `Photobooth-GitHub-CICD` keeps Docker updated after CI passes.
- The proxy **only permits the BloomBooth mobile page and its static assets**, not PHP/admin routes.

## CI/CD
- GitHub Actions tests 43 filters, simplified UI, PHP redirect and HTTP endpoints, then advances `deploy/windows`.
- Windows pulls CI-approved commit and rebuilds Docker. Local privacy data is not committed.
- HTTPS certificate keys and proxy scripts remain on the authorized Windows device, outside of the public repository.

## Current limitations
- Safari camera access on iPhone still requires a real device test after trusting the CA.
- Browser export/download may prompt Save to Files or Share → Save Image depending on iOS version.
- CSS video preview and JavaScript export are designed to be visually similar but not pixel-identical for every preset.
