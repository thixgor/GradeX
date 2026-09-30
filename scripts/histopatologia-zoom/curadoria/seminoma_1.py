import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('seminoma-1', [], achados=[
    achado('celulas-germinativas-neoplasicas', 'presente', [], 'Lençóis de células grandes e uniformes, citoplasma pálido e núcleos com nucléolo evidente, divididos por septos fibrosos.'),
    achado('infiltrado-linfoplasmocitario', 'nao-avaliavel', [], 'Os linfócitos nos septos são escassos nos campos examinados.'),
    achado('granuloma-epitelioide', 'ausente', [], 'Sem granulomas nos campos examinados.'),
], conferencias=3, sem_marcacoes=True, resumo='Orquiectomia de homem de 35 anos: seminoma de 16 mm formando lençóis de células germinativas grandes e claras, com testículo residual ao lado.')
print('ok')
