#!/usr/bin/env python3
"""
Génère les icônes de l'application ColorFlow (app icon + tray icons) à partir
de formes vectorielles simples dessinées avec Pillow. Aucun asset externe requis.

Usage: python3 scripts/generate-icons.py
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR = os.path.join(ROOT, "build")
TRAY_DIR = os.path.join(ROOT, "electron", "resources")

os.makedirs(BUILD_DIR, exist_ok=True)
os.makedirs(TRAY_DIR, exist_ok=True)


def rounded_rect_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def vertical_gradient(size, top, bottom):
    grad = Image.new("RGB", (1, size), 0)
    for y in range(size):
        t = y / max(size - 1, 1)
        r = round(top[0] + (bottom[0] - top[0]) * t)
        g = round(top[1] + (bottom[1] - top[1]) * t)
        b = round(top[2] + (bottom[2] - top[2]) * t)
        grad.putpixel((0, y), (r, g, b))
    return grad.resize((size, size))


def draw_pipette(draw: ImageDraw.ImageDraw, size: int):
    """Dessine une pipette stylisée orientée en diagonale, pointe en bas-gauche."""
    cx, cy = size / 2, size / 2
    length = size * 0.62
    width = size * 0.115
    angle = math.radians(-45)

    dx, dy = math.cos(angle), math.sin(angle)
    nx, ny = -dy, dx

    tip = (cx - dx * length * 0.55, cy - dy * length * 0.55)
    tail = (cx + dx * length * 0.55, cy + dy * length * 0.55)

    def quad(p0, p1, w0, w1):
        return [
            (p0[0] + nx * w0, p0[1] + ny * w0),
            (p1[0] + nx * w1, p1[1] + ny * w1),
            (p1[0] - nx * w1, p1[1] - ny * w1),
            (p0[0] - nx * w0, p0[1] - ny * w0),
        ]

    body_end = (
        cx + dx * length * 0.12,
        cy + dy * length * 0.12,
    )

    draw.polygon(quad(tip, body_end, width * 0.35, width * 0.62), fill=(226, 232, 240, 255))
    draw.polygon(quad(body_end, tail, width, width * 0.78), fill=(241, 245, 249, 255))

    for p, r, col in (
        (tip, width * 0.42, (203, 213, 225, 255)),
        (tail, width * 0.86, (226, 232, 240, 255)),
    ):
        draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=col)

    drop_r = size * 0.075
    drop_c = (tip[0] - dx * drop_r * 1.6, tip[1] - dy * drop_r * 1.6)
    for i, (col) in enumerate(
        [(99, 102, 241, 255), (236, 72, 153, 255), (250, 204, 21, 255)]
    ):
        r = drop_r * (1 - i * 0.22)
        off = drop_r * 0.28 * i
        draw.ellipse(
            [
                drop_c[0] - r + off * 0.4,
                drop_c[1] - r + off * 0.4,
                drop_c[0] + r + off * 0.4,
                drop_c[1] + r + off * 0.4,
            ],
            fill=col,
        )


def make_app_icon(size: int) -> Image.Image:
    scale = 4
    big = size * scale
    base = vertical_gradient(big, (24, 24, 30), (9, 9, 12))
    mask = rounded_rect_mask(big, int(big * 0.22))
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    img.paste(base, (0, 0), mask)

    draw = ImageDraw.Draw(img)
    border = int(big * 0.012)
    draw.rounded_rectangle(
        [border, border, big - border, big - border],
        radius=int(big * 0.22),
        outline=(255, 255, 255, 40),
        width=max(border, 2),
    )

    draw_pipette(draw, big)

    img = img.resize((size, size), Image.LANCZOS)
    return img


def make_tray_icon(size: int, dark: bool) -> Image.Image:
    scale = 4
    big = size * scale
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    color = (255, 255, 255, 255) if dark else (20, 20, 24, 255)
    cx, cy = big / 2, big / 2
    r = big * 0.30
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=int(big * 0.09))
    dot_r = big * 0.09
    draw.ellipse(
        [cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r],
        fill=color,
    )
    img = img.filter(ImageFilter.GaussianBlur(0))
    return img.resize((size, size), Image.LANCZOS)


def save_ico(base_img: Image.Image, path: str):
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    # Pillow régénère chaque résolution à partir de `base_img` (haute résolution) :
    # ne PAS pré-redimensionner l'image passée, sinon toutes les tailles sont dérivées
    # de la plus petite et l'ICO final ne contient qu'une seule résolution utilisable.
    base_img.save(path, format="ICO", sizes=sizes)


if __name__ == "__main__":
    icon_512 = make_app_icon(512)
    icon_512.save(os.path.join(BUILD_DIR, "icon.png"))
    save_ico(icon_512, os.path.join(BUILD_DIR, "icon.ico"))

    for s in (16, 32):
        make_tray_icon(s, dark=True).save(os.path.join(TRAY_DIR, f"tray-icon-{s}.png"))
        make_tray_icon(s * 2, dark=True).save(os.path.join(TRAY_DIR, f"tray-icon-{s}@2x.png"))

    icon_512.resize((256, 256), Image.LANCZOS).save(os.path.join(TRAY_DIR, "app-icon-256.png"))

    print("Icônes générées avec succès dans build/ et electron/resources/")
