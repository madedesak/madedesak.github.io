#!/usr/bin/env python3
"""Dev server with live reload for this static site.

Run:  python3 serve.py
Then open http://localhost:5500  (it also opens automatically).
Saving any .html / .css / .js / asset auto-refreshes the browser.
Stop with Ctrl-C.
"""
from livereload import Server

server = Server()

# Refresh the browser whenever any of these change.
for pattern in ("index.html", "case-onboarding.html", "*.css", "*.js", "assets/*"):
    server.watch(pattern)

server.serve(root=".", host="127.0.0.1", port=8000, open_url=True)
