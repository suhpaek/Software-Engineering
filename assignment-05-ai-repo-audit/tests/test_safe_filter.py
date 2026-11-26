import pytest

from expense_tracker.safe_filter import UnsafeExpressionError, evaluate

VALUES = {"amount": 50.0, "category": "food", "description": "Groceries"}


def test_simple_comparison():
    assert evaluate("amount > 10", VALUES) is True
    assert evaluate("amount > 100", VALUES) is False


def test_string_equality():
    assert evaluate("category == 'food'", VALUES) is True
    assert evaluate("category == 'transport'", VALUES) is False


def test_boolean_combination():
    assert evaluate("amount > 10 and category == 'food'", VALUES) is True


def test_rejects_function_calls():
    with pytest.raises(UnsafeExpressionError):
        evaluate("__import__('os').system('echo pwned')", VALUES)


def test_rejects_unknown_field():
    with pytest.raises(UnsafeExpressionError):
        evaluate("unknown_field > 1", VALUES)
