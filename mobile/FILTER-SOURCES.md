# Mobile filter references and attribution

The /mobile/ filter gallery was researched against these repositories on 2026-11-12:

| Repository | Observed license | Applied integration |
| --- | --- | --- |
| https://github.com/manekinekko/photobooth | MIT (Wassim Chegham, 2021) | Referenced filter catalogue and visual concepts (Brownie, Pinhole, Emboss, CRT, Edges). Did not import the Angular/WebGL implementation. |
| https://github.com/awksrj/web-photobooth-0 | No root license found | Reviewed as reference only. **No source code copied**, as reuse permissions were not established. |
| https://github.com/njpietrow/Filter.io | MIT (Nick J Pietrow, 2022) | Reviewed camera animation workflow; no animation source copied. |
| https://github.com/peterpeterparker/web-photo-filter | MIT (David Dal Busco, 2017) | Referenced color-matrix filter approach and naming; original JavaScript color grading approximation implemented. |
| https://github.com/xdadda/mini-gl | MIT (xdadda, 2025) | Referenced LUT/grading preset names (Clarendon, Juno, Lark, Reyes, Crema, Aden, Ludwig). Original approximations; **not identical LUT curves** and no textures copied. |
| https://github.com/a-hakim/senangwebs-photobooth | MIT (A.Hakim, 2025) | Referenced pixel operations (brightness/contrast/saturation/sharpen) and non-destructive preview; original pixel pipeline implemented. |

The application uses an independently written Canvas pixel-processing engine for downloaded images, with CSS approximations for live preview. This is necessary because CanvasRenderingContext2D.filter is not reliable in iOS Safari.

Filter visuals may differ from the original repositories and from the live preview. Integration is not intended to reproduce every feature of those repositories.

**Limits:** The app processes up to 1600 px maximum output dimension in this mobile mode, locally in the browser. This reduces iPhone memory and CPU pressure. It does not upload pictures to the server. The native iOS camera picker works in a non-HTTPS local LAN context; getUserMedia live camera needs HTTPS and device permissions.

Licenses belong to the linked authors. Names are used for attribution and descriptive comparisons; no upstream code or third-party LUT assets were vendored.
