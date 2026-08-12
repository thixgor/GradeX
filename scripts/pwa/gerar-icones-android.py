#!/usr/bin/env python3
"""
Gera os ícones que o Android (e o One UI da Samsung) precisa para exibir o
DomineAqui como app de verdade na tela de início.

Por que existe: o `/icon-512.png` é uma arte "full-bleed" — a letra D ocupa
quase todo o quadro. O Android NÃO desenha o ícone como um quadrado: ele
recorta com uma máscara (círculo no Pixel, squircle no One UI da Samsung,
gota d'água em outras skins). Reaproveitar a arte full-bleed como `maskable`
faz o recorte comer as bordas do desenho. A regra da plataforma é: todo
conteúdo relevante dentro do círculo central de 80% (a "safe zone").

O que ele produz (a partir de public/icon-512.png, a arte-mãe):

  public/icon-maskable-512.png  ícone adaptativo, logo a 60% + fundo da marca
  public/icon-maskable-192.png  idem, reduzido
  public/icon-mono-512.png      silhueta branca em fundo transparente, para os
                                "ícones temáticos" do Android 13+ (One UI 5+),
                                em que o launcher pinta o ícone com a cor do
                                papel de parede
  public/shortcuts/*.png        96x96, um por atalho do menu de toque longo

Como rodar (só quando a arte-mãe mudar):

    pip install pillow
    python3 scripts/pwa/gerar-icones-android.py

Os PNGs gerados são versionados — o build do Next não depende deste script.
"""

from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUBLIC = os.path.join(RAIZ, "public")
FONTE = os.path.join(PUBLIC, "icon-512.png")

# Fundo da marca (mesmo verde do background_color do manifest).
FUNDO_CENTRO = (18, 52, 43, 255)
FUNDO_BORDA = (6, 19, 13, 255)

# Fração do lado ocupada pelo logo dentro do ícone maskable. 0.60 mantém o
# desenho inteiro dentro da safe zone de 80% com folga, em qualquer máscara.
ESCALA_LOGO = 0.54


def fundo_radial(lado: int) -> Image.Image:
    """Fundo com o mesmo degradê suave do ícone original (centro mais claro)."""
    img = Image.new("RGBA", (lado, lado), FUNDO_BORDA)
    px = img.load()
    centro = (lado - 1) / 2
    # Distância máxima = canto. Normalizada, vira o t da interpolação.
    maxima = (centro**2 + centro**2) ** 0.5
    for y in range(lado):
        for x in range(lado):
            d = ((x - centro) ** 2 + (y - centro) ** 2) ** 0.5 / maxima
            t = d**1.35
            px[x, y] = tuple(
                int(FUNDO_CENTRO[i] + (FUNDO_BORDA[i] - FUNDO_CENTRO[i]) * t)
                for i in range(4)
            )
    return img


def recortar_conteudo(img: Image.Image) -> Image.Image:
    """
    Devolve só o desenho, com fundo transparente.

    A arte-mãe é opaca: o verde de fundo faz parte do PNG. Cortar pelo bbox
    traria junto um retalho retangular daquele fundo, que apareceria como um
    quadrado por cima do fundo novo. Então separamos por preenchimento
    (flood fill) a partir dos quatro cantos, comparando cada pixel com o
    VIZINHO de onde viemos — não com a cor do canto. O fundo é um degradê
    suave (passo de 1–2 por pixel) e a borda do logo é um salto grande, então
    a comparação local acompanha o degradê inteiro e para no desenho.
    """
    largura, altura = img.size
    px = img.convert("RGB").load()
    fundo = bytearray(largura * altura)

    # Tolerância por passo: soma das diferenças RGB entre pixels vizinhos.
    PASSO = 12

    pilha = [(0, 0), (largura - 1, 0), (0, altura - 1), (largura - 1, altura - 1)]
    for x, y in pilha:
        fundo[y * largura + x] = 1
    while pilha:
        x, y = pilha.pop()
        r, g, b = px[x, y]
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < largura and 0 <= ny < altura):
                continue
            i = ny * largura + nx
            if fundo[i]:
                continue
            nr, ng, nb = px[nx, ny]
            if abs(nr - r) + abs(ng - g) + abs(nb - b) <= PASSO:
                fundo[i] = 1
                pilha.append((nx, ny))

    alfa = Image.frombytes(
        "L", img.size, bytes(255 if not v else 0 for v in fundo)
    )
    # Meio pixel de suavização na borda para o recorte não ficar serrilhado.
    alfa = alfa.filter(ImageFilter.GaussianBlur(0.6))

    recorte = img.copy()
    recorte.putalpha(alfa)
    caixa = alfa.getbbox()
    return recorte.crop(caixa) if caixa else recorte


