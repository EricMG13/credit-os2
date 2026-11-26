"""`statement_lines.line_table`: a range whose value cells the extractor cannot read is refused,
so a negative row never vanishes without a flag (S07-method-scripts-calcs-1-2).

Expected outcomes are written by hand: four data rows (Revenue, Operating loss, Interest expense,
Net loss) are extracted when the negatives are in parentheses; a Unicode minus or an ASCII
hyphen-minus before a number is a value the extractor cannot read, so the range is refused.
"""

import pytest

from deploy_vii.contracts import Span
from deploy_vii.live.tools import ToolError
from deploy_workflow.statement_lines import line_table


def _spans(loss: str) -> dict[int, Span]:
    texts = [
        "USD millions",
        "Year ended December 31, 2025 2024",
        "Revenue 1,000 900",
        f"Operating loss {loss}",
        "Interest expense (12) (10)",
        f"Net loss {loss}",
    ]
    return {n + 1: Span(locator=f"line:{n + 1}", text=text) for n, text in enumerate(texts)}


def test_parenthesised_negatives_are_extracted() -> None:
    table = line_table(_spans("(45) (50)"), "line:1-6", "S1")
    labels = [line.label for line in table.lines]
    assert {"Revenue", "Operating loss", "Interest expense", "Net loss"} <= set(labels)


@pytest.mark.parametrize("loss", ["−45 −50", "-45 -50", "$ -45 $ -50", "-45.5 (50)"])
def test_a_minus_sign_negative_is_refused_not_dropped(loss: str) -> None:
    with pytest.raises(ToolError):
        line_table(_spans(loss), "line:1-6", "S1")


@pytest.mark.parametrize("dash", ["- -", "— —", "1,000 -"])
def test_a_dash_placeholder_is_still_a_blank_not_a_negative(dash: str) -> None:
    spans = _spans("(45) (50)")
    spans[5] = Span(locator="line:5", text=f"Other income {dash}")
    table = line_table(spans, "line:1-6", "S1")
    assert "Operating loss" in [line.label for line in table.lines]
