import os, sys

base = "C:\\Users\\Admin\\OneDrive - Islington College Pvt. Ltd\\FYP\\PadaiSathi FYP Submission\\01 Project Artefact"

folders = [
    "01 Feasibility Study\\Week - 01",
    "02 Requirement Analysis\\Week - 07",
    "02 Requirement Analysis\\Week - 09",
    "03 Design\\Week - 13\\Brainstorm Design",
]

for f in folders:
    p = os.path.join(base, f)
    os.makedirs(p, exist_ok=True)
    print(f"OK: {p}")

print("Done.")
sys.exit(0)
