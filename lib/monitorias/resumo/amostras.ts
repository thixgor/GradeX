/**
 * Áudios minúsculos do autoteste do Resumo por IA ("Testar o Resumo por IA",
 * Admin → Configurações). Nenhum é voz de ninguém.
 *
 * - WebM/Opus: 2 s gravados pelo MediaRecorder do Chromium (o mesmo
 *   `audio/webm;codecs=opus`, 24 kb/s, com uma pausa e retomada, que o
 *   gravador da sala produz). Sem duração no cabeçalho, como sai do navegador.
 * - WAV: PCM 16 bits, 16 kHz, mono, gerado na hora (`./wav.ts`, o mesmo que o
 *   navegador do admin manda).
 */

const WEBM_OPUS_BASE64 =
  'GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFh8ZGrH5y6p+DgQKGhkFfT1BVU2Oik09wdXNIZWFkAQEAAIC7AAAAAADhjbWERzuAAJ+BAWJkgSAfQ7Z1Af/////////ngQCjjIEAAID7A//+//7//qOMgQA8gPsD//7//v/+o4yBAHiA+wP//v/+//6jjIEAtID7A//+//7//qOMgQDwgPsD//7//v/+o4yBASyA+wP//v/+//6jjIEBaID7A//+//7//qOMgQGkgPsD//7//v/+o4yBAeCA+wP//v/+//6jjIECHID7A//+//7//qOMgQJYgPsD//7//v/+o4yBApSA+wP//v/+//6jjIEC0ID7A//+//7//qOMgQMMgPsD//7//v/+o4yBA0iA+wP//v/+//6jjIEDhID7A//+//7//qOMgQPAgPsD//7//v/+o4yBA/yA+wP//v/+//6jjIEEOID7A//+//7//qOMgQR0gPsD//7//v/+o4yBBK+A+wP//v/+//6jjIEE64D7A//+//7//qOMgQUngPsD//7//v/+o4yBBWOA+wP//v/+//6jjIEFn4D7A//+//7//qOMgQXbgPsD//7//v/+o4yBBheA+wP//v/+//6jjIEGU4D7A//+//7//qOMgQaPgPsD//7//v/+o4yBBsuA+wP//v/+//6jjIEHB4D7A//+//7//qOMgQdDgPsD//7//v/+o4yBB3+A+wP//v/+//4='

export const AMOSTRA_WEBM = { mime: 'audio/webm', duracaoMs: 2_000, bytes: () => Buffer.from(WEBM_OPUS_BASE64, 'base64') }
