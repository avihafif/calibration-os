"""Locally executable standard-library Phase 0A checks."""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMANDS = [
    [sys.executable, "tools/codegen.py", "--check"],
    [sys.executable, "tools/check_boundaries.py"],
    [sys.executable, "tools/check_isolation.py"],
    [sys.executable, "tools/scan_secrets.py"],
    [sys.executable, "-m", "unittest", "discover", "-s", "tests/unit", "-v"],
]


def main() -> int:
    for command in COMMANDS:
        result = subprocess.run(command, cwd=ROOT, check=False)
        if result.returncode:
            return result.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
