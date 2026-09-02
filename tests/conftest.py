import os
import sys
import json
import hashlib
import pytest
import types
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "samples"))
from fixture_data import evidence_responses

# Add contracts to sys.path
CONTRACT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "contracts"))
if CONTRACT_DIR not in sys.path:
    sys.path.insert(0, CONTRACT_DIR)

# ==============================================================================
# MOCK GENVM TEST HARNESS
# ==============================================================================

class MockUserError(Exception):
    pass

class MockAddress:
    def __init__(self, addr_str):
        self.addr_str = str(addr_str)
    def as_hex(self):
        return self.addr_str
    def __str__(self):
        return self.addr_str
    def __eq__(self, other):
        return str(self).lower() == str(other).lower()

class MockGlMessage:
    def __init__(self, sender="0x1111111111111111111111111111111111111111", value=0):
        self._sender = MockAddress(sender)
        self.value = value

    @property
    def sender(self):
        return self._sender

    @sender.setter
    def sender(self, val):
        self._sender = MockAddress(val) if not isinstance(val, MockAddress) else val

    @property
    def sender_address(self):
        return self._sender

    @sender_address.setter
    def sender_address(self, val):
        self._sender = MockAddress(val) if not isinstance(val, MockAddress) else val

class MockWebResponse:
    def __init__(self, status=200, body=b"OK"):
        self.status = status
        self.body = body if isinstance(body, bytes) else body.encode("utf-8")

class MockGlNondetWeb:
    responses = {}
    default_response = MockWebResponse(200, b"mock content")

    @classmethod
    def get(cls, url, **kwargs):
        if url in cls.responses:
            return cls.responses[url]
        fixtures = evidence_responses(REPO_NAME, SCOPE_SHA, DELIVERY_SHA, SCOPE_PATH, DELIVERY_PATH,
                    [{"id": "CLAUSE_1", "text": "Implement validation", "material": True},
                     {"id": "CLAUSE_2", "text": "Reject empty input", "material": True}])
        return MockWebResponse(200, fixtures[url]) if url in fixtures else MockWebResponse(404, b"not found")

class MockGlNondet:
    web = MockGlNondetWeb
    custom_llm_json = None

    @classmethod
    def exec_prompt(cls, prompt_str, **kwargs):
        if cls.custom_llm_json is not None:
            if isinstance(cls.custom_llm_json, str):
                return cls.custom_llm_json
            return json.dumps(cls.custom_llm_json)
        return json.dumps({
            "clauses": [
                {"id": "CLAUSE_1", "status": "SATISFIED", "material": True},
                {"id": "CLAUSE_2", "status": "SATISFIED", "material": True}
            ],
            "diagnostic_code": "ALL_TESTS_PASS"
        })

class MockGlEqPrinciple:
    @classmethod
    def strict_eq(cls, fn):
        return fn()

    @classmethod
    def prompt_comparative(cls, fn, principle=""):
        return fn()

class MockGlEvm:
    @classmethod
    def contract_interface(cls, interface_cls):
        class MockExternalRecipient:
            def __init__(self, recipient):
                self.recipient = recipient

            def emit_transfer(self, value=0):
                return MockGl.emit_transfer(self.recipient, value)
        return MockExternalRecipient

class MockGl:
    message = MockGlMessage()
    message_raw = {"timestamp": 1000}
    nondet = MockGlNondet
    eq_principle = MockGlEqPrinciple
    evm = MockGlEvm
    transfers = []

    class vm:
        UserError = MockUserError

    @classmethod
    def emit_transfer(cls, recipient, value):
        cls.transfers.append({"to": str(recipient), "value": int(value)})
        return True

    @classmethod
    def reset(cls):
        cls.message.sender = MockAddress("0x1111111111111111111111111111111111111111")
        cls.message.value = 0
        cls.message_raw["timestamp"] = 1000
        cls.transfers.clear()
        cls.nondet.custom_llm_json = None
        cls.nondet.web.responses.clear()

class MockContract:
    def __new__(cls):
        obj = super().__new__(cls)
        for name, annotation in cls.__annotations__.items():
            if getattr(annotation, "__origin__", None) is dict:
                setattr(obj, name, {})
        return obj

# Dynamic GL proxy
class GlProxy:
    @property
    def message(self):
        return MockGl.message
    @property
    def message_raw(self):
        return MockGl.message_raw
    @property
    def nondet(self):
        return MockGl.nondet
    @property
    def eq_principle(self):
        return MockGl.eq_principle
    @property
    def evm(self):
        return MockGl.evm
    @property
    def vm(self):
        return MockGl.vm
    @property
    def Contract(self):
        return MockContract

def dummy_decorator(fn):
    return fn

class WriteDecorator:
    def __call__(self, fn):
        return fn
    def payable(self, fn):
        return fn

class PublicNamespace:
    def __init__(self):
        self.view = dummy_decorator
        self.write = WriteDecorator()

gl_proxy = GlProxy()
setattr(gl_proxy, "public", PublicNamespace())

# Setup GenLayer Modules
genlayer_module = types.ModuleType("genlayer")
genlayer_module.gl = gl_proxy
genlayer_module.Address = MockAddress
genlayer_module.u256 = lambda x=0: int(x)
genlayer_module.TreeMap = dict
genlayer_module.DynArray = list
genlayer_module.Contract = MockContract

sys.modules["genlayer"] = genlayer_module

# Test constants
CLIENT_ADDR = "0x1111111111111111111111111111111111111111"
WORKER_ADDR = "0x2222222222222222222222222222222222222222"
OTHER_ADDR  = "0x3333333333333333333333333333333333333333"

REPO_NAME = "acme-corp/payment-gateway"
SCOPE_SHA = "1111111111111111111111111111111111111111"
DELIVERY_SHA = "2222222222222222222222222222222222222222"
SCOPE_PATH = "SCOPE.md"
DELIVERY_PATH = "DELIVERY.md"
POLICY_TEXT = "Deliver Stripe webhook integration with signature validation."
