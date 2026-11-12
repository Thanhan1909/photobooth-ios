# BloomBooth Studio — 1 / 3 / 5 photos with layout designer

Location: E:\PhotoBooth\photobooth-ios\mobile

## Capture
- Modes: single photo, 3-photo strip, 5-photo collage. One shutter press fills one slot.
- Layouts: vertical strip, photo grid, zigzag, collage. Selecting another layout preserves captured photos.
- Manual positioning: enable Tự kéo thả vị trí ô ảnh, select a slot in the main preview and drag it by touch or mouse; resize with the slider.
- Reorder photos: tap one captured photo then another to swap their positions, or drag a shot card on desktop.
- JPEG resolution: 1200x1600 (one), 1200x2700 (three), 1200x3500 (five).
- Preserves source aspect ratio; background fills the remainder without distorting the centered photo.
- Color filter thumbnails use snapshots from the camera.
- 41 frame choices: 1 plain and 40 original independently drawn art designs; no palette cross-product. Each has its own illustration and ornament geometry.
- Inspiration categories: Y2K Chrome, Coquette Pink, Kawaii Peach, Vintage Film, Noir Editorial, Lavender Dream, Sage Garden and Classic Cream.
- No copyrighted logos, original third-party brand assets or mascots are bundled.
- iPhone Safari camera live requires trusted HTTPS (LAN: https://192.168.2.62:8443/).
- Images are edited and exported locally in the browser; the mobile editor does not upload photos.

## Tests
- node tests/mobile-studio-v2.test.cjs
- node tests/mobile-filter-engine.test.cjs
- Source and bind-mounted frontend are on E drive; frontend-only Windows updates skip Docker rebuild.