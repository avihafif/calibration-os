"""Fail-closed task queue and changed-file policy for the CalOS cloud pilot.

This code is a trusted control-plane file. AI agents must not edit it.
"""

import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TASKS_FILE = ROOT / "docs/autonomy/tasks.json"
STATE_FILE = ROOT / ".calos-autonomy/state.json"


def run_git(*arguments: str) -> str:
    result = subprocess.run(
        ["git", *arguments],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def catalog() -> dict:
    data = json.loads(TASKS_FILE.read_text(encoding="utf-8"))
    assert data["schema"] == 1
    ids = [task["id"] for task in data["tasks"]]
    assert len(ids) == len(set(ids)), "Duplicate task IDs"
    for task in data["tasks"]:
        assert task["id"].replace("-", "").isalnum()
        assert (ROOT / task["prompt_file"]).is_file()
        assert set(task["depends_on"]).issubset(ids)
        assert task["allowed_paths"]
    return data


def state() -> dict:
    if not STATE_FILE.exists():
        return {"completed": [], "attempts": {}, "history": []}
    result = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    assert isinstance(result["completed"], list)
    assert isinstance(result["attempts"], dict)
    assert isinstance(result["history"], list)
    return result


def save(value: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(
        json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )


def select_task() -> None:
    data = catalog()
    recorded = state()
    completed = set(recorded["completed"])
    for task in data["tasks"]:
        if task["id"] in completed:
            continue
        if not set(task["depends_on"]).issubset(completed):
            raise SystemExit("TASK_DEPENDENCY_UNMET: " + task["id"])
        if recorded["attempts"].get(task["id"], 0) >= data["max_attempts_per_task"]:
            print("has_task=false")
            print("blocked_task=" + task["id"])
            print("all_done=false")
            return
        print("has_task=true")
        print("task=" + task["id"])
        print("prompt_file=" + task["prompt_file"])
        print("base_sha=" + run_git("rev-parse", "HEAD"))
        print("all_done=false")
        return
    print("has_task=false")
    print("blocked_task=")
    print("all_done=true")


def allowed(path: str, entries: list[str]) -> bool:
    return any(
        path.startswith(entry) if entry.endswith("/") else path == entry
        for entry in entries
    )


def check_changes(task_id: str) -> None:
    data = catalog()
    task = next((item for item in data["tasks"] if item["id"] == task_id), None)
    if task is None:
        raise SystemExit("UNKNOWN_TASK")
    changes = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "-z"],
        cwd=ROOT,
        capture_output=True,
        check=True,
    ).stdout.decode("utf-8")
    files = [path for path in changes.split("\0") if path]
    if not files or len(files) > 80:
        raise SystemExit("INVALID_CHANGESET_SIZE")
    for path in files:
        if not allowed(path, task["allowed_paths"]):
            raise SystemExit("FORBIDDEN_AGENT_PATH: " + path)
        if "\\n" in path or "\\r" in path or path.startswith("-"):
            raise SystemExit("INVALID_CHANGED_PATH")
    summary = run_git("diff", "--cached", "--summary")
    if any(
        word in summary
        for word in ("mode change", "120000", "160000", "rename", "delete mode")
    ):
        raise SystemExit("UNSAFE_FILE_MODE_OR_RENAME")
    if len(
        subprocess.run(
            ["git", "diff", "--cached", "--binary"],
            cwd=ROOT,
            capture_output=True,
            check=True,
        ).stdout
    ) > 250_000:
        raise SystemExit("CHANGESET_TOO_LARGE")
    print("ALLOWED_CHANGESET: " + ", ".join(files))


def record(task_id: str, result: str, run_id: str) -> None:
    data = catalog()
    if task_id not in {task["id"] for task in data["tasks"]}:
        raise SystemExit("UNKNOWN_TASK")
    recorded = state()
    if result == "success":
        if task_id not in recorded["completed"]:
            recorded["completed"].append(task_id)
        recorded["attempts"].pop(task_id, None)
    elif result == "failure":
        recorded["attempts"][task_id] = recorded["attempts"].get(task_id, 0) + 1
    else:
        raise SystemExit("UNKNOWN_RESULT")
    recorded["history"].append(
        {"task": task_id, "result": result, "run_id": str(run_id)}
    )
    save(recorded)


def self_test() -> None:
    data = catalog()
    assert len(data["tasks"]) >= 2
    assert allowed("apps/web/src/App.tsx", ["apps/web/src/"])
    assert not allowed(".github/workflows/a.yml", ["apps/web/src/"])
    assert not allowed("apps/web/src-other/a.ts", ["apps/web/src/"])
    assert not allowed("docs/adr/0011.md", ["docs/autonomy/research/"])
    print("AUTONOMY_QUEUE_SELFTEST_PASS")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["select", "check", "record", "selftest"])
    parser.add_argument("--task", default="")
    parser.add_argument("--result", default="")
    parser.add_argument("--run-id", default="")
    arguments = parser.parse_args()
    if arguments.command == "select":
        select_task()
    elif arguments.command == "check":
        check_changes(arguments.task)
    elif arguments.command == "record":
        record(arguments.task, arguments.result, arguments.run_id)
    else:
        self_test()


if __name__ == "__main__":
    main()
