"""Static Phase 0A import and no-model-branch checks. @req AC-ARCH-01 @req AC-ARCH-02"""

from __future__ import annotations

import ast
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL_TERMS = re.compile(r"34401A|Keysight|Agilent", re.IGNORECASE)
FORBIDDEN_CALLS = {"eval", "exec"}


def check_python_source(source: str, location: str, *, core: bool, central: bool) -> list[str]:
    findings: list[str] = []
    tree = ast.parse(source, filename=location)
    if core and MODEL_TERMS.search(source):
        findings.append(f"{location}: model or vendor name in runtime")
    for node in ast.walk(tree):
        if (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id in FORBIDDEN_CALLS
        ):
            findings.append(f"{location}: arbitrary code execution call")
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            names = (
                [alias.name for alias in node.names]
                if isinstance(node, ast.Import)
                else [node.module or ""]
            )
            for name in names:
                if central and (
                    name.startswith(
                        (
                            "calos_transport",
                            "calos_driver",
                            "calos_simulator",
                            "calos_station_agent",
                            "pyvisa",
                        )
                    )
                ):
                    findings.append(f"{location}: central imports instrument path {name}")
                if core and location.find("calos_domain") >= 0 and name.startswith("calos_"):
                    findings.append(f"{location}: domain imports another repo package {name}")
                if (
                    location.find("calos_metadata") >= 0
                    and name.startswith("calos_")
                    and not name.startswith("calos_domain")
                ):
                    findings.append(f"{location}: metadata imports disallowed package {name}")
                if location.find("station-agent") >= 0 and name.startswith(
                    ("pyvisa", "calos_transport")
                ):
                    findings.append(f"{location}: Phase 0A station contains real transport {name}")
    return findings


def check() -> list[str]:
    findings = []
    for parent, core, central in (
        (ROOT / "packages" / "py", True, False),
        (ROOT / "apps" / "api", False, True),
        (ROOT / "apps" / "station-agent", False, False),
    ):
        for path in parent.rglob("*.py"):
            findings.extend(
                check_python_source(
                    path.read_text(encoding="utf-8"),
                    str(path.relative_to(ROOT)),
                    core=core,
                    central=central,
                )
            )
    for parent in (ROOT / "packages" / "ts", ROOT / "apps" / "web" / "src"):
        for path in parent.rglob("*.ts*"):
            source = path.read_text(encoding="utf-8")
            if parent.parts[-2:] == ("packages", "ts") and MODEL_TERMS.search(source):
                findings.append(f"{path.relative_to(ROOT)}: model or vendor name in runtime")
            if "@calos/api-client" in source and "packages/ts" in path.as_posix():
                findings.append(f"{path.relative_to(ROOT)}: TS runtime imports api-client")
    return findings


def main() -> int:
    findings = check()
    for finding in findings:
        print(finding)
    if findings:
        return 1
    print("Phase 0A boundary check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
