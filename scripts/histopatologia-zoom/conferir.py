"""
Prancha de conferência: cada marcação da lâmina desenhada no seu próprio
enquadramento (a `vista` que o visualizador usa), lado a lado, com o id.

    python conferir.py <caminho-do-svs> <slug> --saida prancha.jpg [--lado 520] [--so id1,id2]
"""

from __future__ import annotations

import argparse
import json

from PIL import Image, ImageDraw

from leeds import ANOTACOES, _fonte, desenhar, medir, regiao


def envelope(m, alt):
    pts = []
    for k in m['marcas']:
        if k['tipo'] == 'seta':
            pts.append(k['ponta'])
        elif k['tipo'] == 'contorno':
            pts += k['pontos']
        else:
            (cx, cy), (rx, ry) = k['centro'], k['raios']
            pts += [[cx - rx, cy - ry], [cx + rx, cy + ry]]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    if m.get('vista'):
        x0, y0, x1, y1 = m['vista']
        w, h = x1 - x0, y1 - y0
        cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
        if max(xs) - min(xs) <= w and max(ys) - min(ys) <= h:
            return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]
        return m['vista']
    f = max((max(xs) - min(xs)) * 0.35, (max(ys) - min(ys)) * 0.35, 0.0025)
    return [min(xs) - f, min(ys) - f, max(xs) + f, max(ys) + f]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('caminho')
    ap.add_argument('slug')
    ap.add_argument('--saida', required=True)
    ap.add_argument('--lado', type=int, default=520)
    ap.add_argument('--so', default=None)
    a = ap.parse_args()
    anot = json.loads((ANOTACOES / f'{a.slug}.json').read_text(encoding='utf-8'))
    m0 = medir(a.caminho)
    alt = m0['altura'] / m0['largura']
    so = set(a.so.split(',')) if a.so else None
    quadros = []
    for m in anot['marcacoes']:
        if so and m['id'] not in so:
            continue
        x0, y0, x1, y1 = envelope(m, alt)
        # quadrado centrado, para uma prancha regular
        lado = max(x1 - x0, y1 - y0)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        x0, x1, y0, y1 = cx - lado / 2, cx + lado / 2, cy - lado / 2, cy + lado / 2
        img = regiao(a.caminho, x0, y0, x1, y1, a.lado)
        desenhar(img, x0, y0, x1, y1, {'marcacoes': [m]})
        d = ImageDraw.Draw(img)
        d.rectangle([0, 0, a.lado, 22], fill=(0, 0, 0))
        d.text((4, 3), f"{m['id']} → {m['estrutura']}", fill=(255, 255, 255), font=_fonte(14))
        quadros.append(img)
    cols = min(4, len(quadros))
    linhas = (len(quadros) + cols - 1) // cols
    prancha = Image.new('RGB', (cols * a.lado, linhas * a.lado), (40, 40, 40))
    for i, q in enumerate(quadros):
        prancha.paste(q.crop((0, 0, a.lado, a.lado)), ((i % cols) * a.lado, (i // cols) * a.lado))
    prancha.save(a.saida, quality=85)
    print(f'{len(quadros)} quadros -> {a.saida}')


if __name__ == '__main__':
    main()
