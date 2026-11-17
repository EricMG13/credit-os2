# Requirements table (draft for `{{REQUIREMENTS TABLE}}`)

Written in advance for step 6 of `stages/7-send-off.md`. Everything above the line "Paste from here" is
for the lead and stays out of the prompt.

## For the lead

- **Source.** Taken from the tree at the tip of `audit/final-coordination`, commit `b9ea386`
  (2026-11-17). Stage 7 re-takes it on the final commit, because the sweep may change dependencies.
  At this tip no branch (`main`, `audit/final-repairs`, `audit/repair-1` to `3`, `audit/lead-batch-a`
  to `c`) differs from it in `pyproject.toml`, `uv.lock`, `.python-version`, `web/package.json`,
  `web/package-lock.json` or `apps/issuer-library/pyproject.toml`.
- **How it was made.** By script from those files: every Python pin was asserted equal to its
  `uv.lock` version and every npm pin to its `package-lock.json` version; file counts in "What uses
  it" were counted with the same patterns used here (`from`/`import` lines under `src/`, `tests/`,
  `web/src/`). A `uv sync --locked` probe in a scratch environment on 2026-11-17 exited 0; its log
  shows the dev group installed, `hatchling` fetched for `issuer-library` and `deploy-workflow` built
  directly. The script is not committed (this task changes no code); it is at
  `/tmp/claude-0/-home-user-credit-os2/625821d3-887b-573e-b79d-e0aafcff3023/scratchpad/gen/requirements_table.py`
  and can be committed under `lead-tools/` if stage 7 wants a mechanical re-take.
- **Rows.** 54, numbered so the gap table can name them.
- **Four things the lock files do not show**, taken from the code and configuration:
  1. `hatchling` 1.27.0 and its four unpinned dependencies are resolved from the index during
     `uv sync --locked`, in a build environment that `uv.lock` does not govern (row 16). A PC whose
     index lacks them fails at sync even though every locked package is available.
  2. `.python-version` names an exact patch release (3.13.15); `pyproject.toml` and `uv.lock` accept
     any 3.13.x (row 1).
  3. Scanned PDFs are read through `pdftoppm` and `tesseract` when they are on `PATH`; no manifest
     or document says so (rows 51 and 52). Missing, a scanned page reads as empty with a stated
     limitation and nothing fails.
  4. `npm run test:file` and `test:file:gates` read `CHROME_PATH` only and pick Edge before Chrome;
     `EDGE_PATH` is read by `proof:connected` only. With no browser found and `CI` unset they print
     SKIP (exit 77 from `test:file`, exit 0 from `test:file:gates`); a skip must be reported as not
     run. Playwright downloads no browser at `npm ci`, so the draft's section 4 sentence "If
     Playwright cannot download its browsers" should read "if Playwright cannot find the installed
     Edge or Chrome".
- **Which download this table describes.** The draft's `<DOWNLOAD>` and its reading list
  (`AGENTS.md`, `docs/QUALITY-GATE.md`, `docs/COPILOT.md`, `docs/work-pc/`, `tests/`, `tools/`) are
  those of the full tree, the GitHub archive that `docs/work-pc/README.md` describes. The release ZIP
  `credit-os2-react.zip` from `tools/package_react_windows.py` holds only `SOURCE_PATHS` plus
  `web/dist` and `SOURCE-COMMIT.txt`: no `tests/`, `tools/`, `AGENTS.md`, `docs/work-pc/`,
  `docs/QUALITY-GATE.md` or `docs/COPILOT.md`. On the release ZIP the development rows (11 to 15,
  28 to 47) are installed but nothing uses them. The prompt should say which of the two it is for.
- **The audit's own toolchain.** The audit's cloud ran Python 3.13.18, Node v22.23.4 and npm 10.9.9
  (`output/0-baseline/baseline.md`), not the pins in rows 1 and 3.

---

## Paste from here

Row numbers are for the gap table. Versions are exact. Each lock file records every package, direct
or not; the tables list the direct ones. `uv.lock` resolves every Python package at
`pypi.org/simple` (files at `files.pythonhosted.org`) and `web/package-lock.json` every npm package
at `registry.npmjs.org`.

**Toolchain**

