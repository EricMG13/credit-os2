"""Build the Windows React candidate from a selected commit in a clean directory."""

from __future__ import annotations

import argparse
import hashlib
import shutil
import stat
import subprocess
from io import BytesIO
from pathlib import Path, PurePosixPath
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

PROJECT = Path(__file__).resolve().parents[1]
CP1_ANSWER_KEY = "tests/fixtures/cp1-instruction-pr/answer-key.json"
SOURCE_PATHS = (
    ".python-version",
    "AGENTS.md",
    "DESIGN.md",
    "METHODOLOGY-REVIEW.md",
    "PRODUCT.md",
    "README.md",
    "Run-React-Proof.cmd",
    "apps/issuer-library",
    "cases/context",
    "docs/COPILOT.md",
    "docs/QUALITY-GATE.md",
    "docs/design/design-system.md",
    "docs/design/screen-map.md",
    "docs/methodology/portfolio-recommendation.md",  # CP-2's Risk Rubric table
    "docs/react-workflow.md",
    "docs/reuse/selected-methods",
    "docs/rulings",
    "docs/templates",
    "docs/visualisations",
    "prompts",
    "proof",
    "pyproject.toml",
    "react_frontend",
    "src",
    CP1_ANSWER_KEY,  # imported by a web TypeScript test in newer revisions
    "uv.lock",
    "tests/fixtures/cp1-instruction-pr/answer-key.json",
    "web",
    ":(exclude)apps/issuer-library/credit_os/web/index.html",
    ":(exclude)docs/templates/context-form.html",
)


def git(project: Path, *args: str) -> bytes:
    return subprocess.check_output(["git", "-C", str(project), *args])


def validate_source(source: ZipFile) -> None:
    paths: set[str] = set()
    for entry in source.infolist():
        name = entry.filename
        path = PurePosixPath(name)
        if (
            path.is_absolute()
            or any(part in {"..", ".env", "node_modules", ".venv"} for part in path.parts)
            or name.endswith((".rtf", ".key", ".pem"))
            or path.parts[:2] == ("web", "dist")
            or ":" in name
            or "\\" in name
            or stat.S_ISLNK(entry.external_attr >> 16)
        ):
            raise ValueError(f"unsupported source archive entry: {name}")
        folded = str(path).casefold()
        if folded in paths:
            raise ValueError(f"duplicate Windows archive path: {name}")
        paths.add(folded)


def build_web(source: Path) -> None:
    npm = shutil.which("npm.cmd") or shutil.which("npm")
    if npm is None:
        raise ValueError("install the pinned Node.js toolchain to build the candidate")
    subprocess.run([npm, "ci", "--no-audit", "--no-fund"], cwd=source / "web", check=True)
    subprocess.run([npm, "run", "build"], cwd=source / "web", check=True)
    dist = source / "web/dist"
    if not (dist / "index.html").is_file():
        raise ValueError("the build did not create web/dist/index.html")
    if (dist / "data.js").read_bytes() != (source / "web/public/data.js").read_bytes():
        raise ValueError("the build must contain the empty connected data placeholder")


def write_bundle(source: ZipFile, workspace: Path, output: Path) -> None:
    dist = workspace / "web/dist"
    with ZipFile(output, "w", ZIP_DEFLATED) as dest:
        for entry in source.infolist():
            if not entry.is_dir():
                dest.writestr(
                    ZipInfo(entry.filename, entry.date_time),
                    source.read(entry),
                    compress_type=ZIP_DEFLATED,
                )
        for path in sorted(dist.rglob("*")):
            if path.is_symlink():
                raise ValueError(f"unsupported build entry: {path.name}")
            if path.is_file():
                dest.writestr(f"web/dist/{path.relative_to(dist).as_posix()}", path.read_bytes())
        for name in ("SOURCE-COMMIT.txt", "proof-artifacts/connected-build-manifest.json"):
            dest.writestr(name, (workspace / name).read_bytes())


def package(project: Path, revision: str, output: Path) -> str:
    commit = git(project, "rev-parse", "--verify", f"{revision}^{{commit}}").decode("ascii").strip()
    fixture_type = git(project, "ls-tree", "--format=%(objecttype)", commit, "--", CP1_ANSWER_KEY)
    paths: tuple[str, ...] = SOURCE_PATHS
    if fixture_type.strip() != b"blob":
        paths = tuple(path for path in paths if path != CP1_ANSWER_KEY)
    source_bytes = git(project, "archive", "--format=zip", commit, "--", *paths)
    output.parent.mkdir(parents=True, exist_ok=True)
    with (
        TemporaryDirectory(prefix="credit-os2-build-") as workspace,
        TemporaryDirectory(dir=output.parent) as staging,
        ZipFile(BytesIO(source_bytes)) as source,
    ):
        validate_source(source)
        source.extractall(workspace)
        root = Path(workspace)
        (root / "SOURCE-COMMIT.txt").write_bytes((commit + "\n").encode("ascii"))
        build_web(root)
        pending = Path(staging) / output.name
        write_bundle(source, root, pending)
        with pending.open("rb") as file:
            digest = hashlib.file_digest(file, "sha256").hexdigest()
        pending.replace(output)
    output.with_suffix(".zip.sha256").write_text(f"{digest}  {output.name}\n", encoding="ascii")
    return digest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--revision", default="HEAD")
    parser.add_argument("--output", type=Path, default=PROJECT / "delivery/credit-os2-react.zip")
    args = parser.parse_args()
    if args.output.suffix.lower() != ".zip":
        parser.error("--output must end in .zip")
    digest = package(PROJECT, args.revision, args.output.resolve())
    print(f"{args.output.resolve()}\nSHA-256 {digest}")


if __name__ == "__main__":
    main()
