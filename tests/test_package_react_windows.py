from io import BytesIO
from zipfile import ZipFile

import pytest

from tools import package_react_windows

from tools.package_react_windows import PROJECT, SOURCE_PATHS, git, validate_source, write_bundle


@pytest.mark.parametrize("entry", ["../outside", "src/.env", "proof/key.pem", "web/dist/data.js"])
def test_refuses_unsafe_or_stale_source_entries(entry):
    payload = BytesIO()
    with ZipFile(payload, "w") as source:
        source.writestr(entry, "not for the package")
        with pytest.raises(ValueError, match="unsupported"):
            validate_source(source)


def test_keeps_runtime_and_compiled_assets_at_the_archive_root(tmp_path):
    dist = tmp_path / "web/dist"
    dist.mkdir(parents=True)
    (tmp_path / "SOURCE-COMMIT.txt").write_bytes(b"candidate\n")
    (tmp_path / "proof-artifacts").mkdir()
    manifest = "proof-artifacts/connected-build-manifest.json"
    (tmp_path / manifest).write_bytes(b"retained")
    (dist / "connected-assets").mkdir()
    (dist / "connected-assets/source-provenance.json").write_bytes(b"served")
    (dist / "index.html").write_text("<title>Credit OS 2</title>")
    payload = BytesIO()
    with ZipFile(payload, "w") as source:
        source.writestr("Run-React-Proof.cmd", "echo proof")
        source.writestr("uv.lock", "")
        source.writestr("web/package-lock.json", "{}")
        source.writestr("proof/northbridge-filing.txt", "synthetic")
        validate_source(source)
        output = tmp_path / "candidate.zip"
        write_bundle(source, tmp_path, output)
    with ZipFile(output) as archive:
        assert set(archive.namelist()) == {
            "Run-React-Proof.cmd",
            "uv.lock",
            "web/package-lock.json",
            "proof/northbridge-filing.txt",
            "web/dist/index.html",
            "web/dist/connected-assets/source-provenance.json",
            manifest,
            "SOURCE-COMMIT.txt",
        }
        assert archive.read(manifest) == b"retained"
        assert archive.read("web/dist/connected-assets/source-provenance.json") == b"served"
        assert archive.read("SOURCE-COMMIT.txt") == b"candidate\n"


def test_selected_sources_include_the_react_design_specs() -> None:
    payload = git(PROJECT, "archive", "--format=zip", "HEAD", "--", *SOURCE_PATHS)
    with ZipFile(BytesIO(payload)) as archive:
        for name in (
            "DESIGN.md",
            "PRODUCT.md",
            "docs/design/design-system.md",
            "docs/design/screen-map.md",
            "tests/fixtures/cp1-instruction-pr/answer-key.json",
        ):
            assert archive.read(name) == (PROJECT / name).read_bytes()
        assert "apps/issuer-library/credit_os/web/index.html" not in archive.namelist()
        assert "docs/templates/context-form.html" not in archive.namelist()
        assert "docs/COPILOT.md" in archive.namelist()


def test_build_fingerprints_the_same_source_that_the_zip_delivers(tmp_path, monkeypatch):
    expected = git(PROJECT, "rev-parse", "HEAD")

    def build(workspace):
        assert (workspace / "SOURCE-COMMIT.txt").read_bytes() == expected
        assert not (workspace / "apps/issuer-library/credit_os/web/index.html").exists()
        assert not (workspace / "docs/templates/context-form.html").exists()
        (workspace / "web/dist").mkdir()
        (workspace / "proof-artifacts").mkdir()
        (workspace / "proof-artifacts/connected-build-manifest.json").write_bytes(b"retained")

    monkeypatch.setattr(package_react_windows, "build_web", build)
    output = tmp_path / "candidate.zip"
    package_react_windows.package(PROJECT, "HEAD", output)
    with ZipFile(output) as archive:
        assert archive.read("SOURCE-COMMIT.txt") == expected
        assert archive.read("proof-artifacts/connected-build-manifest.json") == b"retained"
