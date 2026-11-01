"""Health-only API and non-operational station smoke tests."""

import importlib.util
import os
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HAS_WEB_DEPS = importlib.util.find_spec("fastapi") is not None


@unittest.skipUnless(HAS_WEB_DEPS, "FastAPI not installed in this local Python")
class AppTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        sys.path[:0] = [
            str(ROOT / "apps" / "api"),
            str(ROOT / "apps" / "station-agent"),
            str(ROOT / "packages" / "py" / "calos_domain"),
        ]
        os.environ["CALOS_DEPLOYMENT_ID"] = "00000000-0000-4000-8000-0000000000a1"
        os.environ["CALOS_ENVIRONMENT_KIND"] = "test"

    def test_api_health(self) -> None:
        from calos_api.main import app

        route = next(route for route in app.routes if route.path == "/healthz")
        response = route.endpoint()
        self.assertTrue(response.simulation_only)
        self.assertTrue(response.non_operational)

    def test_station_status_only(self) -> None:
        from calos_station_agent.main import app, create_app

        route = next(route for route in app.routes if route.path == "/local/v1/status")
        response = route.endpoint()
        self.assertTrue(response.simulated)
        self.assertFalse(any(route.path == "/local/v1/runs" for route in app.routes))
        with self.assertRaises(RuntimeError):
            create_app("", "test")


if __name__ == "__main__":
    unittest.main()
