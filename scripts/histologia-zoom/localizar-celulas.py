"""
Localiza células nucleadas raras (leucócitos num esfregaço, mitoses etc.) e monta
um mosaico numerado de candidatos em alta ampliação, para classificação visual.

  python localizar-celulas.py --slug sangue-periferico-may-grunwald-giemsa \
      --regiao 0.2,0.1,0.8,0.6 --largura 6000 --max 48 --lado 0.0012 --saida m.png

Detecção: pixels roxos-escuros (núcleos corados por Giemsa/hematoxilina) após
desfoque; componentes conectados com área plausível viram candidatos. Imprime um
JSON com o centro de cada candidato em coordenadas de viewport.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recorte import fonte_da_lamina, fonte_texto, montar  # noqa: E402


def candidatos(img: Image.Image, area_min: int, area_max: int):
    px = img.filter(ImageFilter.GaussianBlur(1)).load()
    w, h = img.size
    marca = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if b > 90 and g < 120 and r < 170 and (b - g) > 35 and (r + g + b) < 420:
                marca[y * w + x] = 1
    vistos = bytearray(w * h)
    saida = []
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if not marca[i] or vistos[i]:
                continue
            pilha = [i]
            vistos[i] = 1
            sx = sy = n = 0
            while pilha:
                j = pilha.pop()
                jx, jy = j % w, j // w
                sx += jx
                sy += jy
                n += 1
                for k in (j - 1, j + 1, j - w, j + w):
                    if 0 <= k < w * h and not vistos[k] and marca[k] and abs((k % w) - jx) <= 1:
                        vistos[k] = 1
                        pilha.append(k)
            if area_min <= n <= area_max:
                saida.append((sx / n, sy / n, n))
    return saida


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', required=True)
    ap.add_argument('--regiao', default=None)
    ap.add_argument('--largura', type=int, default=5000)
    ap.add_argument('--area', default='6,4000')
    ap.add_argument('--max', type=int, default=40)
    ap.add_argument('--lado', type=float, default=0.001, help='lado do recorte de cada candidato (viewport)')
    ap.add_argument('--celula', type=int, default=180)
    ap.add_argument('--saida', required=True)
    a = ap.parse_args()

    fonte = fonte_da_lamina(a.slug)
    alt = fonte.altura / fonte.largura
    x0, y0, x1, y1 = [float(v) for v in a.regiao.split(',')] if a.regiao else (0, 0, 1, alt)
    img = montar(fonte, x0, y0, x1, y1, a.largura)
    amin, amax = [int(v) for v in a.area.split(',')]
    cands = candidatos(img, amin, amax)
    esc = (x1 - x0) / img.width
    # Espalha a amostra pela lâmina: ordena por área e pega de faixas diferentes.
    cands.sort(key=lambda c: -c[2])
    escolhidos = []
    for cx, cy, n in cands:
        vx, vy = x0 + cx * esc, y0 + cy * esc
        if all(abs(vx - ex) > a.lado * 1.5 or abs(vy - ey) > a.lado * 1.5 for ex, ey, _ in escolhidos):
            escolhidos.append((vx, vy, n))
        if len(escolhidos) >= a.max:
            break
    if not escolhidos:
        print(json.dumps({'total': len(cands), 'candidatos': []}))
        return
    cols = 8
    L = a.celula
    mosaico = Image.new('RGB', (cols * L, ((len(escolhidos) + cols - 1) // cols) * L), (0, 0, 0))
    d = ImageDraw.Draw(mosaico)
    f = fonte_texto(14)
    for i, (vx, vy, _) in enumerate(escolhidos):
        h = a.lado / 2
        rec = montar(fonte, vx - h, vy - h, vx + h, vy + h, L)
        mosaico.paste(rec.crop((0, 0, L, L)), ((i % cols) * L, (i // cols) * L))
        d.text(((i % cols) * L + 3, (i // cols) * L + 2), str(i), fill=(255, 255, 0), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
    mosaico.save(a.saida)
    print(json.dumps({'total': len(cands), 'candidatos': [[i, round(vx, 5), round(vy, 5)] for i, (vx, vy, _) in enumerate(escolhidos)]}))


if __name__ == '__main__':
    main()
