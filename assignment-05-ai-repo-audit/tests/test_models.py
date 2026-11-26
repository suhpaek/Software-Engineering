import pytest

from expense_tracker.models import Expense


def test_to_dict_roundtrip():
    e = Expense("Coffee", 4.5, "food")
    d = e.to_dict()
    assert d == {"description": "Coffee", "amount": 4.5, "category": "food"}


def test_from_dict():
    d = {"description": "Bus", "amount": 2.0, "category": "transport"}
    e = Expense.from_dict(d)
    assert e.description == "Bus"
    assert e.amount == 2.0
    assert e.category == "transport"


def test_rejects_non_positive_amount():
    with pytest.raises(ValueError):
        Expense("Refund", -50, "food")
    with pytest.raises(ValueError):
        Expense("Free sample", 0, "food")


def test_rejects_invalid_category():
    with pytest.raises(ValueError):
        Expense("Mystery", 10, "not-a-real-category")
