"""@req FR-ENV-02 @req FR-ENV-06"""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages" / "py" / "calos_domain"))

from calos_domain import DeploymentIdentity, DeploymentMismatch  # noqa: E402


class DeploymentTests(unittest.TestCase):
    def test_cross_deployment_artifact_identity_is_rejected(self) -> None:
        test = DeploymentIdentity("test-id", "test")
        rehearsal = DeploymentIdentity("rehearsal-id", "production_rehearsal")
        test.require_match(DeploymentIdentity("test-id", "test"))
        with self.assertRaises(DeploymentMismatch):
            test.require_match(rehearsal)
        with self.assertRaises(DeploymentMismatch):
            rehearsal.require_match(test)


if __name__ == "__main__":
    unittest.main()
