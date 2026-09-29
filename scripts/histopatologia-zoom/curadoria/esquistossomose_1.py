import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('esquistossomose-1', [
    pat('grupo-de-ovos', 'ovos-de-schistosoma', seta(0.1480, 0.3220, 45),
        rotulo='Grupo de ovos com miracídio na lâmina própria',
        vista=(0.125, 0.305, 0.160, 0.340)),
    pat('ovo-viavel', 'ovos-de-schistosoma', seta(0.5325, 0.3032, 45),
        rotulo='Ovo viável: casca fina e miracídio com núcleos',
        vista=(0.520, 0.296, 0.544, 0.320)),
    pat('ovo-degenerado', 'ovos-de-schistosoma', seta(0.4995, 0.3005, 45),
        rotulo='Ovo morto, com casca espessa e conteúdo colapsado',
        vista=(0.490, 0.296, 0.506, 0.312)),
    pat('eosinofilos', 'eosinofilos-teciduais', seta(0.4672, 0.2325, 45),
        rotulo='Eosinófilos em volta dos ovos',
        vista=(0.460, 0.225, 0.476, 0.241)),
], achados=[
    achado('ovos-de-schistosoma', 'presente', ['grupo-de-ovos', 'ovo-viavel', 'ovo-degenerado'], 'Muitos ovos na lâmina própria, isolados e em grupos: a maioria viável, com miracídio multinucleado; alguns degenerados. A espícula não aparece com nitidez nestes cortes; a espécie (S. haematobium) é inferida pela localização vesical.'),
    achado('eosinofilos-teciduais', 'presente', ['eosinofilos'], 'Infiltrado muito rico em eosinófilos em toda a biópsia — cistite eosinofílica.'),
    achado('granuloma-epitelioide', 'nao-avaliavel', [], 'Há células epitelioides esparsas perto de alguns ovos, mas não granulomas bem formados: a reação é predominantemente eosinofílica, própria da fase com ovos viáveis.'),
    achado('fibrose-cicatricial', 'ausente', [], 'Sem fibrose densa nem calcificação nesta biópsia — infecção ativa, não a fase crônica cicatricial.'),
], conferencias=3, resumo='Biópsia de bexiga de homem de 35 anos com hematúria: muitos ovos de Schistosoma, a maioria viáveis, na lâmina própria, com cistite eosinofílica intensa.')
print('ok')
