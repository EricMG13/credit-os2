"""Offline proof of CP-1's acceptance check: no provider call, no network.

    uv run python tools/cp1_check_proof.py HANDOFF.md [HANDOFF.md ...]
    uv run python tools/cp1_check_proof.py --instructions SCRATCH_DIR [HANDOFF.md ...]

Each handoff is read and every issue the check finds is printed, one per line (exit 1 when any
handoff has an issue, 0 when none does). With `--instructions` every pathway is also prepared
offline in SCRATCH_DIR (the way `all_instructions` in tests/test_cpos_launch.py does) and the
script prints CP-1's instruction size, the sha256 of each method section sent to CP-1, and the
pathway's total against its ceiling (the `INSTRUCTION_BUDGET` of that test file, read, not copied).
"""

import argparse
import ast
import hashlib
import json
from decimal import Decimal
from pathlib import Path

from deploy_workflow.credit_os_catalogue import period_order
from deploy_workflow.owners import cpos_cp1_check as cp1_check
from deploy_workflow.owners import cpos_launch
from deploy_workflow.owners.cpos_cp1_check import cp1_issues
from deploy_workflow.owners.cpos_cp1_statements import _findings, _table

ROOT = Path(__file__).resolve().parents[1]

TESTS = ROOT / "tests/test_cpos_launch.py"
ISSUER = "Northbridge Synthetic Group"
AS_OF = "2025-03-31"


def instruction_budget() -> dict[str, int]:
    """The per-pathway ceilings, read from the launcher test that holds the answer key."""
    for node in ast.parse(TESTS.read_text()).body:
        if isinstance(node, ast.Assign) and [getattr(t, "id", "") for t in node.targets] == [
            "INSTRUCTION_BUDGET"
        ]:
            value = ast.literal_eval(node.value)
            assert isinstance(value, dict)
            return {str(k): int(v) for k, v in value.items()}
    raise SystemExit(f"INSTRUCTION_BUDGET not found in {TESTS}")


def _diagnostic_rows(lines: list[str], heading: str, *columns: str) -> list[dict[str, str]] | str:
    """Read a complete table, or explain why it cannot support the comparison."""
    table = _table(lines, heading)
    if not table:
        return f"`{heading}` has no table"
    header, *rows = table
    for column in columns:
        if column not in header:
            return f"`{heading}` missing column `{column}`"
    if not rows:
        return f"`{heading}` has no data rows"
    if any(len(row) != len(header) for row in rows):
        return f"`{heading}` row has the wrong number of cells"
    return [dict(zip(header, row, strict=True)) for row in rows]


def ladder_diagnostic(text: str) -> list[str]:
    """Compare the maturity ladder with the latest Gross debt when no reconciliation is given."""
    lines = _findings(text)
    ladder = _diagnostic_rows(lines, cp1_check.LADDER_HEADING, "Period", "Debt maturing")
    if isinstance(ladder, str):
        return [ladder]
    figures = [cp1_check._number(row["Debt maturing"]) for row in ladder]
    if any(figure is None for figure in figures):
        return ["`Debt maturing` has no stated number in a ladder row; no sum is worked"]
    rows = _diagnostic_rows(lines, cp1_check.NET_DEBT_HEADING, "Period", "Gross debt")
    if isinstance(rows, str):
        return [rows]
    ordered = [(key, row) for row in rows if (key := period_order(row["Period"])) is not None]
    notes = []
    if len(ordered) != len(rows):
        notes.append("`Net debt data` `Period` has no readable value in a row")
    if not ordered:
        return notes

    _, row = max(ordered, key=lambda item: item[0])
    period = row["Period"]
    gross = cp1_check._number(row["Gross debt"])
    if gross is None:
        notes.append(f"`Gross debt` has no stated number for {period}")
        return notes
    total = sum((figure for figure in figures if figure is not None), Decimal(0))
    notes.append(
        f"debt maturities sum to {total:,}; Net debt data Gross debt for "
        f"{period} is {gross:,}; the ladder is {gross - total:,} short"
    )
    return notes


def check_handoffs(paths: list[Path]) -> int:
    found = 0
    for path in paths:
        text = path.read_text(encoding="utf-8")
        issues = cp1_issues(text)
        print(f"{path}: {len(issues)} issue(s)")
        for number, issue in enumerate(issues, 1):
            print(f"  {number}. {issue}")
        if _table(_findings(text), cp1_check.RECON_HEADING) is None:
            for note in ladder_diagnostic(text):
                print(f"  diagnostic (not a check issue): {note}")
        found += len(issues)
    return found


def prepare_pathway(scratch: Path, pathway: str) -> tuple[Path, cpos_launch.Prepared]:
    work = scratch / pathway
    issuer = work / "issuer"
    (issuer / "filings").mkdir(parents=True, exist_ok=True)
    (issuer / "annual.txt").write_text("Net sales were 100.")
    (issuer / "filings/notes.md").write_text("Notes mature in 2030.")
    data = json.loads((ROOT / "cases/cpdr-context-cutoff/context.json").read_text())
    data["run"].update(pathway=pathway, as_of=AS_OF, cutoff="")
    data["identity"].update(issuer_name=ISSUER, issuer_id="nbg")
    context = work / "context.json"
    context.write_text(json.dumps(data))
    return work, cpos_launch.prepare(context, issuer, work / "out", config="sol-medium", cap="50")


def report_sizes(scratch: Path) -> None:
    sections = cpos_launch.method_sections("CP-1")
    print("CP-1 method sections sent (name, characters, sha256):")
    for name, text in sections:
        print(f"  {name}  {len(text):,}  {hashlib.sha256(text.encode()).hexdigest()}")
    for pathway, ceiling in sorted(instruction_budget().items()):
        work, prepared = prepare_pathway(scratch, pathway)
        texts = {
            module: (work / "out" / spec.path).read_text()
            for module, spec in prepared.plan.instructions.items()
        }
        total = sum(len(t) for m, t in texts.items() if m != "CP-8")
        cp1 = len(texts["CP-1"]) if "CP-1" in texts else 0
        verdict = "within" if total <= ceiling else "OVER"
        print(
            f"{pathway}: CP-1 {cp1:,}; total {total:,} / ceiling {ceiling:,} "
            f"(headroom {ceiling - total:,}) {verdict}"
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("handoffs", nargs="*", type=Path)
    parser.add_argument("--instructions", type=Path, metavar="DIR")
    args = parser.parse_args()
    found = check_handoffs(args.handoffs)
    if args.instructions is not None:
        report_sizes(args.instructions.resolve())
    return 1 if found else 0


if __name__ == "__main__":
    raise SystemExit(main())
