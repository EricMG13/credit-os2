"""Build the stage 7 requirements table from the manifests and lock files.

Run from the repository root on the commit being sent off:

    python3 -I \
      docs/audit/2026-11-16-final/output/4-register/lead-tools/requirements_table.py . out.md

It stops (assertion or KeyError) when a pin and its lock entry differ, or when a dependency has no
usage line below; add the line, do not loosen the check. The usage sentences are written by hand;
the file counts in them are recounted on each run.
"""

import json
import re
import sys
import tomllib
from pathlib import Path

root = Path(sys.argv[1])
out = Path(sys.argv[2])
py = tomllib.loads((root / "pyproject.toml").read_text())
uvlock = {p["name"]: p["version"] for p in tomllib.loads((root / "uv.lock").read_text())["package"]}
pkg = json.loads((root / "web/package.json").read_text())
npmlock = json.loads((root / "web/package-lock.json").read_text())["packages"]
pyver = (root / ".python-version").read_text().strip()


def count(folder: str, pattern: str, suffixes: tuple[str, ...]) -> int:
    """Files under `folder` with a line matching `pattern`."""
    rx = re.compile(pattern, re.MULTILINE)
    return sum(
        1
        for f in (root / folder).rglob("*")
        if f.suffix in suffixes
        and "node_modules" not in f.parts
        and rx.search(f.read_text(errors="ignore"))
    )


def py_files(folder: str, module: str) -> int:
    return count(folder, rf"^\s*(from|import) {module}(\.|\s|$)", (".py",))


def web_files(module: str) -> int:
    return count("web/src", rf"from \"{re.escape(module)}(/[^\"]*)?\"", (".ts", ".tsx"))


def pinned(spec: str) -> tuple[str, str]:
    name, _, ver = spec.partition("==")
    return name, ver


type TableRow = tuple[int, str, str, str, str]
n = 0


def add(table: list[TableRow], req: str, pin: str, where: str, uses: str) -> None:
    global n
    n += 1
    table.append((n, req, pin, where, uses))


tables: list[list[TableRow]] = [[] for _ in range(8)]
tool, pdirect, pdev, pbuild, npmd, npmdev, browsers, optional = tables

add(
    tool,
    "Python 3.13",
    f"`{pyver}` (uv asks for exactly this patch release; any 3.13.x meets `requires-python`)",
    (
        "`.python-version`; `pyproject.toml` `requires-python = "
        '">=3.13,<3.14"`; `uv.lock` `requires-python = "==3.13.*"`'
    ),
    (
        "All Python: engine, services, `proof.serve`, tests. uv fetches "
        "the pinned release itself when none matches and downloads are "
        "allowed."
    ),
)
assert pyver == "3.13.15" and py["project"]["requires-python"] == ">=3.13,<3.14"
assert py["tool"]["uv"]["required-version"] == "==0.12.5"
add(
    tool,
    "uv",
    "`0.12.5` exactly",
    '`pyproject.toml` `[tool.uv] required-version = "==0.12.5"`; `.github/workflows/checks.yml`',
    (
        "Every `uv` command (`uv sync --locked`, `uv run`). Any other uv "
        "version is refused; the audit's cloud container had 0.11.32 and "
        "installed 0.12.5."
    ),
)
assert pkg["engines"]["node"] == ">=24"
add(
    tool,
    "Node.js (with its npm)",
    "`24` or later; no npm pin",
    (
        '`web/package.json` `engines.node = ">=24"`; '
        "`docs/react-workflow.md` and `checks.yml` say 24; no `.nvmrc`, "
        "no `packageManager`; `package-lock.json` is lockfileVersion 3"
    ),
    "Everything in `web/`: build, tests, lint, `proof:connected`, `test:file`.",
)
add(
    tool,
    "Windows shells",
    "`cmd.exe` and PowerShell; `uv` and `npm.cmd` on `PATH`",
    "`Run-React-Proof.cmd`; the PowerShell block in `docs/react-workflow.md`",
    (
        "The connected proof (`Run-React-Proof.cmd`) and the release-ZIP "
        "check (`Get-FileHash`, `Expand-Archive`, `Compress-Archive`)."
    ),
)
add(
    tool,
    "Python 3.11 or later, no git",
    "any 3.11+",
    "`docs/work-pc/README.md`",
    "Only `tools/work_pc_delta.py check` and `plan`, the later-sync tool; not the application.",
)

