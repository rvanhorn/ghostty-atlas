# Theme Strip Virtualization Measurements

Recorded on October 4, 2026 on the same macOS arm64 machine with Chromium 153.0.8010.12, a 1440 × 900 viewport, and the Vite development server. The baseline renderer is from commit `8a2dbc0`. Each result is the median of five runs after warming the server transforms and browser cache. Both versions use the same Strict Mode fixture and benchmark script.

| Measurement                        | 725 themes before | 725 themes after | 7,250 themes before | 7,250 themes after |
| ---------------------------------- | ----------------: | ---------------: | ------------------: | -----------------: |
| Initial render to frame (ms)       |             228.9 |             25.0 |             1,682.6 |               26.1 |
| Mounted cards                      |               725 |                8 |               7,250 |                  8 |
| DOM elements in fixture            |            17,427 |              227 |             174,027 |                227 |
| Search update (ms)                 |              48.7 |             30.5 |               905.2 |               30.1 |
| Scroll mean frame interval (ms)    |              16.1 |             16.5 |                34.9 |               16.6 |
| Scroll maximum frame interval (ms) |              17.3 |             24.2 |                82.6 |               24.8 |

The synthetic catalog repeats each bundled palette ten times with distinct theme names. The fixture starts with the first theme selected. Initial rendering starts immediately before `createRoot().render()` and finishes after two animation frames following the layout effect. It excludes module download and evaluation. DOM counts cover the strip fixture, not the full Atlas app.

The search query is `Copy`: it produces no matches in the bundled catalog and retains nine of ten copies in the synthetic catalog. Search timing includes Playwright's input action and the two-frame settling period. Scrolling writes thirty evenly spaced offsets across the full strip and samples animation-frame intervals. This is a repeatable stress sweep, not a measurement of physical touch input or a production performance guarantee. The small catalog's maximum scrolling interval increased; the benefit is primarily bounded initial mounting and scaling at larger sizes.

Reproduce using the commands in [CONTRIBUTING.md](../../CONTRIBUTING.md). Use the same browser and machine for comparisons and keep other workloads steady. The fixture and benchmark are excluded from the production entry point.

Firefox 155.0 was installed and attempted locally, but the host prevented startup before any page loaded (`Could not find profile folder` in headless mode; native sandbox errors in visible mode). These measurements are Chromium results. The regression configuration and CI include Firefox; local Firefox visual verification remains outstanding.
