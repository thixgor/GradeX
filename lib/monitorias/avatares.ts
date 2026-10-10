/**
 * Retratos do monitor. Não há envio de foto (nada no nosso storage): o monitor
 * escolhe um destes, e o servidor grava só o `id`. As imagens são livres
 * (domínio público ou licença aberta) e ficam hospedadas no Wikimedia Commons,
 * que só aceita conteúdo livre. O crédito de cada uma é a página do arquivo.
 *
 * Para incluir um retrato: o arquivo precisa estar no Commons
 * (upload.wikimedia.org/wikipedia/commons/...), nunca num site de terceiros.
 *
 * Médicos de séries usam a foto livre do ATOR (evento, entrevista), nunca uma
 * cena ou divulgação da série, que pertencem ao estúdio. A licença livre cobre
 * o direito autoral do fotógrafo; por isso a tela diz quem é o ator e que não
 * há vínculo com as séries.
 */

export type GrupoAvatar = 'classicos' | 'seculo20' | 'brasil' | 'series'

export type SerieAvatar = 'house' | 'good-doctor' | 'resident' | 'greys' | 'er' | 'scrubs'

/** Séries na ordem em que aparecem no filtro. */
export const SERIES_AVATAR: Array<{ id: SerieAvatar; rotulo: string }> = [
  { id: 'house', rotulo: 'House' },
  { id: 'good-doctor', rotulo: 'The Good Doctor' },
  { id: 'resident', rotulo: 'The Resident' },
  { id: 'greys', rotulo: "Grey's Anatomy" },
  { id: 'er', rotulo: 'Plantão Médico' },
  { id: 'scrubs', rotulo: 'Scrubs' },
]

export interface Avatar {
  id: string
  nome: string
  legenda: string
  grupo: GrupoAvatar
  /** Só nos médicos de série: a série e o ator da foto (a foto é do ator, não da cena). */
  serie?: SerieAvatar
  ator?: string
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

