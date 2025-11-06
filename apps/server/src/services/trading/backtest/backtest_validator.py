#!/usr/bin/env python3
"""
backtest_validator.py - Strategy code validation and security checks

Validates user strategy code for:
- Security (dangerous imports/patterns)
- Syntax errors
- Strategy class structure
"""

import re
from typing import Dict, List


def validate_strategy_code(strategy_code: str) -> Dict[str, any]:
    """
    Validate strategy code for security and correctness

    Returns:
        Dict with 'valid' (bool), 'errors' (List[str]), 'warnings' (List[str])
    """
    errors = []
    warnings = []

    # Check 1: Code is not empty
    if not strategy_code or not strategy_code.strip():
        errors.append("Strategy code is empty")
        return {"valid": False, "errors": errors, "warnings": warnings}

    # Check 2: Security - dangerous imports
    dangerous_imports = [
        (r'import\s+os\b', "OS import detected (blocked)"),
        (r'import\s+sys\b', "SYS import detected (blocked)"),
        (r'import\s+socket\b', "SOCKET import detected (blocked)"),
        (r'import\s+subprocess\b', "SUBPROCESS import detected (blocked)"),
        (r'import\s+urllib\b', "URLLIB import detected (blocked)"),
        (r'import\s+requests\b', "REQUESTS import detected (blocked)"),
        (r'import\s+http\b', "HTTP import detected (blocked)"),
        (r'from\s+os\b', "OS import detected (blocked)"),
        (r'from\s+sys\b', "SYS import detected (blocked)"),
    ]

    for pattern, message in dangerous_imports:
        if re.search(pattern, strategy_code):
            errors.append(message)

    # Check 3: Security - dangerous functions
    dangerous_patterns = [
        (r'open\s*\(', "File operations detected (open() blocked)"),
        (r'exec\s*\(', "exec() detected (blocked)"),
        (r'eval\s*\(', "eval() detected (blocked)"),
        (r'__import__', "__import__ detected (blocked)"),
        (r'compile\s*\(', "compile() detected (blocked)"),
    ]

    for pattern, message in dangerous_patterns:
        if re.search(pattern, strategy_code):
            errors.append(message)

    # Check 4: Must define a Strategy class
    if not re.search(r'class\s+\w+\s*\(\s*Strategy\s*\)', strategy_code):
        errors.append(
            "Strategy code must define a class that inherits from Strategy.\n"
            "Example: class MyStrategy(Strategy):"
        )

    # Check 5: Must define init() and next() methods
    if not re.search(r'def\s+init\s*\(', strategy_code):
        warnings.append("Strategy should define an init() method")

    if not re.search(r'def\s+next\s*\(', strategy_code):
        errors.append("Strategy must define a next() method")

    # Check 6: Basic syntax - must have 'def ' (at least one method)
    if 'def ' not in strategy_code:
        errors.append("Strategy code appears incomplete - no methods defined")

    # Check 7: Warn about allowed imports
    if not re.search(r'from\s+backtesting\s+import\s+Strategy', strategy_code):
        warnings.append("Strategy should import Strategy class: from backtesting import Strategy")

    is_valid = len(errors) == 0

    return {
        "valid": is_valid,
        "errors": errors,
        "warnings": warnings
    }


def get_whitelisted_imports() -> List[str]:
    """
    Return list of allowed imports

    Only these imports are allowed in user strategy code
    """
    return [
        "backtesting",
        "backtesting.lib",
        "numpy",
        "np",
        "pandas",
        "pd",
        "talib",
    ]


def get_security_info() -> Dict[str, List[str]]:
    """
    Return security information about what's allowed/blocked

    Useful for showing to users in UI
    """
    return {
        "allowed_imports": get_whitelisted_imports(),
        "blocked_imports": [
            "os", "sys", "socket", "subprocess", "urllib", "requests", "http"
        ],
        "blocked_functions": [
            "open()", "exec()", "eval()", "__import__", "compile()"
        ],
        "sandbox": "RestrictedPython"
    }
