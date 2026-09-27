"""
Correção pontual de marcações existentes.

  python corrigir.py ver  <slug> <id> [indice] --saida x.png [--lado 0.01] [--grade 0.001]
      Recorte com grade fina em volta da marca (ou da vista), com a marca desenhada.
  python corrigir.py seta <slug> <id> <indice> <x> <y> [angulo]
  python corrigir.py elipse <slug> <id> <indice> <cx> <cy> <rx> <ry>
  python corrigir.py vista <slug> <id> <x0> <y0> <x1> <y1>
  python corrigir.py rotulo <slug> <id> "novo rótulo"
  python corrigir.py estrutura <slug> <id> <novo-id-do-verbete>
  python corrigir.py remover <slug> <id> [indice]

Cada edição incrementa `revisao.conferencias` e atualiza a data.
"""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recorte import desenhar_anotacoes, fonte_da_lamina, grade, montar  # noqa: E402

ANOT = Path(__file__).resolve().parents[2] / 'data' / 'histologia-zoom' / 'anotacoes'


def carregar(slug):
    return json.loads((ANOT / f'{slug}.json').read_text(encoding='utf-8'))


def gravar(slug, doc):
    doc['revisao']['data'] = date.today().isoformat()
    doc['revisao']['conferencias'] = max(3, doc['revisao'].get('conferencias', 1))
    (ANOT / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def achar(doc, id_):
    for e in doc['estruturas']:
        if e['id'] == id_:
            return e
    sys.exit(f'id não encontrado: {id_}')


def centro(e, idx):
    ms = e['marcas'] if idx is None else [e['marcas'][idx]]
    pts = []
    for m in ms:
        if m['tipo'] == 'seta':
            pts.append(m['ponta'])
        elif m['tipo'] == 'elipse':
            pts.append(m['centro'])
        else:
            pts += m['pontos']
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def main():
    a = sys.argv[1:]
    cmd, slug, id_ = a[0], a[1], a[2]
    doc = carregar(slug)
    e = achar(doc, id_)
    r4 = lambda v: round(float(v), 5)
    if cmd == 'ver':
        idx = int(a[3]) if len(a) > 3 and not a[3].startswith('--') else None
        opts = dict(zip(a[::1], a[1::1]))
        saida = opts['--saida']
        lado = float(opts.get('--lado', 0))
        g = float(opts.get('--grade', 0.001))
        f = fonte_da_lamina(slug)
        if lado:
            cx, cy = centro(e, idx)
            x0, y0, x1, y1 = cx - lado / 2, cy - lado / 2, cx + lado / 2, cy + lado / 2
        else:
            x0, y0, x1, y1 = e.get('vista') or (0, 0, 1, f.altura / f.largura)
        im = montar(f, x0, y0, x1, y1, 560).convert('RGB')
        grade(im, x0, y0, x1, y1, g)
        so = dict(e, marcas=[e['marcas'][idx]]) if idx is not None else e
        desenhar_anotacoes(im, x0, y0, x1, y1, {'estruturas': [so]}, None)
        im.save(saida)
        print(json.dumps({'marcas': e['marcas'], 'vista': e.get('vista'), 'regiao': [x0, y0, x1, y1]}))
        return
    if cmd == 'seta':
        i = int(a[3])
        m = e['marcas'][i]
        ang = int(a[6]) if len(a) > 6 else m.get('angulo', 45)
        e['marcas'][i] = {'tipo': 'seta', 'ponta': [r4(a[4]), r4(a[5])], 'angulo': ang % 360}
    elif cmd == 'elipse':
        i = int(a[3])
        e['marcas'][i] = {'tipo': 'elipse', 'centro': [r4(a[4]), r4(a[5])], 'raios': [r4(a[6]), r4(a[7])]}
    elif cmd == 'vista':
        e['vista'] = [r4(v) for v in a[3:7]]
    elif cmd == 'semvista':
        e.pop('vista', None)
    elif cmd == 'rotulo':
        e['rotulo'] = a[3]
    elif cmd == 'estrutura':
        e['estrutura'] = a[3]
    elif cmd == 'remover':
        if len(a) > 3:
            del e['marcas'][int(a[3])]
        else:
            doc['estruturas'] = [x for x in doc['estruturas'] if x['id'] != id_]
    else:
        sys.exit('comando desconhecido')
    gravar(slug, doc)
    print('ok')


if __name__ == '__main__':
    main()
