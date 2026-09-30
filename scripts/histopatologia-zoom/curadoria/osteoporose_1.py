import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('osteoporose-1', [
    pat('panorama', 'trabeculas-osseas-afinadas', seta(0.3000, 0.2200, 45),
        rotulo='Poucas trabéculas finas e muito espaçadas',
        vista=(0.000, 0.000, 1.000, 0.550)),
    pat('trabecula', 'trabeculas-osseas-afinadas', seta(0.4300, 0.2750, 45),
        rotulo='Trabécula fina e interrompida',
        vista=(0.400, 0.200, 0.550, 0.350)),
    pat('fragmento', 'trabeculas-osseas-afinadas', seta(0.4620, 0.2530, 45),
        rotulo='Fragmento trabecular curto, solto na medula',
        vista=(0.400, 0.200, 0.550, 0.350)),
    est('medula', 'medula-ossea-hematopoetica', seta(0.4760, 0.2890, 45), rotulo='Medula com hematopoese e muita gordura',
        vista=(0.470, 0.285, 0.482, 0.297)),
    est('cortical', 'osso-cortical', seta(0.4900, 0.3930, 45), rotulo='Cortical fina',
        vista=(0.460, 0.360, 0.520, 0.420)),
], achados=[
    achado('trabeculas-osseas-afinadas', 'presente', ['panorama', 'trabecula', 'fragmento'], 'Trabéculas finas, curtas e desconectadas, muito espaçadas, entre amplos espaços medulares com gordura; lamelas de aspecto normal.'),
    achado('fibrose-cicatricial', 'nao-avaliavel', [], 'Sob a cortical há tecido fibroso e cartilaginoso que pode corresponder a calo da fratura de costela, mas não é inequívoco nesta lâmina.'),
], conferencias=3, resumo='Costela de mulher de 85 anos com fratura: osteoporose, com trabéculas finas e desconectadas, medula rica em gordura e cortical fina.')
print('ok')