def gerar_maskable() -> None:
    origem = Image.open(FONTE).convert("RGBA")
    logo = recortar_conteudo(origem)

    lado = 512
    alvo = int(lado * ESCALA_LOGO)
    escala = alvo / max(logo.size)
    logo = logo.resize(
        (max(1, round(logo.width * escala)), max(1, round(logo.height * escala))),
        Image.LANCZOS,
    )

    canvas = fundo_radial(lado)
    canvas.alpha_composite(
        logo, ((lado - logo.width) // 2, (lado - logo.height) // 2)
    )
    canvas.save(os.path.join(PUBLIC, "icon-maskable-512.png"))
    canvas.resize((192, 192), Image.LANCZOS).save(
        os.path.join(PUBLIC, "icon-maskable-192.png")
    )
    print("ok: icon-maskable-512.png / icon-maskable-192.png")


def gerar_monocromatico() -> None:
    """
    Ícone temático (Android 13+ / One UI 5+): o launcher joga fora as cores e
    usa só o canal alfa, pintando a forma com a cor do papel de parede.

    Uma silhueta cheia do logo vira um borrão sem leitura, e o contorno fino
    original some a 48dp. A saída aqui é o meio-termo: forma CHEIA com os
    traços do desenho (o contorno creme da arte, engrossado) recortados como
    espaço negativo. A letra D, os balões e o lápis continuam separados e
    legíveis mesmo pintados de uma cor só.
    """
    origem = Image.open(FONTE).convert("RGBA")
    logo = recortar_conteudo(origem)

    lado = 512
    alvo = int(lado * ESCALA_LOGO)
    escala = alvo / max(logo.size)
    logo = logo.resize(
        (max(1, round(logo.width * escala)), max(1, round(logo.height * escala))),
        Image.LANCZOS,
    )

    cheia = logo.getchannel("A").point(lambda v: 255 if v > 128 else 0)

    # Traço = o contorno claro da arte (creme sobre verde), por luminância.
    traco = Image.new("L", logo.size, 0)
    lp = logo.load()
    tp = traco.load()
    for y in range(logo.height):
        for x in range(logo.width):
            r, g, b, a = lp[x, y]
            if a > 128 and (0.2126 * r + 0.7152 * g + 0.0722 * b) > 120:
                tp[x, y] = 255
    # Engrossa o traço para o vão continuar visível depois de reduzido a 48dp.
    traco = traco.filter(ImageFilter.MaxFilter(9))

    alfa = Image.new("L", logo.size, 0)
    ap = alfa.load()
    cp = cheia.load()
    tp = traco.load()
    for y in range(logo.height):
        for x in range(logo.width):
            ap[x, y] = 255 if (cp[x, y] and not tp[x, y]) else 0

    marca = Image.new("RGBA", logo.size, (255, 255, 255, 0))
    marca.paste((255, 255, 255, 255), (0, 0), alfa)

    saida = Image.new("RGBA", (lado, lado), (255, 255, 255, 0))
    saida.alpha_composite(
        marca, ((lado - marca.width) // 2, (lado - marca.height) // 2)
    )
    saida.save(os.path.join(PUBLIC, "icon-mono-512.png"))
    print("ok: icon-mono-512.png")


# ── Atalhos (toque longo no ícone) ────────────────────────────────────────
# Glifos desenhados a mão: 96x96 é pequeno demais para reaproveitar arte, e
# quatro atalhos com o mesmo ícone não ajudam ninguém a escolher.

CREME = (244, 241, 234, 255)
VERDE = (18, 52, 43, 255)

# Desenhamos em 4x e reduzimos com LANCZOS no final: antialias barato, sem
# depender de rasterizador vetorial.
SUPER = 4
LADO = 96


def _e(*valores: float) -> list[float]:
    """Escala coordenadas do desenho (pensado em 96px) para o canvas 4x."""
    return [v * SUPER for v in valores]


def base_atalho() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    lado = LADO * SUPER
    img = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, lado - 1, lado - 1], radius=22 * SUPER, fill=VERDE)
    return img, d