| # | Requirement | Exact pin | Pinned in | What uses it |
| ---: | :--- | :--- | :--- | :--- |
| 1 | Python 3.13 | `3.13.15` (uv asks for exactly this patch release; any 3.13.x meets `requires-python`) | `.python-version`; `pyproject.toml` `requires-python = ">=3.13,<3.14"`; `uv.lock` `requires-python = "==3.13.*"` | All Python: engine, services, `proof.serve`, tests. uv fetches the pinned release itself when none matches and downloads are allowed. |
| 2 | uv | `0.12.5` exactly | `pyproject.toml` `[tool.uv] required-version = "==0.12.5"`; `.github/workflows/checks.yml` | Every `uv` command (`uv sync --locked`, `uv run`). Any other uv version is refused; the audit's cloud container had 0.11.32 and installed 0.12.5. |
| 3 | Node.js (with its npm) | `24` or later; no npm pin | `web/package.json` `engines.node = ">=24"`; `docs/react-workflow.md` and `checks.yml` say 24; no `.nvmrc`, no `packageManager`; `package-lock.json` is lockfileVersion 3 | Everything in `web/`: build, tests, lint, `proof:connected`, `test:file`. |
| 4 | Windows shells | `cmd.exe` and PowerShell; `uv` and `npm.cmd` on `PATH` | `Run-React-Proof.cmd`; the PowerShell block in `docs/react-workflow.md` | The connected proof (`Run-React-Proof.cmd`) and the release-ZIP check (`Get-FileHash`, `Expand-Archive`, `Compress-Archive`). |
| 5 | Python 3.11 or later, no git | any 3.11+ | `docs/work-pc/README.md` | Only `tools/work_pc_delta.py check` and `plan`, the later-sync tool; not the application. |

**Python packages: direct dependencies (`uv.lock` locks every one)**

| # | Requirement | Exact pin | Pinned in | What uses it |
| ---: | :--- | :--- | :--- | :--- |
| 6 | pydantic | `2.14.1` | `pyproject.toml` `[project] dependencies`; `uv.lock` | Data models and validation in 66 files under `src/`: run inputs, handoffs, every module owner in `src/deploy_workflow/owners/`, the workflow. `github-copilot-sdk` needs it too. |
| 7 | pypdf | `6.21.2` | `pyproject.toml` `[project] dependencies`; `uv.lock` | Reads PDF source documents: `src/deploy_vii/preparation.py`; `PyPdfError` in `react_frontend/sources.py`; imported on demand in `src/deploy_workflow/model/handoff.py`. |
| 8 | openpyxl | `3.1.5` | `pyproject.toml` `[project] dependencies`; `uv.lock` | Not read by the engine at run time (`src/deploy_vii/preparation.py` reads `.xlsx` through `zipfile`). Builds the synthetic workbooks in `tools/synthetic_portfolio_workbooks.py` and `tools/synthetic_portfolio_exports.py`; used by `tests/test_portfolio_workbook.py`, `tests/test_handoff_loop.py` and `tests/test_issuer_library_packaging.py`; also pinned in `apps/issuer-library/packaging/runtime.py`. |
| 9 | github-copilot-sdk | `1.0.28` | `pyproject.toml` `[project] dependencies`; `uv.lock` | `src/deploy_workflow/model/copilot_adapter.py` (`real_client`, imported at call time, nowhere else) for live runs through the `copilot-*` configurations; `tests/model/test_copilot_adapter.py` imports it. No offline step calls a provider. |
| 10 | issuer-library (workspace member) | `0.1.0`, from `apps/issuer-library`, not from an index | `pyproject.toml` `[tool.uv.sources]`; `uv.lock` (editable) | The legacy issuer library (R17): page parts and `update_library.py`, which rebuilds `library/data.js` after a run. The engine imports it and it imports the engine. |

**Python packages: development group (`uv sync --locked` installs it)**

| # | Requirement | Exact pin | Pinned in | What uses it |
| ---: | :--- | :--- | :--- | :--- |
| 11 | pytest | `9.1.1` | `pyproject.toml` `[dependency-groups] dev`; `uv.lock`; installed by `uv sync --locked` | Test runner: 88 files under `tests/`. |
| 12 | ruff | `0.17.1` | `pyproject.toml` `[dependency-groups] dev`; `uv.lock`; installed by `uv sync --locked` | `tools/quality_gate.py`: `ruff check` and `ruff format` on changed code. |
| 13 | mypy | `2.4.0` | `pyproject.toml` `[dependency-groups] dev`; `uv.lock`; installed by `uv sync --locked` | `tools/quality_gate.py`: strict type check on changed code. |
| 14 | hypothesis | `6.170.5` | `pyproject.toml` `[dependency-groups] dev`; `uv.lock`; installed by `uv sync --locked` | Property tests in 13 files under `tests/`. |
| 15 | import-linter | `2.16` | `pyproject.toml` `[dependency-groups] dev`; `uv.lock`; installed by `uv sync --locked` | `tools/quality_gate.py --checks imports`: `lint-imports` on `.importlinter`. |