pyuse = {
    "pydantic": (
        f"Data models and validation in {py_files('src', 'pydantic')} files under `src/`: "
        "run inputs, handoffs, every module owner in `src/deploy_workflow/owners/`, "
        "the workflow. `github-copilot-sdk` needs it too."
    ),
    "pypdf": (
        "Reads PDF source documents: `src/deploy_vii/preparation.py`; "
        "`PyPdfError` in `react_frontend/sources.py`; imported on demand "
        "in `src/deploy_workflow/model/handoff.py`."
    ),
    "openpyxl": (
        "Not read by the engine at run time "
        "(`src/deploy_vii/preparation.py` reads `.xlsx` through "
        "`zipfile`). Builds the synthetic workbooks in "
        "`tools/synthetic_portfolio_workbooks.py` and "
        "`tools/synthetic_portfolio_exports.py`; used by "
        "`tests/test_portfolio_workbook.py`, `tests/test_handoff_loop.py` "
        "and `tests/test_issuer_library_packaging.py`; also pinned in "
        "`apps/issuer-library/packaging/runtime.py`."
    ),
    "github-copilot-sdk": (
        "`src/deploy_workflow/model/copilot_adapter.py` (`real_client`, "
        "imported at call time, nowhere else) for live runs through the "
        "`copilot-*` configurations; "
        "`tests/model/test_copilot_adapter.py` imports it. No offline "
        "step calls a provider."
    ),
}
for spec in py["project"]["dependencies"]:
    name, ver = pinned(spec) if "==" in spec else (spec, "")
    if name == "issuer-library":
        add(
            pdirect,
            "issuer-library (workspace member)",
            f"`{uvlock[name]}`, from `apps/issuer-library`, not from an index",
            "`pyproject.toml` `[tool.uv.sources]`; `uv.lock` (editable)",
            (
                "The legacy issuer library (R17): page parts and "
                "`update_library.py`, which rebuilds `library/data.js` after a "
                "run. The engine imports it and it imports the engine."
            ),
        )
        continue
    assert uvlock[name] == ver, (name, uvlock[name], ver)
    add(
        pdirect,
        name,
        f"`{ver}`",
        "`pyproject.toml` `[project] dependencies`; `uv.lock`",
        pyuse[name],
    )

devuse = {
    "pytest": f"Test runner: {py_files('tests', 'pytest')} files under `tests/`.",
    "ruff": "`tools/quality_gate.py`: `ruff check` and `ruff format` on changed code.",
    "mypy": "`tools/quality_gate.py`: strict type check on changed code.",
    "hypothesis": f"Property tests in {py_files('tests', 'hypothesis')} files under `tests/`.",
    "import-linter": "`tools/quality_gate.py --checks imports`: `lint-imports` on `.importlinter`.",
}
for spec in py["dependency-groups"]["dev"]:
    name, ver = pinned(spec)
    assert uvlock[name] == ver, (name, uvlock[name], ver)
    add(
        pdev,
        name,
        f"`{ver}`",
        "`pyproject.toml` `[dependency-groups] dev`; `uv.lock`; installed by `uv sync --locked`",
        devuse[name],
    )

