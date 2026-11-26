"""CP-1D's add-back key must be carried into both keyed output registers."""

from collections import Counter


def compare(expected, actual):
    """Describe differences between the bridge IDs and a CP-1D register."""
    expected_counts = Counter(expected)
    actual_counts = Counter(actual)
    missing = [
        ident
        for ident, count in expected_counts.items()
        for _ in range(count - actual_counts[ident])
    ]
    unexpected = [
        ident
        for ident, count in actual_counts.items()
        for _ in range(count - expected_counts[ident])
    ]
    repeated = sorted(ident for ident, count in actual_counts.items() if count > 1)
    details = []
    if missing:
        details.append("missing " + ", ".join(missing))
    if unexpected:
        details.append("unexpected " + ", ".join(unexpected))
    if repeated:
        details.append("duplicated " + ", ".join(repeated))
    if not details and expected != actual:
        details.append("IDs are out of bridge order")
    return "; ".join(details)
