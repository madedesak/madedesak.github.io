import functools
import http.server
import socketserver

DIRECTORY = "/Users/bytedance/Downloads/Test"
PORT = 4521

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIRECTORY)
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    httpd.serve_forever()
