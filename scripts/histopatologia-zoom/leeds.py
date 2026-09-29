"""
Ferramenta de curadoria das lâminas de Leeds (Histopatologia com Zoom).

O servidor de imagens de Leeds (Aperio ImageServer) entrega qualquer região
em qualquer redução numa única requisição:

    https://images.virtualpathology.leeds.ac.uk/<caminho>.svs?<esq>+<topo>+<larg>+<alt>+<reducao>+<qualidade>

com `esq`/`topo` em pixels do nível reduzido. Por isso um recorte é um único
pedido, e a inspeção em vários aumentos é barata.

Coordenadas em fração da LARGURA da lâmina (x de 0 a 1; y de 0 a
altura/largura) — as mesmas do visualizador e das anotações.

CLI:
    python leeds.py medir <caminho>
    python leeds.py ver <caminho> [--regiao x0,y0,x1,y1] [--largura 1400] [--grade 0.05]
                        [--slug <slug> (sobrepõe anotações)] [--so <id>] --saida arq.jpg

Uso como módulo (script de curadoria):

    from leeds import *
    salvar('apendicite-aguda-1', [
        pat('neutrofilos-muscular', 'infiltrado-neutrofilico', seta(0.41, 0.33, 45), rotulo='...'),
        est('mucosa', 'mucosa-do-apendice', contorno(...)),
    ], achados=[achado('infiltrado-neutrofilico', 'presente', ['neutrofilos-muscular'], 'nota')])
"""

from __future__ import annotations

import argparse
import io
import json
import math
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parents[2]
CACHE = RAIZ / 'node_modules' / '.cache' / 'hp-leeds'
MEDIDAS = CACHE / 'medidas.json'
ANOTACOES = RAIZ / 'data' / 'histopatologia-zoom' / 'anotacoes'
SITE = 'https://www.virtualpathology.leeds.ac.uk'
IMAGENS = 'https://images.virtualpathology.leeds.ac.uk'
UA = {'User-Agent': 'DomineAqui-curadoria/1.0 (autorizado)'}

CACHE.mkdir(parents=True, exist_ok=True)


def _baixar(url: str, tentativas: int = 6) -> bytes:
    for t in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                return r.read()
        except Exception:
            if t == tentativas - 1:
                raise
            time.sleep(2 + 3 * t)
    raise RuntimeError('inalcançável')


# ─── Medidas ────────────────────────────────────────────────────────────────

def medir(caminho: str) -> dict:
    medidas = json.loads(MEDIDAS.read_text(encoding='utf-8')) if MEDIDAS.exists() else {}
    if caminho in medidas:
        return medidas[caminho]
    # `?INFO` do ImageServer: largura|altura|tileL|tileA||descrição Aperio (AppMag, MPP, Date…).
    info = _baixar(f'{IMAGENS}{urllib.parse.quote(caminho)}?INFO').decode('utf-8', 'replace')
    partes = info.split('|')
    if len(partes) < 3 or not partes[0].strip().isdigit():
        raise SystemExit(f'sem dimensões para {caminho}: {info[:120]}')
    obj = re.search(r'AppMag = ([\d.]+)', info)
    mpp = re.search(r'MPP = ([\d.]+)', info)
    data = re.search(r'Date = ([\d/]+)', info)
    d = {
        'largura': int(partes[0]),
        'altura': int(partes[1]),
        'objetiva': float(obj.group(1)) if obj else None,
        'mpp': float(mpp.group(1)) if mpp else None,
        'escaneada': data.group(1) if data else None,
    }
    if not d['largura'] or not d['altura']:
        raise SystemExit(f'dimensões nulas para {caminho}')
    medidas[caminho] = d
    MEDIDAS.write_text(json.dumps(medidas, ensure_ascii=False, indent=1), encoding='utf-8')
    return d


# ─── Recorte ────────────────────────────────────────────────────────────────

