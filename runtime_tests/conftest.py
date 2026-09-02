"""Real gltest Direct Mode; intentionally isolated from tests' fake genlayer."""
import os
import sys
import tempfile
from pathlib import Path
import pytest

_paths = []


@pytest.fixture(autouse=True)
def refresh_transaction_datetime(monkeypatch):
    # gltest 0.29.2 refreshes sender/value but omits datetime on warp().
    # Mirror the VM's transaction time into the SDK message, not contract state.
    from gltest.direct.vm import VMContext
    original = VMContext._refresh_gl_message
    def refresh(vm):
        original(vm)
        module = sys.modules.get("genlayer.gl")
        if module is not None and hasattr(module, "message_raw"):
            module.message_raw["datetime"] = vm._datetime
    monkeypatch.setattr(VMContext, "_refresh_gl_message", refresh)


def _inject(vm):
    from genlayer.py import calldata
    from genlayer.py.types import Address
    def address(value):
        return Address(value) if isinstance(value, bytes) else value
    message = {
        "contract_address": address(vm._contract_address),
        "sender_address": address(vm.sender), "origin_address": address(vm.origin),
        "stack": [], "value": vm._value, "datetime": vm._datetime,
        "is_init": False, "chain_id": vm._chain_id, "entry_kind": 0,
        "entry_data": b"", "entry_stage_data": None,
    }
    fd, path = tempfile.mkstemp(prefix="msdr-direct-")
    _paths.append(Path(path))
    os.write(fd, calldata.encode(message))
    os.lseek(fd, 0, os.SEEK_SET)
    vm._original_stdin_fd = os.dup(0)
    os.dup2(fd, 0)
    os.close(fd)


def pytest_configure():
    if sys.platform == "win32":
        from gltest.direct import loader
        loader._inject_message_to_fd0 = _inject


def pytest_sessionfinish():
    for path in _paths:
        try:
            path.unlink(missing_ok=True)
        except PermissionError:
            pass