**Python build tools (resolved from the index during `uv sync --locked`, outside the lock)**

| # | Requirement | Exact pin | Pinned in | What uses it |
| ---: | :--- | :--- | :--- | :--- |
| 16 | hatchling | `1.27.0`, plus unpinned `packaging`, `pathspec`, `pluggy`, `trove-classifiers` | `apps/issuer-library/pyproject.toml` `[build-system]`; its build environment is not locked | Builds `issuer-library` during `uv sync --locked`, in a temporary build environment fetched from the index. A probe on 2026-11-17 resolved packaging 26.3, pathspec 1.1.1, pluggy 1.7.0 and trove-classifiers 2026.9.21.13. |
| 17 | uv_build | `>=0.12.5,<0.13` | `pyproject.toml` `[build-system]`; its build environment is not locked | Builds `deploy-workflow`. uv 0.12.5 built it directly in the same probe; no download of `uv_build` was seen. |

**npm packages: `dependencies` (`web/package-lock.json` locks every one)**

| # | Requirement | Exact pin | Pinned in | What uses it |
| ---: | :--- | :--- | :--- | :--- |
| 18 | @untitledui/icons | `0.0.23` | `web/package.json` `dependencies`; `web/package-lock.json` | Icons: imported in 73 files under `web/src/`. |
| 19 | react | `19.3.0` | `web/package.json` `dependencies`; `web/package-lock.json` | The interface: imported in 176 files under `web/src/`. |
| 20 | react-aria-components | `1.22.1` | `web/package.json` `dependencies`; `web/package-lock.json` | Accessible primitives (buttons, inputs, selects, tabs, tables, modals, slide-outs, tooltips): 36 files under `web/src/`. |
| 21 | react-dom | `19.3.0` | `web/package.json` `dependencies`; `web/package-lock.json` | Mounts both apps: `web/src/main.tsx` (static) and `web/src/connected-main.tsx` (connected). |
| 22 | react-is | `19.3.0` | `web/package.json` `dependencies`; `web/package-lock.json` | Not imported in `web/`; a peer dependency of `recharts`. |
| 23 | recharts | `3.10.1` | `web/package.json` `dependencies`; `web/package-lock.json` | Charts: 8 files under `web/src/`. |
| 24 | tailwind-merge | `3.7.0` | `web/package.json` `dependencies`; `web/package-lock.json` | Class merging: `web/src/utils/cx.ts`. |
| 25 | tailwindcss | `4.3.3` | `web/package.json` `dependencies`; `web/package-lock.json` | Styling: `@import "tailwindcss"` in `web/src/index.css`; compiled at build by `@tailwindcss/vite`. |
| 26 | tailwindcss-animate | `1.0.7` | `web/package.json` `dependencies`; `web/package-lock.json` | Tailwind plugin loaded in `web/src/index.css`. |
| 27 | tailwindcss-react-aria-components | `2.2.0` | `web/package.json` `dependencies`; `web/package-lock.json` | Tailwind plugin loaded in `web/src/index.css` (state variants for react-aria). |

**npm packages: `devDependencies` other than Playwright (20)**

