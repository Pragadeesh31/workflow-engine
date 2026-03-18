from __future__ import annotations

import re
from collections import defaultdict
from typing import Any, Dict, List, Optional, Tuple

from app.models.rule import Rule


class RuleEngine:

    @staticmethod
    def evaluate_rules(
        rules: List[Rule],
        data: Dict[str, Any],
    ) -> Tuple[Optional[str], List[Dict], bool]:
        """
        Evaluate rules in priority order (lowest number first).

        Returns:
            (next_step_id, evaluations_list, had_error)
        """
        evaluations: List[Dict] = []
        had_error = False

        sorted_rules = sorted(rules, key=lambda r: r.priority if r.priority is not None else 999)

        for rule in sorted_rules:
            condition = (rule.condition or "").strip()

            if condition.upper() == "DEFAULT":
                evaluations.append(
                    {"rule_id": rule.id, "condition": condition, "matched": True, "default": True}
                )
                return rule.next_step_id, evaluations, had_error

            try:
                matched = RuleEngine._evaluate_condition(condition, data)
                evaluations.append({"rule_id": rule.id, "condition": condition, "matched": matched})
                if matched:
                    return rule.next_step_id, evaluations, had_error
            except Exception as exc:
                had_error = True
                evaluations.append(
                    {"rule_id": rule.id, "condition": condition, "matched": False, "error": str(exc)}
                )

        return None, evaluations, had_error

    # ── String helper functions ──────────────────────────────────────────────

    @staticmethod
    def _contains(field_value: Any, substring: str) -> bool:
        return substring in str(field_value)

    @staticmethod
    def _starts_with(field_value: Any, prefix: str) -> bool:
        return str(field_value).startswith(prefix)

    @staticmethod
    def _ends_with(field_value: Any, suffix: str) -> bool:
        return str(field_value).endswith(suffix)

    @staticmethod
    def _build_eval_context(data: Dict[str, Any]) -> Dict[str, Any]:
        ctx = dict(data)
        ctx["contains"]    = RuleEngine._contains
        ctx["startsWith"]  = RuleEngine._starts_with
        ctx["endsWith"]    = RuleEngine._ends_with
        return ctx

    @staticmethod
    def _evaluate_condition(condition: str, data: Dict[str, Any]) -> bool:
        """
        Evaluate a JS-style condition string against the data dict.

        Supported:
          Comparison:  ==  !=  <  >  <=  >=
          Logical:     && (and)   || (or)
          String fns:  contains(field, "val")
                       startsWith(field, "prefix")
                       endsWith(field, "suffix")
        """
        expr = condition.replace("&&", " and ").replace("||", " or ")
        expr = re.sub(r"(?<![=!<>])=(?!=)", "==", expr)
        ctx = RuleEngine._build_eval_context(data)
        try:
            return bool(eval(expr, {"__builtins__": {}}, ctx))  # noqa: S307
        except Exception as exc:
            raise ValueError(f"Failed to evaluate '{condition}': {exc}") from exc

    @staticmethod
    def validate_condition(condition: str) -> Optional[str]:
        """
        Lightweight syntax check. Returns an error string or None if valid.
        """
        if not condition or not condition.strip():
            return "Condition cannot be empty."
        if condition.strip().upper() == "DEFAULT":
            return None

        expr = condition.replace("&&", " and ").replace("||", " or ")
        expr = re.sub(r"(?<![=!<>])=(?!=)", "==", expr)

        class _DefaultNS(dict):
            def __missing__(self, key):
                return ""

        ctx = _DefaultNS()
        ctx["contains"]   = RuleEngine._contains
        ctx["startsWith"] = RuleEngine._starts_with
        ctx["endsWith"]   = RuleEngine._ends_with

        try:
            eval(expr, {"__builtins__": {}}, ctx)  # noqa: S307
            return None
        except SyntaxError as exc:
            return f"Syntax error: {exc}"
        except Exception:
            return None  # runtime errors are fine at validate time
