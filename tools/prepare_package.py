"""Create a deterministic, local review ZIP from an explicit relative-file list."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import stat
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parent / 'review-package'
EXAMPLES = {
    'examples/nps-ficticio.csv', 'examples/agendamientos-ficticios.csv',
    'examples/ventas-ficticias.csv', 'examples/cotizaciones-ficticias.csv',
}


def selected_files():
    names = [line.strip() for line in (ROOT / 'package-files.txt').read_text().splitlines()
             if line.strip() and not line.lstrip().startswith('#')]
    if not names or len(names) != len(set(names)):
        raise ValueError('Lista vacía o con duplicados')
    files = {}
    for name in sorted(names):
        relative = PurePosixPath(name)
        path = ROOT / name
        if relative.is_absolute() or any(p in {'.', '..', '.git', 'drafts'} for p in relative.parts):
            raise ValueError('Ruta no permitida en lista')
        if '\\' in name or str(relative) != name or ROOT not in path.resolve().parents:
            raise ValueError('La ruta no es relativa y normalizada')
        if any((ROOT / parent).is_symlink() for parent in [relative, *relative.parents]):
            raise ValueError('No se admiten symlinks')
        if not path.is_file() or (path.suffix == '.csv' and name not in EXAMPLES):
            raise ValueError('Archivo faltante o CSV fuera de los cuatro ejemplos')
        files[name] = path.read_bytes()
    if not EXAMPLES.issubset(files):
        raise ValueError('Falta un ejemplo sintético')
    return files


def main():
    files = selected_files()
    manifest = {
        'format_version': 1,
        'scope': 'Original project code, tests, documentation and synthetic fixtures under MIT; no business data.',
        'files': [{'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
                  for name, data in files.items()],
    }
    manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
    OUTPUT.mkdir(exist_ok=True)
    archive = OUTPUT / 'optical-retail-metrics-review.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as handle:
        for name, data in [*files.items(), ('MANIFEST.json', manifest_bytes)]:
            info = zipfile.ZipInfo('optical-retail-metrics/' + name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            mode = 0o755 if name.endswith('.command') else 0o644
            info.external_attr = (stat.S_IFREG | mode) << 16
            handle.writestr(info, data)
    with zipfile.ZipFile(archive) as handle:
        if handle.testzip() is not None:
            raise ValueError('Falló CRC del ZIP')
        expected = {'optical-retail-metrics/' + name for name in files} | {'optical-retail-metrics/MANIFEST.json'}
        if set(handle.namelist()) != expected:
            raise ValueError('Miembros inesperados')
        for entry in manifest['files']:
            data = handle.read('optical-retail-metrics/' + entry['path'])
            if len(data) != entry['bytes'] or hashlib.sha256(data).hexdigest() != entry['sha256']:
                raise ValueError('Diferencia de hash o tamaño')
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (OUTPUT / 'MANIFEST.json').write_bytes(manifest_bytes)
    (OUTPUT / 'SHA256SUMS.txt').write_text(digest + '  ' + archive.name + '\n')
    print(json.dumps({'archive': archive.name, 'product_files': len(files), 'zip_members': len(expected),
                      'bytes': archive.stat().st_size, 'sha256': digest, 'verified': True}, indent=2))


if __name__ == '__main__':
    main()