def regiao(caminho: str, x0: float, y0: float, x1: float, y1: float, largura_saida: int = 1400) -> Image.Image:
    m = medir(caminho)
    W, H = m['largura'], m['altura']
    px0, py0, px1, py1 = x0 * W, y0 * W, x1 * W, y1 * W
    reducao = max(1.0, (px1 - px0) / largura_saida)
    # Redução em potência de 2 abaixo da pedida: o servidor lê do nível nativo
    # mais próximo e o resto é reamostrado aqui, com LANCZOS.
    red = 2 ** math.floor(math.log2(reducao))
    esq, topo = int(px0 / red), int(py0 / red)
    larg, alt = max(1, int((px1 - px0) / red)), max(1, int((py1 - py0) / red))
    # O servidor corta pedidos acima de 2000 px: divide em blocos desse tamanho.
    lona = Image.new('RGB', (larg, alt), (255, 255, 255))
    B = 2000
    for by in range(0, alt, B):
        for bx in range(0, larg, B):
            w, h = min(B, larg - bx), min(B, alt - by)
            url = f'{IMAGENS}{urllib.parse.quote(caminho)}?{esq + bx}+{topo + by}+{w}+{h}+{red}+90'
            chave = CACHE / 'recortes' / (re.sub(r'[^A-Za-z0-9]+', '_', caminho)[-80:] + f'_{esq + bx}_{topo + by}_{w}_{h}_{red}.jpg')
            if chave.exists():
                dados = chave.read_bytes()
            else:
                dados = _baixar(url)
                chave.parent.mkdir(parents=True, exist_ok=True)
                chave.write_bytes(dados)
            lona.paste(Image.open(io.BytesIO(dados)).convert('RGB'), (bx, by))
    alt_saida = max(1, round(largura_saida * alt / larg))
    if larg != largura_saida:
        lona = lona.resize((largura_saida, alt_saida), Image.LANCZOS)
    return lona


# ─── Desenho ───────────────────────────────────────────────────────────────

def _fonte(t: int):
    for n in ('arial.ttf', 'DejaVuSans.ttf', 'segoeui.ttf'):
        try:
            return ImageFont.truetype(n, t)
        except Exception:
            pass
    return ImageFont.load_default()


