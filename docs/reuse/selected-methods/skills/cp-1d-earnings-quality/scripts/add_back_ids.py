"""CP-1D's add-back key must be carried into both keyed output registers."""

from collections import Counter

GAP_MARKERS = {
    "Not supplied: CP-1 bridge has no Add-Back ID",
    "Not supplied: CP-1 does not state an Add-Back ID for this adjustment",
    "Not supplied: CP-1 bridge amounts do not establish whether add-backs exist",
}


def compare(expected, actual):
    """Describe differences between the bridge IDs and a CP-1D register."""
    expected_markers = Counter(ident for ident in expected if ident in GAP_MARKERS)
    actual_markers = Counter(ident for ident in actual if ident in GAP_MARKERS)
    expected_ids = [ident for ident in expected if ident not in GAP_MARKERS]
    actual_ids = [ident for ident in actual if ident not in GAP_MARKERS]
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
    missing_markers = [
        marker
        for marker, count in expected_markers.items()
        for _ in range(count - actual_markers[marker])
    ]
    unexpected_markers = [
        marker
        for marker, count in actual_markers.items()
        for _ in range(count - expected_markers[marker])
    ]
    if missing_markers:
        details.append("missing " + ", ".join(missing_markers))
    if unexpected_markers:
        details.append("unexpected " + ", ".join(unexpected_markers))
    if missing:
        details.append("missing " + ", ".join(missing))
    if unexpected:
        details.append("unexpected " + ", ".join(unexpected))
    if repeated:
        details.append("duplicated " + ", ".join(repeated))
    if not details and expected != actual:
        details.append("IDs are out of bridge order")
    return "; ".join(details)
