"""
Escreve o arquivo de anotações de uma lâmina a partir de uma especificação
compacta em Python e, em seguida, desenha as marcações sobre a própria lâmina
para conferência visual.

Uso (num script de curadoria):

    from anotar import *
    salvar('medula-espinal-tionina-2', [
        est('canal', 'canal-central', elipse(0.705, 0.044, 0.03, 0.026)),
        est('mn', 'motoneuronio-alfa', seta(0.151, 0.172, 225), rotulo='...'),
    ], conferencias=2)
    conferir('medula-espinal-tionina-2', saida='c.png')

Coordenadas em fração da largura da lâmina (as mesmas do visualizador).
Seta: `ponta` é onde ela toca a estrutura; `angulo` é o sentido em que aponta
(0 = para a direita, 90 = para baixo, 180 = para a esquerda, 270 = para cima).
"""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
PASTA = RAIZ / 'data' / 'histologia-zoom' / 'anotacoes'
AQUI = Path(__file__).resolve().parent


def r4(v: float) -> float:
    return round(float(v), 4)


def seta(x: float, y: float, angulo: float = 45) -> dict:
    return {'tipo': 'seta', 'ponta': [r4(x), r4(y)], 'angulo': int(angulo) % 360}


def contorno(*pontos) -> dict:
    return {'tipo': 'contorno', 'pontos': [[r4(x), r4(y)] for x, y in pontos]}


def elipse(cx: float, cy: float, rx: float, ry: float) -> dict:
    return {'tipo': 'elipse', 'centro': [r4(cx), r4(cy)], 'raios': [r4(rx), r4(ry)]}


def est(id: str, estrutura: str, *marcas, rotulo: str | None = None, nota: str | None = None, vista=None) -> dict:
    d = {'id': id, 'estrutura': estrutura}
    if rotulo:
        d['rotulo'] = rotulo
    d['marcas'] = list(marcas)
    if vista:
        d['vista'] = [r4(v) for v in vista]
    if nota:
        d['nota'] = nota
    return d


def salvar(slug: str, estruturas: list, conferencias: int = 1) -> Path:
    ids = [e['id'] for e in estruturas]
    if len(ids) != len(set(ids)):
        sys.exit(f'ids repetidos em {slug}')
    doc = {
        'slug': slug,
        'revisao': {
            'por': 'Curadoria assistida (Claude) — marcações conferidas sobre recortes da própria lâmina',
            'data': date.today().isoformat(),
            'conferencias': conferencias,
        },
        'estruturas': estruturas,
    }
    PASTA.mkdir(parents=True, exist_ok=True)
    arq = PASTA / f'{slug}.json'
    arq.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return arq


def conferir(slug: str, saida: str, regiao: str | None = None, largura: int = 1300, so: str | None = None):
    cmd = [sys.executable, str(AQUI / 'recorte.py'), '--slug', slug, '--anotacoes', '--largura', str(largura), '--saida', saida]
    if regiao:
        cmd += ['--regiao', regiao]
    if so:
        cmd += ['--estrutura', so]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)
