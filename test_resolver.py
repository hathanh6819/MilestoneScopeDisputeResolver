from resolver import resolve_milestone_dispute


def test_exact_normalized_match_is_satisfied():
    assert resolve_milestone_dispute("Ship audit report", "  ship   AUDIT report ") == "SATISFIED"


def test_different_delivery_is_unsatisfied():
    assert resolve_milestone_dispute("Ship audit report", "Ship draft report") == "UNSATISFIED"
