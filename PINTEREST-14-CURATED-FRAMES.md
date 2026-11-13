# BloomBooth: 14 original photo-frame designs from Pinterest reference concepts

The 14 input links are visual references from the user. Their artwork, photos, characters, and logos are not bundled in the public app.
BloomBooth creates original vectors with independent camera-ready cutouts. Third-party designs may be shipped only with proper authorization.

## Reference to original design mapping

| # | Pinterest reference | New BloomBooth frame | Photo slots | Concept |
|---|---|---|---:|---|
| 01 | https://pin.it/4rAyzEZZZ | Pink Pop Diary | 3 | playful stickers |
| 02 | https://pin.it/19yWk0j5w | Pressed Rose Letter | 2 | romantic pressed flowers |
| 03 | https://pin.it/4x3s9TAZD | Mono Zine Doodles | 2 | monochrome editorial |
| 04 | https://pin.it/4ZFEll4zu | Midnight 35mm | 3 | 35mm film perforation |
| 05 | https://pin.it/7CtbcYTSh | Theater Ticket Night | 4 | vintage ticket gallery |
| 06 | https://pin.it/3WzX04Ny3 | Instant Snapshot Party | 3 | instant camera stickers |
| 07 | https://pin.it/1WQFHSwlA | Burgundy Love Notes | 3 | romantic wine postcard |
| 08 | https://pin.it/3GwxJI6w4 | Graph Paper Memory | 3 | retro contact sheet |
| 09 | https://pin.it/3SmGcG6vk | Gingham Ribbon Book | 4 | pink gingham scrapbook |
| 10 | https://pin.it/3nv5zvClR | Cinema Candy Scrap | 3 | movie journal collage |
| 11 | https://pin.it/3dzwORcPl | Blue Field Notes | 4 | blue scrapbook collection |
| 12 | https://pin.it/6YtEzVy70 | Candy Friends Club | 3 | original little critters |
| 13 | https://pin.it/6UyUVG8N0 | Polaroid Mood Wall | 5 | handmade photo memory wall |
| 14 | https://pin.it/7hJkiCrRI | Rose Poetry Note | 2 | handwritten floral letter |

## Paths
E:\PhotoBooth\photobooth-ios — original source, GitHub CI/CD, static frontend and iOS build
E:\PhotoBooth\references\pinterest — 14 private user-provided references (not committed)
E:\PhotoBooth\previews\bloombooth-14-original-frames.png — preview screenshot
mobile/curated-frames.js — 14 frame definitions with exact slots
mobile/frames/*.svg — 14 original transparent-cutout vectors
mobile/frame-gallery.html — visual preview website
scripts/generate-curated-frames.py — deterministic vector generator

## iPhone independent from laptop
GitHub Pages over HTTPS plus Safari Add to Home Screen. PWA service worker caches frame SVG, CSS, JS and icons for offline use.
GitHub Pages must be enabled once in Settings > Pages > Source GitHub Actions.
App URL after activation: https://thanhan1909.github.io/photobooth-ios/
Gallery URL after activation: https://thanhan1909.github.io/photobooth-ios/frame-gallery.html
The old LAN URL 192.168.2.62 is dependent on the Windows host and not suitable for independent phone use.
The web cannot silently save to iOS Photos; use Share > Save Image. Use signed native IPA for automatic Photos saving.
Photos are processed on device, not uploaded.

Important: Docker Desktop global data may still reside on C because it is shared with other projects. Do not move raw WSL/Docker files manually.
