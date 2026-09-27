#!/usr/bin/env python3
"""
Painel de curadoria: várias regiões de uma lâmina lado a lado, numa imagem só.

Cada quadro tem grade de coordenadas de viewport e, opcionalmente, as
marcações já registradas — é a forma de conferir várias estruturas de uma vez.

Uso:
  python painel.py --slug SLUG --saida p.png \
      --quadro 0.30,0.31,0.36,0.37,0.005 --quadro 0.40,0.49,0.43,0.52,0.002 [--anotacoes] [--largura 520]
"""

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
import recorte  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', required=True)
    ap.add_argument('--quadro', action='append', required=True, help='x0,y0,x1,y1[,grade]')
    ap.add_argument('--largura', type=int, default=520)
    ap.add_argument('--colunas', type=int, default=0)
    ap.add_argument('--anotacoes', action='store_true')
    ap.add_argument('--saida', required=True)
    a = ap.parse_args()

    fonte = recorte.fonte_da_lamina(a.slug)
    anot = None
    if a.anotacoes:
        arq = recorte.ANOTACOES / f'{a.slug}.json'
        if arq.exists():
            anot = json.loads(arq.read_text(encoding='utf-8'))
    imgs = []
    for q in a.quadro:
        v = [float(t) for t in q.split(',')]
        x0, y0, x1, y1 = v[:4]
        img = recorte.montar(fonte, x0, y0, x1, y1, a.largura)
        if len(v) > 4 and v[4] > 0:
            recorte.grade(img, x0, y0, x1, y1, v[4])
        if anot:
            recorte.desenhar_anotacoes(img, x0, y0, x1, y1, anot, None)
        imgs.append(img)
    cols = a.colunas or min(3, len(imgs))
    linhas = (len(imgs) + cols - 1) // cols
    alt = max(i.height for i in imgs)
    folha = Image.new('RGB', (cols * a.largura + (cols - 1) * 8, linhas * alt + (linhas - 1) * 8), (0, 0, 0))
    for i, img in enumerate(imgs):
        folha.paste(img, ((i % cols) * (a.largura + 8), (i // cols) * (alt + 8)))
    folha.save(a.saida)
    print(json.dumps({'saida': a.saida, 'tamanho': folha.size}))


if __name__ == '__main__':
    main()
