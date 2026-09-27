#!/usr/bin/env python3
"""
Recorte de lâmina para curadoria da Histologia com Zoom.

Monta qualquer região de uma lâmina a partir dos tiles — pirâmide do
HistoViewer ou DZI (GTEx) — e desenha, opcionalmente:

* uma **grade de coordenadas** no mesmo sistema do visualizador (coordenadas de
  viewport do OpenSeadragon: x de 0 a 1 na largura da imagem; y na mesma escala,
  de 0 a altura/largura). O que se lê na grade vai direto para o arquivo de
  anotações;
* as **marcações** de um arquivo de anotações (setas, contornos, elipses), para
  conferir se cada uma está exatamente sobre a estrutura antes de publicar.

Uso:
  python recorte.py --fonte hv:Nerve/Sample3/ --regiao 0,0,1,1.2 --largura 1400 --grade 0.1 --saida a.png
  python recorte.py --fonte dzi:https://gtexportal.org/openslide/gtexhip/GTEX-X/GTEX-X-1.dzi --largura 1200 --saida b.png
  python recorte.py --slug medula-espinal-tionina --anotacoes --saida c.png

Os tiles ficam em cache (padrão: pasta temporária), então revisar a mesma região
várias vezes não refaz download.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import os
import sys
import tempfile
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parents[2]
ACERVO_HV = RAIZ / 'data' / 'histologia-zoom' / 'acervo-histoviewer.json'
ACERVO_DZI = RAIZ / 'data' / 'histologia-zoom' / 'acervo-dzi.json'
INDICE = RAIZ / 'data' / 'histologia-zoom' / 'indice-de-laminas.json'
ANOTACOES = RAIZ / 'data' / 'histologia-zoom' / 'anotacoes'
HOST_HV = 'https://histoviewer.biomed.au.dk/imgsets/'
# Cache no disco do projeto (node_modules/.cache): a pasta temporária do sistema costuma estar no C:, que pode lotar.
CACHE = Path(os.environ.get('HZ_CACHE', Path(__file__).resolve().parents[2] / 'node_modules' / '.cache' / 'hz-tiles'))
UA = {'User-Agent': 'DomineAqui-HistologiaZoom-curadoria/1.0'}


# ─── Fontes ────────────────────────────────────────────────────────────────

class Fonte:
    """Nível: dict(largura, altura, tile_l, tile_a, nx, ny, url(x,y), origem(x,y))."""

    largura: int
    altura: int
    niveis: list

    def nivel_para(self, largura_regiao_topo: float, largura_saida: int) -> dict:
        # O menor nível em que a região tem pelo menos a largura de saída.
        for n in self.niveis:
            if largura_regiao_topo * (n['largura'] / self.largura) >= largura_saida:
                return n
        return self.niveis[-1]


class FonteHV(Fonte):
    def __init__(self, root: str):
        acervo = json.loads(ACERVO_HV.read_text(encoding='utf-8'))
        esp = next((e for e in acervo['especimes'] if e['root'] == root), None)
        if not esp:
            sys.exit(f'root não encontrado no acervo: {root}')
        topo = esp['niveis'][-1]
        self.largura, self.altura = topo['largura'], topo['altura']
        self.niveis = []
        for n in esp['niveis']:
            base = f"{HOST_HV}{root}{n['pasta']}"
            self.niveis.append(dict(
                largura=n['largura'], altura=n['altura'], tile_l=n['tileL'], tile_a=n['tileA'],
                nx=n['nx'], ny=n['ny'],
                url=(lambda b, nx: (lambda x, y: f'{b}{y * nx + x}.jpg'))(base, n['nx']),
                origem=(lambda tl, ta: (lambda x, y: (x * tl, y * ta)))(n['tileL'], n['tileA']),
            ))


class FonteDZI(Fonte):
    def __init__(self, url: str):
        xml = baixar(url).decode('utf-8')
        raiz = ET.fromstring(xml)
        ns = {'d': 'http://schemas.microsoft.com/deepzoom/2008'}
        tamanho = raiz.find('d:Size', ns)
        self.largura, self.altura = int(tamanho.get('Width')), int(tamanho.get('Height'))
        ts, ov, fmt = int(raiz.get('TileSize')), int(raiz.get('Overlap')), raiz.get('Format')
        base = url[: -len('.dzi')] + '_files/'
        maximo = math.ceil(math.log2(max(self.largura, self.altura)))
        self.niveis = []
        for nivel in range(0, maximo + 1):
            escala = 2 ** (maximo - nivel)
            w, h = math.ceil(self.largura / escala), math.ceil(self.altura / escala)
            if w < 64:
                continue
            self.niveis.append(dict(
                largura=w, altura=h, tile_l=ts, tile_a=ts,
                nx=math.ceil(w / ts), ny=math.ceil(h / ts),
                url=(lambda b, lv: (lambda x, y: f'{b}{lv}/{x}_{y}.{fmt}'))(base, nivel),
                # Com overlap, o tile (x, y) começa `ov` pixels antes, exceto na borda.
                origem=(lambda: (lambda x, y: (x * ts - (ov if x else 0), y * ts - (ov if y else 0))))(),
            ))


class FonteImagem(Fonte):
    """Fotomicrografia avulsa (acervo-imagens.json): cada nível é uma imagem inteira."""

    def __init__(self, chave: str):
        # `chave`: o `root` da imagem ou a URL do original (como o índice grava).
        acervo = json.loads((ACERVO_HV.parent / 'acervo-imagens.json').read_text(encoding='utf-8'))
        esp = next((e for e in acervo['especimes'] if chave in (e['root'], e['niveis'][-1]['pasta'])), None)
        if not esp:
            sys.exit(f'imagem não encontrada no acervo: {chave}')
        topo = esp['niveis'][-1]
        self.largura, self.altura = topo['largura'], topo['altura']
        self.niveis = [dict(
            largura=n['largura'], altura=n['altura'], tile_l=n['largura'], tile_a=n['altura'], nx=1, ny=1,
            url=(lambda u: (lambda x, y: u))(n['pasta']),
            origem=lambda x, y: (0, 0),
        ) for n in esp['niveis']]


def fonte_de(texto: str) -> Fonte:
    if texto.startswith('img:'):
        return FonteImagem(texto[4:])
    if texto.startswith('hv:'):
        return FonteHV(texto[3:])
    if texto.startswith('dzi:'):
        return FonteDZI(texto[4:])
    sys.exit('fonte deve começar com hv:, dzi: ou img:')


def fonte_da_lamina(slug: str) -> Fonte:
    if not INDICE.exists():
        sys.exit('índice ausente: rode `node scripts/histologia-zoom/exportar-indice.mjs`')
    indice = json.loads(INDICE.read_text(encoding='utf-8'))
    if slug not in indice:
        sys.exit(f'slug desconhecido: {slug}')
    return fonte_de(indice[slug]['fonte'])


# ─── Download com cache ────────────────────────────────────────────────────

def baixar(url: str) -> bytes:
    CACHE.mkdir(parents=True, exist_ok=True)
    arquivo = CACHE / hashlib.sha1(url.encode()).hexdigest()
    if arquivo.exists():
        return arquivo.read_bytes()
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        dados = r.read()
    arquivo.write_bytes(dados)
    return dados


def tile(url: str):
    try:
        return Image.open(io.BytesIO(baixar(url))).convert('RGB')
    except Exception:
        return None


# ─── Montagem ──────────────────────────────────────────────────────────────

def montar(fonte: Fonte, x0: float, y0: float, x1: float, y1: float, largura_saida: int) -> Image.Image:
    """Região em coordenadas de viewport (fração da largura) → imagem."""
    W = fonte.largura
    rx0, ry0, rx1, ry1 = x0 * W, y0 * W, x1 * W, y1 * W
    n = fonte.nivel_para(rx1 - rx0, largura_saida)
    s = n['largura'] / W
    lx0, ly0, lx1, ly1 = rx0 * s, ry0 * s, rx1 * s, ry1 * s
    tx0 = max(0, int(lx0 // n['tile_l']))
    ty0 = max(0, int(ly0 // n['tile_a']))
    tx1 = min(n['nx'] - 1, int(lx1 // n['tile_l']))
    ty1 = min(n['ny'] - 1, int(ly1 // n['tile_a']))
    lona = Image.new('RGB', (max(1, math.ceil(lx1 - lx0)), max(1, math.ceil(ly1 - ly0))), (0, 0, 0))
    pedidos = [(x, y) for y in range(ty0, ty1 + 1) for x in range(tx0, tx1 + 1)]
    with ThreadPoolExecutor(8) as ex:
        imagens = list(ex.map(lambda p: tile(n['url'](*p)), pedidos))
    for (x, y), img in zip(pedidos, imagens):
        if img is None:
            continue
        # Nível de imagem única: o servidor pode entregar um tamanho diferente
        # do declarado (o Commons arredonda miniaturas para tamanhos padrão).
        # O visualizador estica a imagem para os limites do nível; aqui também.
        if n['nx'] == 1 and n['ny'] == 1 and img.size != (n['largura'], n['altura']):
            img = img.resize((n['largura'], n['altura']), Image.LANCZOS)
        ox, oy = n['origem'](x, y)
        lona.paste(img, (int(round(ox - lx0)), int(round(oy - ly0))))
    # Recorta o padding preto além do conteúdo real do nível.
    cw = min(lona.width, max(1, int(n['largura'] - lx0)))
    ch = min(lona.height, max(1, int(n['altura'] - ly0)))
    lona = lona.crop((0, 0, cw, ch))
    altura_saida = max(1, round(largura_saida * lona.height / max(1, lona.width)))
    return lona.resize((largura_saida, altura_saida), Image.LANCZOS)


# ─── Desenho ───────────────────────────────────────────────────────────────

def fonte_texto(tamanho: int):
    for nome in ('arial.ttf', 'DejaVuSans.ttf', 'segoeui.ttf'):
        try:
            return ImageFont.truetype(nome, tamanho)
        except Exception:
            pass
    return ImageFont.load_default()


def grade(img: Image.Image, x0, y0, x1, y1, passo: float):
    d = ImageDraw.Draw(img, 'RGBA')
    f = fonte_texto(13)
    px = lambda x: (x - x0) / (x1 - x0) * img.width
    py = lambda y: (y - y0) / (y1 - y0) * img.height
    casas = max(2, -int(math.floor(math.log10(passo))) + 1)
    v = math.ceil(x0 / passo) * passo
    while v <= x1:
        X = px(v)
        d.line([(X, 0), (X, img.height)], fill=(0, 255, 255, 110), width=1)
        d.text((X + 2, 2), f'{v:.{casas}f}', fill=(0, 255, 255, 255), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
        v += passo
    v = math.ceil(y0 / passo) * passo
    while v <= y1:
        Y = py(v)
        d.line([(0, Y), (img.width, Y)], fill=(255, 255, 0, 110), width=1)
        d.text((2, Y + 2), f'{v:.{casas}f}', fill=(255, 255, 0, 255), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
        v += passo


CORES = [(255, 40, 40), (40, 220, 90), (60, 140, 255), (255, 200, 0), (255, 90, 220), (0, 230, 230)]


def desenhar_anotacoes(img: Image.Image, x0, y0, x1, y1, anot: dict, so: str | None):
    d = ImageDraw.Draw(img, 'RGBA')
    f = fonte_texto(14)
    px = lambda x: (x - x0) / (x1 - x0) * img.width
    py = lambda y: (y - y0) / (y1 - y0) * img.height
    for i, est in enumerate(anot.get('estruturas', [])):
        if so and est['id'] != so:
            continue
        cor = CORES[i % len(CORES)]
        for m in est.get('marcas', []):
            if m['tipo'] == 'contorno':
                pts = [(px(x), py(y)) for x, y in m['pontos']]
                d.line(pts + [pts[0]], fill=cor + (255,), width=3)
                ax, ay = pts[0]
            elif m['tipo'] == 'elipse':
                (cx, cy), (rx, ry) = m['centro'], m['raios']
                d.ellipse([px(cx - rx), py(cy - ry), px(cx + rx), py(cy + ry)], outline=cor + (255,), width=3)
                ax, ay = px(cx), py(cy - ry)
            elif m['tipo'] == 'seta':
                tx, ty = m['ponta']
                a = math.radians(m.get('angulo', 45))
                X, Y = px(tx), py(ty)
                L = 60
                bx, by = X - math.cos(a) * L, Y - math.sin(a) * L
                d.line([(bx, by), (X, Y)], fill=cor + (255,), width=4)
                for s in (-0.45, 0.45):
                    d.line([(X, Y), (X - math.cos(a + s) * 16, Y - math.sin(a + s) * 16)], fill=cor + (255,), width=4)
                ax, ay = bx, by
            else:
                continue
            d.text((ax + 4, ay - 18), est['id'], fill=cor + (255,), font=f, stroke_width=3, stroke_fill=(0, 0, 0))


# ─── CLI ───────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--fonte', help='hv:<root> ou dzi:<url>')
    g.add_argument('--slug', help='slug da lâmina (usa o índice exportado)')
    ap.add_argument('--regiao', default=None, help='x0,y0,x1,y1 em coordenadas de viewport (padrão: lâmina inteira)')
    ap.add_argument('--largura', type=int, default=1400)
    ap.add_argument('--grade', type=float, default=0)
    ap.add_argument('--anotacoes', action='store_true', help='sobrepõe as marcações do slug')
    ap.add_argument('--estrutura', default=None, help='só esta estrutura')
    ap.add_argument('--saida', required=True)
    a = ap.parse_args()

    fonte = fonte_de(a.fonte) if a.fonte else fonte_da_lamina(a.slug)
    alt = fonte.altura / fonte.largura
    x0, y0, x1, y1 = [float(v) for v in a.regiao.split(',')] if a.regiao else (0, 0, 1, alt)
    img = montar(fonte, x0, y0, x1, y1, a.largura)
    if a.grade:
        grade(img, x0, y0, x1, y1, a.grade)
    if a.anotacoes and a.slug:
        arq = ANOTACOES / f'{a.slug}.json'
        if arq.exists():
            desenhar_anotacoes(img, x0, y0, x1, y1, json.loads(arq.read_text(encoding='utf-8')), a.estrutura)
    img.save(a.saida)
    print(json.dumps({'saida': a.saida, 'tamanho': img.size, 'imagem': [fonte.largura, fonte.altura],
                      'altura_viewport': round(alt, 4), 'regiao': [x0, y0, x1, y1]}))


if __name__ == '__main__':
    main()
