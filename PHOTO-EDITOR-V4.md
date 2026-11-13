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