def glifo_provas() -> Image.Image:
    """Folha de prova com um "certo" — a ação é responder e acertar."""
    img, d = base_atalho()
    d.rounded_rectangle(_e(24, 18, 72, 78), radius=6 * SUPER, outline=CREME, width=5 * SUPER)
    for y in (32, 43):
        d.line(_e(35, y, 61, y), fill=CREME, width=4 * SUPER)
    d.line(_e(36, 60, 44, 68), fill=CREME, width=6 * SUPER)
    d.line(_e(44, 68, 62, 50), fill=CREME, width=6 * SUPER)
    return img


def glifo_banco() -> Image.Image:
    """Pilha de listas — o banco é volume de questões empilhadas."""
    img, d = base_atalho()
    d.rounded_rectangle(_e(18, 28, 60, 74), radius=6 * SUPER, fill=CREME)
    d.rounded_rectangle(_e(30, 18, 78, 64), radius=6 * SUPER, fill=VERDE)
    d.rounded_rectangle(_e(30, 18, 78, 64), radius=6 * SUPER, outline=CREME, width=5 * SUPER)
    for y in (31, 41, 51):
        d.line(_e(40, y, 68, y), fill=CREME, width=4 * SUPER)
    return img


def glifo_flashcards() -> Image.Image:
    """Dois cartões deslocados: frente e verso do flashcard."""
    img, d = base_atalho()
    d.rounded_rectangle(_e(16, 24, 62, 58), radius=7 * SUPER, outline=CREME, width=5 * SUPER)
    d.rounded_rectangle(_e(34, 42, 80, 76), radius=7 * SUPER, fill=VERDE)
    d.rounded_rectangle(_e(34, 42, 80, 76), radius=7 * SUPER, outline=CREME, width=5 * SUPER)
    d.line(_e(45, 59, 69, 59), fill=CREME, width=4 * SUPER)
    return img


def glifo_cronograma() -> Image.Image:
    """Calendário com os dias marcados."""
    img, d = base_atalho()
    d.rounded_rectangle(_e(18, 26, 78, 78), radius=8 * SUPER, outline=CREME, width=5 * SUPER)
    d.line(_e(18, 43, 78, 43), fill=CREME, width=5 * SUPER)
    d.line(_e(32, 16, 32, 31), fill=CREME, width=6 * SUPER)
    d.line(_e(64, 16, 64, 31), fill=CREME, width=6 * SUPER)
    for cy in (56, 68):
        for cx in (34, 48, 62):
            d.ellipse(_e(cx - 4, cy - 4, cx + 4, cy + 4), fill=CREME)
    return img


ATALHOS = {
    "provas": glifo_provas,
    "banco-questoes": glifo_banco,
    "flashcards": glifo_flashcards,
    "cronogramas": glifo_cronograma,
}


def gerar_atalhos() -> None:
    destino = os.path.join(PUBLIC, "shortcuts")
    os.makedirs(destino, exist_ok=True)
    for nome, desenhar in ATALHOS.items():
        desenhar().resize((LADO, LADO), Image.LANCZOS).save(
            os.path.join(destino, f"{nome}.png")
        )
        print(f"ok: shortcuts/{nome}.png")


if __name__ == "__main__":
    gerar_maskable()
    gerar_monocromatico()
    gerar_atalhos()
