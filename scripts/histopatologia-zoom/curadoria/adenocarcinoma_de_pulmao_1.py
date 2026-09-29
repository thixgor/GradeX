import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('adenocarcinoma-de-pulmao-1', [
    pat('glandulas', 'glandulas-neoplasicas-complexas', seta(0.2400, 0.5050, 45),
        rotulo='Glândulas e cordões de células atípicas',
        vista=(0.200, 0.470, 0.270, 0.540)),
    pat('papilas', 'glandulas-neoplasicas-complexas', seta(0.8010, 0.4850, 45),
        rotulo='Células tumorais revestindo espaços, formando papilas',
        vista=(0.760, 0.450, 0.830, 0.520)),
    pat('atipia', 'atipia-citologica', seta(0.8012, 0.4800, 45),
        rotulo='Núcleos grandes com nucléolo evidente',
        vista=(0.795, 0.470, 0.815, 0.490)),
    pat('desmoplasia', 'reacao-desmoplasica', seta(0.4480, 0.6700, 45),
        rotulo='Estroma desmoplásico com células tumorais infiltrando',
        vista=(0.430, 0.660, 0.460, 0.690)),
    pat('antracose', 'antracose', seta(0.4360, 0.7050, 45),
        rotulo='Antracose aprisionada na cicatriz tumoral',
        vista=(0.420, 0.650, 0.520, 0.750)),
], achados=[
    achado('glandulas-neoplasicas-complexas', 'presente', ['glandulas', 'papilas'], 'Glândulas, cordões e papilas de células epiteliais atípicas, com luzes irregulares.'),
    achado('crescimento-lepidico', 'nao-avaliavel', [], 'O relatório descreve componente lepídico, mas nesta biópsia por agulha os alvéolos estão colapsados e fragmentados: não é possível separar com segurança revestimento lepídico de invasão. O padrão é avaliado na peça cirúrgica.'),
    achado('atipia-citologica', 'presente', ['atipia'], 'Células grandes, de citoplasma eosinofílico, núcleos vesiculosos e nucléolos proeminentes.'),
    achado('reacao-desmoplasica', 'presente', ['desmoplasia'], 'Estroma fibroso reativo com células tumorais isoladas e em pequenos grupos.'),
    achado('antracose', 'presente', ['antracose'], 'Pigmento antracótico na área fibrosa central do tumor.'),
], conferencias=3, resumo='Biópsia por agulha de massa de 17 mm no lobo inferior esquerdo: adenocarcinoma com glândulas, papilas e células atípicas em estroma desmoplásico; CK7 e TTF-1 positivos.')
print('ok')
