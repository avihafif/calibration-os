"""Static, machine-checkable Phase 0A Compose separation proof.

This does not prove runtime network isolation, credential verification, or signing.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]


def _load(name: str) -> dict[str, Any]:
    return json.loads((ROOT / "deploy" / name / "compose.yaml").read_text(encoding="utf-8"))


def check(with_secrets: bool = False) -> None:
    test = _load("test")
    rehearsal = _load("prod-rehearsal")
    assert test["name"] == "calos-test"
    assert rehearsal["name"] == "calos-prod-rehearsal"
    assert test["name"] != rehearsal["name"]
    for field in ("networks", "volumes"):
        left = {item["name"] for item in test[field].values()}
        right = {item["name"] for item in rehearsal[field].values()}
        assert left and right and left.isdisjoint(right), field
    test_ports = {
        port for service in test["services"].values() for port in service.get("ports", [])
    }
    rehearsal_ports = {
        port for service in rehearsal["services"].values() for port in service.get("ports", [])
    }
    assert test_ports and rehearsal_ports and test_ports.isdisjoint(rehearsal_ports)
    assert all(port.startswith("127.0.0.1:") for port in test_ports | rehearsal_ports)
    for left, right in ((test, rehearsal),):
        assert (
            left["services"]["db"]["environment"]["POSTGRES_DB"]
            != right["services"]["db"]["environment"]["POSTGRES_DB"]
        )
        assert (
            left["services"]["db"]["environment"]["POSTGRES_USER"]
            != right["services"]["db"]["environment"]["POSTGRES_USER"]
        )
        for service_name in ("api", "station_stub", "migrate"):
            left_env = left["services"][service_name]["environment"]
            right_env = right["services"][service_name]["environment"]
            assert left_env["CALOS_DEPLOYMENT_ID"] != right_env["CALOS_DEPLOYMENT_ID"]
            assert left_env["CALOS_ENVIRONMENT_KIND"] == "test"
            assert right_env["CALOS_ENVIRONMENT_KIND"] == "production_rehearsal"
    for key in ("postgres_password", "prototype_signing_seed"):
        lpath = ROOT / "deploy" / "test" / test["secrets"][key]["file"]
        rpath = ROOT / "deploy" / "prod-rehearsal" / rehearsal["secrets"][key]["file"]
        assert lpath.resolve() != rpath.resolve(), key
        if with_secrets:
            assert lpath.exists() and rpath.exists(), key
            assert lpath.read_bytes() != rpath.read_bytes(), key
    assert "station_stub" in test["services"] and "station_stub" in rehearsal["services"]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--with-secrets", action="store_true")
    args = parser.parse_args()
    check(args.with_secrets)
    print("Phase 0A Compose static isolation check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