add(
    pbuild,
    "hatchling",
    "`1.27.0`, plus unpinned `packaging`, `pathspec`, `pluggy`, `trove-classifiers`",
    "`apps/issuer-library/pyproject.toml` `[build-system]`; not in `uv.lock`",
    (
        "Builds `issuer-library` during `uv sync --locked`, in a "
        "temporary build environment fetched from the index. A probe on "
        "2026-11-17 resolved packaging 26.3, pathspec 1.1.1, pluggy 1.7.0 "
        "and trove-classifiers 2026.9.21.13."
    ),
)
add(
    pbuild,
    "uv_build",
    "`>=0.12.5,<0.13`",
    "`pyproject.toml` `[build-system]`; not in `uv.lock`",
    (
        "Builds `deploy-workflow`. uv 0.12.5 built it directly in the "
        "same probe; no download of `uv_build` was seen."
    ),
)

npmuse = {
    "@untitledui/icons": (
        f"Icons: imported in {web_files('@untitledui/icons')} files under `web/src/`."
    ),
    "react": f"The interface: imported in {web_files('react')} files under `web/src/`.",
    "react-aria-components": (
        "Accessible primitives (buttons, inputs, selects, tabs, tables, modals, "
        f"slide-outs, tooltips): {web_files('react-aria-components')} files under `web/src/`."
    ),
    "react-dom": (
        "Mounts both apps: `web/src/main.tsx` (static) and "
        "`web/src/connected-main.tsx` (connected)."
    ),
    "react-is": "Not imported in `web/`; a peer dependency of `recharts`.",
    "recharts": f"Charts: {web_files('recharts')} files under `web/src/`.",
    "tailwind-merge": "Class merging: `web/src/utils/cx.ts`.",
    "tailwindcss": (
        'Styling: `@import "tailwindcss"` in `web/src/index.css`; '
        "compiled at build by `@tailwindcss/vite`."
    ),
    "tailwindcss-animate": "Tailwind plugin loaded in `web/src/index.css`.",
    "tailwindcss-react-aria-components": (
        "Tailwind plugin loaded in `web/src/index.css` (state variants for react-aria)."
    ),
}
for name, ver in pkg["dependencies"].items():
    assert npmlock["node_modules/" + name]["version"] == ver, name
    add(
        npmd,
        name,
        f"`{ver}`",
        "`web/package.json` `dependencies`; `web/package-lock.json`",
        npmuse[name],
    )

devnpm = {
    "@tailwindcss/vite": "Vite plugin: `web/vite.config.ts`, `web/vite.connected.config.ts`.",
    "@testing-library/dom": "Peer dependency of `@testing-library/react`; not imported directly.",
    "@testing-library/jest-dom": "Test matchers: `web/src/setup.ts`, `web/tsconfig.json` types.",
    "@testing-library/react": "Component tests (`src/**/*.test.tsx`) under `npm run test`.",
    "@types/node": (
        "Types for `node:` imports in the Vite and Vitest configs; `npm run typecheck` and `build`."
    ),
    "@types/react": "Type check and build.",
    "@types/react-dom": "Type check and build.",
    "@vitejs/plugin-react": "Vite plugin: `web/vite.config.ts`, `web/vite.connected.config.ts`.",
    "@vitest/coverage-v8": (
        "Coverage in `npm run test` (80 % line threshold, `web/vitest.config.ts`)."
    ),
    "eslint": "`npm run lint`.",
    "eslint-plugin-jsx-a11y": "Lint rules: `web/eslint.config.mjs`.",
    "eslint-plugin-react-hooks": "Lint rules: `web/eslint.config.mjs`.",
    "jscpd": "`npm run duplication` (`web/scripts/duplication.mjs`).",
    "jsdom": "DOM for the tests: `web/vitest.config.ts`.",
    "knip": "`npm run unused`.",
    "prettier": "`npm run format:check`.",
    "typescript": "`npm run typecheck`, and the first step of `npm run build`.",
    "typescript-eslint": "Lint rules: `web/eslint.config.mjs`.",
    "vite": "The build: `web/scripts/build.mjs` and both Vite configs.",
    "vitest": "`npm run test`.",
}
for name, ver in pkg["devDependencies"].items():
    assert npmlock["node_modules/" + name]["version"] == ver, name
    if name == "playwright":
        pw = ver
        continue
    add(
        npmdev,
        name,
        f"`{ver}`",
        "`web/package.json` `devDependencies`; `web/package-lock.json`",
        devnpm[name],
    )

