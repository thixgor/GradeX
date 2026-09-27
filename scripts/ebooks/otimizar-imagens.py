#!/usr/bin/env python3
"""
Reencoda as imagens embutidas nos ebooks em HTML de `public/`.

Por que existe: os ebooks (`/apg`, `/prescricao-real-no-sus`, `/ecorj-ebook`)
são páginas exportadas pelo bundler, e cada imagem vai dentro do próprio HTML,
em base64, no `<script type="__bundler/manifest">`. O bundler exporta tudo em
PNG e no tamanho original. O resultado eram páginas de 8 a 11 MB. O `logo.png`
de 2,7 MB (1584 px) aparecia nas três para ser exibido a 22-32 px, e as capas
A4 iam a 300 dpi para aparecer com 112-430 px de altura.

Cada visita a uma página dessas é um HTML inteiro. `/apg` sai por função, e é
Fast Origin Transfer a cada cache miss. Os outros dois são estáticos, mas o
visitante baixa o mesmo tanto, e quem chega de anúncio está no 4G.

O que faz, imagem a imagem:

  - o logo da marca (idêntico a `public/logo.png`) vai a 256 px no lado maior:
    8× o maior tamanho em que é exibido;
  - o resto vai a no máximo 1600 px no lado maior. A maior exibição é uma capa
    de 430 px de altura, então sobram mais de 3× de densidade para tela retina;
  - tudo vira WebP qualidade 88, com canal alfa quando a imagem tem
    transparência de fato;
  - só troca se o resultado for pelo menos 15% menor. Imagem que já é pequena
    ou que não ganha nada fica como está.

O loader do bundler cria um `Blob` com o `mime` que estiver no manifesto, sem
tratar formato nenhum de forma especial, então trocar `image/png` por
`image/webp` basta.

É idempotente: numa segunda passada as imagens já são WebP e são puladas.

Como rodar (sempre que um ebook for reexportado):

    pip install pillow
    python3 scripts/ebooks/otimizar-imagens.py            # os três ebooks
    python3 scripts/ebooks/otimizar-imagens.py arquivo.html
"""

import base64
import hashlib
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
PUBLIC = RAIZ / 'public'

EBOOKS = [
    'Cadernos-APGs.html',
    'Prescrição Real no SUS.html',
    'O Estado da Arte da Ecocardiografia Atual.html',
]

LADO_MAXIMO = 1600
LADO_MAXIMO_LOGO = 256
QUALIDADE = 88
GANHO_MINIMO = 0.15
TAMANHO_MINIMO = 60 * 1024

MANIFESTO = re.compile(r'(<script type="__bundler/manifest">)(.*?)(</script>)', re.S)
FORMATOS = {'image/png', 'image/jpeg'}


def md5(dados: bytes) -> str:
    return hashlib.md5(dados).hexdigest()


MD5_LOGO = md5((PUBLIC / 'logo.png').read_bytes()) if (PUBLIC / 'logo.png').exists() else None


def tem_transparencia(imagem: Image.Image) -> bool:
    if imagem.mode not in ('RGBA', 'LA', 'P'):
        return False
    return imagem.convert('RGBA').getextrema()[3][0] < 255


def reencodar(bruto: bytes) -> tuple[bytes, str]:
    imagem = Image.open(io.BytesIO(bruto))
    imagem.load()

    lado = LADO_MAXIMO_LOGO if md5(bruto) == MD5_LOGO else LADO_MAXIMO
    if max(imagem.size) > lado:
        imagem.thumbnail((lado, lado), Image.LANCZOS)

    alfa = tem_transparencia(imagem)
    imagem = imagem.convert('RGBA' if alfa else 'RGB')

    saida = io.BytesIO()
    imagem.save(saida, 'WEBP', quality=QUALIDADE, method=6, alpha_quality=100)
    return saida.getvalue(), f'{imagem.size[0]}x{imagem.size[1]}'


def otimizar(caminho: Path) -> None:
    html = caminho.read_text(encoding='utf-8')
    achado = MANIFESTO.search(html)
    if not achado:
        print(f'{caminho.name}: sem manifesto do bundler, nada a fazer')
        return

    manifesto = json.loads(achado.group(2))
    antes = len(html.encode('utf-8'))
    trocas = 0

    for uuid, entrada in manifesto.items():
        if entrada.get('mime') not in FORMATOS or entrada.get('compressed'):
            continue
        bruto = base64.b64decode(entrada['data'])
        if len(bruto) < TAMANHO_MINIMO:
            continue

        novo, dimensoes = reencodar(bruto)
        if len(novo) > len(bruto) * (1 - GANHO_MINIMO):
            print(f'  {uuid[:8]} {entrada["mime"]}: ganho pequeno, mantida')
            continue

        print(
            f'  {uuid[:8]} {entrada["mime"]} {len(bruto) // 1024} KB'
            f' -> image/webp {dimensoes} {len(novo) // 1024} KB'
        )
        entrada['mime'] = 'image/webp'
        entrada['data'] = base64.b64encode(novo).decode('ascii')
        trocas += 1

    if not trocas:
        print(f'{caminho.name}: nenhuma imagem a otimizar')
        return

    original = achado.group(2)
    json_manifesto = json.dumps(manifesto, ensure_ascii=False, separators=(',', ':'))
    json_manifesto = (
        original[: len(original) - len(original.lstrip())]
        + json_manifesto
        + original[len(original.rstrip()) :]
    )
    html = html[: achado.start(2)] + json_manifesto + html[achado.end(2) :]
    caminho.write_text(html, encoding='utf-8')

    depois = len(html.encode('utf-8'))
    print(f'{caminho.name}: {antes // 1024} KB -> {depois // 1024} KB ({trocas} imagens)')


def main() -> None:
    alvos = [Path(a) for a in sys.argv[1:]] or [PUBLIC / nome for nome in EBOOKS]
    for alvo in alvos:
        print(f'== {alvo.name}')
        otimizar(alvo)


if __name__ == '__main__':
    main()
