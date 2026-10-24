import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 562, caso 2 — "Chondrosarcoma, low grade".
salvar('condrossarcoma-2', [
    pat('condrocitos', 'condrocitos-atipicos', seta(0.4420, 0.2880, 225),
        rotulo='Condrócitos atípicos, alguns binucleados, em lacunas',
        nota='As células cartilaginosas são mais numerosas que na cartilagem normal, de núcleos maiores, hipercromáticos e irregulares, várias com dois núcleos na mesma lacuna. A matriz é azul-pálida e mixoide. Em lesão de baixo grau a atipia é discreta — por isso o diagnóstico depende também da imagem (lesão grande, que erode a cortical) e da invasão do osso.',
        vista=(0.420, 0.260, 0.460, 0.300)),
    pat('lobulos', 'condrocitos-atipicos', seta(0.4300, 0.2700, 135),
        rotulo='Lóbulos de cartilagem neoplásica',
        vista=(0.400, 0.250, 0.460, 0.310)),
    pat('invasao', 'invasao-estromal', seta(0.4100, 0.2650, 45),
        rotulo='Borda do lóbulo contra o tecido fibroso vizinho',
        nota='Os lóbulos tumorais crescem empurrando e infiltrando os tecidos de fora; na peça inteira, o condrossarcoma envolve trabéculas preexistentes e permeia a medula — o que o encondroma não faz.',
        vista=(0.400, 0.250, 0.430, 0.290)),
    est('condrocito', 'condrocito', seta(0.4280, 0.2850, 315),
        rotulo='Condrócito em lacuna',
        vista=(0.422, 0.280, 0.432, 0.290)),
], achados=[
    achado('condrocitos-atipicos', 'presente', ['condrocitos', 'lobulos'],
           'Lóbulos de cartilagem hipercelular com condrócitos atípicos e binucleados, matriz mixoide — baixo grau.'),
    achado('invasao-estromal', 'presente', ['invasao'],
           'Lóbulos infiltrando o tecido fibroso da periferia; o osso hospedeiro não está incluído neste corte.'),
    achado('necrose-coagulativa', 'ausente', [],
           'Não há necrose — compatível com o baixo grau.'),
], conferencias=3, resumo='Condrossarcoma de baixo grau: lóbulos de cartilagem hipercelular, de matriz mixoide azul-pálida, com condrócitos de núcleos aumentados, hipercromáticos e binucleados em lacunas, infiltrando o tecido fibroso da periferia. Sem necrose.')
print('ok')
