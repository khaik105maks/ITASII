"""Build a hosting ZIP containing only public website files (Python 3)."""

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parent.parent
PAGES = (
    "index.html", "archive.html", "committee.html", "contacts.html",
    "submission.html", "venue.html", "styles.css", "script.js",
)
ASSET_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".ico", ".woff", ".woff2"}


def main():
    files = [ROOT / name for name in PAGES]
    files.extend(
        path for path in sorted((ROOT / "assets").rglob("*"))
        if path.is_file()
        and path.suffix.lower() in ASSET_EXTENSIONS
        and not any(part.startswith(".") for part in path.relative_to(ROOT).parts)
    )
    for path in files:
        if not path.is_file() or path.is_symlink() or not path.resolve().is_relative_to(ROOT):
            raise ValueError(f"Missing or unsafe public file: {path.relative_to(ROOT)}")

    output = ROOT / "dist" / "itasii-site.zip"
    output.parent.mkdir(exist_ok=True)
    with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(ROOT))
    print(f"Created {output} ({len(files)} public files)")


if __name__ == "__main__":
    main()
