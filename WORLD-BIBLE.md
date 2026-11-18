# Portfolio world and visual system

## Art direction

An original dark editorial developer portfolio informed by the reference's confident typography, large negative spaces, chapter pacing, and small interactive details. It does not reuse the reference's copy, imagery, identity, or source. The page remains black and graphite; lime is reserved for navigation, emphasis, and state. Project colors appear only inside their corresponding scenes.

| Role | Value | Use |
| --- | --- | --- |
| Background | `#080808` | Page canvas and negative space |
| Secondary | `#111111` | Section planes |
| Elevated | `#181818` | Scene surrounds and interactive surfaces |
| Text | `#F5F5F0` | Headings and high priority copy |
| Secondary text | `#A1A1A1` | Body copy and descriptions |
| Muted text | `#707070` | Metadata |
| Structural line | `rgba(255,255,255,.13)` | Rules, borders, and technical linework |
| Site accent | `#C8FF4D` | Restrained lime focus and navigation states |
| GeoSense | `#43C9E8` | Route and location signals |
| AgriNex | `#8FBF67` | Fields and marketplace routes |
| RSA Bookings | `#77D986` | Court surface and selected slot |
| Gurubaran Builders | `#F1A45D` | Construction stage and warm practicals |

Manrope is the single display and body family. Geist Mono is reserved for technical labels. Scenes use no image textures, external models, or stock media. The attached architectural framework image informs the Gurubaran Builders structure's grid, cross-bracing, and isometric composition; it is not displayed as a background.

## World sentence and interaction contract

A rotating idea core opens into four practical worlds—location, agriculture, sport, and construction—before the story returns to the person building them. Native document scroll selects and scrubs the active scene; pointer motion adds a small local parallax response. All meaning, navigation, project links, and contact information remain in semantic HTML.

## Spatial and motion grammar

- One Three.js renderer, one WebGL context, one camera, and one persistent scene graph.
- Scene groups are created on demand and retained for reverse scroll; only the active group is visible.
- Each canvas host sits inside its semantic story chapter. The renderer pauses when that host is outside the viewport or the tab is hidden.
- The initial hero frame is an abstract brushed-metal knot with orbital rings and a lime core.
- Project scenes are authored sets connected by short dark fades. The page does not pretend the projects occupy one literal geography.
- The camera uses a restrained perspective around 38 degrees on desktop and 44 degrees on narrow screens. Composition favors a readable focal silhouette with open space around it.
- Scroll progress controls route drawing, assembly, and scene emphasis. Ambient motion stays small and pauses under `prefers-reduced-motion`.
- Pointer response is limited to fine pointers, clamped to a few degrees, and never controls access to information.
- Selective RGB separation remains a brief heading interaction only. No continuous distortion or audio is used anywhere on the portfolio.

## Scene ledger

| Scene | Story beat and landmark | Scroll authored change | Responsive treatment | Fallback |
| --- | --- | --- | --- | --- |
| Hero | Curiosity becomes a small metal mechanism | Orbit rings settle around the lit core as the hero enters | Pull back and reduce parallax on narrow screens | CSS orbital lines behind readable copy |
| GeoSense | A passenger moves toward a saved stop | Route draws, marker travels, radius pulses, distance readout approaches zero | Keep route and destination in the center third | Labeled dark map field with route and destination marker |
| AgriNex | Farmers and buyers connect through a marketplace | Field rows, supply routes, produce, and a compact demand/supply graph animate in | Reduce crop instances and simplify graph detail | Layered field bands and market route labels |
| RSA Bookings | A booking centers on a court and selected slot | Court lines illuminate, shuttlecock follows a curved flight, selected slot confirms | Preserve court ratio and move the HUD below the visual | Green court plane with correct boundary and net markings |
| Gurubaran Builders | A construction accounts project becomes a structural frame | Steel columns, beams, bracing, and floors assemble level by level; one floor gains a translucent solid surface | Reduce grid density and frame count | Amber labeled structural grid with an isometric frame silhouette |

## Scene and DOM map

```text
Three.js canvas (reused and moved into the active visual host)
  scene
    shared lights and camera
    hero mechanism group
    GeoSense map, roads, route, destination and moving marker group
    AgriNex field instances, farmer/buyer nodes, routes and graph group
    RSA court, linework, net, shuttlecock and trajectory group
    Gurubaran columns, beams, bracing and progressive floor group

Semantic HTML above/beside the canvas
  navigation and hero copy
  about, interests, original skill list and learning timeline
  four project chapters with live links and descriptive text
  achievements, motto, contact links, and footer
```

## Camera and material ledger

The view is a medium perspective, not a fisheye. The camera stays outside each model with enough margin to preserve the silhouette. On mobile the scene pulls back, uses a lower pixel ratio, and avoids relying on mouse input.

