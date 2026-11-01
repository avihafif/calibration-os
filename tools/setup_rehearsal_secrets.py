"""Create separate disposable, non-operational local Compose credentials.

No signing or verification capability consumes prototype_signing_seed in Phase 0A.
"""

from pathlib import Path
from secrets import token_hex

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    for environment in ("test", "prod-rehearsal"):
        directory = ROOT / "deploy" / environment / "secrets"
        directory.mkdir(parents=True, exist_ok=True)
        for name in ("postgres_password", "prototype_signing_seed"):
            path = directory / name
            try:
                with path.open("x", encoding="ascii") as stream:
                    stream.write(token_hex(32))
                path.chmod(0o600)
            except FileExistsError:
                pass
    print("Disposable secrets created or retained in separate ignored directories.")


if __name__ == "__main__":
    main()
