"""Expense data model."""

VALID_CATEGORIES = ["food", "transport", "housing", "entertainment", "other"]


class Expense:
    def __init__(self, description, amount, category):
        if amount <= 0:
            raise ValueError(f"amount must be positive, got {amount!r}")
        if category not in VALID_CATEGORIES:
            raise ValueError(f"invalid category {category!r}, expected one of {VALID_CATEGORIES}")
        self.description = description
        self.amount = amount
        self.category = category

    def to_dict(self):
        return {
            "description": self.description,
            "amount": self.amount,
            "category": self.category,
        }

    @staticmethod
    def from_dict(data):
        return Expense(data["description"], data["amount"], data["category"])
