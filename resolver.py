"""Minimal deterministic implementation for the canonical lifecycle test."""


def _normalize(value: str) -> str:
    if not isinstance(value, str):
        raise TypeError("milestone values must be strings")
    return " ".join(value.strip().lower().split())


def resolve_milestone_dispute(scope_item: str, delivered_item: str) -> str:
    """Compare a delivery against its frozen scope without hidden fallbacks."""
    frozen = _normalize(scope_item)
    delivered = _normalize(delivered_item)
    return "SATISFIED" if delivered == frozen else "UNSATISFIED"
