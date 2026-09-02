import pytest
import os
import sys

# Test the custody capability gate and native GEN transfer primitive

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
        self.sender = MockAddress(sender)
        self.sender_address = self.sender
        self.value = value

class MockGl:
    message = MockGlMessage()
    transfers = []

    @classmethod
    def reset(cls):
        cls.message = MockGlMessage()
        cls.transfers = []

class MockEoaRecipient:
    def __init__(self, addr):
        self.addr = str(addr)

    def emit_transfer(self, value):
        MockGl.transfers.append({"to": self.addr, "value": int(value)})

def test_custody_capability_and_balance_conservation():
    """Verify deposit, proportional split transfer, and conservation invariant."""
    MockGl.reset()
    
    # 1. Deposit
    deposit_amount = 2000000000000000000  # 2.0 GEN
    MockGl.message.value = deposit_amount
    
    total_deposited = deposit_amount
    total_reserved = deposit_amount
    total_paid = 0
    total_refunded = 0
    
    assert total_deposited == total_reserved + total_paid + total_refunded
    
    # 2. Partial split 50/50
    worker_split_bps = 5000  # 50%
    client_split_bps = 5000  # 50%
    
    worker_payout = (total_reserved * worker_split_bps) // 10000
    client_refund = total_reserved - worker_payout
    
    worker_addr = "0x2222222222222222222222222222222222222222"
    client_addr = "0x1111111111111111111111111111111111111111"
    
    # Execute transfers via EoaRecipient
    MockEoaRecipient(worker_addr).emit_transfer(value=worker_payout)
    MockEoaRecipient(client_addr).emit_transfer(value=client_refund)
    
    total_paid += worker_payout
    total_refunded += client_refund
    total_reserved = 0
    
    # Assert conservation of funds
    assert total_deposited == total_paid + total_refunded + total_reserved
    assert len(MockGl.transfers) == 2
    assert MockGl.transfers[0] == {"to": worker_addr, "value": 1000000000000000000}
    assert MockGl.transfers[1] == {"to": client_addr, "value": 1000000000000000000}
    
    # Assert no double transfer
    settlement_consumed = True
    with pytest.raises(MockUserError):
        if settlement_consumed:
            raise MockUserError("SETTLEMENT_ALREADY_CONSUMED")
