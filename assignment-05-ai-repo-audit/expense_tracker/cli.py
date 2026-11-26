"""Command-line interface for the expense tracker."""

import argparse
import json
import sys

from .models import Expense
from .safe_filter import UnsafeExpressionError, evaluate
from .storage import StorageError, load_expenses, save_expenses


def _load_expenses_or_exit():
    try:
        return load_expenses()
    except StorageError as exc:
        print(f"Error: {exc}")
        sys.exit(1)


def cmd_add(args):
    try:
        expense = Expense(args.description, args.amount, args.category)
    except ValueError as exc:
        print(f"Rejected: {exc}")
        sys.exit(1)
    expenses = _load_expenses_or_exit()
    expenses.append(expense)
    save_expenses(expenses)
    print(f"Added: {args.description} ({args.amount}) [{args.category}]")


def _render_list_table(expenses):
    print(f"{'Description':<20}{'Amount':>10}{'Category':>15}")
    for e in expenses:
        print(f"{e.description:<20}{e.amount:>10}{e.category:>15}")


def _render_list_json(expenses):
    print(json.dumps([e.to_dict() for e in expenses], indent=2))


def _render_list_csv(expenses):
    print("description,amount,category")
    for e in expenses:
        print(f"{e.description},{e.amount},{e.category}")


def _render_total_table(total):
    print(f"Total: {total}")


def _render_total_json(total):
    print(json.dumps({"total": total}, indent=2))


def _render_total_csv(total):
    print("total")
    print(total)


# Output-format strategies. Each command has its own dict of
# {format_name: render_function}; adding a new format for `list` or `total`
# means adding one entry here, not another if/elif branch. See AGENTS.md
# ("New CLI output formats go through the FORMATTERS dispatch table").
LIST_FORMATTERS = {
    "table": _render_list_table,
    "json": _render_list_json,
    "csv": _render_list_csv,
}

TOTAL_FORMATTERS = {
    "table": _render_total_table,
    "json": _render_total_json,
    "csv": _render_total_csv,
}


def cmd_list(args):
    expenses = _load_expenses_or_exit()
    renderer = LIST_FORMATTERS.get(args.format)
    if renderer is None:
        print(f"Unknown format: {args.format}")
        return
    renderer(expenses)


def cmd_total(args):
    expenses = _load_expenses_or_exit()
    total = sum(e.amount for e in expenses)
    renderer = TOTAL_FORMATTERS.get(args.format)
    if renderer is None:
        print(f"Unknown format: {args.format}")
        return
    renderer(total)


def cmd_filter(args):
    expenses = _load_expenses_or_exit()
    try:
        matched = [
            e
            for e in expenses
            if evaluate(
                args.expression,
                {"amount": e.amount, "category": e.category, "description": e.description},
            )
        ]
    except UnsafeExpressionError as exc:
        print(f"Rejected filter expression: {exc}")
        sys.exit(1)
    for e in matched:
        print(f"{e.description}: {e.amount} [{e.category}]")


def build_parser():
    parser = argparse.ArgumentParser(prog="expense-tracker")
    sub = parser.add_subparsers(dest="command")

    p_add = sub.add_parser("add")
    p_add.add_argument("description")
    p_add.add_argument("amount", type=float)
    p_add.add_argument("category")
    p_add.set_defaults(func=cmd_add)

    p_list = sub.add_parser("list")
    p_list.add_argument("--format", default="table")
    p_list.set_defaults(func=cmd_list)

    p_total = sub.add_parser("total")
    p_total.add_argument("--format", default="table")
    p_total.set_defaults(func=cmd_total)

    p_filter = sub.add_parser("filter")
    p_filter.add_argument("expression")
    p_filter.set_defaults(func=cmd_filter)

    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    if not hasattr(args, "func"):
        parser.print_help()
        return
    args.func(args)


if __name__ == "__main__":
    main()
