# Matched measurements

Base 0563bccc and reviewed application commit dda94d1c. Both arms used the same lockfiles, Node 24.16.0, Python 3.13.15, uv 0.12.5, the same synthetic Northbridge inputs and matching scan scopes.

| Metric | Base | Candidate |
| --- | ---: | ---: |
| Source lines across six roots excluding Signal | 434,710 | 434,705 |
| Suppression directives | 162 | 162 |
| Web jscpd clones | 623 | 622 |
| Web duplicate lines | 7,839 | 7,824 |
| Knip findings | 0 | 0 |
| Built files | 49 | 49 |
| Build bytes | 4,743,469 | 4,743,421 |
| Sum of per-file gzip bytes | 1,624,257 | 1,624,308 |
| Encoded JavaScript bytes per sampled route | 625,727 | 625,754 |

The all-root Python scan at base counted 255 clones and 2,967 duplicate lines. Python source is identical on the candidate. The configured web Fallow baseline found zero cycles, unused exports and unused files.

## Seven-route synthetic readback

Five fresh 1440 × 900 desktop contexts per route in Chrome 158.0.8127.88. Every navigation completed and normalized reader text matched on all seven routes. Each cell shows median milliseconds and median absolute deviation in parentheses. Other tests ran concurrently, so these observations do not establish a speed change.

| Route | Base | Candidate |
| --- | ---: | ---: |
| Overview | 682.00 (40.24) | 454.62 (22.96) |
| Changes | 575.93 (15.27) | 392.63 (39.85) |
| Forecast | 621.92 (20.85) | 502.34 (58.28) |
| Evidence · Sources | 597.82 (106.28) | 388.35 (47.51) |
| Evidence · Gaps | 556.61 (35.54) | 447.97 (20.62) |
| Modules · CP-2 | 601.85 (53.05) | 446.91 (14.27) |
| Deliverables | 546.31 (92.88) | 426.59 (76.86) |

Raw fixture results, build checksums, scan output and gate logs are in /private/tmp/credit-os-0563-evidence.

The slowest accepted fast Python case ran for 19.27 seconds under concurrent load (the Signal store size-limit case). The complete merged frontend run recorded 98.32% line coverage.
