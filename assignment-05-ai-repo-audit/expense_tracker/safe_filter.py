"""A restricted filter-expression evaluator.

Replaces the previous `eval()`-based filter (Task #07, Risk R-01). Only a
narrow grammar is accepted: comparisons of the whitelisted fields
(amount, category, description) against literal numbers/strings, optionally
combined with `and` / `or`. No function calls, attribute access, imports,
or arbitrary names are allowed — the AST is validated before any node is
evaluated.
"""

import ast
import operator

ALLOWED_FIELDS = {"amount", "category", "description"}

_COMPARATORS = {
    ast.Gt: operator.gt,
    ast.Lt: operator.lt,
    ast.GtE: operator.ge,
    ast.LtE: operator.le,
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
}


class UnsafeExpressionError(ValueError):
    """Raised when a filter expression uses a disallowed construct."""


def _check_allowed(node):
    allowed_types = (
        ast.Expression,
        ast.BoolOp,
        ast.And,
        ast.Or,
        ast.Compare,
        ast.Name,
        ast.Load,
        ast.Constant,
    ) + tuple(_COMPARATORS)
    for child in ast.walk(node):
        if not isinstance(child, allowed_types):
            raise UnsafeExpressionError(f"disallowed syntax: {type(child).__name__}")
        if isinstance(child, ast.Name) and child.id not in ALLOWED_FIELDS:
            raise UnsafeExpressionError(f"unknown field: {child.id}")
        if isinstance(child, ast.Compare):
            for op in child.ops:
                if type(op) not in _COMPARATORS:
                    raise UnsafeExpressionError(f"disallowed operator: {type(op).__name__}")


def _eval_node(node, values):
    if isinstance(node, ast.Expression):
        return _eval_node(node.body, values)
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.Name):
        return values[node.id]
    if isinstance(node, ast.BoolOp):
        results = [_eval_node(v, values) for v in node.values]
        return all(results) if isinstance(node.op, ast.And) else any(results)
    if isinstance(node, ast.Compare):
        left = _eval_node(node.left, values)
        for op, comparator in zip(node.ops, node.comparators):
            right = _eval_node(comparator, values)
            if not _COMPARATORS[type(op)](left, right):
                return False
            left = right
        return True
    raise UnsafeExpressionError(f"disallowed syntax: {type(node).__name__}")


def evaluate(expression, values):
    """Evaluate a restricted filter expression against a dict of values.

    Raises UnsafeExpressionError if the expression uses anything outside the
    allowed grammar (comparisons/boolean combinations of whitelisted fields
    against literals).
    """
    tree = ast.parse(expression, mode="eval")
    _check_allowed(tree)
    return bool(_eval_node(tree, values))