add(
    browsers,
    "playwright (npm)",
    f"`{pw}`",
    "`web/package.json` `devDependencies`; `web/package-lock.json`",
    (
        "`npm run proof:connected` (`web/scripts/connected-proof.mjs`). "
        "It starts the installed Chrome and Edge by channel; `npm ci` "
        "downloads no browser."
    ),
)
add(
    browsers,
    "Google Chrome (stable)",
    "No version pin; the proof records the version it ran",
    "`web/scripts/connected-proof.mjs` (channel `chrome`; override `CHROME_PATH`)",
    (
        "First of the two browser tests in `proof:connected`. `npm run "
        "test:file` and `test:file:gates` open the built app from disk in "
        "Chrome or Edge, and read `CHROME_PATH` only; without it they "
        "take the first of Edge, then Chrome, found under `Program Files` "
        "or `Program Files (x86)`."
    ),
)
add(
    browsers,
    "Microsoft Edge",
    "No version pin; the proof records the version it ran",
    "`web/scripts/connected-proof.mjs` (channel `msedge`; override `EDGE_PATH`)",
    (
        "Second browser test in `proof:connected`. The release needs both "
        "browser records and exit code 0 (`docs/react-workflow.md`)."
    ),
)

add(
    optional,
    "`pdftoppm` (Poppler) on `PATH`",
    "no pin",
    "`src/deploy_vii/preparation.py`",
    (
        "OCR of scanned PDF pages, with `tesseract`. Absent, such a page "
        'is read as empty with the stated limitation "OCR unavailable"; '
        "nothing fails. In no manifest or document."
    ),
)
add(
    optional, "`tesseract` on `PATH`", "no pin", "`src/deploy_vii/preparation.py`", "As `pdftoppm`."
)
add(
    optional,
    "`gh` CLI",
    "no pin",
    "`docs/COPILOT.md`; `src/deploy_workflow/model/copilot_adapter.py`",
    "Only with `COPILOT_USE_GH_LOGIN=1`, for live runs through GitHub Copilot.",
)
add(
    optional,
    "GitHub Copilot runtime",
    "`1.0.105`",
    (
        "`docs/COPILOT.md` (fetched by `python -m copilot "
        "download-runtime`, path in `COPILOT_CLI_PATH`)"
    ),
    (
        "Live runs through the `copilot-*` configurations only. Not "
        "needed to make the application run; record whether `<APPROVED>` "
        "can supply it and do not fetch it yourself."
    ),
)


def table(title: str, rows_: list[TableRow]) -> str:
    s = (
        f"**{title}**\n\n| # | Requirement | Exact pin | Pinned in | What uses it |\n"
        "| ---: | :--- | :--- | :--- | :--- |\n"
    )
    for r in rows_:
        s += "| " + " | ".join(str(c) for c in r) + " |\n"
    return s + "\n"


body = ""
for title, rows_ in [
    ("Toolchain", tool),
    ("Python packages: direct dependencies (`uv.lock` locks every one)", pdirect),
    ("Python packages: development group (`uv sync --locked` installs it)", pdev),
    ("Python build tools (fetched during `uv sync --locked`, not locked)", pbuild),
    ("npm packages: `dependencies` (`web/package-lock.json` locks every one)", npmd),
    (f"npm packages: `devDependencies` other than Playwright ({len(npmdev)})", npmdev),
    ("Playwright and the two browsers", browsers),
    ("Programs and downloads outside both lock files", optional),
]:
    body += table(title, rows_)
Path(out).write_text(body)
print(
    "rows:",
    n,
    {
        k: len(v)
        for k, v in {
            "tool": tool,
            "pdirect": pdirect,
            "pdev": pdev,
            "pbuild": pbuild,
            "npmd": npmd,
            "npmdev": npmdev,
            "browsers": browsers,
            "optional": optional,
        }.items()
    },
)