| # | Requirement | Exact pin | Pinned in | What uses it |
| ---: | :--- | :--- | :--- | :--- |
| 28 | @tailwindcss/vite | `4.3.3` | `web/package.json` `devDependencies`; `web/package-lock.json` | Vite plugin: `web/vite.config.ts`, `web/vite.connected.config.ts`. |
| 29 | @testing-library/dom | `10.4.1` | `web/package.json` `devDependencies`; `web/package-lock.json` | Peer dependency of `@testing-library/react`; not imported directly. |
| 30 | @testing-library/jest-dom | `7.0.1` | `web/package.json` `devDependencies`; `web/package-lock.json` | Test matchers: `web/src/setup.ts`, `web/tsconfig.json` types. |
| 31 | @testing-library/react | `16.3.3` | `web/package.json` `devDependencies`; `web/package-lock.json` | Component tests (`src/**/*.test.tsx`) under `npm run test`. |
| 32 | @types/node | `24.13.4` | `web/package.json` `devDependencies`; `web/package-lock.json` | Types for `node:` imports in the Vite and Vitest configs; `npm run typecheck` and `build`. |
| 33 | @types/react | `19.3.0` | `web/package.json` `devDependencies`; `web/package-lock.json` | Type check and build. |
| 34 | @types/react-dom | `19.3.0` | `web/package.json` `devDependencies`; `web/package-lock.json` | Type check and build. |
| 35 | @vitejs/plugin-react | `5.2.0` | `web/package.json` `devDependencies`; `web/package-lock.json` | Vite plugin: `web/vite.config.ts`, `web/vite.connected.config.ts`. |
| 36 | @vitest/coverage-v8 | `4.1.12` | `web/package.json` `devDependencies`; `web/package-lock.json` | Coverage in `npm run test` (80 % line threshold, `web/vitest.config.ts`). |
| 37 | eslint | `9.39.5` | `web/package.json` `devDependencies`; `web/package-lock.json` | `npm run lint`. |
| 38 | eslint-plugin-jsx-a11y | `6.10.2` | `web/package.json` `devDependencies`; `web/package-lock.json` | Lint rules: `web/eslint.config.mjs`. |
| 39 | eslint-plugin-react-hooks | `7.1.1` | `web/package.json` `devDependencies`; `web/package-lock.json` | Lint rules: `web/eslint.config.mjs`. |
| 40 | jscpd | `5.4.1` | `web/package.json` `devDependencies`; `web/package-lock.json` | `npm run duplication` (`web/scripts/duplication.mjs`). |
| 41 | jsdom | `27.4.0` | `web/package.json` `devDependencies`; `web/package-lock.json` | DOM for the tests: `web/vitest.config.ts`. |
| 42 | knip | `6.41.0` | `web/package.json` `devDependencies`; `web/package-lock.json` | `npm run unused`. |
| 43 | prettier | `3.9.6` | `web/package.json` `devDependencies`; `web/package-lock.json` | `npm run format:check`. |
| 44 | typescript | `5.9.3` | `web/package.json` `devDependencies`; `web/package-lock.json` | `npm run typecheck`, and the first step of `npm run build`. |
| 45 | typescript-eslint | `8.70.0` | `web/package.json` `devDependencies`; `web/package-lock.json` | Lint rules: `web/eslint.config.mjs`. |
| 46 | vite | `6.4.5` | `web/package.json` `devDependencies`; `web/package-lock.json` | The build: `web/scripts/build.mjs` and both Vite configs. |
| 47 | vitest | `4.1.12` | `web/package.json` `devDependencies`; `web/package-lock.json` | `npm run test`. |

**Playwright and the two browsers**

| # | Requirement | Exact pin | Pinned in | What uses it |
| ---: | :--- | :--- | :--- | :--- |
| 48 | playwright (npm) | `1.62.1` | `web/package.json` `devDependencies`; `web/package-lock.json` | `npm run proof:connected` (`web/scripts/connected-proof.mjs`). It starts the installed Chrome and Edge by channel; `npm ci` downloads no browser. |
| 49 | Google Chrome (stable) | No version pin; the proof records the version it ran | `web/scripts/connected-proof.mjs` (channel `chrome`; override `CHROME_PATH`) | First of the two browser tests in `proof:connected`. `npm run test:file` and `test:file:gates` open the built app from disk in Chrome or Edge, and read `CHROME_PATH` only; without it they take the first of Edge, then Chrome, found under `Program Files` or `Program Files (x86)`. |
| 50 | Microsoft Edge | No version pin; the proof records the version it ran | `web/scripts/connected-proof.mjs` (channel `msedge`; override `EDGE_PATH`) | Second browser test in `proof:connected`. The release needs both browser records and exit code 0 (`docs/react-workflow.md`). |

**Programs and downloads outside both lock files**

| # | Requirement | Exact pin | Pinned in | What uses it |
| ---: | :--- | :--- | :--- | :--- |
| 51 | `pdftoppm` (Poppler) on `PATH` | no pin | `src/deploy_vii/preparation.py` | OCR of scanned PDF pages, with `tesseract`. Absent, such a page is read as empty with the stated limitation "OCR unavailable"; nothing fails. In no manifest or document. |
| 52 | `tesseract` on `PATH` | no pin | `src/deploy_vii/preparation.py` | As `pdftoppm`. |
| 53 | `gh` CLI | no pin | `docs/COPILOT.md`; `src/deploy_workflow/model/copilot_adapter.py` | Only with `COPILOT_USE_GH_LOGIN=1`, for live runs through GitHub Copilot. |
| 54 | GitHub Copilot runtime | `1.0.105` | `docs/COPILOT.md` (fetched by `python -m copilot download-runtime`, path in `COPILOT_CLI_PATH`) | Live runs through the `copilot-*` configurations only. Not needed to make the application run; record whether `<APPROVED>` can supply it and do not fetch it yourself. |
