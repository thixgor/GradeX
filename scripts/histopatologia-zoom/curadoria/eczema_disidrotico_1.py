import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('eczema-disidrotico-1', [
    pat('vesiculas', 'vesicula-intraepidermica', seta(0.4800, 0.0880, 45),
        rotulo='Vesículas grandes dentro da epiderme acral',
        vista=(0.460, 0.060, 0.520, 0.100)),
    pat('vesicula', 'vesicula-intraepidermica', seta(0.5030, 0.0860, 45),
        rotulo='Vesícula com fibrina e células inflamatórias',
        vista=(0.500, 0.083, 0.510, 0.093)),
    pat('espongiose', 'espongiose', seta(0.5080, 0.0900, 45),
        rotulo='Espongiose na parede da vesícula',
        vista=(0.505, 0.088, 0.517, 0.100)),
    pat('infiltrado', 'infiltrado-linfocitario-perivascular', seta(0.5195, 0.0928, 45),
        rotulo='Infiltrado linfocitário na derme superficial',
        vista=(0.505, 0.088, 0.517, 0.100)),
    est('camada-cornea', 'camada-cornea', seta(0.4900, 0.0800, 45), rotulo='Camada córnea espessa da pele acral',
        vista=(0.460, 0.060, 0.520, 0.100)),
], achados=[
    achado('vesicula-intraepidermica', 'presente', ['vesiculas', 'vesicula'], 'Várias vesículas grandes, confluentes, dentro da epiderme espessa, com fibrina e células inflamatórias.'),
    achado('espongiose', 'presente', ['espongiose'], 'Edema intercelular nas paredes das vesículas.'),
    achado('infiltrado-linfocitario-perivascular', 'presente', ['infiltrado'], 'Linfócitos na derme papilar e em volta dos vasos superficiais.'),
], conferencias=3, resumo='Pele da palma de homem de 70 anos: dermatite eczematosa tipo pompholyx, com grandes vesículas espongióticas intraepidérmicas sob a camada córnea espessa.')
print('ok')
