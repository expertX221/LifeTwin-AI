"""Use the project-owned, optimized organ models; no network download during builds."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "public" / "models"

required = ("heart.glb", "brain.glb", "lungs-textured.glb")
missing = [name for name in required if not (MODELS / name).is_file()]
if missing:
    raise SystemExit(
        "Missing local organ model(s): " + ", ".join(missing) +
        ". Restore the files under public/models before building."
    )

for name in required:
    path = MODELS / name
    if path.stat().st_size < 12 or path.read_bytes()[:4] != b"glTF":
        raise SystemExit(f"{path} is not a valid binary glTF (GLB) file")
    print(f"Using local model: {name} ({path.stat().st_size:,} bytes)")
