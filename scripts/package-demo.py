"""Build a standalone demo ZIP. Packaging requires Python 3 and the repo's npm dependencies."""
from pathlib import Path
import subprocess
import tempfile
import shutil
import zipfile

root = Path(__file__).resolve().parents[1]
subprocess.run(["npm", "run", "build", "-w", "apps/client", "--", "--base", "./"], cwd=root, check=True)
with tempfile.TemporaryDirectory(prefix="astra-demo-") as temp:
    package = Path(temp) / "ASTRA-demo"
    shutil.copytree(root / "scripts/demo", package)
    shutil.copytree(root / "apps/client/dist", package / "web")
    # The original online entry needs a backend; this distribution opens the local demo.
    (package / "web/index.html").unlink(missing_ok=True)
    output = root / "downloads/ASTRA-demo.zip"
    output.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for file in sorted(package.rglob("*")):
            if file.is_file():
                archive.write(file, file.relative_to(Path(temp)))
    print(f"Demo: {output} ({output.stat().st_size:,} bytes)")
