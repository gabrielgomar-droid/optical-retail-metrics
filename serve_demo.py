"""Serve the reviewable demo on loopback, without exposing repository metadata."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent
ALLOWED_EXAMPLES = {
    'examples/nps-ficticio.csv', 'examples/agendamientos-ficticios.csv',
    'examples/ventas-ficticias.csv', 'examples/cotizaciones-ficticias.csv',
}


class DemoHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlsplit(self.path).path == '/':
            self.path = '/home.html'
        return super().do_GET()

    def send_head(self):
        path = unquote(urlsplit(self.path).path).lstrip('/')
        if not path:
            self.path = '/home.html'
            path = 'home.html'
        candidate = ROOT / path
        allowed = (
            len(Path(path).parts) == 1 and candidate.suffix in {'.html', '.css', '.js', '.md'}
        ) or (
            len(Path(path).parts) == 2 and path.startswith('docs/') and candidate.suffix == '.md'
        ) or path in ALLOWED_EXAMPLES
        if not allowed or candidate.is_symlink() or ROOT not in candidate.resolve().parents or not candidate.is_file():
            self.send_error(404)
            return None
        return super().send_head()


def main():
    handler = partial(DemoHandler, directory=str(ROOT))
    try:
        server = ThreadingHTTPServer(('127.0.0.1', 8765), handler)
    except OSError:
        raise SystemExit('El puerto 8765 está ocupado. Revisa el servidor existente; no se detuvo ningún proceso.')
    print('Abre http://127.0.0.1:8765/home.html · Ctrl+C detiene este servidor.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