def grade(img, x0, y0, x1, y1, passo):
    d = ImageDraw.Draw(img, 'RGBA')
    f = _fonte(13)
    px = lambda x: (x - x0) / (x1 - x0) * img.width
    py = lambda y: (y - y0) / (y1 - y0) * img.height
    casas = max(2, -int(math.floor(math.log10(passo))) + 1)
    v = math.ceil(x0 / passo) * passo
    while v <= x1:
        X = px(v)
        d.line([(X, 0), (X, img.height)], fill=(0, 255, 255, 100), width=1)
        d.text((X + 2, 2), f'{v:.{casas}f}', fill=(0, 255, 255, 255), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
        v += passo
    v = math.ceil(y0 / passo) * passo
    while v <= y1:
        Y = py(v)
        d.line([(0, Y), (img.width, Y)], fill=(255, 255, 0, 100), width=1)
        d.text((2, Y + 2), f'{v:.{casas}f}', fill=(255, 255, 0, 255), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
        v += passo


def desenhar(img, x0, y0, x1, y1, anot: dict, so: str | None = None):
    d = ImageDraw.Draw(img, 'RGBA')
    f = _fonte(14)
    px = lambda x: (x - x0) / (x1 - x0) * img.width
    py = lambda y: (y - y0) / (y1 - y0) * img.height
    for e in anot.get('marcacoes', []):
        if so and e['id'] != so:
            continue
        patologica = e.get('categoria') == 'patologica'
        cor = (255, 40, 120) if patologica else (255, 210, 0)
        for m in e['marcas']:
            if m['tipo'] == 'contorno':
                pts = [(px(x), py(y)) for x, y in m['pontos']]
                d.line(pts + [pts[0]], fill=(0, 0, 0, 200), width=6)
                d.line(pts + [pts[0]], fill=cor + (255,), width=3)
                ax, ay = pts[0]
            elif m['tipo'] == 'elipse':
                (cx, cy), (rx, ry) = m['centro'], m['raios']
                box = [px(cx - rx), py(cy - ry), px(cx + rx), py(cy + ry)]
                d.ellipse(box, outline=(0, 0, 0, 200), width=6)
                d.ellipse(box, outline=cor + (255,), width=3)
                ax, ay = px(cx), py(cy - ry)
            else:
                tx, ty = m['ponta']
                a = math.radians(m.get('angulo', 45))
                X, Y = px(tx), py(ty)
                L = 60
                bx, by = X - math.cos(a) * L, Y - math.sin(a) * L
                for largura, c in ((8, (0, 0, 0, 220)), (4, cor + (255,))):
                    d.line([(bx, by), (X, Y)], fill=c, width=largura)
                    for s in (-0.45, 0.45):
                        d.line([(X, Y), (X - math.cos(a + s) * 16, Y - math.sin(a + s) * 16)], fill=c, width=largura)
                ax, ay = bx, by
            d.text((ax + 4, ay - 18), ('⚠ ' if patologica else '') + e['id'], fill=cor + (255,), font=f,
                   stroke_width=3, stroke_fill=(0, 0, 0))


def ver(caminho: str, saida: str, regiao_=None, largura: int = 1400, passo: float = 0, slug: str | None = None,
        so: str | None = None) -> dict:
    m = medir(caminho)
    alt = m['altura'] / m['largura']
    x0, y0, x1, y1 = regiao_ or (0, 0, 1, alt)
    img = regiao(caminho, x0, y0, x1, y1, largura)
    if passo:
        grade(img, x0, y0, x1, y1, passo)
    if slug:
        arq = ANOTACOES / f'{slug}.json'
        if arq.exists():
            desenhar(img, x0, y0, x1, y1, json.loads(arq.read_text(encoding='utf-8')), so)
    img.save(saida, quality=90)
    um_px = (x1 - x0) * m['largura'] / img.width
    return {'saida': saida, 'tamanho': img.size, 'altura_viewport': round(alt, 4), 'regiao': [x0, y0, x1, y1],
            'pixels_da_lamina_por_pixel': round(um_px, 2), 'objetiva': m['objetiva']}


# ─── Anotações ─────────────────────────────────────────────────────────────

def r4(v):
    return round(float(v), 4)


def seta(x, y, angulo=45):
    return {'tipo': 'seta', 'ponta': [r4(x), r4(y)], 'angulo': int(angulo) % 360}


def contorno(*pontos):
    return {'tipo': 'contorno', 'pontos': [[r4(x), r4(y)] for x, y in pontos]}


def elipse(cx, cy, rx, ry):
    return {'tipo': 'elipse', 'centro': [r4(cx), r4(cy)], 'raios': [r4(rx), r4(ry)]}


def _marcacao(id, chave, marcas, categoria, rotulo, nota, vista):
    d = {'id': id, 'estrutura': chave}
    if categoria:
        d['categoria'] = categoria
    if rotulo:
        d['rotulo'] = rotulo
    d['marcas'] = list(marcas)
    if vista:
        d['vista'] = [r4(v) for v in vista]
    if nota:
        d['nota'] = nota
    return d


def est(id, estrutura, *marcas, rotulo=None, nota=None, vista=None):
    """Estrutura histológica (glossário da Histologia com Zoom)."""
    return _marcacao(id, estrutura, marcas, None, rotulo, nota, vista)


def pat(id, achado, *marcas, rotulo=None, nota=None, vista=None):
    """Achado histopatológico (glossário de achados)."""
    return _marcacao(id, achado, marcas, 'patologica', rotulo, nota, vista)


def achado(id, status, marcacoes=(), nota=''):
    """Situação de um achado da doença NESTA lâmina: presente | ausente | nao-avaliavel."""
    assert status in ('presente', 'ausente', 'nao-avaliavel'), status
    d = {'achado': id, 'status': status}
    if marcacoes:
        d['marcacoes'] = list(marcacoes)
    if nota:
        d['nota'] = nota
    return d


def salvar(slug: str, marcacoes: list, achados: list, conferencias: int = 3, resumo: str = '') -> Path:
    ids = [e['id'] for e in marcacoes]
    if len(ids) != len(set(ids)):
        sys.exit(f'ids repetidos em {slug}')
    for a in achados:
        for m in a.get('marcacoes', []):
            if m not in ids:
                sys.exit(f'{slug}: achado {a["achado"]} aponta marcação inexistente {m}')
    doc = {
        'slug': slug,
        'revisao': {
            'por': 'Curadoria assistida (Claude) — cada marcação conferida em vários aumentos sobre recortes da própria lâmina',
            'data': date.today().isoformat(),
            'conferencias': conferencias,
        },
        'resumo': resumo,
        'marcacoes': marcacoes,
        'achados': achados,
    }
    ANOTACOES.mkdir(parents=True, exist_ok=True)
    arq = ANOTACOES / f'{slug}.json'
    arq.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return arq


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    a1 = sub.add_parser('medir')
    a1.add_argument('caminho')
    a2 = sub.add_parser('ver')
    a2.add_argument('caminho')
    a2.add_argument('--regiao', default=None)
    a2.add_argument('--largura', type=int, default=1400)
    a2.add_argument('--grade', type=float, default=0)
    a2.add_argument('--slug', default=None)
    a2.add_argument('--so', default=None)
    a2.add_argument('--saida', required=True)
    a = ap.parse_args()
    if a.cmd == 'medir':
        print(json.dumps(medir(a.caminho)))
    else:
        reg = [float(v) for v in a.regiao.split(',')] if a.regiao else None
        print(json.dumps(ver(a.caminho, a.saida, reg, a.largura, a.grade, a.slug, a.so)))


if __name__ == '__main__':
    main()
