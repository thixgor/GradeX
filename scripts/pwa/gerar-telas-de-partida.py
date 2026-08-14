#!/usr/bin/env python3
"""
Gera as telas de partida (splash screens) do app instalado no iPhone/iPad.

Por que existe: ao tocar no ícone do DomineAqui na tela de início do iPhone, o
Safari abre a WebView e espera o HTML chegar. Sem `apple-touch-startup-image`,
o que aparece nesse intervalo é um retângulo vazio — preto, no aparelho em tema
escuro. Quem tocou no ícone de um app não lê tela preta parada como
"carregando"; lê como "quebrou". O Android não sofre disso porque o Chrome
monta a tela de abertura sozinho, a partir do `background_color` e do ícone do
manifest.

O iOS escolhe a imagem por media query EXATA (largura × altura em pixels CSS +
densidade), então cada aparelho precisa do seu arquivo, no pixel. A tabela de
aparelhos vive em `lib/pwa/splash.ts` — que é também quem monta as tags
`<link>` no `app/layout.tsx`. Este script lê aquela tabela para as duas listas
nunca saírem de sincronia.

O desenho é o de uma tela de abertura nativa: fundo da marca e o ícone do app
centralizado, com cantos arredondados como o iOS desenha. Nada de texto — sem
a fonte da marca disponível aqui, um texto genérico ficaria pior que nenhum.

Como rodar (só quando a arte-mãe ou a tabela de aparelhos mudar):

    pip install pillow
    python3 scripts/pwa/gerar-telas-de-partida.py

Os PNGs gerados são versionados — o build do Next não depende deste script.
"""

from __future__ import annotations

import os
import re

from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUBLIC = os.path.join(RAIZ, "public")
FONTE = os.path.join(PUBLIC, "icon-512.png")
DESTINO = os.path.join(PUBLIC, "pwa", "splash")
TABELA = os.path.join(RAIZ, "lib", "pwa", "splash.ts")

# Mesma cor do `background_color` do manifest: a transição da tela de partida
# para a primeira pintura do app não tem salto de cor.
COR_DE_FUNDO = (11, 31, 26)

# Proporção do ícone em relação ao MENOR lado da tela. 26% é o que a Apple usa
# na prática nas telas de abertura dos apps do sistema: presente sem dominar.
PROPORCAO_DO_ICONE = 0.26
# Teto em pixels físicos: no iPad, 26% da largura daria um ícone gigante.
ICONE_MAXIMO = 360
# O ícone fica um pouco acima do centro óptico — centralizado no eixo exato,
# ele parece "caído" para baixo.
DESLOCAMENTO_VERTICAL = -0.04


def ler_tabela() -> str:
    with open(TABELA, "r", encoding="utf-8") as arquivo:
        return arquivo.read()


def ler_aparelhos(conteudo: str) -> list[tuple[int, int, int]]:
    """Extrai (larguraCss, alturaCss, densidade) de lib/pwa/splash.ts.

    Ler o TypeScript em vez de repetir a tabela aqui é de propósito: com duas
    listas, a próxima tela de iPhone entraria em uma e não na outra, e o
    sintoma seria exatamente o que este script veio consertar — retângulo vazio
    na abertura, só que num aparelho só.
    """
    padrao = re.compile(
        r"larguraCss:\s*(\d+),\s*alturaCss:\s*(\d+),\s*densidade:\s*(\d+)"
    )
    aparelhos = [
        (int(largura), int(altura), int(densidade))
        for largura, altura, densidade in padrao.findall(conteudo)
    ]
    if not aparelhos:
        raise SystemExit(f"Nenhum aparelho encontrado em {TABELA}")
    return aparelhos


def ler_reservas(conteudo: str) -> list[tuple[str, int, int]]:
    """Extrai as telas de reserva (as que casam com qualquer aparelho)."""
    padrao = re.compile(
        r"orientacao:\s*'(portrait|landscape)',\s*larguraPx:\s*(\d+),\s*alturaPx:\s*(\d+)"
    )
    reservas = [
        (orientacao, int(largura), int(altura))
        for orientacao, largura, altura in padrao.findall(conteudo)
    ]
    if not reservas:
        raise SystemExit(f"Nenhuma tela de reserva encontrada em {TABELA}")
    return reservas


def cantos_arredondados(icone: Image.Image) -> Image.Image:
    """Aplica a máscara de canto arredondado que o iOS usa no ícone do app."""
    lado = icone.width
    # 22,37% é o raio do "squircle" do iOS. A aproximação por retângulo
    # arredondado é indistinguível neste tamanho.
    raio = int(lado * 0.2237)
    mascara = Image.new("L", (lado, lado), 0)
    ImageDraw.Draw(mascara).rounded_rectangle([0, 0, lado - 1, lado - 1], raio, fill=255)
    recortado = icone.copy()
    recortado.putalpha(mascara)
    return recortado


def desenhar(arte: Image.Image, largura: int, altura: int) -> Image.Image:
    tela = Image.new("RGB", (largura, altura), COR_DE_FUNDO)

    lado_do_icone = min(int(min(largura, altura) * PROPORCAO_DO_ICONE), ICONE_MAXIMO)
    icone = cantos_arredondados(arte.resize((lado_do_icone, lado_do_icone), Image.LANCZOS))

    x = (largura - lado_do_icone) // 2
    y = int((altura - lado_do_icone) / 2 + altura * DESLOCAMENTO_VERTICAL)
    tela.paste(icone, (x, y), icone)

    # Paleta de 256 cores: a imagem é fundo chapado + um ícone pequeno com
    # brilho suave, então 256 cores cobrem tudo sem banda visível e o arquivo
    # cai a um terço (de ~107 KB para ~36 KB por tela). Cada aparelho baixa
    # exatamente uma — na abertura do app, que é justamente o momento em que
    # ninguém quer gastar rede.
    return tela.quantize(colors=256, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG)


def gerar() -> None:
    if not os.path.exists(FONTE):
        raise SystemExit(f"Arte-mãe não encontrada: {FONTE}")

    os.makedirs(DESTINO, exist_ok=True)
    arte = Image.open(FONTE).convert("RGBA")
    conteudo = ler_tabela()

    total = 0
    for largura_css, altura_css, densidade in ler_aparelhos(conteudo):
        # Retrato e paisagem: a orientação em que o aparelho estava no instante
        # do toque decide qual das duas o iOS procura, e o que não casa abre
        # preto.
        for sufixo, (largura, altura) in (
            ("", (largura_css * densidade, altura_css * densidade)),
            ("-paisagem", (altura_css * densidade, largura_css * densidade)),
        ):
            nome = f"partida-{largura_css}x{altura_css}@{densidade}x{sufixo}.png"
            desenhar(arte, largura, altura).save(
                os.path.join(DESTINO, nome), "PNG", optimize=True
            )
            print(f"  {nome}  {largura}x{altura}")
            total += 1

    # Reserva: usada por qualquer aparelho que não esteja na tabela — o iPhone
    # que ainda não existe. É o que impede a volta do retângulo preto quando a
    # tabela envelhecer.
    for orientacao, largura, altura in ler_reservas(conteudo):
        sufixo = "-paisagem" if orientacao == "landscape" else ""
        nome = f"partida-reserva{sufixo}.png"
        desenhar(arte, largura, altura).save(
            os.path.join(DESTINO, nome), "PNG", optimize=True
        )
        print(f"  {nome}  {largura}x{altura}  (reserva)")
        total += 1

    print(f"\n{total} telas de partida geradas em {DESTINO}")


if __name__ == "__main__":
    gerar()
