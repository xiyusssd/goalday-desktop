#!/usr/bin/env python3
"""Compose a macOS-style app icon with transparent corners + padded artwork.

Usage: make_icon.py <source-art-png> <out-png>
"""
import sys
from PIL import Image, ImageDraw

SRC, OUT = sys.argv[1], sys.argv[2]
SIZE = 1024
MARGIN = 100                      # transparent gutter around the squircle
RADIUS = 230                      # corner radius (soft, Apple-ish)
INNER = SIZE - 2 * MARGIN         # white square side (824)
ART = 600                         # artwork box (padded well inside)

# Rounded-rect alpha mask for the icon body.
mask = Image.new("L", (SIZE, SIZE), 0)
ImageDraw.Draw(mask).rounded_rectangle(
    [MARGIN, MARGIN, SIZE - MARGIN, SIZE - MARGIN], radius=RADIUS, fill=255
)

# White body + centered artwork.
body = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 255))
art = Image.open(SRC).convert("RGBA")
art.thumbnail((ART, ART), Image.LANCZOS)
ax = (SIZE - art.width) // 2
ay = (SIZE - art.height) // 2
body.paste(art, (ax, ay), art)

# Composite body through the rounded mask onto a transparent canvas.
out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
out.paste(body, (0, 0), mask)

# Subtle inner ring so the white body still has an edge on light backgrounds.
ring = ImageDraw.Draw(out)
ring.rounded_rectangle(
    [MARGIN + 3, MARGIN + 3, SIZE - MARGIN - 3, SIZE - MARGIN - 3],
    radius=RADIUS - 3, outline=(150, 170, 190, 90), width=6,
)

out.save(OUT)
print("wrote", OUT, out.size)
