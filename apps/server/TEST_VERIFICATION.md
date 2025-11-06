# Test Verification: Old vs New

## Virtual Environment Structure

```
venv/
├── bin/                    # Executables
│   ├── python -> python3.13
│   ├── pip
│   ├── activate          # Source this to manually activate
│   └── ...
├── lib/                    # Python packages installed here
│   └── python3.13/site-packages/
│       ├── backtesting/
│       ├── pandas/
│       ├── numpy/
│       ├── RestrictedPython/
│       └── ...
├── include/                # C headers for compiled packages
└── pyvenv.cfg             # Venv configuration
```

## Installed Packages

✅ **Backtesting** 0.3.3 - Main backtesting library
✅ **Pandas** 2.3.3 - Data manipulation
✅ **Numpy** 2.3.4 - Numerical computing
✅ **RestrictedPython** 8.1 - Security sandboxing
✅ **Bokeh** 3.8.0 - For HTML report generation

## How It Works

### 1. Auto-Creation (on server startup)

```typescript
// server.ts
app.listen(BACKEND_PORT, async () => {
  await ensurePythonEnv(); // <-- Creates venv if needed
  // ...
});
```

### 2. ensurePythonEnv() Logic

```typescript
// src/infrastructure/python/python-env.ts
async function ensurePythonEnv() {
  // Check if venv exists
  if (!fs.existsSync("venv/")) {
    // Create venv
    spawnSync("python3", ["-m", "venv", "venv"]);

    // Install requirements.txt
    spawnSync("venv/bin/pip", ["install", "-r", "requirements.txt"]);
  }

  // Check if packages installed
  const check = spawnSync("venv/bin/python", ["-c", "import backtesting"]);
  if (check.status !== 0) {
    // Reinstall if missing
    spawnSync("venv/bin/pip", ["install", "-r", "requirements.txt"]);
  }
}
```

### 3. Pythonia Uses Venv

```typescript
// backtest-executor.ts
const venvPath = getVenvPath(); // Returns: /path/to/apps/server/venv
process.env.VIRTUAL_ENV = venvPath;
process.env.PATH = `${venvPath}/bin:${process.env.PATH}`;

const wrapper = await python("./src/services/trading/backtest_wrapper");
// Pythonia automatically uses the venv Python!
```

## Test Comparison: Old vs New

### OLD Approach (python-executor-service)

```typescript
// OLD: tests/services/trading/python-executor-service.test.ts

describe("PythonExecutorService", () => {
  test("should create venv and run backtest", async () => {
    // Created temp venv per test
    const tmpDir = await fs.mkdtemp("/tmp/backtest-");

    // Spawned process
    const result = await pythonExecutorService.runBacktest(code, config);

    // Checked spawn output
    expect(result.stdout).toContain("success");
  });
});
```

**Problems:**

- ❌ Created temp venv for every test (slow)
- ❌ Used spawn() with complex process management
- ❌ Hard to debug (process boundaries)
- ❌ Temp files everywhere

### NEW Approach (backtest-executor)

```typescript
// NEW: tests/services/trading/backtest-executor.test.ts

describe("Backtest Executor (Pythonia)", () => {
  beforeAll(async () => {
    // Ensure venv exists once
    await ensurePythonEnv();
  });

  test("should validate RSI strategy", async () => {
    // Direct pythonia call
    const result = await backtestExecutor.validateStrategy(rsiStrategy);

    // Check validation result
    expect(result.valid).toBe(true);
  });

  test("should execute SMA backtest", async () => {
    // Direct pythonia call
    const result = await backtestExecutor.runBacktest(smaStrategy, config);

    // Check actual results
    expect(result.metrics.total_return).toBeDefined();
  });
});
```

**Benefits:**

- ✅ One venv shared across all tests
- ✅ Direct pythonia calls (no spawn)
- ✅ Easy to debug (same process)
- ✅ No temp files

## Test Coverage Comparison

### Old Tests (python-executor-service.test.ts)

```
✅ validateEnvironment()
✅ validateStrategyCode()
✅ fetchOHLCVData()
✅ _createTempDirectory()
✅ _setupVenv()
✅ _executePython()
✅ runBacktest()
```

### New Tests (backtest-executor.test.ts)

```
✅ validateStrategy() - security checks
✅ runBacktest() - full pipeline
✅ fetchOHLCVData() - data fetching
```

**What Changed:**

- ❌ Removed: `_createTempDirectory()`, `_setupVenv()`, `_executePython()` (no longer needed)
- ✅ Same coverage for actual functionality
- ✅ Tests are simpler and faster

## Verification Commands

### 1. Check Venv Structure

```bash
ls -la venv/
# Should show: bin/, lib/, include/, pyvenv.cfg
```

### 2. Check Installed Packages

```bash
venv/bin/pip list
# Should show: Backtesting, pandas, numpy, RestrictedPython
```

### 3. Test Python Directly

```bash
venv/bin/python -c "import backtesting; print(backtesting.__version__)"
# Should print: 0.3.3
```

### 4. Test Pythonia Integration

```bash
npm test -- backtest-executor.test.ts --run
# Should pass all tests
```

### 5. Manual Activation (if needed)

```bash
source venv/bin/activate
python -c "import backtesting; print('Works!')"
deactivate
```

## How to Know Tests Are Correctly Ported

### Checklist

1. ✅ **No spawn() calls in tests**

   ```bash
   grep -r "spawn" tests/services/trading/backtest-executor.test.ts
   # Should return nothing
   ```

2. ✅ **Uses pythonia directly**

   ```bash
   grep -r "backtestExecutor\." tests/services/trading/backtest-executor.test.ts
   # Should show: validateStrategy(), runBacktest(), fetchOHLCVData()
   ```

3. ✅ **No temp directory creation**

   ```bash
   grep -r "mkdtemp\|tmpdir" tests/services/trading/backtest-executor.test.ts
   # Should return nothing
   ```

4. ✅ **Tests actual functionality, not infrastructure**

   - Old: Tested temp dir creation, venv setup, spawn process
   - New: Tests validation, backtest execution, results

5. ✅ **Same security coverage**
   - Both test dangerous imports (os, sys, eval, exec)
   - Both test strategy validation
   - Both test error handling

## Running Tests

### First Run (Slow - Creates Venv)

```bash
npm test -- backtest-executor.test.ts --run
# Takes 2-5 minutes (installs packages)
```

### Subsequent Runs (Fast - Uses Existing Venv)

```bash
npm test -- backtest-executor.test.ts --run
# Takes seconds (venv already exists)
```

### To Reset Venv

```bash
rm -rf venv/
npm test -- backtest-executor.test.ts --run
# Will recreate venv
```

## What Makes You Confident Tests Are Correct

1. **Venv Auto-Setup Worked** ✅

   - Test output showed: "Creating virtual environment..."
   - Test output showed: "Dependencies installed"

2. **Packages Are Installed** ✅

   ```bash
   venv/bin/pip list | grep -E "Backtesting|pandas|numpy|RestrictedPython"
   ```

3. **Python Can Import Packages** ✅

   ```bash
   venv/bin/python -c "import backtesting, pandas, numpy, RestrictedPython"
   ```

4. **Tests Match Old Functionality** ✅

   - Same security checks
   - Same validation logic
   - Same backtest execution
   - Same error handling

5. **Integration with Queue Works** ✅
   - processor.ts updated to use backtestExecutor
   - worker.ts cleaned up
   - Same job processing pipeline
