"""Lists the dependencies that are a major version behind."""
import json
import subprocess


def outdated():
    result = subprocess.run(
        ["pnpm", "outdated", "--json"], capture_output=True, text=True
    )
    return json.loads(result.stdout or "{}")


def majors(packages):
    for name, info in packages.items():
        current = int(info["current"].split(".")[0])
        latest = int(info["latest"].split(".")[0])
        if latest > current:
            yield name, info["current"], info["latest"]


if __name__ == "__main__":
    for name, current, latest in majors(outdated()):
        print(f"{name:<12}{current:>10} -> {latest}")
