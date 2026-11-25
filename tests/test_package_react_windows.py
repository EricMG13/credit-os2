from io import BytesIO
from zipfile import ZipFile

import pytest

from tools.package_react_windows import PROJECT, SOURCE_PATHS, git, validate_source, write_bundle


@pytest.mark.parametrize("entry", ["../outside", "src/.env", "proof/key.pem", "web/dist/data.js"])
def test_refuses_unsafe_or_stale_source_entries(entry):
    payload = BytesIO()
    with ZipFile(payload, "w") as source:
        source.writestr(entry, "not for the package")
        with pytest.raises(ValueError, match="unsupported"):
            validate_source(source)


def test_keeps_runtime_and_compiled_assets_at_the_archive_root(tmp_path):
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text("<title>Credit OS 2</title>")
    payload = BytesIO()
    with ZipFile(payload, "w") as source:
        source.writestr("Run-React-Proof.cmd", "echo proof")
        source.writestr("uv.lock", "")
        source.writestr("web/package-lock.json", "{}")
        source.writestr("proof/northbridge-filing.txt", "synthetic")
        source.writestr("apps/issuer-library/credit_os/web/index.html", "legacy design ref")
        source.writestr("docs/templates/context-form.html", "retired form")
        validate_source(source)
        output = tmp_path / "candidate.zip"
        write_bundle(source, dist, output, "candidate")
    with ZipFile(output) as archive:
        assert set(archive.namelist()) == {
            "Run-React-Proof.cmd",
            "uv.lock",
            "web/package-lock.json",
            "proof/northbridge-filing.txt",
            "web/dist/index.html",
            "SOURCE-COMMIT.txt",
        }
        assert "apps/issuer-library/credit_os/web/index.html" not in archive.namelist()
        assert "docs/templates/context-form.html" not in archive.namelist()
        assert archive.read("SOURCE-COMMIT.txt") == b"candidate\n"


def test_selected_sources_include_the_react_design_specs() -> None:
    payload = git(PROJECT, "archive", "--format=zip", "HEAD", "--", *SOURCE_PATHS)
    with ZipFile(BytesIO(payload)) as archive:
        for name in (
            "DESIGN.md",
            "PRODUCT.md",
            "docs/design/design-system.md",
            "docs/design/screen-map.md",
        ):
            assert archive.read(name) == (PROJECT / name).read_bytes()
        # The design-reference file remains in source history; write_bundle filters it.
        assert "apps/issuer-library/credit_os/web/index.html" in archive.namelist()
        assert "docs/COPILOT.md" in archive.namelist()
