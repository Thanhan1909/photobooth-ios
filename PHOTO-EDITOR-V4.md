# BloomBooth Photo Editor v4 — independent capture and post-processing

## Workflow
1. Capture one or more camera photos. Choose the photo count 1–10 using the custom capture field or the 1/3/5 shortcuts.
2. Choose either Auto-save when capture completes or edit-first (checkbox). Custom counts start edit-first.
3. Tap Edit captured photos; it opens the independent editor and imports the captured originals.
4. Import more files using 'Them anh tu Photos' (iOS file picker; the photos stay on the device).
5. Pick 1–10 photo slots, select any images for them in any order, then choose a layout.
6. Pick any of 32 original geometries, optionally one of 41 original theme ornaments and 43 color filters.
7. Drag photo windows to position them, resize selected window, choose contain/cover and preview instantly.
8. Optional: overlay a user-owned transparent PNG/WebP frame. It must have genuine alpha in cutouts; JPEG screenshots and flat gallery covers cannot be used as overlays.
9. Save the completed composition with the same geometry in native iPhone Photos using the Capacitor bridge, or with the web Share Sheet.

## Template art and licensing
The Penci gallery (https://penci.vn/mau-thiet-ke-bo-anh-photobooth.html) was referenced to understand editorial photostrips and common 1/3/4/5 window geometry. BloomBooth does not copy or distribute Penci's preview images, embedded portraits, logos, or proprietary layered artwork.
Publishing third-party designs inside another application's template library requires authorization or a compatible license. Users can import their own properly licensed transparent template PNG; the editor supports manual positioning of its cutouts.

## Architecture
- mobile/layout-catalog.js: 32 original template layout definitions (ratio, background, title, accent, per-template slot geometry).
- mobile/editor-v4.js: separate photo candidate store, manual source-to-slot mapping, pointer dragging, template previews, image downsampling, local compositing and native saving.
- mobile/studio-engine.js: arbitrary 1–10 capture slot counts, decorations behind photo windows.
- mobile/lite.js: camera capture, auto-save toggle, bridge exposing captured photos to the editor.
- ios-app: bundled standalone Capacitor iOS shell for Sideloadly.

## Tests
- node tests/editor-layouts.test.cjs — all 32 templates × 1–10 slot counts.
- node tests/mobile-studio-v2.test.cjs — original themes and composition.
- Browser end-to-end smoke: E:\PhotoBooth\tests\editor-v4-smoke.cjs
- Browser capture 7 and edit: E:\PhotoBooth\tests\capture-seven-edit-smoke.cjs
- iOS native build and IPA: .github/workflows/ios-sideloadly.yml

No cloud server is required to compose photos, and photos are not uploaded to the repository.
## Camera directly inside a template (new)
- Open Chỉnh sửa, choose any of 32 layout templates or a personally saved template.
- Tap Mở camera trong khung. The active photo window shows the live camera feed at the template's coordinates.
- Tap Chụp vào ô to capture just that window. The active slot advances and the source photo remains editable.
- Front/back camera switching and stop controls are included. Filter selection is reflected in the preview.
- The exact same per-template clipping path and composition are used for preview and Photos export.

## Personal licensed template library
- Import your own licensed JPG/PNG background (drawn behind captured photos) and/or transparent PNG overlay (drawn above photos).
- Adjust photo-window positions so they match the background or overlay cutouts.
- Choose a name and tap Lưu mẫu hiện tại. IndexedDB stores the background, overlay, count and slot positions on the device.
- Open a saved frame later and photograph directly into its windows. The data is not uploaded to GitHub or the VPS.
- Back up your templates externally if important: iOS may delete app data when an app is uninstalled or storage is reclaimed.

## Third-party designs and Penci
- Penci photobooth galleries showcase editable projects, but public availability and free online editing do not establish permission to redistribute their source graphics in a different application's IPA.
- BloomBooth does not batch-download, scrape or package Penci designs. If you have licensed/exported a reusable frame, import it into your personal template library instead.
- JPEG gallery previews already include sample subjects. They cannot automatically be treated as editable transparent frames; a clean background and/or transparent PNG overlay is preferable.

## Verification
- Remote Chrome: editor camera preview, per-slot capture, changing template, and stopping camera passed.
- Remote Chrome: personal template saved in IndexedDB, persisted across reload and restored successfully.
- Tests: tests/editor-camera-frame.test.cjs and tests/editor-layouts.test.cjs.
- Native iOS Photos permissions and camera in the actual signed IPA still require physical-device verification.