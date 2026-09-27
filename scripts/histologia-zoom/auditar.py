"""
Auditoria visual das marcações: renderiza cada marcação como o aluno a vê ao
tocar no catálogo (mesma vista do visualizador, só aquela estrutura desenhada)
e monta folhas numeradas para revisão.

  python auditar.py --saida pasta/ [--slug a,b] [--por-folha 12] [--lado 300]

Cada quadro traz: nº, lâmina, id da marcação, nome do verbete (ou rótulo).
Setas espalhadas (várias setas) viram um quadro por seta, como no visualizador.
"""

from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recorte import desenhar_anotacoes, fonte_da_lamina, fonte_texto, montar  # noqa: E402

RAIZ = Path(__file__).resolve().parents[2]
ANOT = RAIZ / 'data' / 'histologia-zoom' / 'anotacoes'


def pontos(m):
    if m['tipo'] == 'seta':
        return [m['ponta']]
    if m['tipo'] == 'contorno':
        return m['pontos']
    (cx, cy), (rx, ry) = m['centro'], m['raios']
    return [[cx - rx, cy - ry], [cx + rx, cy + ry]]


def vistas(e):
    """Espelha vistaDaMarcacao/paradasDaMarcacao (lib/histologia-zoom/desenho-de-marcacoes.ts)."""
    ms = e['marcas']
    if len(ms) > 1 and all(m['tipo'] == 'seta' for m in ms):
        v = e.get('vista')
        meia = max(v[2] - v[0], v[3] - v[1]) / 2 if v else 0.006
        return [((m['ponta'][0] - meia, m['ponta'][1] - meia, m['ponta'][0] + meia, m['ponta'][1] + meia), i) for i, m in enumerate(ms)]
    pts = [p for m in ms for p in pontos(m)]
    x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts)
    y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts)
    v = e.get('vista')
    if v:
        w, h = v[2] - v[0], v[3] - v[1]
        if x1 - x0 <= w and y1 - y0 <= h:
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            return [((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), None)]
        return [(tuple(v), None)]
    f = max((x1 - x0) * 0.35, (y1 - y0) * 0.35, 0.0025)
    return [((x0 - f, y0 - f, x1 + f, y1 + f), None)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--saida', required=True)
    ap.add_argument('--slug', default=None)
    ap.add_argument('--por-folha', type=int, default=12)
    ap.add_argument('--lado', type=int, default=300)
    a = ap.parse_args()

    sys.path.insert(0, str(RAIZ / 'lib'))
    nomes = {}
    for arq in (RAIZ / 'lib' / 'histologia-zoom' / 'estruturas' / 'glossario').glob('*.ts'):
        t = arq.read_text(encoding='utf-8')
        import re
        for m in re.finditer(r"id: '([a-z0-9-]+)',\s*\n\s*nome: '([^']+)'", t):
            nomes[m.group(1)] = m.group(2)

    slugs = a.slug.split(',') if a.slug else sorted(p.stem for p in ANOT.glob('*.json'))
    jobs = []
    for s in slugs:
        doc = json.loads((ANOT / f'{s}.json').read_text(encoding='utf-8'))
        for e in doc['estruturas']:
            for (vx0, vy0, vx1, vy1), k in vistas(e):
                so = dict(e, marcas=[e['marcas'][k]]) if k is not None else e
                jobs.append((s, e, so, (vx0, vy0, vx1, vy1), k))

    L = a.lado
    fonte = {}

    def render(j):
        s, e, so, (x0, y0, x1, y1), k = j
        if s not in fonte:
            fonte[s] = fonte_da_lamina(s)
        # quadro quadrado em volta da vista (o visualizador é mais largo que alto)
        cx, cy, meia = (x0 + x1) / 2, (y0 + y1) / 2, max(x1 - x0, y1 - y0) / 2
        meia = max(meia, 700 / fonte[s].largura / 2)  # CAMPO_MINIMO_EM_PIXELS do visualizador
        x0, y0, x1, y1 = cx - meia, cy - meia, cx + meia, cy + meia
        im = montar(fonte[s], x0, y0, x1, y1, L).convert('RGB')
        im = im.crop((0, 0, L, L)) if im.height >= L else im
        desenhar_anotacoes(im, x0, y0, x1, y1, {'estruturas': [so]}, None)
        return im

    with ThreadPoolExecutor(6) as ex:
        ims = list(ex.map(render, jobs))

    out = Path(a.saida)
    out.mkdir(parents=True, exist_ok=True)
    f = fonte_texto(12)
    cols = 4
    H = L + 34
    indice = []
    for n0 in range(0, len(jobs), a.por_folha):
        bloco = list(range(n0, min(n0 + a.por_folha, len(jobs))))
        folha = Image.new('RGB', (cols * (L + 6), ((len(bloco) + cols - 1) // cols) * (H + 6)), (15, 15, 15))
        d = ImageDraw.Draw(folha)
        for i, n in enumerate(bloco):
            s, e, so, v, k = jobs[n]
            x, y = (i % cols) * (L + 6), (i // cols) * (H + 6)
            folha.paste(ims[n], (x, y + 34))
            nome = e.get('rotulo') or nomes.get(e['estrutura'], e['estrutura'])
            d.text((x + 2, y + 1), f"#{n} {s}"[:48], fill=(255, 255, 0), font=f)
            d.text((x + 2, y + 16), (f"{e['id']}{'' if k is None else f' [{k + 1}]'}: {nome}")[:50], fill=(255, 255, 255), font=f)
            indice.append({'n': n, 'slug': s, 'id': e['id'], 'seta': k, 'nome': nome})
        folha.save(out / f'folha-{n0 // a.por_folha:03d}.jpg', quality=82)
    (out / 'indice.json').write_text(json.dumps(indice, ensure_ascii=False, indent=0), encoding='utf-8')
    print(json.dumps({'quadros': len(jobs), 'folhas': (len(jobs) + a.por_folha - 1) // a.por_folha}))


if __name__ == '__main__':
    main()
