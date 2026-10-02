"""
Curadoria dos casos de imagem com apontamentos (TC e Raio-X) a partir do
Radiopaedia (termo conjunto DomineAqui, 18/09/2026).

Entrada:
  escolha.txt   linhas "<mod>|<categoria>|<tema>|<slug> <caso-radiopaedia>"
  estudos.json  caso-radiopaedia -> [autoria, [[estudo, token c], ...]]
                (o token c vem da página do caso, que só abre no navegador)

Para cada caso, baixa o JSON de cada estudo, fica com as séries que têm setas
do autor com rótulo útil, amostra até 50 cortes preservando todo corte com
seta, baixa as imagens, converte para JPEG (lado maior até 1100 px) em
`.radiologia/<mod>/<slug>/s<k>-<n>.jpg` e grava `scripts/radiologia/casos-imagem.json`.
O upload ao Blob e o manifesto ficam com `sync-casos-imagem.mjs`.

Uso:
  python scripts/radiologia/curar-casos-imagem.py <escolha.txt> <estudos.json>
"""

import io
import re
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

RAIZ = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..'))
SAIDA = os.path.join(RAIZ, 'scripts', 'radiologia', 'casos-imagem.json')
CACHE = os.path.join(RAIZ, '.radiologia')
UA = {'User-Agent': 'DomineAqui educational asset mirror (termo conjunto 2026-09-18; contato: throdrigf@gmail.com)'}
LIXO = {'a', 'b', 'c', 'd', 'axial', 'coronal', 'sagittal', 'right', 'left', 'r', 'l', '', 'normal'}
MAX_CORTES = 50
MAX_SERIES = 2
LADO_MAX = 1100


def baixar(url, tentativas=4):
    for t in range(tentativas):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
        except Exception:
            time.sleep(1.5 * (t + 1))
    raise RuntimeError('falha ao baixar ' + url)


def limpo(rotulo):
    s = (rotulo or '').strip()
    return len(s) > 2 and s.lower() not in LIXO


def arquivo_do_quadro(tf):
    if not tf:
        return None
    return tf.get('gallery') or tf.get('original')


def amostrar(total, com_seta):
    if total <= MAX_CORTES:
        return list(range(total))
    restantes = MAX_CORTES - len(com_seta)
    passo = total / max(1, restantes)
    amostra = {int(i * passo) for i in range(restantes)}
    return sorted(amostra | set(com_seta))


def series_do_caso(estudos, modal):
    candidatas = []
    for estudo, c in estudos:
        j = json.loads(baixar(f'https://radiopaedia.org/studies/{estudo}/annotated_viewer_json?c={c}&lang=us'))['study']
        mod = j.get('modality') or ''
        if modal == 'tc' and mod != 'CT':
            continue
        if modal == 'rx' and not any(k in mod for k in ('X-ray', 'XR', 'Fluoro', 'X ray')):
            continue
        for s in j.get('series') or []:
            anot = [a for a in (s.get('annotations') or []) if limpo(a.get('label'))]
            frames = s.get('frames') or []
            tf = (s.get('encodings') or {}).get('thumbnailed_files') or []
            if not anot or not frames or not any(arquivo_do_quadro(x) for x in tf):
                continue
            if modal == 'tc' and len(frames) < 6:
                continue
            candidatas.append((j, s, anot))
    candidatas.sort(key=lambda x: -len(x[2]))
    return candidatas[:MAX_SERIES if modal == 'tc' else 3]


