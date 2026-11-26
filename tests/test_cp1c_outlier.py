"""CP-1C outlier flag at the exact one-half threshold (S01-owners-cp1-cp2a-cp2d-1-1).

Expected values are worked by hand: the median of 4/3 and 4 is 8/3, so the 4.0x peer deviates by
(4 - 8/3) / (8/3) = 1/2 exactly, which is not strictly above one half.
"""

from decimal import Decimal as D

import pytest

from deploy_workflow.owners import cp1c


def test_a_deviation_of_exactly_one_half_through_a_rounded_median_is_within_range() -> None:
    third = cp1c.CTX.divide(D(4), D(3))  # a stored 38-digit ratio, as the peer table holds it
    middle = cp1c.median([third, D(4)])
    found = cp1c.outlier(D(4), middle)
    assert found is not None
    assert found[1] == "Within range"
    found = cp1c.outlier(third, middle)
    assert found is not None
    assert found[1] == "Within range"


@pytest.mark.parametrize(
    ("value", "flag"),
    [(D(1), "Outlier"), (D(5), "Outlier"), (D("4.0001"), "Outlier"), (D("3.9999"), "Within range")],
)
def test_a_real_deviation_either_side_of_one_half_keeps_its_flag(value: D, flag: str) -> None:
    middle = cp1c.median([cp1c.CTX.divide(D(4), D(3)), D(4)])
    found = cp1c.outlier(value, middle)
    assert found is not None
    assert found[1] == flag
