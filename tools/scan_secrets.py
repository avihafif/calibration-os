"""Small deterministic tracked-source secret scan; broader scanners remain a gap."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = {
    "private-key": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "aws-access-key": re.compile(rb"AKIA[0-9A-Z]{16}"),
    "github-token": re.compile(rb"gh[pousr]_[A-Za-z0-9]{36,}"),
}


def scan_bytes(content: bytes) -> list[str]:
    return [name for name, pattern in PATTERNS.items() if pattern.search(content)]


def main() -> int:
    result = subprocess.run(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        cwd=ROOT,
        capture_output=True,
        check=True,
    )
    findings = []
    for raw_path in result.stdout.split(b"\0"):
        if not raw_path:
            continue
        path = ROOT / raw_path.decode("utf-8")
        if path.suffix == ".zip" or not path.is_file():
            continue
        for name in scan_bytes(path.read_bytes()):
            findings.append(f"{path.relative_to(ROOT)}: {name}")
    for finding in findings:
        print(finding)
    if findings:
        return 1
    print("Tracked-source secret pattern scan passed (limited patterns).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
