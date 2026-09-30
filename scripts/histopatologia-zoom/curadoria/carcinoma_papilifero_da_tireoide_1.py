import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('carcinoma-papilifero-da-tireoide-1', [], achados=[
    achado('nucleos-de-carcinoma-papilifero', 'presente', [], 'No nódulo, núcleos alongados, claros ("vidro fosco"), sobrepostos, com fendas longitudinais.'),
    achado('papilas-com-eixo-fibrovascular', 'presente', [], 'Estruturas papilares e folículos alongados revestidos pelas células tumorais.'),
    achado('corpos-psamomatosos', 'nao-avaliavel', [], 'Não foram encontrados corpos psamomatosos inequívocos nos campos examinados.'),
], conferencias=3, sem_marcacoes=True, resumo='Lobectomia tireoidiana de mulher de 53 anos com nódulo único: carcinoma papilífero com núcleos típicos, em meio a tireoide com folículos cheios de coloide.')
print('ok')
