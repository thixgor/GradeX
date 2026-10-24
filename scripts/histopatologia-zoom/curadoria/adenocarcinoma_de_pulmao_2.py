import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 217, caso 8 — "Bronchiolo-alveolar carcinoma" (hoje: adenocarcinoma mucinoso invasivo).
salvar('adenocarcinoma-de-pulmao-2', [
    pat('lepidico', 'crescimento-lepidico', seta(0.5250, 0.1000, 225),
        rotulo='Células colunares mucinosas forrando septos alveolares preservados',
        nota='As células tumorais — altas, colunares, de núcleo basal e citoplasma cheio de muco claro — revestem as paredes dos alvéolos como um papel de parede, sem destruí-las: é o crescimento lepídico. Os septos finos continuam lá por baixo. Este padrão era chamado de "carcinoma bronquioloalveolar"; a forma mucinosa, como esta, é hoje adenocarcinoma mucinoso invasivo e costuma se associar a mutação de KRAS.',
        vista=(0.500, 0.070, 0.560, 0.120)),
    pat('glandulas', 'glandulas-neoplasicas-complexas', seta(0.7800, 0.2450, 315),
        rotulo='Foco de glândulas apertadas e confluentes',
        nota='Aqui as células deixam de só forrar septos e formam glândulas aglomeradas, de contornos irregulares, com estroma entre elas — o componente acinar invasivo.',
        vista=(0.740, 0.200, 0.800, 0.260)),
    pat('atipia', 'atipia-citologica', seta(0.5350, 0.1080, 315),
        rotulo='Atipia discreta: núcleos basais, algo aumentados e empilhados',
        nota='No adenocarcinoma mucinoso a atipia é pouca — núcleos pequenos, basais, às vezes empilhados. A suspeita vem da arquitetura (células colunares mucinosas onde deveria haver pneumócitos achatados) mais que do núcleo.',
        vista=(0.525, 0.100, 0.545, 0.115)),
    pat('aerogena', 'crescimento-lepidico', seta(0.3500, 0.2300, 225),
        rotulo='Ilhas de tumor espalhadas por alvéolos à distância',
        nota='Grupos de células mucinosas aparecem soltos em alvéolos longe da massa principal: o tumor se espalha pelas vias aéreas (disseminação aerógena), o que explica o aspecto pneumônico, multifocal, na tomografia.',
        vista=(0.280, 0.200, 0.360, 0.300)),
    est('alveolos', 'alveolo-pulmonar', seta(0.3100, 0.2600, 45),
        rotulo='Alvéolos com septos finos e macrófagos na luz',
        vista=(0.290, 0.240, 0.340, 0.290)),
    est('bronquiolo', 'bronquiolo', seta(0.6100, 0.1600, 135),
        rotulo='Bronquíolo e artéria acompanhante',
        vista=(0.570, 0.120, 0.650, 0.200)),
], achados=[
    achado('glandulas-neoplasicas-complexas', 'presente', ['glandulas'],
           'Focos de glândulas aglomeradas e confluentes na metade direita, além do componente lepídico.'),
    achado('crescimento-lepidico', 'presente', ['lepidico', 'aerogena'],
           'Crescimento lepídico mucinoso extenso, com ilhas aerógenas à distância.'),
    achado('atipia-citologica', 'presente', ['atipia'],
           'Atipia discreta, típica da variante mucinosa.'),
    achado('reacao-desmoplasica', 'ausente', [],
           'Os septos alveolares se mantêm finos; não há estroma desmoplásico extenso nos campos conferidos.'),
    achado('antracose', 'presente', [],
           'Pigmento de carvão discreto junto ao foco glandular e nos septos.'),
], conferencias=3, resumo='Adenocarcinoma mucinoso do pulmão (antigo carcinoma bronquioloalveolar mucinoso): células colunares mucinosas, de atipia discreta, revestem septos alveolares preservados (crescimento lepídico), formam focos de glândulas confluentes e se espalham em ilhas por alvéolos à distância. Entre elas, parênquima com alvéolos de septos finos e macrófagos.')
print('ok')