  // Médicos de séries: foto livre do ator, identificada como tal. Sem logos e
  // sem fotos de cena (essas são do estúdio). Personagem sem foto livre do
  // ator no Commons fica de fora.
  { id: 'serie-house', nome: "Dr. Gregory House", legenda: "Hugh Laurie em House", grupo: 'series', serie: 'house', ator: "Hugh Laurie", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Hugh_Laurie%2C_from_a_bit_of_Fry_%26_Laurie%2C_http---en.wikipedia.org-wiki-Hugh_laurie_%289450843901%29_%28cropped%29.jpg/330px-Hugh_Laurie%2C_from_a_bit_of_Fry_%26_Laurie%2C_http---en.wikipedia.org-wiki-Hugh_laurie_%289450843901%29_%28cropped%29.jpg', arquivo: "Hugh_Laurie,_from_a_bit_of_Fry_&_Laurie,_http---en.wikipedia.org-wiki-Hugh_laurie_(9450843901)_(cropped).jpg" },
  { id: 'serie-cuddy', nome: "Dra. Lisa Cuddy", legenda: "Lisa Edelstein em House", grupo: 'series', serie: 'house', ator: "Lisa Edelstein", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Lisa_Edelstein_%40_Fox_Upfronts_%28headshot%29.jpg', arquivo: "Lisa Edelstein @ Fox Upfronts (headshot).jpg" },
  { id: 'serie-wilson', nome: "Dr. James Wilson", legenda: "Robert Sean Leonard em House", grupo: 'series', serie: 'house', ator: "Robert Sean Leonard", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Robert_Sean_Leonard.jpg/330px-Robert_Sean_Leonard.jpg', arquivo: "Robert_Sean_Leonard.jpg" },
  { id: 'serie-foreman', nome: "Dr. Eric Foreman", legenda: "Omar Epps em House", grupo: 'series', serie: 'house', ator: "Omar Epps", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Omar_Epps.jpg/330px-Omar_Epps.jpg', arquivo: "Omar_Epps.jpg" },
  { id: 'serie-chase', nome: "Dr. Robert Chase", legenda: "Jesse Spencer em House", grupo: 'series', serie: 'house', ator: "Jesse Spencer", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Jesse_Spencer_2009.jpg/330px-Jesse_Spencer_2009.jpg', arquivo: "Jesse_Spencer_2009.jpg" },
  { id: 'serie-cameron', nome: "Dra. Allison Cameron", legenda: "Jennifer Morrison em House", grupo: 'series', serie: 'house', ator: "Jennifer Morrison", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Jennifer_Morrison_%2855267980278%29_%28cropped%29.jpg/330px-Jennifer_Morrison_%2855267980278%29_%28cropped%29.jpg', arquivo: "Jennifer_Morrison_(55267980278)_(cropped).jpg" },
  { id: 'serie-treze', nome: "Dra. Remy Hadley, a Treze", legenda: "Olivia Wilde em House", grupo: 'series', serie: 'house', ator: "Olivia Wilde", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Olivia_Wilde_at_a_photocall_at_the_79th_Locarno_Film_Festival_2026_12_%28cropped%29.jpg/330px-Olivia_Wilde_at_a_photocall_at_the_79th_Locarno_Film_Festival_2026_12_%28cropped%29.jpg', arquivo: "Olivia_Wilde_at_a_photocall_at_the_79th_Locarno_Film_Festival_2026_12_(cropped).jpg" },
  { id: 'serie-taub', nome: "Dr. Chris Taub", legenda: "Peter Jacobson em House", grupo: 'series', serie: 'house', ator: "Peter Jacobson", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Peter_Jacobson_at_the_2009_Tribeca_Film_Festival.jpg/330px-Peter_Jacobson_at_the_2009_Tribeca_Film_Festival.jpg', arquivo: "Peter_Jacobson_at_the_2009_Tribeca_Film_Festival.jpg" },
  { id: 'serie-kutner', nome: "Dr. Lawrence Kutner", legenda: "Kal Penn em House", grupo: 'series', serie: 'house', ator: "Kal Penn", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Kal_Penn_at_the_2025_Jaipur_Literature_Festival_01_%28cropped%29.jpg/330px-Kal_Penn_at_the_2025_Jaipur_Literature_Festival_01_%28cropped%29.jpg', arquivo: "Kal_Penn_at_the_2025_Jaipur_Literature_Festival_01_(cropped).jpg" },
  { id: 'serie-amber', nome: "Dra. Amber Volakis", legenda: "Anne Dudek em House", grupo: 'series', serie: 'house', ator: "Anne Dudek", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Anne_Dudek_%28cropped%29.jpg/330px-Anne_Dudek_%28cropped%29.jpg', arquivo: "Anne Dudek (cropped).jpg" },
  { id: 'serie-adams', nome: "Dra. Jessica Adams", legenda: "Odette Annable em House", grupo: 'series', serie: 'house', ator: "Odette Annable", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Odette_Annable_%282017%29.jpg/330px-Odette_Annable_%282017%29.jpg', arquivo: "Odette Annable (2017).jpg" },
  { id: 'serie-shaun-murphy', nome: "Dr. Shaun Murphy", legenda: "Freddie Highmore em The Good Doctor", grupo: 'series', serie: 'good-doctor', ator: "Freddie Highmore", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Freddie_Highmore_2013_%28Straighten_Crop%29.jpg/330px-Freddie_Highmore_2013_%28Straighten_Crop%29.jpg', arquivo: "Freddie_Highmore_2013_(Straighten_Crop).jpg" },
  { id: 'serie-claire-browne', nome: "Dra. Claire Browne", legenda: "Antonia Thomas em The Good Doctor", grupo: 'series', serie: 'good-doctor', ator: "Antonia Thomas", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Antonia_Thomas_%28Cropped%29.jpg/330px-Antonia_Thomas_%28Cropped%29.jpg', arquivo: "Antonia_Thomas_(Cropped).jpg" },
  { id: 'serie-glassman', nome: "Dr. Aaron Glassman", legenda: "Richard Schiff em The Good Doctor", grupo: 'series', serie: 'good-doctor', ator: "Richard Schiff", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Richard_Schiff_Blue_Moon-47_%28cropped%29.jpg/330px-Richard_Schiff_Blue_Moon-47_%28cropped%29.jpg', arquivo: "Richard_Schiff_Blue_Moon-47_(cropped).jpg" },
  { id: 'serie-melendez', nome: "Dr. Neil Melendez", legenda: "Nicholas Gonzalez em The Good Doctor", grupo: 'series', serie: 'good-doctor', ator: "Nicholas Gonzalez", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Nicholas_Gonzalez_by_Gage_Skidmore.jpg/330px-Nicholas_Gonzalez_by_Gage_Skidmore.jpg', arquivo: "Nicholas Gonzalez by Gage Skidmore.jpg" },
  { id: 'serie-andrews', nome: "Dr. Marcus Andrews", legenda: "Hill Harper em The Good Doctor", grupo: 'series', serie: 'good-doctor', ator: "Hill Harper", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Hillharper.png', arquivo: "Hillharper.png" },
  { id: 'serie-park', nome: "Dr. Alex Park", legenda: "Will Yun Lee em The Good Doctor", grupo: 'series', serie: 'good-doctor', ator: "Will Yun Lee", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/WillYunLee-byPhilipRomano.jpg/330px-WillYunLee-byPhilipRomano.jpg', arquivo: "WillYunLee-byPhilipRomano.jpg" },
  { id: 'serie-reznick', nome: "Dra. Morgan Reznick", legenda: "Fiona Gubelmann em The Good Doctor", grupo: 'series', serie: 'good-doctor', ator: "Fiona Gubelmann", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Fiona_Gubelmann%2C_2012_%28crop%29.jpg/330px-Fiona_Gubelmann%2C_2012_%28crop%29.jpg', arquivo: "Fiona Gubelmann, 2012 (crop).jpg" },
  { id: 'serie-conrad-hawkins', nome: "Dr. Conrad Hawkins", legenda: "Matt Czuchry em The Resident", grupo: 'series', serie: 'resident', ator: "Matt Czuchry", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Matt_Czuchry_at_2015_PaleyFest.jpg/330px-Matt_Czuchry_at_2015_PaleyFest.jpg', arquivo: "Matt_Czuchry_at_2015_PaleyFest.jpg" },
  { id: 'serie-nic-nevin', nome: "Enf. Nic Nevin", legenda: "Emily VanCamp em The Resident", grupo: 'series', serie: 'resident', ator: "Emily VanCamp", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Emily_VanCamp_at_Televerse_2026.jpg/330px-Emily_VanCamp_at_Televerse_2026.jpg', arquivo: "Emily_VanCamp_at_Televerse_2026.jpg" },
  { id: 'serie-devon-pravesh', nome: "Dr. Devon Pravesh", legenda: "Manish Dayal em The Resident", grupo: 'series', serie: 'resident', ator: "Manish Dayal", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Manish_Dayal_Deauville_2014.jpg/330px-Manish_Dayal_Deauville_2014.jpg', arquivo: "Manish_Dayal_Deauville_2014.jpg" },
  { id: 'serie-randolph-bell', nome: "Dr. Randolph Bell", legenda: "Bruce Greenwood em The Resident", grupo: 'series', serie: 'resident', ator: "Bruce Greenwood", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Bruce_Greenwood_%2829223732930%29_cropped.jpg/330px-Bruce_Greenwood_%2829223732930%29_cropped.jpg', arquivo: "Bruce Greenwood (29223732930) cropped.jpg" },
  { id: 'serie-mina-okafor', nome: "Dra. Mina Okafor", legenda: "Shaunette Renée Wilson em The Resident", grupo: 'series', serie: 'resident', ator: "Shaunette Renée Wilson", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shaunette_Ren%C3%A9e_Wilson%2C_The_Women_of_Billions_Season_2.jpg/330px-Shaunette_Ren%C3%A9e_Wilson%2C_The_Women_of_Billions_Season_2.jpg', arquivo: "Shaunette Renée Wilson, The Women of Billions Season 2.jpg" },
  { id: 'serie-aj-austin', nome: "Dr. AJ Austin", legenda: "Malcolm-Jamal Warner em The Resident", grupo: 'series', serie: 'resident', ator: "Malcolm-Jamal Warner", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Malcolm-Jamal_Warner_%28cropped_2%29.jpg/330px-Malcolm-Jamal_Warner_%28cropped_2%29.jpg', arquivo: "Malcolm-Jamal Warner (cropped 2).jpg" },
  { id: 'serie-kit-voss', nome: "Dra. Kit Voss", legenda: "Jane Leeves em The Resident", grupo: 'series', serie: 'resident', ator: "Jane Leeves", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Jane_Leeves_2012.jpg/330px-Jane_Leeves_2012.jpg', arquivo: "Jane Leeves 2012.jpg" },
  { id: 'serie-barrett-cain', nome: "Dr. Barrett Cain", legenda: "Morris Chestnut em The Resident", grupo: 'series', serie: 'resident', ator: "Morris Chestnut", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Morris_Chestnut_in_2010_by_Gage_Skidmore.jpg/330px-Morris_Chestnut_in_2010_by_Gage_Skidmore.jpg', arquivo: "Morris Chestnut in 2010 by Gage Skidmore.jpg" },
  { id: 'serie-meredith-grey', nome: "Dra. Meredith Grey", legenda: "Ellen Pompeo em Grey's Anatomy", grupo: 'series', serie: 'greys', ator: "Ellen Pompeo", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Ellen_Pompeo_LF.JPG/330px-Ellen_Pompeo_LF.JPG', arquivo: "Ellen_Pompeo_LF.JPG" },
  { id: 'serie-derek-shepherd', nome: "Dr. Derek Shepherd", legenda: "Patrick Dempsey em Grey's Anatomy", grupo: 'series', serie: 'greys', ator: "Patrick Dempsey", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Patrick_Dempsey_SiriusXM.jpg/330px-Patrick_Dempsey_SiriusXM.jpg', arquivo: "Patrick_Dempsey_SiriusXM.jpg" },
  { id: 'serie-cristina-yang', nome: "Dra. Cristina Yang", legenda: "Sandra Oh em Grey's Anatomy", grupo: 'series', serie: 'greys', ator: "Sandra Oh", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Sandra_Oh_2011_%28cropped%29.jpg/330px-Sandra_Oh_2011_%28cropped%29.jpg', arquivo: "Sandra Oh 2011 (cropped).jpg" },
  { id: 'serie-miranda-bailey', nome: "Dra. Miranda Bailey", legenda: "Chandra Wilson em Grey's Anatomy", grupo: 'series', serie: 'greys', ator: "Chandra Wilson", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Chandra_Wilson_2014.jpg/330px-Chandra_Wilson_2014.jpg', arquivo: "Chandra Wilson 2014.jpg" },
  { id: 'serie-alex-karev', nome: "Dr. Alex Karev", legenda: "Justin Chambers em Grey's Anatomy", grupo: 'series', serie: 'greys', ator: "Justin Chambers", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Justin_Cambers_2014_%28cropped%29.jpg/330px-Justin_Cambers_2014_%28cropped%29.jpg', arquivo: "Justin Cambers 2014 (cropped).jpg" },
  { id: 'serie-addison', nome: "Dra. Addison Montgomery", legenda: "Kate Walsh em Grey's Anatomy", grupo: 'series', serie: 'greys', ator: "Kate Walsh", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kate_Walsh_2011_crop.jpg/330px-Kate_Walsh_2011_crop.jpg', arquivo: "Kate Walsh 2011 crop.jpg" },
  { id: 'serie-mark-sloan', nome: "Dr. Mark Sloan", legenda: "Eric Dane em Grey's Anatomy", grupo: 'series', serie: 'greys', ator: "Eric Dane", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Eric_Dane_%2835445096813%29_%28cropped_2%29.jpg/330px-Eric_Dane_%2835445096813%29_%28cropped_2%29.jpg', arquivo: "Eric Dane (35445096813) (cropped 2).jpg" },
  { id: 'serie-doug-ross', nome: "Dr. Doug Ross", legenda: "George Clooney em Plantão Médico", grupo: 'series', serie: 'er', ator: "George Clooney", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/George_Clooney_Jay_Kelly-19_%28cropped%29.jpg/330px-George_Clooney_Jay_Kelly-19_%28cropped%29.jpg', arquivo: "George_Clooney_Jay_Kelly-19_(cropped).jpg" },
  { id: 'serie-john-carter', nome: "Dr. John Carter", legenda: "Noah Wyle em Plantão Médico", grupo: 'series', serie: 'er', ator: "Noah Wyle", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Noah_Wyle_-_Walk_of_Fame-01.jpg/330px-Noah_Wyle_-_Walk_of_Fame-01.jpg', arquivo: "Noah_Wyle_-_Walk_of_Fame-01.jpg" },
  { id: 'serie-mark-greene', nome: "Dr. Mark Greene", legenda: "Anthony Edwards em Plantão Médico", grupo: 'series', serie: 'er', ator: "Anthony Edwards", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Anthony_Edwards_2018_-_1_in_6_181029-F-VX890-1029_%28cropped%29.jpg/330px-Anthony_Edwards_2018_-_1_in_6_181029-F-VX890-1029_%28cropped%29.jpg', arquivo: "Anthony Edwards 2018 - 1 in 6 181029-F-VX890-1029 (cropped).jpg" },
  { id: 'serie-jd', nome: "Dr. John Dorian, o J.D.", legenda: "Zach Braff em Scrubs", grupo: 'series', serie: 'scrubs', ator: "Zach Braff", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Zach_Braff_by_David_Shankbone.jpg/330px-Zach_Braff_by_David_Shankbone.jpg', arquivo: "Zach Braff by David Shankbone.jpg" },
  { id: 'serie-turk', nome: "Dr. Chris Turk", legenda: "Donald Faison em Scrubs", grupo: 'series', serie: 'scrubs', ator: "Donald Faison", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Donald_Faison_by_Gage_Skidmore_2_%28cropped%29.jpg/330px-Donald_Faison_by_Gage_Skidmore_2_%28cropped%29.jpg', arquivo: "Donald Faison by Gage Skidmore 2 (cropped).jpg" },
  { id: 'serie-elliot-reid', nome: "Dra. Elliot Reid", legenda: "Sarah Chalke em Scrubs", grupo: 'series', serie: 'scrubs', ator: "Sarah Chalke", mulher: true, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Sarah_Chalke_2008_%28facecrop%29.jpg/330px-Sarah_Chalke_2008_%28facecrop%29.jpg', arquivo: "Sarah Chalke 2008 (facecrop).jpg" },
  { id: 'serie-perry-cox', nome: "Dr. Perry Cox", legenda: "John C. McGinley em Scrubs", grupo: 'series', serie: 'scrubs', ator: "John C. McGinley", mulher: false, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/JohnCMcGinleyByTomMorgan2008.jpg/330px-JohnCMcGinleyByTomMorgan2008.jpg', arquivo: "JohnCMcGinleyByTomMorgan2008.jpg" },
]

const POR_ID = new Map(AVATARES.map((a) => [a.id, a]))

/** O retrato do catálogo, ou null para id ausente/inventado. */
export function avatarPorId(id: string | null | undefined): Avatar | null {
  return (id && POR_ID.get(id)) || null
}

/** "Hipócrates, pai da medicina" / "Dr. Gregory House, Hugh Laurie em House". */
export function descricaoDoAvatar(a: Avatar): string {
  return `${a.nome}, ${a.ator ? a.legenda : a.legenda.charAt(0).toLowerCase() + a.legenda.slice(1)}`
}

/** Página do arquivo no Commons: autor, licença e origem da imagem. */
export function creditoDoAvatar(a: Pick<Avatar, 'arquivo'>): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(a.arquivo.replace(/ /g, '_'))}`
}

export type FiltroAvatar = 'todos' | 'series' | 'brasil' | 'mulheres' | 'classicos' | 'seculo20'

export const FILTROS_AVATAR: Array<{ id: FiltroAvatar; rotulo: string; aceita: (a: Avatar) => boolean }> = [
  { id: 'todos', rotulo: 'Todos', aceita: () => true },
  { id: 'series', rotulo: 'Séries', aceita: (a) => a.grupo === 'series' },
  { id: 'brasil', rotulo: 'Brasil', aceita: (a) => a.grupo === 'brasil' },
  { id: 'mulheres', rotulo: 'Mulheres', aceita: (a) => a.mulher },
  { id: 'classicos', rotulo: 'Clássicos', aceita: (a) => a.grupo === 'classicos' },
  { id: 'seculo20', rotulo: 'Século XX', aceita: (a) => a.grupo === 'seculo20' },
]
