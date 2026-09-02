"""Synthetic GitHub boundary responses for local tests ONLY; never runtime fallbacks."""
import hashlib
import json


def evidence_responses(repo, base, head, scope_path, notes_path, clauses, added=None):
    scope = json.dumps({"clauses": clauses}, sort_keys=True)
    later = json.dumps({"clauses": clauses + (added or [])}, sort_keys=True)
    before = {scope_path: scope, "implementation.py": "def valid(x):\n    return False\n"}
    after = {scope_path: later, notes_path: "Implemented the milestone; inspect code, not this claim.",
             "implementation.py": "def valid(x):\n    return isinstance(x, str) and len(x) > 0\n"}
    api = f"https://api.github.com/repos/{repo}"
    out = {}
    for sha, tree_sha, files in [(base, "a" * 40, before), (head, "b" * 40, after)]:
        out[f"{api}/git/commits/{sha}"] = json.dumps({"sha": sha, "tree": {"sha": tree_sha}})
        entries = []
        for path, text in files.items():
            body = text.encode()
            blob = hashlib.sha1(b"blob " + str(len(body)).encode() + b"\0" + body).hexdigest()
            entries.append({"path": path, "mode": "100644", "type": "blob", "size": len(body), "sha": blob})
            out[f"https://raw.githubusercontent.com/{repo}/{sha}/{path}"] = text
        out[f"{api}/git/trees/{tree_sha}?recursive=1"] = json.dumps({"sha": tree_sha, "truncated": False, "tree": entries})
    out[f"{api}/compare/{base}...{head}"] = json.dumps({"status": "ahead", "base_commit": {"sha": base}, "merge_base_commit": {"sha": base}, "total_commits": 1, "commits": [{"sha": head}]})
    out[f"{api}/pulls/42"] = json.dumps({"number": 42, "merged": True, "merge_commit_sha": head, "base": {"repo": {"full_name": repo}}})
    return out
