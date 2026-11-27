# Stage 6 matched measurements

Both arms use the lockfiles at `4f9689bd`, macOS on arm64, Python 3.13.15,
uv 0.12.5, Node 24.16.0 and npm 11.13.0. The earlier Claude audit has a
different tree and toolchain.

| Metric | Main | Sweep |
| --- | ---: | ---: |
| Source lines in the six sweep roots, excluding Signal | 434,731 | 434,707 |
| Suppression directives in that scope | 162 | 162 |
| Frontend Knip findings | 0 | 0 |
| Fallow unused exports | 1 | 0 |
| Fallow circular dependencies | 2 | 0 |
| Web jscpd clones | 624 | 623 |
| Web jscpd duplicate lines | 7,860 | 7,839 |
| Python jscpd clones, excluding Signal | 256 | 255 |
| Python jscpd duplicate lines, excluding Signal | 2,988 | 2,967 |
| Files in both Vite builds | 49 | 49 |
| Entire build, raw bytes | 4,743,833 | 4,743,469 |
| Entire build, per-file gzip bytes | 1,624,115 | 1,624,257 |

The static assets are byte-identical. ReportLibrary grew by 9,494 raw bytes
and Calendar shrank by 10,085. ReportLibrary imports Calendar statically in
both builds. Together they are 591 raw bytes smaller and 82 per-file gzip
bytes larger. Gzip sums are compression measurements, independent of what
the service sends over the network.

Raw jscpd, Fallow, Knip and build logs and file checksums are under
`/private/tmp/credit-os-final-sweep.qGoGct/{before,after}/`.

## Test timing observations

The base and sweep each executed the same 9,500 fast Python identities. Their
slowest case was `test_cpos_parallel.py::test_the_synthetic_run_is_the_same_tree_one_at_a_time_and_in_parallel`
at 15.536 s on main and `test_signal_formats.py::test_the_worst_store_with_issuers_at_their_limits_stays_under_the_cap`
at 17.272 s on the sweep. This is a comparison of the slowest cases observed,
under different concurrent loads.

The matched `ConnectedApp.test.tsx` file passed 228 tests in both builds.
Vitest reported 150.74 s of test time on main and 161.40 s on the sweep.
These tests ran under different concurrent loads. The 9,438-test merged
front-end result and the native coverage gate are independent of those timings.

## Synthetic desktop render and readback

Native Chrome 158.0.8127.88 ran five fresh 1440 × 900 contexts per route
against each build, using the same integrated Python service and canned
Northbridge inputs in a fresh workspace for each arm. Measured navigation
through the route heading and two animation frames. The offline guard
passed on both arms. Reader text matched on all seven routes after
normalizing the synthetic run identifier and time fields.

| Route | Main median, ms | Sweep median, ms | Larger median absolute deviation, ms |
| --- | ---: | ---: | ---: |
| Overview | 319.58 | 289.58 | 5.06 |
| Changes, first listed run | 287.80 | 271.75 | 7.87 |
| Forecast | 342.66 | 295.41 | 29.16 |
| Evidence, Sources | 280.71 | 269.11 | 6.09 |
| Evidence, Gaps | 293.77 | 266.37 | 15.68 |
| Modules, CP-2 | 292.02 | 276.05 | 8.49 |
| Deliverables | 281.97 | 280.58 | 10.72 |

The measured JavaScript response bodies totalled 625,566 encoded bytes
before and 625,727 after, on each sampled route. No timing gain is attributed
to the sweep. The two sample windows had different host load. An earlier
probe looked for a comparison heading on the first-run Changes page. The
reported probe uses that page's actual heading on both arms. The paired
CP-8 behavior was covered by the focused and integrated frontend tests.
