"""@req AC-ARCH-01 @req AC-ARCH-02"""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))

from check_boundaries import check, check_python_source  # noqa: E402
from scan_secrets import scan_bytes  # noqa: E402


class BoundaryTests(unittest.TestCase):
    def test_repo_boundaries(self) -> None:
        self.assertEqual(check(), [])

    def test_hardcoded_model_branch_rejected(self) -> None:
        source = 'if model == "34401A":\n    pass\n'
        self.assertTrue(
            check_python_source(source, "packages/py/core.py", core=True, central=False)
        )

    def test_central_transport_import_rejected(self) -> None:
        self.assertTrue(
            check_python_source(
                "import calos_transport", "apps/api/main.py", core=False, central=True
            )
        )

    def test_secret_canary_rejected(self) -> None:
        self.assertIn("private-key", scan_bytes(b"-----BEGIN " + b"PRIVATE KEY-----"))


if __name__ == "__main__":
    unittest.main()
