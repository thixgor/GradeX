"""
Acrescenta uma lâmina ao fim de `lib/histopatologia-zoom/curadoria.ts`, com
largura, altura, objetiva e µm/pixel medidos no servidor de Leeds.

    python registrar.py <doenca> <caminho> "<subtítulo>" <F|M|-> <idade|-> "<história em PT>" "<diagnóstico original>"
"""

import json
import sys
from pathlib import Path

from leeds import RAIZ, medir

CURADORIA = RAIZ / 'lib' / 'histopatologia-zoom' / 'curadoria.ts'


def main():
    doenca, caminho, subtitulo, sexo, idade, historia, diag = sys.argv[1:8]
    s = CURADORIA.read_text(encoding='utf-8').rstrip()
    if f"caminho: '{caminho}'" in s:
        sys.exit('já registrada')
    m = medir(caminho)
    def j(v):
        # Literal TS entre aspas simples ("Crohn's disease" vira 'Crohn\'s disease').
        return "'" + v.replace(chr(92), chr(92) * 2).replace("'", chr(92) + "'") + "'"

    entrada = f"""  {{
    doenca: '{doenca}',
    caminho: '{caminho}',
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
    }},
  }},
]
"""
    assert s.endswith(']')
    CURADORIA.write_text(s[:-1] + entrada, encoding='utf-8')
    print('registrada', doenca, caminho)


if __name__ == '__main__':
    main()
