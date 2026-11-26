"""JSON-backed storage for expenses."""

import json
import os

from .models import Expense

DATA_FILE = "expenses.json"


class StorageError(Exception):
    """Raised when expenses.json cannot be read as a valid expense list."""


def load_expenses():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as exc:
            raise StorageError(f"{DATA_FILE} is not valid JSON: {exc}") from exc
    return [Expense.from_dict(d) for d in data]


def save_expenses(expenses):
    with open(DATA_FILE, "w") as f:
        json.dump([e.to_dict() for e in expenses], f, indent=2)
