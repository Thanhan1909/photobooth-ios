# BloomBooth for iPhone — PWA, no VPS required

The existing Windows PhotoBooth under E:\PhotoBooth\photobooth-ios remains unchanged. A separate GitHub Pages workflow builds the independent static iPhone PWA from mobile/.

## Install on iPhone
1. Connect iPhone to internet for the first visit.
2. In Safari, open https://thanhan1909.github.io/photobooth-ios/ .
3. Tap Share → Add to Home Screen → enable Open as Web App → Add.
4. Launch BloomBooth using its Home Screen icon and allow camera access.
5. Capture 1, 3 or 5 shots and edit the frame/filter locally. Download/save the final picture.
6. After the service worker activates and caches assets, you can use it offline without Windows, Docker or a VPS.

Important: initial installation, updates and restoration after iOS evicts Safari site storage need internet. Download or Save to Photos to permanently retain your pictures. Offline availability is not an absolute guarantee if iOS reclaims storage.

## CI/CD
Workflow: .github/workflows/iphone-pages.yml . Changes to mobile, build tools and tests trigger static-site deployment.
ONE-TIME GitHub setting: repository Settings → Pages → Build and deployment → Source: GitHub Actions .
App URL: https://thanhan1909.github.io/photobooth-ios/ .
Local test: node scripts/build-iphone-pwa.cjs then node tests/iphone-pwa.test.cjs .
Distribution output: dist/iphone/ (gitignored).

## Privacy and architecture
Published assets are strictly allowlisted: HTML, CSS, JS, manifest, service worker and icons. No server-side PHP, Docker data, app credentials or local TLS keys are published.
Photo processing and JPEG exports happen in the browser; the app does not upload images.
GitHub Pages provides secure HTTPS for first-time app loading and updates.
This is a Home Screen web app, not an IPA or App Store binary. Native iOS signing/distribution requires a separate Apple developer and supported build/sign environment.