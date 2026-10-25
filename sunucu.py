"""Hızlı Okuma yerel sunucusu.

Güvenlik:
- Sadece bu bilgisayardan (127.0.0.1) erişilir; port başka programla paylaşılmaz.
- İzin listesi: sadece programın kendi dosyaları verilir (.git, yedekler, başka hiçbir dosya verilmez).
- Host başlığı kontrol edilir: kötü niyetli bir sitenin DNS yeniden bağlama ile dosya okuması engellenir.
- Her yanıtla güvenlik kuralı (CSP) gönderilir: sayfa ve OCR işçisi internete bağlanamaz.
- Tarayıcı her açılışta güncel sürümü sorar (eski sürüm önbellekte kalmaz).

Kullanım: python -I sunucu.py [port] [--ac]   (--ac: sunucu hazır olunca tarayıcıda açar)
"""
import ctypes
import http.server
import os
import re
import socket
import sys
import threading
import urllib.request
import webbrowser

ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
PORT = int(ARGS[0]) if ARGS else 8765
URL = f'http://127.0.0.1:{PORT}/HizliOkuma.html'
HOSTS = {f'127.0.0.1:{PORT}', f'localhost:{PORT}'}

# Verilebilecek dosyalar. Yüzde kodlaması, ters bölü, ~ ve nokta ile başlayan ad eşleşmez.
ALLOWED = re.compile(
    r'/(?:HizliOkuma\.html|app\.js'
    r'|fonts/poppins-latin(?:-ext)?-[0-9]{3}-normal\.woff2'
    r'|vendor/tesseract/(?:tesseract\.min\.js|worker\.min\.js'
    r'|core/tesseract-core(?:-simd)?-lstm\.wasm\.js|lang/[a-z]{3}\.traineddata\.gz))')

CSP = ("default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; "
       "connect-src 'self' blob: data:; img-src 'self' blob: data:; font-src 'self'; style-src 'unsafe-inline'; "
       "base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'none'")


class Handler(http.server.SimpleHTTPRequestHandler):
    # Windows kayıt defterindeki dosya türlerine güvenme (bazı bilgisayarlarda .js = text/plain olur)
    extensions_map = {
        '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
        '.woff2': 'font/woff2', '.gz': 'application/gzip', '': 'application/octet-stream',
    }

    def send_head(self):
        # HTTP/0.9 yanıtında başlık (CSP) gönderilemez; tarayıcılar zaten kullanmaz
        if self.request_version == 'HTTP/0.9':
            self.close_connection = True
            return None
        hosts = self.headers.get_all('Host') or []
        if len(hosts) != 1 or hosts[0] not in HOSTS:
            self.send_error(421)
            return None
        path = self.path.split('?', 1)[0]
        if path == '/':
            self.send_response(302)
            self.send_header('Location', '/HizliOkuma.html')
            self.end_headers()
            return None
        if not ALLOWED.fullmatch(path):
            self.send_error(404)
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', CSP)
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('X-Hizli-Okuma', '1')
        super().end_headers()

    def log_message(self, *args):
        pass


class Server(http.server.ThreadingHTTPServer):
    # Windows'ta SO_REUSEADDR başka programın kullandığı porta bağlanmaya izin verir; kapat ve portu sahiplen
    allow_reuse_address = False

    def server_bind(self):
        if hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def is_ours():
    """Port doluysa: onu tutan zaten Hızlı Okuma mı?"""
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(URL, timeout=2) as r:
            return r.headers.get('X-Hizli-Okuma') == '1'
    except Exception:
        return False


def warn(msg):
    try:
        ctypes.windll.user32.MessageBoxW(None, msg, 'Hızlı Okuma', 0x30)
    except Exception:
        print(msg)
        input('Kapatmak icin Enter...')


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    try:
        server = Server(('127.0.0.1', PORT), Handler)
    except OSError:
        if is_ours():
            webbrowser.open(URL)   # program zaten açık: sadece tarayıcıyı aç
        else:
            warn(f'{PORT} portunu başka bir program kullanıyor, Hızlı Okuma açılamadı.\n'
                 'Güvenlik için tarayıcı açılmadı. O programı kapatıp tekrar dene.')
        sys.exit(0)
    print(f'Hizli Okuma sunucusu: {URL} (kapatmak icin bu pencereyi kapat)')
    if '--ac' in sys.argv:
        threading.Timer(0.3, webbrowser.open, [URL]).start()
    server.serve_forever()
