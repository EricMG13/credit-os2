"""Bundle official Python and pinned wheels; verify every downloaded SHA-256."""

import hashlib
import json
import shutil
import urllib.request
import zipfile
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parents[1]
RUBRIC_SOURCE = "docs/methodology/portfolio-recommendation.md"
CACHE = ROOT / "artifacts/issuer-library/runtime-cache"
PINS = {
    "pydantic": "2.14.1",
    "pydantic-core": "2.50.1",
    "annotated-types": "0.8.0",
    "typing-extensions": "4.16.0",
    "typing-inspection": "0.4.4",
    "pypdf": "6.21.2",
    "openpyxl": "3.1.5",
    "et-xmlfile": "2.0.0",
}
PYTHON = {
    "amd64": "d1f04d990aee1253d8569e8e5104e30fa9f5fa830899f14843448872d936a2cf",
    "arm64": "cd992cbfb33be433ff20f150691595efb2862e56f4f1bec684c6077d4775af8e",
}


def download(url: str, sha: str, name: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    target = CACHE / name
    if not target.exists() or hashlib.sha256(target.read_bytes()).hexdigest() != sha:
        with urllib.request.urlopen(url, timeout=90) as response:
            raw = response.read(100 << 20)
        if hashlib.sha256(raw).hexdigest() != sha:
            raise ValueError(f"Checksum mismatch: {name}")
        target.write_bytes(raw)
    return target


def clear_runtime(target: Path, runtime: Path, manifest: Path) -> None:
    """Empty the runtime folder the build owns, so a re-pinned runtime ships no stale wheels.

    Nothing is deleted until the folder is known to be inside the build target.
    """
    if (
        runtime.is_symlink()
        or runtime.is_junction()
        or not runtime.resolve().is_relative_to(target.resolve())
    ):
        raise ValueError(f"Refusing to clear a runtime folder outside the build: {runtime}")
    manifest.unlink(missing_ok=True)
    if runtime.exists():
        shutil.rmtree(runtime)
    runtime.mkdir()


# Windows wrappers, one batch line per entry. Untested on Windows from this build host;
# Smoke-test.ps1 on the target host is the acceptance.
_PYTHON = '"%~dp0engine\\runtime\\python.exe" -I -B -X utf8'
# The embeddable Python ignores PYTHONPATH and, started with a script, does not add the script's
# folder, so the package's two import roots are listed here (paths are relative to the runtime
# folder): engine\src holds deploy_workflow and deploy_vii, engine holds credit_os and
# update_library. It is the package's equivalent of a checkout's `uv sync`; `-m deploy_workflow...`
# and the run page's launcher children need both.
PTH = "python313.zip\n.\nLib\\site-packages\n..\\src\n..\nimport site\n"
_ROOT_ARGUMENT = [
    'set "ROOT=%~1"',
    'if not defined ROOT set "ROOT=%FINAL_WORKFLOW_WORKSPACE%"',
]
WRAPPERS = {
    "Run workflow.cmd": [
        "@echo off",
        "rem Prepare and review a CP-OS run offline with the embedded Python.",
        f'{_PYTHON} "%~dp0engine\\run_workflow.py" %*',
        "exit /b %errorlevel%",
    ],
    "Start signal.cmd": [
        "@echo off",
        "setlocal",
        "rem Serve the Signal feed: stories from the approved news, regulator and ratings feeds.",
        "rem Folder: the first argument, else FINAL_WORKFLOW_WORKSPACE.",
        "rem Address: the second argument, else 127.0.0.1 (this machine only). Pass this machine's",
        "rem own address to serve colleagues; 0.0.0.0 is refused. It makes no model call and needs",
        "rem no provider key.",
        *_ROOT_ARGUMENT,
        'set "HOSTADDR=%~2"',
        'if not defined HOSTADDR set "HOSTADDR=127.0.0.1"',
        "if not defined ROOT (",
        "  echo Usage: Start signal.cmd ^<shared folder^> [address]",
        "  echo Or set FINAL_WORKFLOW_WORKSPACE to the shared folder.",
        "  exit /b 1",
        ")",
        (
            f'{_PYTHON} -m deploy_workflow.signal --root "%ROOT%" serve --host "%HOSTADDR%"'
            " --port 8766"
        ),
        "exit /b %errorlevel%",
    ],
}


def _purge_retired_outputs(target: Path) -> None:
    # Remove these outputs from an existing package folder before re-archiving it.
    retired_paths = (
        "Update library.cmd",
        "Start run page.cmd",
        "engine/docs/templates/context-form.html",
        "engine/docs/rulings/2026-11-11-run-start-submit.md",
        "engine/credit_os/web/index.html",
    )
    root = target.resolve()
    for retired in retired_paths:
        path = target / retired
        for parent in path.parents:
            if parent == target.parent:
                break
            if parent.is_symlink() or parent.is_junction():
                raise ValueError(
                    f"Refusing to purge package file through a linked folder: {parent}"
                )
            if parent.exists() and not parent.resolve().is_relative_to(root):
                raise ValueError(f"Refusing to purge package file outside the build: {parent}")
        path.unlink(missing_ok=True)


def _copy_documents(engine: Path) -> None:
    """The single files under docs/ the engine reads, at the same paths relative to engine/:
    store.REPO is engine/ in the package and the store reads the visualisation catalogue from it;
    the launcher reads the Risk Rubric table CP-2 is sent from RUBRIC_SOURCE
    (`deploy_workflow.cp2_scorecard.LEVEL_TEXT_SOURCE`)."""
    for name in ("docs/visualisations/catalogue.csv", RUBRIC_SOURCE):
        (engine / name).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, engine / name)


