import http.server
import socketserver

PORT = 8000

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        if path.endswith('.html'):
            return 'text/html'
        return super().guess_type(path)

# Allow socket reuse to prevent port-in-use errors during quick restarts
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
