#!/usr/bin/env python3
"""
backtest_runner.py - Core backtesting execution logic

Executes user strategy code with backtesting.py library
Receives data as function parameters (called from TypeScript via pythonia)
Returns results as dict (metrics + HTML report)
"""

import json
import pandas as pd
import logging
from typing import Dict, List, Any
from io import StringIO

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def execute_backtest(strategy_code: str, config: Dict[str, Any], ohlcv_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Execute a backtest with user strategy code

    Args:
        strategy_code: User's Python strategy class code
        config: Configuration dict with initialCapital, commission, startDate, endDate
        ohlcv_data: List of OHLCV candles with timestamp, open, high, low, close

    Returns:
        Dict with html_report and metrics
    """
    try:
        logger.info("Starting backtest execution")

        # Step 1: Validate config
        validate_config(config)

        # Step 2: Convert OHLCV data to DataFrame
        logger.info("Converting OHLCV data to DataFrame")
        df = convert_to_dataframe(ohlcv_data)

        # Step 3: Execute user strategy code and get Strategy class
        logger.info("Executing user strategy code")
        strategy_class = execute_user_code(strategy_code)

        # Step 4: Create Backtest instance
        logger.info("Creating Backtest instance")
        from backtesting import Backtest

        bt = Backtest(
            df,
            strategy_class,
            cash=config['initialCapital'],
            commission=config['commission']
        )

        # Step 5: Run backtest
        logger.info("Running backtest")
        stats = bt.run()

        # Step 6: Generate HTML report
        logger.info("Generating HTML report")
        html_report = bt.plot(_return_fig=True, show_legend=True, agg_func='D')
        html_str = html_report.to_html(include_plotlyjs='cdn', config={'responsive': True})

        # Step 7: Extract metrics
        logger.info("Extracting metrics")
        metrics = extract_metrics(stats)

        # Step 8: Return results
        result = {
            "html_report": html_str,
            "metrics": metrics
        }

        logger.info("Backtest completed successfully")
        return result

    except Exception as e:
        logger.error(f"Backtest execution failed: {e}")
        raise


def validate_config(config: Dict[str, Any]) -> None:
    """Validate that config has all required fields"""
    required_fields = ['initialCapital', 'commission', 'startDate', 'endDate']
    for field in required_fields:
        if field not in config:
            raise ValueError(f"Missing required config field: {field}")


def convert_to_dataframe(ohlcv_data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert OHLCV data to pandas DataFrame in backtesting.py format

    backtesting.py expects:
    - Columns: Open, High, Low, Close, Volume (optional)
    - DatetimeIndex
    """
    try:
        if not isinstance(ohlcv_data, list) or len(ohlcv_data) == 0:
            raise ValueError("ohlcv_data must be a non-empty list of candles")

        # Convert to DataFrame
        data = []
        for candle in ohlcv_data:
            data.append({
                'Open': candle['open'],
                'High': candle['high'],
                'Low': candle['low'],
                'Close': candle['close'],
                'Volume': candle.get('volume', 0)
            })

        df = pd.DataFrame(data)

        # Create datetime index from timestamps
        timestamps = [pd.Timestamp(c['timestamp'] * 1000, unit='ms') for c in ohlcv_data]
        df.index = pd.DatetimeIndex(timestamps)

        logger.info(f"DataFrame created with {len(df)} rows")
        logger.info(f"Date range: {df.index[0]} to {df.index[-1]}")

        return df

    except (KeyError, TypeError, ValueError) as e:
        raise ValueError(f"Failed to convert OHLCV data to DataFrame: {e}")


def execute_user_code(strategy_code: str) -> type:
    """
    Execute user strategy code in a sandboxed environment

    Security implemented via RestrictedPython:
    - Compile code in restricted mode
    - Only allow whitelisted imports
    - Remove dangerous builtins

    Returns the Strategy class
    """
    try:
        from RestrictedPython import compile_restricted_exec
        from RestrictedPython.Guards import safe_builtins, guarded_inplacebinary_op
    except ImportError:
        raise ImportError("RestrictedPython not installed. Run: pip install RestrictedPython")

    try:
        # Compile user code with RestrictedPython
        byte_code = compile_restricted_exec(strategy_code)

        if byte_code.errors:
            error_msg = "Code compilation errors:\n" + "\n".join(str(e) for e in byte_code.errors)
            raise SyntaxError(error_msg)

        # Create restricted execution environment
        safe_globals = {
            "__builtins__": safe_builtins,
            "__name__": "__main__",
            "__metaclass__": type,
            "_print_": lambda x: None,  # Disable print
            "_getattr_": getattr,
            "_write_": lambda x: None,  # Disable writes
            "_inplacebinary_": guarded_inplacebinary_op,
        }

        # Add whitelisted imports
        try:
            from backtesting import Strategy
            from backtesting.lib import crossover
            import numpy as np
            import pandas as pd
            import talib

            safe_globals.update({
                'Strategy': Strategy,
                'crossover': crossover,
                'numpy': np,
                'np': np,
                'pandas': pd,
                'pd': pd,
                'talib': talib,
            })
        except ImportError as e:
            raise ImportError(f"Failed to import backtesting dependencies: {e}")

        # Execute the code
        exec(byte_code.code, safe_globals)

        # Extract Strategy class
        strategy_class = None
        for name, obj in safe_globals.items():
            if isinstance(obj, type) and name != 'Strategy':
                # Check if it's a Strategy subclass
                from backtesting import Strategy as BaseStrategy
                try:
                    if issubclass(obj, BaseStrategy) and obj is not BaseStrategy:
                        strategy_class = obj
                        break
                except TypeError:
                    continue

        if strategy_class is None:
            raise ValueError("No Strategy class found in user code. Must define a class that inherits from Strategy.")

        logger.info(f"User strategy class '{strategy_class.__name__}' loaded successfully")
        return strategy_class

    except SyntaxError as e:
        raise SyntaxError(f"Strategy code syntax error: {e}")
    except Exception as e:
        logger.error(f"Error executing strategy code: {e}")
        raise


def extract_metrics(stats) -> Dict[str, float]:
    """Extract key metrics from backtesting.py results"""
    try:
        metrics = {
            "total_return": float(stats.get('Return [%]', 0)),
            "sharpe_ratio": float(stats.get('Sharpe Ratio', 0)),
            "max_drawdown": float(stats.get('Max. Drawdown [%]', 0)),
            "win_rate": float(stats.get('Win Rate [%]', 0)),
            "total_trades": int(stats.get('# Trades', 0)),
            "profit_factor": float(stats.get('Profit Factor', 0)),
            "best_day": float(stats.get('Best Day [%]', 0)),
            "worst_day": float(stats.get('Worst Day [%]', 0)),
            "avg_trade": float(stats.get('Avg. Trade [%]', 0)),
        }

        logger.info(f"Extracted metrics: {json.dumps(metrics, indent=2)}")
        return metrics

    except (KeyError, ValueError, TypeError) as e:
        logger.warning(f"Failed to extract some metrics: {e}")
        # Return basic metrics even if extraction is incomplete
        return {
            "total_return": float(stats.get('Return [%]', 0)),
            "sharpe_ratio": float(stats.get('Sharpe Ratio', 0)),
            "max_drawdown": float(stats.get('Max. Drawdown [%]', 0)),
            "win_rate": float(stats.get('Win Rate [%]', 0)),
            "total_trades": int(stats.get('# Trades', 0)),
        }
