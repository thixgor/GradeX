/**
 * Retratos do monitor. Não há envio de foto (nada no nosso storage): o monitor
 * escolhe um destes, e o servidor grava só o `id`. As imagens são livres
 * (domínio público ou licença aberta) e ficam hospedadas no Wikimedia Commons,
 * que só aceita conteúdo livre. O crédito de cada uma é a página do arquivo.
 *
 * Para incluir um retrato: o arquivo precisa estar no Commons
 * (upload.wikimedia.org/wikipedia/commons/...), nunca num site de terceiros.
 */

export type GrupoAvatar = 'classicos' | 'seculo20' | 'brasil'

export interface Avatar {
  id: string
  nome: string
  legenda: string
  grupo: GrupoAvatar
  mulher: boolean
  /** Miniatura de 330 px no Commons. */
  url: string
  /** Nome do arquivo no Commons (crédito e licença). */
  arquivo: string
}

export const AVATARES: Avatar[] = [
  { id: 'hipocrates', nome: "Hipócrates", legenda: "Pai da medicina", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Hippocrates.jpg/330px-Hippocrates.jpg', arquivo: "Hippocrates.jpg" },
  { id: 'galeno', nome: "Galeno", legenda: "Anatomia e fisiologia na Antiguidade", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Galenus.jpg/330px-Galenus.jpg', arquivo: "Galenus.jpg" },
  { id: 'avicena', nome: "Avicena", legenda: "Autor do Cânone da Medicina", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Avicenna_Bust%2C_left_profile_%28cropped%29.jpg/330px-Avicenna_Bust%2C_left_profile_%28cropped%29.jpg', arquivo: "Avicenna_Bust,_left_profile_(cropped).jpg" },
  { id: 'hildegarda', nome: "Hildegarda de Bingen", legenda: "Medicina e ciência na Idade Média", grupo: 'classicos', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Hildegard_von_Bingen.jpg/330px-Hildegard_von_Bingen.jpg', arquivo: "Hildegard_von_Bingen.jpg" },
  { id: 'paracelso', nome: "Paracelso", legenda: "A dose faz o veneno", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Aureolus_Theophrastus_Bombastus_von_Hohenheim_%28Paracelsus%29._Wellcome_V0004455.jpg/330px-Aureolus_Theophrastus_Bombastus_von_Hohenheim_%28Paracelsus%29._Wellcome_V0004455.jpg', arquivo: "Aureolus_Theophrastus_Bombastus_von_Hohenheim_(Paracelsus)._Wellcome_V0004455.jpg" },
  { id: 'pare', nome: "Ambroise Paré", legenda: "Pai da cirurgia moderna", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Portrait_of_Ambroise_Par%C3%A9.jpg/330px-Portrait_of_Ambroise_Par%C3%A9.jpg', arquivo: "Portrait_of_Ambroise_Paré.jpg" },
  { id: 'vesalius', nome: "Andreas Vesalius", legenda: "Fundador da anatomia moderna", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Man_dressed_in_Black_by_Calcar_%28Hermitage%29.jpg/330px-Man_dressed_in_Black_by_Calcar_%28Hermitage%29.jpg', arquivo: "Man_dressed_in_Black_by_Calcar_(Hermitage).jpg" },
  { id: 'harvey', nome: "William Harvey", legenda: "Descreveu a circulação do sangue", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/William_Harvey_2.jpg/330px-William_Harvey_2.jpg', arquivo: "William_Harvey_2.jpg" },
  { id: 'jenner', nome: "Edward Jenner", legenda: "Criou a primeira vacina", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Edward_Jenner.jpg/330px-Edward_Jenner.jpg', arquivo: "Edward_Jenner.jpg" },
  { id: 'laennec', nome: "René Laennec", legenda: "Inventou o estetoscópio", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Rene-Theophile-Hyacinthe_Laennec.jpg/330px-Rene-Theophile-Hyacinthe_Laennec.jpg', arquivo: "Rene-Theophile-Hyacinthe_Laennec.jpg" },
  { id: 'semmelweis', nome: "Ignaz Semmelweis", legenda: "Lavar as mãos salva vidas", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Borsos_%26_Doctor_Semmelweis_Ign%C3%A1c_cropped.jpg/330px-Borsos_%26_Doctor_Semmelweis_Ign%C3%A1c_cropped.jpg', arquivo: "Borsos_&_Doctor_Semmelweis_Ignác_cropped.jpg" },
  { id: 'snow', nome: "John Snow", legenda: "Pai da epidemiologia", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/John_Snow.jpg/330px-John_Snow.jpg', arquivo: "John_Snow.jpg" },
  { id: 'nightingale', nome: "Florence Nightingale", legenda: "Fundadora da enfermagem moderna", grupo: 'classicos', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Florence_Nightingale_%28H_Hering_NPG_x82368%29.jpg/330px-Florence_Nightingale_%28H_Hering_NPG_x82368%29.jpg', arquivo: "Florence_Nightingale_(H_Hering_NPG_x82368).jpg" },
  { id: 'blackwell', nome: "Elizabeth Blackwell", legenda: "Primeira médica formada nos EUA", grupo: 'classicos', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Elizabeth_Blackwell.jpg', arquivo: "Elizabeth_Blackwell.jpg" },
  { id: 'crumpler', nome: "Rebecca Lee Crumpler", legenda: "Primeira médica negra dos EUA", grupo: 'classicos', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Crumpler_A-Book-of-Medical-Discourses.jpg/330px-Crumpler_A-Book-of-Medical-Discourses.jpg', arquivo: "Crumpler_A-Book-of-Medical-Discourses.jpg" },
  { id: 'garrett-anderson', nome: "Elizabeth Garrett Anderson", legenda: "Primeira médica do Reino Unido", grupo: 'classicos', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Elizabeth_Garrett_Anderson_%28detail_of_painting%29.jpg/330px-Elizabeth_Garrett_Anderson_%28detail_of_painting%29.jpg', arquivo: "Elizabeth_Garrett_Anderson_(detail_of_painting).jpg" },
  { id: 'walker', nome: "Mary Edwards Walker", legenda: "Cirurgiã, Medalha de Honra dos EUA", grupo: 'classicos', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Dr._Mary_Walker_%28cropped%29.jpg/330px-Dr._Mary_Walker_%28cropped%29.jpg', arquivo: "Dr._Mary_Walker_(cropped).jpg" },
  { id: 'pasteur', nome: "Louis Pasteur", legenda: "Microbiologia e vacina da raiva", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Louis_Pasteur%2C_foto_av_Paul_Nadar%2C_Crisco_edit.jpg/330px-Louis_Pasteur%2C_foto_av_Paul_Nadar%2C_Crisco_edit.jpg', arquivo: "Louis_Pasteur,_foto_av_Paul_Nadar,_Crisco_edit.jpg" },
  { id: 'koch', nome: "Robert Koch", legenda: "Descobriu o bacilo da tuberculose", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Robert_Koch_BeW.jpg/330px-Robert_Koch_BeW.jpg', arquivo: "Robert_Koch_BeW.jpg" },
  { id: 'lister', nome: "Joseph Lister", legenda: "Pai da cirurgia antisséptica", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Joseph_Lister%2C_1st_Baron_Lister_%281827_%E2%80%93_1912%29_surgeon_Wellcome_L0002075.jpg/330px-Joseph_Lister%2C_1st_Baron_Lister_%281827_%E2%80%93_1912%29_surgeon_Wellcome_L0002075.jpg', arquivo: "Joseph_Lister,_1st_Baron_Lister_(1827_–_1912)_surgeon_Wellcome_L0002075.jpg" },
  { id: 'virchow', nome: "Rudolf Virchow", legenda: "Pai da patologia celular", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Rudolf_Virchow_NLM3.jpg/330px-Rudolf_Virchow_NLM3.jpg', arquivo: "Rudolf_Virchow_NLM3.jpg" },
  { id: 'claude-bernard', nome: "Claude Bernard", legenda: "Meio interno e homeostase", grupo: 'classicos', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Claude_Bernard.jpg/330px-Claude_Bernard.jpg', arquivo: "Claude_Bernard.jpg" },
  { id: 'osler', nome: "William Osler", legenda: "Ensino à beira do leito", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/William_Osler_c1912.jpg/330px-William_Osler_c1912.jpg', arquivo: "William_Osler_c1912.jpg" },
  { id: 'cajal', nome: "Santiago Ramón y Cajal", legenda: "Pai da neurociência", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Santiago_Ram%C3%B3n_y_Cajal_%281852-1934%29_portrait_%28restored%29.jpg/330px-Santiago_Ram%C3%B3n_y_Cajal_%281852-1934%29_portrait_%28restored%29.jpg', arquivo: "Santiago_Ramón_y_Cajal_(1852-1934)_portrait_(restored).jpg" },
  { id: 'pavlov', nome: "Ivan Pavlov", legenda: "Fisiologia da digestão", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Ivan_Pavlov_NLM3.jpg/330px-Ivan_Pavlov_NLM3.jpg', arquivo: "Ivan_Pavlov_NLM3.jpg" },
  { id: 'rontgen', nome: "Wilhelm Röntgen", legenda: "Descobriu os raios X", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Wilhelm_Conrad_R%C3%B6ntgen_%281888-1900%29%2C_88374_p.jpg/330px-Wilhelm_Conrad_R%C3%B6ntgen_%281888-1900%29%2C_88374_p.jpg', arquivo: "Wilhelm_Conrad_Röntgen_(1888-1900),_88374_p.jpg" },
  { id: 'alzheimer', nome: "Alois Alzheimer", legenda: "Descreveu a doença de Alzheimer", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Alois_Alzheimer_002.jpg/330px-Alois_Alzheimer_002.jpg', arquivo: "Alois_Alzheimer_002.jpg" },
  { id: 'richet', nome: "Charles Richet", legenda: "Descobriu a anafilaxia", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Charles_Robert_Richet_3.jpg/330px-Charles_Robert_Richet_3.jpg', arquivo: "Charles_Robert_Richet_3.jpg" },
  { id: 'freud', nome: "Sigmund Freud", legenda: "Criador da psicanálise", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Sigmund_Freud%2C_by_Max_Halberstadt_%28cropped%29.jpg/330px-Sigmund_Freud%2C_by_Max_Halberstadt_%28cropped%29.jpg', arquivo: "Sigmund_Freud,_by_Max_Halberstadt_(cropped).jpg" },
  { id: 'curie', nome: "Marie Curie", legenda: "Radioatividade, dois prêmios Nobel", grupo: 'seculo20', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marie_Curie_c._1920s.jpg/330px-Marie_Curie_c._1920s.jpg', arquivo: "Marie_Curie_c._1920s.jpg" },
  { id: 'cushing', nome: "Harvey Cushing", legenda: "Pai da neurocirurgia", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Harvey_Williams_Cushing_1938b.jpg/330px-Harvey_Williams_Cushing_1938b.jpg', arquivo: "Harvey_Williams_Cushing_1938b.jpg" },
  { id: 'banting', nome: "Frederick Banting", legenda: "Descobriu a insulina", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/F._G._Banting_1923.jpg/330px-F._G._Banting_1923.jpg', arquivo: "F._G._Banting_1923.jpg" },
  { id: 'fleming', nome: "Alexander Fleming", legenda: "Descobriu a penicilina", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Synthetic_Production_of_Penicillin_TR1468.jpg/330px-Synthetic_Production_of_Penicillin_TR1468.jpg', arquivo: "Synthetic_Production_of_Penicillin_TR1468.jpg" },
  { id: 'gerty-cori', nome: "Gerty Cori", legenda: "Ciclo de Cori, Nobel de Medicina", grupo: 'seculo20', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Gerty_Theresa_Cori.jpg/330px-Gerty_Theresa_Cori.jpg', arquivo: "Gerty_Theresa_Cori.jpg" },
  { id: 'apgar', nome: "Virginia Apgar", legenda: "Criou o índice de Apgar", grupo: 'seculo20', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Virginia-Apgar-July-6-1959.jpg/330px-Virginia-Apgar-July-6-1959.jpg', arquivo: "Virginia-Apgar-July-6-1959.jpg" },
  { id: 'salk', nome: "Jonas Salk", legenda: "Vacina inativada da pólio", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Jonas_Salk_candid.jpg/330px-Jonas_Salk_candid.jpg', arquivo: "Jonas_Salk_candid.jpg" },
  { id: 'sabin', nome: "Albert Sabin", legenda: "Vacina oral da pólio", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Albert_Sabin.jpg', arquivo: "Albert_Sabin.jpg" },
  { id: 'levi-montalcini', nome: "Rita Levi-Montalcini", legenda: "Fator de crescimento neural", grupo: 'seculo20', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Rita_Levi-Montalcini_%281986%29.png/330px-Rita_Levi-Montalcini_%281986%29.png', arquivo: "Rita_Levi-Montalcini_(1986).png" },
  { id: 'barnard', nome: "Christiaan Barnard", legenda: "Primeiro transplante de coração", grupo: 'seculo20', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Heart_transplant_pioneer_Barnard_here_on_Visit_%28FL61733185%29.jpg/330px-Heart_transplant_pioneer_Barnard_here_on_Visit_%28FL61733185%29.jpg', arquivo: "Heart_transplant_pioneer_Barnard_here_on_Visit_(FL61733185).jpg" },
  { id: 'oswaldo-cruz', nome: "Oswaldo Cruz", legenda: "Saúde pública e vacinação no Brasil", grupo: 'brasil', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Oswcruz.jpg', arquivo: "Oswcruz.jpg" },
  { id: 'carlos-chagas', nome: "Carlos Chagas", legenda: "Descreveu a doença de Chagas", grupo: 'brasil', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Carlos_Chagas%2C_sem_data.tif/lossy-page1-330px-Carlos_Chagas%2C_sem_data.tif.jpg', arquivo: "lossy-page1-330px-Carlos_Chagas,_sem_data.tif.jpg" },
  { id: 'vital-brazil', nome: "Vital Brazil", legenda: "Criou o soro antiofídico", grupo: 'brasil', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/3/37/VitalBrazil1892.jpg', arquivo: "VitalBrazil1892.jpg" },
  { id: 'emilio-ribas', nome: "Emílio Ribas", legenda: "Combate à febre amarela", grupo: 'brasil', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Medico_eribas.jpg', arquivo: "Medico_eribas.jpg" },
  { id: 'miguel-couto', nome: "Miguel Couto", legenda: "Clínica médica e ensino", grupo: 'brasil', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Miguel_Couto.png/330px-Miguel_Couto.png', arquivo: "Miguel_Couto.png" },
  { id: 'clementino-fraga', nome: "Clementino Fraga", legenda: "Saúde pública e febre amarela", grupo: 'brasil', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Clementino_Fraga_1918.png/330px-Clementino_Fraga_1918.png', arquivo: "Clementino_Fraga_1918.png" },
  { id: 'manoel-de-abreu', nome: "Manoel de Abreu", legenda: "Criou a abreugrafia", grupo: 'brasil', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Manoel_de_Abreu%2C_m%C3%A9dico%2C_1942.tif/lossy-page1-330px-Manoel_de_Abreu%2C_m%C3%A9dico%2C_1942.tif.jpg', arquivo: "lossy-page1-330px-Manoel_de_Abreu,_médico,_1942.tif.jpg" },
  { id: 'ana-neri', nome: "Ana Néri", legenda: "Pioneira da enfermagem no Brasil", grupo: 'brasil', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Anna_Nery%2C_c.1903.jpg/330px-Anna_Nery%2C_c.1903.jpg', arquivo: "Anna_Nery,_c.1903.jpg" },
  { id: 'rita-lobato', nome: "Rita Lobato", legenda: "Primeira médica formada no Brasil", grupo: 'brasil', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Ritalobato.jpg/330px-Ritalobato.jpg', arquivo: "Ritalobato.jpg" },
  { id: 'praguer-froes', nome: "Francisca Praguer Fróes", legenda: "Médica e defensora da saúde da mulher", grupo: 'brasil', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Praguer_Froes.jpg/330px-Praguer_Froes.jpg', arquivo: "Praguer_Froes.jpg" },
  { id: 'nise-da-silveira', nome: "Nise da Silveira", legenda: "Psiquiatria humanizada", grupo: 'brasil', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Nise_da_Silveira.tif/lossless-page1-330px-Nise_da_Silveira.tif.png', arquivo: "lossless-page1-330px-Nise_da_Silveira.tif.png" },
  { id: 'zerbini', nome: "Euryclides Zerbini", legenda: "Primeiro transplante cardíaco do Brasil", grupo: 'brasil', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Dr._Zerbini_e_Abreu_Sodr%C3%A9_%281968%29_%28cropped_Zerbini%29.jpg/330px-Dr._Zerbini_e_Abreu_Sodr%C3%A9_%281968%29_%28cropped_Zerbini%29.jpg', arquivo: "Dr._Zerbini_e_Abreu_Sodré_(1968)_(cropped_Zerbini).jpg" },
  { id: 'adib-jatene', nome: "Adib Jatene", legenda: "Cirurgia cardíaca e saúde pública", grupo: 'brasil', mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Adib_jatene.JPG/330px-Adib_jatene.JPG', arquivo: "Adib_jatene.JPG" },
  { id: 'zilda-arns', nome: "Zilda Arns", legenda: "Médica, fundou a Pastoral da Criança", grupo: 'brasil', mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Zilda_Arns.jpeg/330px-Zilda_Arns.jpeg', arquivo: "Zilda_Arns.jpeg" },
]

const POR_ID = new Map(AVATARES.map((a) => [a.id, a]))

/** O retrato do catálogo, ou null para id ausente/inventado. */
export function avatarPorId(id: string | null | undefined): Avatar | null {
  return (id && POR_ID.get(id)) || null
}

/** Página do arquivo no Commons: autor, licença e origem da imagem. */
export function creditoDoAvatar(a: Pick<Avatar, 'arquivo'>): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(a.arquivo.replace(/ /g, '_'))}`
}

export type FiltroAvatar = 'todos' | 'brasil' | 'mulheres' | 'classicos' | 'seculo20'

export const FILTROS_AVATAR: Array<{ id: FiltroAvatar; rotulo: string; aceita: (a: Avatar) => boolean }> = [
  { id: 'todos', rotulo: 'Todos', aceita: () => true },
  { id: 'brasil', rotulo: 'Brasil', aceita: (a) => a.grupo === 'brasil' },
  { id: 'mulheres', rotulo: 'Mulheres', aceita: (a) => a.mulher },
  { id: 'classicos', rotulo: 'Clássicos', aceita: (a) => a.grupo === 'classicos' },
  { id: 'seculo20', rotulo: 'Século XX', aceita: (a) => a.grupo === 'seculo20' },
]
