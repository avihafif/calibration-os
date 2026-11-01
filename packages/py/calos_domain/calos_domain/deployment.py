"""Deployment identity check for future signed tokens and artifacts.

This check alone is not authentication or signature verification.
"""

from dataclasses import dataclass
from typing import Literal


class DeploymentMismatch(ValueError):
    code = "DEPLOYMENT_MISMATCH"


@dataclass(frozen=True)
class DeploymentIdentity:
    deployment_id: str
    environment_kind: Literal["test", "production_rehearsal"]

    def require_match(self, presented: "DeploymentIdentity") -> None:
        if self != presented:
            raise DeploymentMismatch("DEPLOYMENT_MISMATCH")
