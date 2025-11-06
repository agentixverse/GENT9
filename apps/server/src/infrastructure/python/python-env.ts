import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export class PythonEnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PythonEnvironmentError";
  }
}

/**
 * Ensures Python virtual environment is set up and ready to use
 * Creates venv and installs dependencies if needed
 *
 * Location: apps/server/venv/
 * Requirements: apps/server/requirements.txt
 */
export async function ensurePythonEnv(): Promise<void> {
  const serverRoot = path.join(__dirname, "../../../");
  const venvPath = path.join(serverRoot, "venv");
  const requirementsPath = path.join(serverRoot, "requirements.txt");

  console.log("🐍 Checking Python environment...");

  // Check if Python 3 is installed
  const pythonCheck = spawnSync("python3", ["--version"], {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  if (pythonCheck.error || pythonCheck.status !== 0) {
    throw new PythonEnvironmentError(
      "Python 3 is not installed or not found in PATH. Please install Python 3."
    );
  }

  const pythonVersion = pythonCheck.stdout.trim();
  console.log(`  ✓ Python found: ${pythonVersion}`);

  // Check if venv exists
  const venvExists = fs.existsSync(venvPath);
  const venvPythonPath = path.join(venvPath, "bin", "python");
  const venvPipPath = path.join(venvPath, "bin", "pip");

  if (!venvExists || !fs.existsSync(venvPythonPath)) {
    console.log("  ⚙️  Creating virtual environment...");

    const venvCreate = spawnSync("python3", ["-m", "venv", venvPath], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (venvCreate.status !== 0) {
      throw new PythonEnvironmentError(
        `Failed to create virtual environment: ${venvCreate.stderr}`
      );
    }

    console.log("  ✓ Virtual environment created");
  } else {
    console.log("  ✓ Virtual environment exists");
  }

  // Check if requirements.txt exists
  if (!fs.existsSync(requirementsPath)) {
    throw new PythonEnvironmentError(
      `requirements.txt not found at: ${requirementsPath}`
    );
  }

  // Check if dependencies are installed by trying to import backtesting
  const checkImport = spawnSync(venvPythonPath, ["-c", "import backtesting"], {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  if (checkImport.status !== 0) {
    console.log("  ⚙️  Installing Python dependencies...");

    // Upgrade pip first
    const pipUpgrade = spawnSync(venvPipPath, ["install", "--upgrade", "pip"], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (pipUpgrade.status !== 0) {
      console.warn(`  ⚠️  Warning: pip upgrade failed: ${pipUpgrade.stderr}`);
    }

    // Install dependencies from requirements.txt
    const pipInstall = spawnSync(venvPipPath, ["install", "-r", requirementsPath], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120000, // 2 minutes timeout
    });

    if (pipInstall.status !== 0) {
      throw new PythonEnvironmentError(
        `Failed to install dependencies: ${pipInstall.stderr}`
      );
    }

    console.log("  ✓ Dependencies installed");
  } else {
    console.log("  ✓ Dependencies already installed");
  }

  console.log("✅ Python environment ready\n");
}

/**
 * Get the path to the Python executable in the venv
 */
export function getPythonPath(): string {
  const serverRoot = path.join(__dirname, "../../../");
  return path.join(serverRoot, "venv", "bin", "python");
}

/**
 * Get the venv path for use with pythonia
 * Pythonia uses VIRTUAL_ENV environment variable
 */
export function getVenvPath(): string {
  const serverRoot = path.join(__dirname, "../../../");
  return path.join(serverRoot, "venv");
}
