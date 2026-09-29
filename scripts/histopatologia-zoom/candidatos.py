"""
Lista casos do acervo de Leeds cujo diagnóstico casa com uma expressão e
monta uma prancha com as miniaturas das lâminas H&E, numeradas.

    python candidatos.py "acute appendicitis" [--em diagnostico,comentario,clinica] [--max 24] --saida prancha.jpg
"""

from __future__ import annotations

import argparse
import io
import json
import re
import urllib.parse
from pathlib import Path

from PIL import Image, ImageDraw

from leeds import CACHE, IMAGENS, RAIZ, _baixar, _fonte

ACERVO = RAIZ / 'data' / 'histopatologia-zoom' / 'acervo-leeds.json'


def miniatura(caminho: str) -> Image.Image:
    arq = CACHE / 'miniaturas' / (re.sub(r'[^A-Za-z0-9]+', '_', caminho)[-120:] + '.jpg')
    if not arq.exists():
        arq.parent.mkdir(parents=True, exist_ok=True)
        arq.write_bytes(_baixar(f'{IMAGENS}{urllib.parse.quote(caminho)}?-1'))
    return Image.open(io.BytesIO(arq.read_bytes())).convert('RGB')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('expressao')
    ap.add_argument('--em', default='diagnostico,comentario')
    ap.add_argument('--excluir', default=None)
    ap.add_argument('--max', type=int, default=24)
    ap.add_argument('--pular', type=int, default=0)
    ap.add_argument('--saida', required=True)
    a = ap.parse_args()
    rx = re.compile(a.expressao, re.I)
    ex = re.compile(a.excluir, re.I) if a.excluir else None
    campos = a.em.split(',')
    casos = json.loads(ACERVO.read_text(encoding='utf-8'))['casos']
    achados = []
    for c in casos:
        t = ' '.join(str(c.get(k) or '') for k in campos)
        if rx.search(t) and not (ex and ex.search(t)):
            for l in c['laminas']:
                if re.match(r'H\s*&\s*E', l['rotulo'], re.I):
                    achados.append((c, l))
    print(f'{len(achados)} lâminas H&E')
    achados = achados[a.pular:a.pular + a.max]
    lado = 300
    cols = 6
    linhas = (len(achados) + cols - 1) // cols
    prancha = Image.new('RGB', (cols * lado, max(1, linhas) * (lado + 34)), (30, 30, 30))
    d = ImageDraw.Draw(prancha)
    f = _fonte(14)
    for i, (c, l) in enumerate(achados):
        n = a.pular + i
        print(f"[{n}] {c.get('sexo') or '?'} {c.get('idade') or '?'}a | {c.get('diagnostico')} | com: {(c.get('comentario') or '')[:140]} | clin: {(c.get('clinica') or '')[:140]} | {l['caminho']}")
        try:
            m = miniatura(l['caminho'])
        except Exception as e:
            print('   falhou miniatura', e)
            continue
        m.thumbnail((lado - 6, lado - 6))
        x, y = (i % cols) * lado, (i // cols) * (lado + 34)
        prancha.paste(m, (x + 3 + (lado - 6 - m.width) // 2, y + 3 + (lado - 6 - m.height) // 2))
        d.text((x + 6, y + lado + 4), f'[{n}] {(c.get("diagnostico") or "")[:30]}', fill=(255, 255, 255), font=f)
    prancha.save(a.saida, quality=88)


if __name__ == '__main__':
    main()