| Scene | Material families | Lighting |
| --- | --- | --- |
| Hero | Brushed neutral metal, pale lime emissive center, graphite orbit lines | Warm key, low neutral fill, lime rim |
| GeoSense | Slate map plane, raised graphite roads, cyan route and marker | Cool cyan practical, soft white key |
| AgriNex | Deep soil, natural green crop rows, muted produce crates, green route | Warm white key, restrained leaf-green practical |
| RSA Bookings | Forest-green court, chalk white lines, pale shuttlecock, lime slot state | Overhead white key and green edge light |
| Gurubaran Builders | Graphite steel, white structural lines, amber stage accents, one low-opacity floor | Warm amber practical and neutral white key |

All geometry is procedural and uses shared materials where possible. No shadow maps or post-processing are required for scene identity. Contact is communicated through ground planes and restrained local glow rather than expensive full-frame effects.

## Interaction matrix

| Interaction | Pointer | Keyboard/touch | Reduced motion |
| --- | --- | --- | --- |
| Native chapter journey | Lenis smooth wheel input connected to ScrollTrigger | Native anchors and scrolling | Native scrolling; no Lenis or scrubbed animation |
| 3D composition | Small pointer parallax while a visual host is visible | Decorative; no information depends on it | Canvas hidden; CSS fallback remains |
| Project links | Existing outbound links remain usable | Normal focus and activation | Same functional links |
| What I do list | Select one interest to reveal its existing detail | Real buttons with accurate expanded states | Content remains readable |
| Magnetic links and cursor | Fine-pointer-only, bounded transforms | Normal link activation and visible focus | Disabled |
| Heading glitch | Brief RGB split on selected hover | Same effect on focus | Disabled |

There is no audio element, audio library, audio context, sound toggle, or sound playback on the portfolio. GeoSense's existing project description may mention that its own application offers sound alerts; the portfolio itself remains silent.

## Asset and loading ledger

| Group | Source | Loading | Fallback |
| --- | --- | --- | --- |
| Critical page | Existing HTML, CSS, local GSAP and ScrollTrigger | Immediate; content works without 3D | Complete semantic page |
| Hero world | Local Three.js 0.187.0 module and procedural geometry | Imported after first paint/idle | CSS orbit geometry |
| Project world | Four procedural Three.js scene builders; no textures or external models | Loaded on first project-scene visibility; scenes cached for reverse scroll | Per-scene CSS linework and captions |
| Smooth scroll | Local Lenis 1.3.27 | Only with GSAP and when motion is allowed | Native scrolling |
| Font | Google Fonts Manrope and Geist Mono with system fallbacks | Browser font loading | System sans and monospace |

The existing project screenshots are no longer referenced in the project showcase or offline precache. Their source files are left in the workspace but are not rendered.

## Performance budget and quality cuts

| Measure | Target |
| --- | --- |
| Active renderers / contexts | 1 / 1 |
| Active project groups | 1, plus shared hero shell when applicable |
| DPR cap | 1.35 desktop, 1.0 mobile and low-memory devices |
| Draw calls per active scene | Under 90 |
| Textures | None in the scene graph |
| Render loop | Active visual host visible and document visible only |

If profiling shows a problem, lower DPR first, then reduce repeated crop/beam instances, then reduce optional particles and highlights. Keep landmarks, scene purpose, project copy, and accessible links intact. These are targets, not measurements.

## Verification record

| Check | Status |
| --- | --- |
| Desktop, tablet and narrow phone layout | No document horizontal overflow at 1440, 1024, 768, 390, or 320 px; project scene hosts are responsive. The 320 px pass exposed two small edge cases: the rotated accordion glyph crossed its button edge and the hero entrance offset exceeded the viewport by 2 px. The glyph is centered on mobile and the aside now fades in without a horizontal offset. |
| Forward/reverse project scene transitions | Hero and all four project scenes activated; the single canvas moved between hosts and all project groups remained cached on reverse scroll. |
| Keyboard navigation and project links | Mobile menu opened, Escape closed it and returned focus; section anchors resolved and all original project/contact URLs remained present. External destinations were not opened. |
| Reduced motion and WebGL fallback | Reduced-motion reload left all project content and links readable, hid the canvas, and used native scrolling. Simulated an unavailable WebGL 2 context: the startup check sets `data-world-fallback="no-webgl2"`, leaves the CSS scene poster visible, and avoids asking Three.js to create an invalid renderer. |
| Silent page and removed showcase screenshots | No audio/video elements or playback code; project visuals contain no screenshot images and screenshots are absent from offline precache. |
| Runtime console and renderer diagnostics | One renderer/context; all four scene builders had finite geometry at 0%, 50%, and 100% progress. Fixed the RSA outline's non-finite vertices; latest activation pass emitted no console errors. The WebGL-unavailable simulation now exits before Three.js renderer construction. Draw-call counts were not measured because the browser tab is hidden. |
| Local run and build workflow | Static preview served at `http://127.0.0.1:8765/`; this project has no package manifest or build/test scripts. JavaScript syntax, editor diagnostics, and `git diff --check` pass. |
| Scene visual inspection | Rendered each procedural scene in a temporary Three.js renderer and inspected the resulting frames. The live portfolio tab is hidden, so its real-time frame timing and draw-call profile were not measured. |
| Visible portfolio tab | Refreshing the shared VS Code preview was rejected by its automatic approval review. The isolated browser preview was refreshed and exercised through the updated service-worker cache. |
