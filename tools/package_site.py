"""Build a hosting ZIP containing only public website files (Python 3)."""

from hashlib import sha256
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parent.parent
PAGES = (
    "index.html", "about.html", "archive.html", "committee.html",
    "contacts.html", "programme.html", "submission.html", "venue.html",
    "styles.css", "script.js",
)
ASSET_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".ico",
    ".woff", ".woff2", ".docx", ".docm",
}


def asset_version(path):
    return sha256(path.read_bytes()).hexdigest()[:12]


def versioned_html(path, style_version, script_version):
    html = path.read_text(encoding="utf-8")
    html = html.replace('href="styles.css"', f'href="styles.css?v={style_version}"')
    return html.replace('src="script.js"', f'src="script.js?v={script_version}"')


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
    style_version = asset_version(ROOT / "styles.css")
    script_version = asset_version(ROOT / "script.js")
    with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
        for path in files:
            relative_path = path.relative_to(ROOT)
            if path.suffix == ".html":
                html = versioned_html(path, style_version, script_version)
                archive.writestr(str(relative_path), html)
                continue
            archive.write(path, relative_path)
    print(f"Created {output} ({len(files)} public files)")


if __name__ == "__main__":
    main()