def bundle(target: Path, architecture: str | None) -> None:
    _purge_retired_outputs(target)
    engine = target / "engine"
    engine.mkdir(exist_ok=True)
    shutil.copyfile(APP / "engine/run_workflow.py", engine / "run_workflow.py")
    # The static library: its update script, the Credit OS store and page parts (not their tests),
    # and the workflow and Signal wrappers (bundled Python).
    shutil.copyfile(APP / "update_library.py", engine / "update_library.py")
    if (engine / "credit_os").exists():
        shutil.rmtree(engine / "credit_os")
    tests = shutil.ignore_patterns(
        "*.test.cjs", "*_check.cjs", "__pycache__", "*.pyc", "index.html"
    )
    shutil.copytree(APP / "credit_os", engine / "credit_os", ignore=tests)
    for name, lines in WRAPPERS.items():
        (target / name).write_text("\n".join(lines) + "\n", encoding="ascii", newline="\r\n")
    shutil.copyfile(ROOT / "cases/context/research-minimal.json", engine / "smoke-context.json")
    shutil.copyfile(APP / "packaging/Smoke-test.ps1", target / "Smoke-test.ps1")
    if (engine / "src").exists():
        shutil.rmtree(engine / "src")
    shutil.copytree(
        ROOT / "src",
        engine / "src",
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "*.test.cjs"),
    )
    # The launcher reads each module's method from these, relative to the engine folder.
    for name in ["docs/reuse/selected-methods", "prompts"]:
        if (engine / name).exists():
            shutil.rmtree(engine / name)
        shutil.copytree(
            ROOT / name, engine / name, ignore=shutil.ignore_patterns("__pycache__", "*.pyc")
        )
    _copy_documents(engine)
    if architecture is None:
        return
    runtime = engine / "runtime"
    # The same pinned runtime from an earlier build needs no download.
    manifest = engine / "runtime-manifest.json"
    if manifest.exists() and (runtime / "python.exe").exists():
        records = json.loads(manifest.read_text())
        if (
            records["python"]["sha256"] == PYTHON[architecture]
            and {k: v["version"] for k, v in records["wheels"].items()} == PINS
        ):
            (runtime / "python313._pth").write_text(PTH)  # An older build lacks an import root.
            print("Reusing the pinned Python engine for", architecture, flush=True)
            return
    clear_runtime(target, runtime, manifest)
    filename = f"python-3.13.15-embed-{architecture}.zip"
    source = download(
        "https://www.python.org/ftp/python/3.13.15/" + filename, PYTHON[architecture], filename
    )
    with zipfile.ZipFile(source) as archive:
        archive.extractall(runtime)
    site = runtime / "Lib/site-packages"
    site.mkdir(parents=True, exist_ok=True)
    records = {"python": {"version": "3.13.15", "sha256": PYTHON[architecture]}, "wheels": {}}
    tag = "win_amd64" if architecture == "amd64" else "win_arm64"
    for name, version in PINS.items():
        with urllib.request.urlopen(
            f"https://pypi.org/pypi/{name}/{version}/json", timeout=45
        ) as response:
            metadata = json.load(response)
        matches = [
            item
            for item in metadata["urls"]
            if item["filename"].endswith(".whl")
            and (
                item["filename"].endswith("-none-any.whl")
                or (
                    "-cp313-" in item["filename"]
                    and item["filename"].endswith("-" + tag + ".whl")
                    and "-cp313t-" not in item["filename"]
                )
            )
        ]
        if len(matches) != 1:
            raise ValueError(f"No unique pinned Windows wheel: {name} {version} {tag}")
        item = matches[0]
        wheel = download(item["url"], item["digests"]["sha256"], item["filename"])
        with zipfile.ZipFile(wheel) as archive:
            archive.extractall(site)
        records["wheels"][name] = {
            "version": version,
            "filename": item["filename"],
            "sha256": item["digests"]["sha256"],
        }
    (runtime / "python313._pth").write_text(PTH)
    (engine / "runtime-manifest.json").write_text(json.dumps(records, indent=2) + "\n")
    print("Bundled pinned Python engine for", architecture, flush=True)


if __name__ == "__main__":
    import sys

    bundle(Path(sys.argv[1]), sys.argv[2])
