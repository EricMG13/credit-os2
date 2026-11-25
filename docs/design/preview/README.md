# Previewing the connected app on the synthetic Northbridge run

For design work only. Nothing here calls a provider or spends money: `proof.serve` replaces the
model with canned replies. The synthetic text is thin (every module says the same sentence), so
check layout and states here and check content against the retained TransDigm fixtures in tests.

```bash
# 1. Dependencies. The repo pins uv 0.12.5; if the machine's uv is older, install it in a venv.
python3 -m venv ~/uvenv && ~/uvenv/bin/pip install -q uv==0.12.5 && ~/uvenv/bin/uv sync -q
(cd web && npm ci --no-audit --no-fund && npm run build)

# 2. Publish one synthetic run. The root must be new, empty, outside the repo, and its path at
#    most 80 characters.
PYTHONPATH=src .venv/bin/python -m proof.serve --root ~/cos-ws --port 8765 &
node docs/design/preview/drive-synthetic-run.cjs      # prints the report address

# 3. After every `npm run build`, restart the viewer (it reads the built page at start), then shoot.
pkill -f "proof.serve|react_frontend --root" ; \
  PYTHONPATH=src .venv/bin/python -m react_frontend --root ~/cos-ws --port 8765 &
node docs/design/preview/screenshot.cjs "/report/<run>#overview" ~/overview.png 1440
node docs/design/preview/screenshot.cjs "/report/<run>#overview" ~/overview-1024.png 1024
```

Warning: restarting the viewer with `python -m react_frontend` serves /start in paid mode. Do not submit there; use `proof.serve` on a new empty root for the synthetic mode.

`require('playwright')` resolves from any directory in the cloud container; elsewhere run the
scripts from `web/`.

## Rendered check before reporting a screen

Unit tests run without a layout engine, so they cannot see sideways scroll, colliding chart
labels, small targets or shrunken text. Before reporting a screen as done, run the rendered check
on it at the three desktop widths (`--widths 1440,1280,1024`; the app is desktop only, owner, 2026-11-25), with `--stress` (long text) and with a fixture for the cases the
synthetic run lacks, and look at the PNGs it writes:

```bash
node docs/design/preview/check-render.cjs --widths 1440,1280,1024 --out ~/shots --stress "/report/<run>#overview"
node docs/design/preview/check-render.cjs --widths 1440,1280,1024 --out ~/shots --fixture my-cases.cjs "/coverage"
```

It fails on: the page scrolling sideways; a scroll box that is not named and focusable; cut text
with no full text reachable; targets under 32px wide or tall; text under 12px,
including scaled chart text; chart labels that overlap or leave their figure; console errors.
A finding from shared code outside your files is reported, not fixed in place.
