import json

import pytest

from expense_tracker import storage


def test_load_expenses_missing_file_returns_empty(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(storage, "DATA_FILE", "expenses.json")
    assert storage.load_expenses() == []


def test_load_expenses_corrupted_file_raises_storage_error(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(storage, "DATA_FILE", "expenses.json")
    with open("expenses.json", "w") as f:
        f.write("{not valid json")
    with pytest.raises(storage.StorageError):
        storage.load_expenses()


def test_save_and_load_roundtrip(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(storage, "DATA_FILE", "expenses.json")
    from expense_tracker.models import Expense

    storage.save_expenses([Expense("Coffee", 4.5, "food")])
    loaded = storage.load_expenses()
    assert len(loaded) == 1
    assert loaded[0].description == "Coffee"
    with open("expenses.json") as f:
        assert json.load(f)[0]["amount"] == 4.5
