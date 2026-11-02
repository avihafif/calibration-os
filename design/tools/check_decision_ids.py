#!/usr/bin/env python3
"""Repository-wide decision-identifier uniqueness check (design documentation only; stdlib, no network).

Namespaces
  D-nn        Phase 1 register (docs/phase1/11_DECISIONS_REQUIRED.md) and later additions marked `*(new)*`
  PD-DEC-nnn  Procedure Designer package (docs/procedure-designer/)
  PD-GAP-n    Procedure Designer catalogue gaps (docs/procedure-designer/)

A DEFINITION is a markdown table row whose first cell is the identifier:
  * D-nn: bold in the register file, or bold with the `*(new)*` marker anywhere (restated rows are references and do not count);
  * PD-DEC-nnn / PD-GAP-n: first cell in docs/procedure-designer/ (rows elsewhere restate them and count as references).
Rules
  1. every identifier has exactly one definition (no duplicates, no re-definition of a register id as `*(new)*`);
  2. docs/procedure-designer/ may not define a bare `D-nn` (the collision this check exists to prevent);
  3. every referenced identifier is defined (catches typos and stale numbers);
  4. PD-DEC ids are contiguous from 001 (a gap means a deleted or renumbered decision that needs a note).
It never changes an outcome or approval status; it only checks identifiers.
Usage: python design/tools/check_decision_ids.py [--root DIR] | --self-test
"""
from __future__ import annotations

import argparse
import re
import sys
import tempfile
from collections import defaultdict
from pathlib import Path

REGISTER = "docs/phase1/11_DECISIONS_REQUIRED.md"
PD_DIR = "docs/procedure-designer/"
ID = r"(?:PD-DEC-\d{3}|PD-GAP-\d+|D-\d{2})"
ROW = re.compile(r"^\|\s*(\*\*)?\s*(" + ID + r")\s*(\*\*)?\s*(\*\(new\)\*)?\s*\|")
REF = re.compile(r"(?<![A-Za-z0-9-])(" + ID + r")(?![0-9])")
SKIP_DIRS = {".git", "node_modules", ".pnpm-store", ".venv", "target"}


def markdown_files(root: Path):
    for p in sorted(root.rglob("*.md")):
        if SKIP_DIRS & set(p.relative_to(root).parts):
            continue
        yield p


def check(root: Path) -> list[str]:
    errors: list[str] = []
    defs: dict[str, list[str]] = defaultdict(list)
    refs: dict[str, list[str]] = defaultdict(list)
    new_marked: set[str] = set()
    for p in markdown_files(root):
        rel = p.relative_to(root).as_posix()
        for n, line in enumerate(p.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
            m = ROW.match(line)
            where = f"{rel}:{n}"
            if m:
                bold, ident, _, new = bool(m.group(1)), m.group(2), m.group(3), bool(m.group(4))
                if ident.startswith("PD-"):
                    if rel.startswith(PD_DIR):
                        defs[ident].append(where)
                    # elsewhere a PD-* row restates a decision (e.g. the Gate A0 matrix): a reference, not a definition
                else:  # D-nn
                    if rel.startswith(PD_DIR):
                        errors.append(f"{where}: {ident} is defined in the Procedure Designer package; use PD-DEC-nnn (or cross-reference with italics)")
                    elif rel == REGISTER and bold:
                        defs[ident].append(where)
                    elif bold and new:
                        defs[ident].append(where)
                        new_marked.add(ident)
            for r in REF.findall(line):
                refs[r].append(where)
    for ident, places in sorted(defs.items()):
        if len(places) > 1:
            errors.append(f"duplicate definition of {ident}: " + ", ".join(places))
    in_register = {i for i, ps in defs.items() if any(x.startswith(REGISTER + ":") for x in ps)}
    for ident in sorted(new_marked & in_register):
        errors.append(f"{ident} is marked *(new)* but already exists in {REGISTER}")
    for ident, places in sorted(refs.items()):
        if ident not in defs:
            errors.append(f"undefined identifier {ident} referenced at " + ", ".join(places[:3]))
    nums = sorted(int(i[-3:]) for i in defs if i.startswith("PD-DEC-"))
    if nums and nums != list(range(1, nums[-1] + 1)):
        errors.append("PD-DEC numbering is not contiguous from 001: " + ", ".join(f"{n:03d}" for n in nums))
    return errors


def self_test() -> int:
    def run(files: dict[str, str]) -> list[str]:
        with tempfile.TemporaryDirectory() as d:
            for name, text in files.items():
                path = Path(d) / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(text, encoding="utf-8")
            return check(Path(d))

    reg = REGISTER
    ok_reg = "| ID | x |\n|---|---|\n| **D-01** | a |\n| **D-02** | b |\n"
    cases = [
        ("clean", {reg: ok_reg, PD_DIR + "10.md": "| PD-DEC-001 | x |\n| PD-DEC-002 | y |\nsee D-01 and PD-DEC-002\n"}, False),
        ("PD package reuses a D id (the original defect)", {reg: ok_reg, PD_DIR + "10.md": "| D-02 | oops |\n"}, True),
        ("duplicate PD-DEC", {reg: ok_reg, PD_DIR + "10.md": "| PD-DEC-001 | x |\n| PD-DEC-001 | y |\n"}, True),
        ("*(new)* collides with register", {reg: ok_reg, "docs/phase1a/05.md": "| **D-02** *(new)* | x |\n"}, True),
        ("*(new)* is fine for a fresh id", {reg: ok_reg, "docs/phase1a/05.md": "| **D-03** *(new)* | x |\nrestated: | **D-01** | still a reference |\n"}, False),
        ("restated register row is a reference, not a duplicate", {reg: ok_reg, "docs/phase1a/05.md": "| **D-01** | restated without (new) |\n"}, False),
        ("undefined reference", {reg: ok_reg, "docs/x.md": "depends on D-99\n"}, True),
        ("PD-DEC gap", {reg: ok_reg, PD_DIR + "10.md": "| PD-DEC-001 | x |\n| PD-DEC-003 | y |\n"}, True),
        ("PD id referenced but never defined in the package", {reg: ok_reg, "docs/x.md": "| PD-DEC-001 | x |\n"}, True),
        ("PD id restated outside the package is a reference", {reg: ok_reg, PD_DIR + "10.md": "| PD-DEC-001 | x |\n", "docs/x.md": "| PD-DEC-001 | restated |\n"}, False),
        ("regression: old revision of the Designer register reused D-07..D-17", {reg: "| **D-07** | a |\n", PD_DIR + "10.md": "| D-07 | reused |\n"}, True),
        ("italic cross-reference in PD package is allowed", {reg: ok_reg, PD_DIR + "10.md": "| *D-01 (existing, cross-reference only)* | x |\n"}, False),
    ]
    bad = 0
    for name, files, should_fail in cases:
        errs = run(files)
        good = bool(errs) == should_fail
        bad += not good
        print(("  ok   " if good else "  FAIL ") + name + ("" if good else f"  -> {errs}"))
    print("self-test:", "FAILED" if bad else "passed")
    return 1 if bad else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[2]))
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    errs = check(Path(args.root))
    for e in errs:
        print("ERROR", e)
    print(f"decision identifiers: {'FAILED (' + str(len(errs)) + ' problem(s))' if errs else 'ok'}")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
