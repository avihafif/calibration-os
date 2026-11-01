"""@req FR-ENV-01 @req NFR-21"""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))

from check_isolation import check  # noqa: E402


class IsolationTests(unittest.TestCase):
    def test_compose_resources_are_distinct(self) -> None:
        check()


if __name__ == "__main__":
    unittest.main()
