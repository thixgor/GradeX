import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('angiomiolipoma-renal-1', [
    pat('vasos', 'vasos-de-parede-espessa-dismorficos', seta(0.4600, 0.1600, 45),
        rotulo='Vasos de parede espessa por todo o tumor',
        vista=(0.440, 0.140, 0.500, 0.200)),
    pat('vaso-parede', 'vasos-de-parede-espessa-dismorficos', seta(0.4700, 0.1745, 45),
        rotulo='Parede grossa e desorganizada',
        vista=(0.460, 0.160, 0.490, 0.190)),
    pat('gordura', 'tecido-adiposo-no-tumor', seta(0.3910, 0.2360, 45),
        rotulo='Adipócitos maduros dentro do tumor',
        vista=(0.360, 0.200, 0.420, 0.260)),
    est('musculo', 'feixe-de-musculo-liso', seta(0.4800, 0.1832, 45),
        rotulo='Células musculares lisas fusiformes do tumor',
        vista=(0.476, 0.176, 0.486, 0.186)),
    est('glomerulo', 'corpusculo-renal', seta(0.4320, 0.3484, 45), rotulo='Glomérulo do rim normal',
        vista=(0.400, 0.280, 0.480, 0.360)),
], achados=[
    achado('vasos-de-parede-espessa-dismorficos', 'presente', ['vasos', 'vaso-parede'], 'Numerosos vasos de parede muscular grossa, hialina e desorganizada, com células fusiformes se desprendendo para o estroma.'),
    achado('tecido-adiposo-no-tumor', 'presente', ['gordura'], 'Adipócitos maduros isolados e em grupos no meio das células fusiformes; componente de gordura minoritário neste tumor.'),
    achado('hemorragia-intersticial', 'nao-avaliavel', [], 'Há hemácias soltas em focos pequenos, mas não se distinguem com segurança de capilares congestos; não há hemorragia extensa neste tumor pequeno.'),
], conferencias=3, resumo='Angiomiolipoma renal de 18 mm (nefrectomia parcial): vasos de parede espessa, feixes de músculo liso e adipócitos maduros; córtex renal normal no fragmento vizinho.')
print('ok')
