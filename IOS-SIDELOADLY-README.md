# BloomBooth iOS Native (Sideloadly)

Goal: iPhone app with an embedded offline photo booth, direct automatic save into the Apple Photos library, and capture 5 / choose 3 workflow.

## Capture rules
- Mode 1 photo: one shutter press -> compose -> auto-save one finished image to iPhone Photos.
- Mode 3 photos: three shutter presses -> compose -> auto-save one finished strip to Photos.
- Mode 5 photos: five shutter presses -> compose -> auto-save one finished collage to Photos.
- Mode 5 capture / 3 selected: capture five candidates, tap exactly three in the desired order, then press Confirm. Only then compose and auto-save one finished strip to Photos.
- Each shutter press only stores the individual temporary photo in the app session. No individual candidate photo is automatically saved.
- After saving, you can change filter, frame or layout and tap 'Luu lai vao Anh' to save another version deliberately.
- Photos are processed on the iPhone, never uploaded to Windows, VPS, or GitHub.

## Build and install from GitHub
Workflow: .github/workflows/ios-sideloadly.yml (macos-latest, Xcode).
CI creates an unsigned IPA: BloomBooth-iOS-unsigned.ipa.
GitHub Actions -> BloomBooth iOS IPA (Sideloadly) -> successful run -> Artifacts -> BloomBooth-iOS-Sideloadly-unsigned-IPA -> extract the downloaded ZIP.
On Windows, connect iPhone, open Sideloadly, choose the unsigned IPA and use your own Apple ID for local signing.
On iPhone, approve any required trust / Developer Mode prompts. Open BloomBooth, allow Camera and add-only Photos permissions.
No Apple password, signing certificate or device UDID is uploaded to GitHub.
Free personal Apple ID sideloaded apps typically need re-signing about every 7 days. Sideloadly's refresh support may help, depending on setup.

## Dependencies and source
ios-app/package.json: Capacitor 7 + @capacitor-community/media 8 + esbuild.
ios-app/src/native-photos.js: native iOS Photos bridge. Media.savePhoto({path:dataUrl}) saves the final JPEG to the camera roll.
scripts/build-ios-app.cjs: copies only the standalone web application assets into ios-app/www and adds the bridge.
scripts/configure-ios-plist.py: NSCameraUsageDescription, NSPhotoLibraryAddUsageDescription and NSPhotoLibraryUsageDescription.
Local Windows source: E:\PhotoBooth\photobooth-ios. Native build uses GitHub-hosted macOS so a local Mac is not required.

## Limitations
This is an unsigned IPA until Sideloadly signs it on the user's PC. It cannot be installed without signing.
On Windows and Safari/PWA, direct silent saving to Apple Photos is not available. Web fallback shows the OS Share sheet where the user can manually choose Save Image; the native app has the automatic Photos bridge.
Actual iOS permissions, physical camera, background app behavior and Photos saving must be confirmed on a real iPhone after installing the IPA.