def processar(linha, estudos):
    chave, caso = linha.rsplit(' ', 1)
    modal, categoria, tema, slug = chave.split('|')
    autoria, lista = estudos[caso]
    escolhidas = series_do_caso(lista, modal)
    if not escolhidas:
        return None, f'{slug}: sem série utilizável'
    saida = {'slug': slug, 'modalidade': modal, 'categoria': categoria, 'tema': tema, 'casoRadiopaedia': caso,
             'autoria': autoria, 'tituloOriginal': escolhidas[0][0].get('case_title'), 'series': []}
    achados = []
    for k, (j, s, anot) in enumerate(escolhidas):
        if j.get('findings') and j['findings'] not in achados:
            achados.append(j['findings'])
        frames = s['frames']
        tf = s['encodings']['thumbnailed_files']
        com_seta = sorted({p['slice_idx'] for a in anot for p in a['arrow_positions'] if p['slice_idx'] < len(frames)})
        indices = [i for i in amostrar(len(frames), com_seta) if i < len(tf) and arquivo_do_quadro(tf[i])]
        presentes = set(indices)
        pasta = os.path.join(CACHE, modal, slug)
        os.makedirs(pasta, exist_ok=True)
        fatias = []

        def baixar_quadro(par):
            n, i = par
            destino = os.path.join(pasta, f's{k}-{n + 1}.jpg')
            url = f"https://prod-images-static.radiopaedia.org/images/{frames[i]['id']}/{arquivo_do_quadro(tf[i])}"
            if not os.path.exists(destino):
                im = Image.open(io.BytesIO(baixar(url))).convert('RGB')
                im.thumbnail((LADO_MAX, LADO_MAX))
                im.save(destino, 'JPEG', quality=86)
            return {'abs': i, 'url': url}

        with ThreadPoolExecutor(8) as pool:
            fatias = list(pool.map(baixar_quadro, enumerate(indices)))
        # Uma série pode misturar quadros de tamanhos diferentes (um localizador
        # quadrado numa coronal retangular): fica o formato da maioria, e as
        # dimensões originais saem dos quadros desse formato.
        formatos = []
        for n in range(len(fatias)):
            with Image.open(os.path.join(pasta, f's{k}-{n + 1}.jpg')) as im:
                formatos.append(round(im.size[0] / im.size[1], 2))
        formato = max(set(formatos), key=formatos.count)
        if len(set(formatos)) > 1:
            manter = [n for n, f in enumerate(formatos) if f == formato]
            for n in range(len(fatias)):
                os.remove(os.path.join(pasta, f's{k}-{n + 1}.jpg'))
            fatias = [fatias[n] for n in manter]
            indices = [indices[n] for n in manter]
            presentes = set(indices)
            with ThreadPoolExecutor(8) as pool:
                fatias = list(pool.map(baixar_quadro, enumerate(indices)))
        with Image.open(os.path.join(pasta, f's{k}-1.jpg')) as im:
            proporcao = im.size[0] / im.size[1]
        medidas = [(frames[i].get('width'), frames[i].get('height')) for i in indices]
        alturas = [h for _, h in medidas if h]
        larguras = [w for w, _ in medidas if w]
        if alturas:
            altura = max(set(alturas), key=alturas.count)
            largura = round(altura * proporcao) if not larguras or abs(larguras[0] / altura - proporcao) > 0.02 else larguras[0]
        elif larguras:
            largura = larguras[0]
            altura = round(largura / proporcao)
        else:
            # Sem medidas no JSON: o arquivo original tem o tamanho das coordenadas das setas.
            original = tf[indices[0]].get('original') or arquivo_do_quadro(tf[indices[0]])
            url = f"https://prod-images-static.radiopaedia.org/images/{frames[indices[0]]['id']}/{original}"
            with Image.open(io.BytesIO(baixar(url))) as im:
                largura, altura = im.size
        anotacoes = []
        for a in anot:
            pts = [[p['slice_idx'], p['x'], p['y'], p.get('rotation', 0)] for p in a['arrow_positions'] if p['slice_idx'] in presentes]
            if pts:
                anotacoes.append({'rotulo': a['label'].strip(), 'pontos': pts})
        saida['series'].append({'perspectiva': s.get('perspective') or ('Frontal' if modal == 'rx' else 'Axial'),
                                'especificos': s.get('specifics'), 'largura': largura, 'altura': altura,
                                'fatias': fatias, 'anotacoes': anotacoes})
    saida['achadosOriginais'] = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', ' '.join(achados))).strip()[:900]
    rotulos = sorted({a['rotulo'] for s in saida['series'] for a in s['anotacoes']})
    resumo = f"{slug} [{modal}/{categoria}/{tema}] {saida['tituloOriginal']} | séries {[(s['perspectiva'], len(s['fatias'])) for s in saida['series']]}"
    return saida, resumo + '\n   L: ' + ' ; '.join(rotulos) + '\n   F: ' + saida['achadosOriginais'][:400]


def main():
    escolha = [l.strip() for l in open(sys.argv[1], encoding='utf8') if l.strip()]
    estudos = json.load(open(sys.argv[2], encoding='utf8'))
    anteriores = {}
    if os.path.exists(SAIDA):
        anteriores = {c['slug']: c for c in json.load(open(SAIDA, encoding='utf8'))}
    casos = []
    for linha in escolha:
        slug = linha.rsplit(' ', 1)[0].split('|')[3]
        if slug in anteriores:
            casos.append(anteriores[slug])
            continue
        try:
            caso, msg = processar(linha, estudos)
        except Exception as e:  # um caso ruim não derruba a leva
            caso, msg = None, f'{slug}: ERRO {e}'
        print(msg, flush=True)
        if caso:
            casos.append(caso)
            json.dump(casos, open(SAIDA, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    json.dump(casos, open(SAIDA, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print(len(casos), 'casos')


if __name__ == '__main__':
    main()
