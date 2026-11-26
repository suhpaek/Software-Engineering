# AGENTS.md — Operating Instructions for Coding Agents

## Purpose

This repository is a small, single-user command-line expense tracker written
in Python 3. It lets a user add expenses, list them, total them, and filter
them, persisting data to a local JSON file (`expenses.json`). It exists as a
teaching/demo project for agent-readiness auditing — it is intentionally
small and contains no real or sensitive data.

## Architecture

```
expense_tracker/
  __init__.py      package marker
  models.py        Expense data model (to_dict/from_dict)
  storage.py       JSON load/save for the expense list (expenses.json)
  cli.py           argparse-based CLI: add, list, total, filter
tests/
  test_models.py   unit tests for the Expense model
```

Entry point: `python -m expense_tracker.cli <command> ...`
(there is no separate `main.py`; the module is also runnable directly).

Data flow: CLI command → `storage.load_expenses()` → in-memory list of
`Expense` objects → mutate/read → `storage.save_expenses()` writes JSON back.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt   # see Task #07 mitigation: pins test/lint tools
```

No external runtime dependencies are required to run the CLI itself
(standard library only). `requirements.txt` pins only development tooling
(pytest, flake8, bandit).

## Safe commands (agents may run these without asking)

- `python -m pytest -q`
- `python -m flake8 expense_tracker --max-line-length=100`
- `python -m bandit -r expense_tracker`
- `python -m py_compile expense_tracker/*.py`
- `git status`, `git diff`, `git log`

## Coding conventions

- Python 3, stdlib only for runtime code; keep functions small and in one
  module per concern (model / storage / CLI).
- Public functions get a one-line docstring describing *why*, not *what*,
  when the reason isn't obvious from the name.
- New CLI output formats go through the `FORMATTERS` dispatch table in
  `cli.py`, not a new `if/elif` chain (see Task #03 refactor rationale).
- Never use `eval`/`exec` on user-supplied input. Any new "filter"-style
  feature must use an explicit, restricted parser (see `safe_filter.py`).

## Test expectations

- Every change must keep `python -m pytest -q` green.
- Any change to `storage.py` or `cli.py` must add at least one new test
  covering the changed behavior (happy path + one failure/edge case).
- Run `flake8` and `bandit` before proposing a change is complete; report
  their exact output, do not summarize it away.

## Forbidden actions (agents must not do these without explicit human approval)

- Do not commit secrets, API keys, tokens, or real personal/financial data.
  This repo must only ever contain synthetic example data.
- Do not deploy anywhere, publish a package, or push tags/releases.
- Do not run destructive commands (`rm -rf`, `git reset --hard`,
  `git push --force`, deleting `expenses.json` for a real user) outside of
  this repo's own disposable test fixtures.
- Do not add or upgrade a dependency without listing it in
  `requirements.txt` with a pinned version and stating why it's needed.
- Do not re-introduce `eval`/`exec` on untrusted input, even "temporarily."
- Do not mark a risk finding as mitigated without pasting the command
  output that proves it.

## Review gates

- Any AI-proposed diff must be reviewed by a human before merge; the human
  must re-run the test suite locally (or in CI once configured) before
  accepting.
- Findings from a "read-only" review pass (Task #04) must not be silently
  acted on — they go through the risk register (Task #05) first.

## Disclosure

If an agent/tool does not automatically load this file, its relevant
instructions (Architecture, Safe commands, Coding conventions, Forbidden
actions) must be pasted explicitly into the agent's context, and this must
be disclosed in the AI-use record for the session.
