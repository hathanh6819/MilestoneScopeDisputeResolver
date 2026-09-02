import ast
import os
import pytest

CONTRACT_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "contracts", "milestone_scope_dispute_resolver.py")
)

def test_contract_exists():
    assert os.path.exists(CONTRACT_PATH), f"Contract file not found at {CONTRACT_PATH}"

def test_contract_is_pure_ascii():
    with open(CONTRACT_PATH, "rb") as f:
        content = f.read()
    content.decode("ascii")

def test_contract_headers():
    with open(CONTRACT_PATH, "r", encoding="utf-8") as f:
        lines = [f.readline().strip() for _ in range(3)]
    
    assert lines[0] == "# v0.2.16", f"Line 1 must be '# v0.2.16', got: '{lines[0]}'"
    assert lines[1] == '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'
    assert lines[2] == "from genlayer import *", f"Line 3 must be 'from genlayer import *', got: '{lines[2]}'"

def test_contract_syntax_and_ast():
    with open(CONTRACT_PATH, "r", encoding="utf-8") as f:
        code = f.read()
    parsed = ast.parse(code)
    
    class_defs = [node for node in parsed.body if isinstance(node, ast.ClassDef)]
    class_names = [c.name for c in class_defs]
    assert "MilestoneScopeDisputeResolver" in class_names, "Named contract class is required for schema discovery"
