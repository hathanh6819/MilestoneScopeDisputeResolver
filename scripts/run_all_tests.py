"""Run mock and real-SDK suites in isolated interpreters to prevent module collisions."""
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
for suite in ("tests", "runtime_tests"):
    print(f"\n=== {suite} ===", flush=True)
    result = subprocess.run([sys.executable, "-m", "pytest", "-q", suite, "-p", "no:cacheprovider"], cwd=root)
    if result.returncode:
        raise SystemExit(result.returncode)
