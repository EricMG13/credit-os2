"""Offline size and density measures of the instructions CP-OS sends: no provider call, no network.

    uv run python tools/cp1_check_proof.py --instructions SCRATCH_DIR
    uv run python tools/instruction_metrics.py SCRATCH_DIR/deep_credit_assessment/out/instructions
    uv run python tools/instruction_metrics.py DIR --json after.json --against before.json

DIR is a prepared run's `instructions` folder (one `<module>.md` per module). The table is what a
model is sent as instructions, measured; it says nothing about what the model then writes.
`--against` prints each measure's change from an earlier `--json` file. Token counts are an
ESTIMATE from bytes (`BYTES_PER_TOKEN_ESTIMATE`), not a provider's count.
"""

import argparse
import json
import re
from collections import Counter
from pathlib import Path

from deploy_workflow.model.copilot import prompt_tokens_estimate
from deploy_workflow.owners.cpos_launch_prompts import METHOD_MARK

# A shorter paragraph is a heading, a table rule or a one-line note, which repeat by design.
PARAGRAPH_FLOOR = 200
SENT_FILE = re.compile(r"^=== (.+?) sha256 [0-9a-f]{64} ===$", re.MULTILINE)
REFERENCE_NAME = re.compile(r"\bREF_[A-Za-z0-9_-]+\.md\b")
# A bundle file carries each reference it holds under a heading that is the reference's file name.
BUNDLED = re.compile(r"^#{1,6} .*?\b(REF_[A-Za-z0-9_-]+\.md)\b", re.MULTILINE)
# Words that make a sentence a requirement or a prohibition: a count of how much is demanded.
DIRECTIVE = re.compile(
    r"\b(must|never|do not|don't|shall|always|required|mandatory|may not|cannot|prohibited)\b",
    re.IGNORECASE,
)
EMPHASIS = re.compile(r"\b(MUST|NEVER|CRITICAL|MANDATORY|IMPORTANT|ALWAYS|DO NOT|NON-NEGOTIABLE)\b")
# What `TRANSPORT_RULES` in the head tells the model to leave out or not to wait for. A method
# paragraph that names one is text the head overrides: a count by keyword, so an upper bound.
OVERRIDDEN = re.compile(
    r"qa_status|prepare_invocation\.py|validate_handoff\.py|completeness_check\.py|scripts/"
    r"|acceptance receipt|invocation digest|settled-head|confidence band|Audit Summary",
    re.IGNORECASE,
)
SENTENCE_END = re.compile(r"(?<=[.;:])\s+|\n")
MEASURES = (
    "chars",
    "tokens_estimate",
    "lines",
    "head_chars",
    "method_chars",
    "method_files",
    "directive_sentences",
    "emphasis_words",
    "repeated_chars",
    "overridden_chars",
    "unsent_references",
)


def measure(text: str) -> dict[str, int]:
    """One module's instructions, measured. `repeated_chars` is what removing every second and
    later copy of a paragraph would save; `unsent_references` is the reference files the text
    names that are neither a file it was sent nor a headed section of a bundle it was sent;
    `overridden_chars` is the method paragraphs naming something the head says to leave out."""
    head, mark, method = text.partition(METHOD_MARK)
    sent = SENT_FILE.findall(text)
    blocks = [p.strip() for p in re.split(r"\n\s*\n", text)]
    paragraphs = Counter(p for p in blocks if len(p) >= PARAGRAPH_FLOOR)
    method_blocks = [p.strip() for p in re.split(r"\n\s*\n", method)]
    held = set(BUNDLED.findall(text))
    named = set(REFERENCE_NAME.findall(text)) - held
    return {
        "chars": len(text),
        "tokens_estimate": prompt_tokens_estimate(len(text.encode())),
        "lines": len(text.splitlines()),
        "head_chars": len(head),
        "method_chars": len(mark) + len(method),
        "method_files": len(sent),
        "directive_sentences": sum(1 for s in SENTENCE_END.split(text) if DIRECTIVE.search(s)),
        "emphasis_words": len(EMPHASIS.findall(text)),
        "repeated_chars": sum(len(p) * (n - 1) for p, n in paragraphs.items()),
        "overridden_chars": sum(len(p) for p in method_blocks if OVERRIDDEN.search(p)),
        "unsent_references": sum(1 for name in named if not any(name in f for f in sent)),
    }


def measure_folder(folder: Path) -> dict[str, dict[str, int]]:
    files = sorted(folder.glob("*.md"))
    if not files:
        raise SystemExit(f"no <module>.md instruction file in {folder}")
    return {path.stem: measure(path.read_text(encoding="utf-8")) for path in files}


def table(rows: dict[str, dict[str, int]], before: dict[str, dict[str, int]] | None) -> str:
    """One line per module and a total; with `before`, each cell is the change from it."""
    shown = dict(rows)
    shown["TOTAL"] = {m: sum(row[m] for row in rows.values()) for m in MEASURES}
    if before is not None:
        earlier = dict(before)
        earlier["TOTAL"] = {m: sum(row.get(m, 0) for row in before.values()) for m in MEASURES}
        shown = {
            module: {m: row[m] - earlier.get(module, {}).get(m, 0) for m in MEASURES}
            for module, row in shown.items()
        }
    sign = "+" if before is not None else ""
    lines = ["module  " + " ".join(f"{m:>19}" for m in MEASURES)]
    lines += [
        f"{module:<8}" + " ".join(f"{row[m]:>{sign}19,}" for m in MEASURES)
        for module, row in shown.items()
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").splitlines()[0])
    parser.add_argument("folder", type=Path, help="a prepared run's instructions folder")
    parser.add_argument("--json", type=Path, metavar="FILE", help="also write the measures here")
    parser.add_argument("--against", type=Path, metavar="FILE", help="an earlier --json file")
    args = parser.parse_args()
    rows = measure_folder(args.folder)
    before = None if args.against is None else json.loads(args.against.read_text())
    print(table(rows, before))
    if args.json is not None:
        args.json.write_text(json.dumps(rows, indent=1, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
