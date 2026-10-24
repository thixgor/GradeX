"""
Acrescenta uma lâmina ao fim de `lib/histopatologia-zoom/curadoria.ts`, com
largura, altura, objetiva e µm/pixel medidos no servidor de imagens (Leeds,
ou `rosai:`/`upmc:` como prefixo do caminho — ver `leeds.py`).

    python registrar.py <doenca> <caminho> "<subtítulo>" <F|M|-> <idade|-> "<história em PT>" "<diagnóstico original>" ["<coloração, se não for H&E>"]
"""

import json
import sys
from pathlib import Path

from leeds import RAIZ, medir, separar

CURADORIA = RAIZ / 'lib' / 'histopatologia-zoom' / 'curadoria.ts'


def main():
    doenca, caminho, subtitulo, sexo, idade, historia, diag = sys.argv[1:8]
    coloracao = sys.argv[8] if len(sys.argv) > 8 else None
    s = CURADORIA.read_text(encoding='utf-8').rstrip()
    if f"caminho: '{separar(caminho)[1]}'" in s:
        sys.exit('já registrada')
    m = medir(caminho)
    servidor, relativo = separar(caminho)
    def j(v):
        # Literal TS entre aspas simples ("Crohn's disease" vira 'Crohn\'s disease').
        return "'" + v.replace(chr(92), chr(92) * 2).replace("'", chr(92) + "'") + "'"

    entrada = f"""  {{
    doenca: '{doenca}',{chr(10) + "    servidor: '" + servidor + "'," if servidor != 'leeds' else ''}
    caminho: '{relativo}',
    largura: {m['largura']},
    altura: {m['altura']},
    objetiva: {int(m['objetiva']) if m['objetiva'] else 20},
    mpp: {m['mpp'] if m['mpp'] else 'null'},
    subtitulo: {j(subtitulo) if subtitulo != '-' else 'null'},
    caso: {{
      sexo: {j(sexo) if sexo in ('F', 'M') else 'null'},
      idade: {idade if idade != '-' else 'null'},
      historia: {j(historia) if historia != '-' else 'null'},
      diagnosticoOriginal: {j(diag)},
    }},{chr(10) + '    coloracao: ' + j(coloracao) + ',' if coloracao else ''}
  }},
]
"""
    assert s.endswith(']')
    # newline='\n': no Windows o modo texto gravaria CRLF num repositório LF.
    CURADORIA.write_text(s[:-1] + entrada, encoding='utf-8', newline='\n')
    print('registrada', doenca, caminho)


if __name__ == '__main__':
    main()
