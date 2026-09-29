import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('cardiopatia-reumatica-1', [
    pat('espessamento', 'fibrose-cicatricial', seta(0.20, 0.14, 45),
        rotulo='Folheto valvar muito espessado por fibrose',
        nota='Compare esta porção, grossa e cheia de colágeno, com a extremidade do mesmo folheto à direita, fina.',
        vista=(0.10, 0.04, 0.44, 0.22)),
    pat('vaso', 'neovascularizacao-valvar', seta(0.2112, 0.0937, 45),
        rotulo='Vaso de parede espessa dentro do folheto',
        nota='A valva normal não tem vasos: estes cresceram depois de surtos repetidos de valvulite.',
        vista=(0.200, 0.090, 0.230, 0.120)),
    pat('vaso-2', 'neovascularizacao-valvar', seta(0.2865, 0.1065, 45),
        rotulo='Outra arteríola neoformada',
        vista=(0.280, 0.100, 0.310, 0.130)),
    pat('linfocitos', 'infiltrado-linfoplasmocitario', seta(0.2825, 0.1235, 45),
        rotulo='Linfócitos e plasmócitos no folheto',
        vista=(0.280, 0.110, 0.300, 0.130)),
], achados=[
    achado('fibrose-cicatricial', 'presente', ['espessamento'], 'Espessamento fibroso acentuado de boa parte do folheto.'),
    achado('neovascularizacao-valvar', 'presente', ['vaso', 'vaso-2'], 'Numerosos vasos, alguns de parede espessa, no interior do folheto.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['linfocitos'], 'Infiltrado linfoplasmocitário leve, perivascular.'),
    achado('corpusculo-de-aschoff', 'ausente', [], 'Não há nódulos de Aschoff: é a fase crônica, cicatricial, da doença.'),
], conferencias=3, resumo='Folheto de valva cardíaca com cardiopatia reumática crônica: espessamento fibroso acentuado, vasos neoformados de parede espessa e infiltrado linfoplasmocitário leve; a extremidade do folheto é mais fina. Sem nódulos de Aschoff (fase crônica).')
print('ok')
