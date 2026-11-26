# Expense Tracker

A small single-user command-line expense tracker. Expenses are stored in
`expenses.json` in the current directory.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Usage

```bash
python -m expense_tracker.cli add "Coffee" 4.5 food
python -m expense_tracker.cli list --format table   # table | json | csv
python -m expense_tracker.cli total --format table
python -m expense_tracker.cli filter "amount > 10 and category == 'food'"
```

Valid categories: `food`, `transport`, `housing`, `entertainment`, `other`.
Amounts must be positive numbers.

The `filter` command accepts a restricted expression grammar (comparisons
on `amount` / `category` / `description`, combined with `and`/`or`) — see
`expense_tracker/safe_filter.py`. It does not execute arbitrary Python.

## Development

```bash
python -m pytest -q
python -m flake8 expense_tracker --max-line-length=100
python -m bandit -r expense_tracker
```

See `AGENTS.md` for agent operating instructions and `REPORT.md` for the
full repository audit, risk register, and release decision.
