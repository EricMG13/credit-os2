"""CP-1D's add-back key must be carried into both keyed output registers."""

from collections import Counter

LEGACY_KEY = "Not supplied: CP-1 bridge has no Add-Back ID"


def compare(expected, actual):
    """Describe differences between the bridge IDs and a CP-1D register."""
    expected_gaps = expected.count(LEGACY_KEY)
    actual_gaps = actual.count(LEGACY_KEY)
    expected_ids = [ident for ident in expected if ident != LEGACY_KEY]
    actual_ids = [ident for ident in actual if ident != LEGACY_KEY]
    expected_counts = Counter(expected_ids)
    actual_counts = Counter(actual_ids)
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
    if actual_gaps < expected_gaps:
        details.append(f"missing {expected_gaps - actual_gaps} legacy missing-key marker(s)")
    elif actual_gaps > expected_gaps:
        details.append(f"unexpected {actual_gaps - expected_gaps} legacy missing-key marker(s)")
    if missing:
        details.append("missing " + ", ".join(missing))
    if unexpected:
        details.append("unexpected " + ", ".join(unexpected))
    if repeated:
        details.append("duplicated " + ", ".join(repeated))
    if not details and expected != actual:
        details.append("IDs are out of bridge order")
    return "; ".join(details)
