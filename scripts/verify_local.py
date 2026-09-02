#!/usr/bin/env python3
"""
Single-run local regression verification. This does not claim Studionet execution.
Exits with code 0 on complete pass.
"""

import sys
import subprocess

def main():
    print("=" * 70)
    print("RUNNING LOCAL REGRESSION VERIFICATION: MilestoneScopeDisputeResolver")
    print("=" * 70)

    commands = [[sys.executable, "-m", "pytest", "tests/", "-q", "-p", "no:cacheprovider"],
                [sys.executable, "-m", "pytest", "runtime_tests/", "-q", "-p", "no:cacheprovider"]]
    result = None
    for cmd in commands:
        print(f"Command: {' '.join(cmd)}\n")
        result = subprocess.run(cmd)
        if result.returncode:
            break

    if result.returncode == 0:
        print("\n" + "=" * 70)
        print("STATUS: LOCAL_REGRESSION_SUITES_PASSED")
        print("=" * 70)
        sys.exit(0)
    else:
        print("\n" + "!" * 70)
        print(f"STATUS: VERIFICATION_FAILED (pytest returned code {result.returncode})")
        print("!" * 70)
        sys.exit(result.returncode)

if __name__ == "__main__":
    main()
