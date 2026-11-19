#!/usr/bin/env python3
"""Build index.html (the website) from page.html (the same page used on claude.ai).

Run:  python3 build.py
page.html is the single source. This adds the page skeleton, the website bridge (shim.js)
and the clinic settings (config.js), and adjusts a few messages that mention claude.ai.
"""
import re, time
src = open("page.html", encoding="utf-8").read()

swaps = {
  "Kiraan disimpan dalam browser ni sahaja (log masuk claude.ai untuk simpan dalam talian).":
    "Database online belum disambung. Kiraan disimpan dalam browser ni sahaja.",
  "Muat turun tak boleh dibuat dalam paparan ni. Buka page ni di claude.ai.":
    "Muat turun tak berjaya. Cuba browser lain.",
}
for a, b in swaps.items():
    src = src.replace(a, b)

v = time.strftime("%Y%m%d%H%M")
head = f"""<!doctype html>
<html lang="ms">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#3b3b9c">
<link rel="icon" href="logo.png">
<link rel="apple-touch-icon" href="logo.png">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);color-scheme:light}}body{{margin:0;font:14px system-ui,-apple-system,"Segoe UI",sans-serif}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
<script src="config.js?v={v}"></script>
<script src="shim.js?v={v}"></script>
</head>
<body>
"""
open("index.html", "w", encoding="utf-8").write(head + src + "\n</body>\n</html>\n")
print("index.html built", v)
