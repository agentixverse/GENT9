#!/usr/bin/env python3
"""
backtest_wrapper.py - Thin wrapper for TypeScript/pythonia integration

This is the interface between TypeScript and Python backtesting logic.
TypeScript calls these functions via pythonia.

Keep this file THIN - it just delegates to runner and validator.
"""

from typing import Dict, List, Any
import backtest_runner
import backtest_validator


def run_backtest(strategy_code: str, config: Dict[str, Any], ohlcv_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Execute a backtest with user strategy code

    This is the main entry point called from TypeScript via pythonia.

    Args:
        strategy_code: User's Python strategy class code
        config: Configuration dict with initialCapital, commission, startDate, endDate
        ohlcv_data: List of OHLCV candles with timestamp, open, high, low, close

    Returns:
        Dict with html_report and metrics on success
        Dict with error on failure

    Example:
        result = run_backtest(
            strategy_code="class MyStrategy(Strategy): ...",
            config={"initialCapital": 10000, "commission": 0.002, ...},
            ohlcv_data=[{"timestamp": 1577836800, "open": 9344.54, ...}, ...]
        )
    """
    try:
        # Delegate to runner
        return backtest_runner.execute_backtest(strategy_code, config, ohlcv_data)
    except Exception as e:
        # Return error dict instead of throwing
        return {
            "error": str(e),
            "html_report": None,
            "metrics": None
        }


def validate_strategy(strategy_code: str) -> Dict[str, Any]:
    """
    Validate strategy code for security and correctness

    This can be called before run_backtest for fast validation.

    Args:
        strategy_code: User's Python strategy class code

    Returns:
        Dict with 'valid' (bool), 'errors' (List[str]), 'warnings' (List[str])

    Example:
        validation = validate_strategy("class MyStrategy(Strategy): ...")
        if validation["valid"]:
            # proceed with backtest
        else:
            # show errors to user
    """
    return backtest_validator.validate_strategy_code(strategy_code)


def get_security_info() -> Dict[str, List[str]]:
    """
    Get security information about allowed/blocked imports and functions

    Useful for showing in UI to help users write valid strategies

    Returns:
        Dict with allowed_imports, blocked_imports, blocked_functions, sandbox
    """
    return backtest_validator.get_security_info()


# Export these functions for pythonia
__all__ = ['run_backtest', 'validate_strategy', 'get_security_info']
