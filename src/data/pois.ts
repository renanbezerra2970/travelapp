// Pontos turísticos curados, com história, para o modo Explorar.
// Coordenadas no local real de visita (ex.: a Pietà fica na 1ª capela à direita da nave).
import { OBRAS } from './obras';
import { RESTAURANTS } from './restaurants';
import WIKI from './pois-wiki.json';

export type Rarity = 'lendario' | 'epico' | 'raro' | 'comum';

export type Poi = {
  id: string;
  city: 'Lisboa' | 'Roma' | 'Veneza' | 'Paris';
  name: string;
  emoji: string;
  kind: string;
  rarity: Rarity;
  lat: number;
  lng: number;
  year?: string;
  inside?: string; // id do lugar que o contém
  wiki?: string; // título na Wikipédia em português
  story: string;
  fact?: string;
  tip?: string;
  obra?: boolean; // obra/objeto (não um lugar)
  source?: 'wiki'; // gerado a partir da Wikipédia (scripts/build-pois.mjs)
  food?: boolean;
  price?: '€' | '€€' | '€€€';
  addr?: string;
};

export type Category = 'monumentos' | 'igrejas' | 'museus' | 'obras' | 'natureza' | 'curiosidades' | 'comer';

export const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: 'monumentos', label: 'Monumentos', emoji: '🏛️' },
  { id: 'igrejas', label: 'Igrejas', emoji: '⛪' },
  { id: 'museus', label: 'Museus', emoji: '🏺' },
  { id: 'obras', label: 'Obras de arte', emoji: '🖼️' },
  { id: 'natureza', label: 'Parques e vistas', emoji: '🌳' },
  { id: 'curiosidades', label: 'Curiosidades', emoji: '💡' },
  { id: 'comer', label: 'Restaurantes', emoji: '🍝' },
];

const CHURCH = /bas[íi]lica|catedral|capela|igreja|sinagoga|mosteiro|convento|cripta/i;
const MUSEUM = /museu|galeria|biblioteca|^museo/i;
const NATURE = /jardim|mirante|colina|ilha|canal|parque/i;
const CURIOUS = /curiosidade|segredo|ícone|livraria|caf[ée]|mercado|cabar[ée]|ci[êe]ncia|cemit[ée]rio|doçaria/i;

export function categoryOf(p: Poi): Category {
  if (p.food) return 'comer';
  if (p.obra) return 'obras';
  if (CHURCH.test(p.kind)) return 'igrejas';
  if (MUSEUM.test(p.kind)) return 'museus';
  if (NATURE.test(p.kind)) return 'natureza';
  if (CURIOUS.test(p.kind)) return 'curiosidades';
  return 'monumentos';
}

export const RARITY: Record<Rarity, { label: string; color: string; glow: string; xp: number }> = {
  lendario: { label: 'Lendário', color: '#E0A100', glow: 'rgba(224,161,0,.55)', xp: 100 },
  epico: { label: 'Épico', color: '#8B4FD8', glow: 'rgba(139,79,216,.5)', xp: 60 },
  raro: { label: 'Raro', color: '#2C7BE5', glow: 'rgba(44,123,229,.45)', xp: 35 },
  comum: { label: 'Comum', color: '#2E9E6A', glow: 'rgba(46,158,106,.4)', xp: 15 },
};

const CURATED: Poi[] = [
  // ───────────── ROMA · VATICANO ─────────────
  {
    id: 'roma-basilica-sao-pedro', city: 'Roma', name: 'Basílica de São Pedro', emoji: '⛪', kind: 'Basílica', rarity: 'lendario',
    lat: 41.90222, lng: 12.45395, year: '1506–1626', wiki: 'Basílica de São Pedro',
    story: 'Construída sobre o túmulo do apóstolo Pedro, crucificado no Circo de Nero, onde hoje fica o Vaticano. A primeira igreja foi erguida por Constantino no século IV. Em 1506, o papa Júlio II mandou demoli-la para fazer a maior igreja da cristandade: o projeto passou por Bramante, Rafael, Michelangelo (que desenhou a cúpula aos 71 anos) e terminou com Maderno e Bernini, 120 anos depois.',
    fact: 'No chão da nave há marcas de bronze com o tamanho das outras grandes catedrais do mundo — todas cabem dentro dela.',
    tip: 'Entrada grátis. Fila menor antes das 8h30 ou depois das 16h. Ombros e joelhos cobertos.',
  },
  {
    id: 'roma-pieta', city: 'Roma', name: 'Pietà de Michelangelo', emoji: '🗿', kind: 'Escultura', rarity: 'lendario', inside: 'roma-basilica-sao-pedro',
    lat: 41.90243, lng: 12.45463, year: '1498–1499', wiki: 'Pietà (Michelangelo)',
    story: 'Michelangelo tinha apenas 24 anos quando esculpiu Maria segurando Jesus morto, num único bloco de mármore de Carrara. Críticos diziam que a Virgem parecia jovem demais; ele respondeu que a pureza preserva a juventude. É a única obra que ele assinou: ao ouvir visitantes atribuírem a escultura a outro artista, entrou à noite e gravou seu nome na faixa que cruza o peito de Maria.',
    fact: 'Em 1972 um homem atacou a estátua com um martelo, gritando "Eu sou Jesus Cristo". Desde então ela fica atrás de um vidro à prova de balas.',
    tip: 'Primeira capela à direita, logo ao entrar. Repare na assinatura: MICHAEL·ANGELVS·BONAROTVS·FLORENT·FACIEBAT.',
  },
  {
    id: 'roma-baldaquino', city: 'Roma', name: 'Baldaquino de Bernini', emoji: '🕍', kind: 'Escultura', rarity: 'epico', inside: 'roma-basilica-sao-pedro',
    lat: 41.90219, lng: 12.45338, year: '1623–1634', wiki: 'Baldaquino de São Pedro',
    story: 'O dossel de bronze de 29 metros marca o altar papal, exatamente sobre o túmulo de Pedro. Bernini criou colunas torcidas inspiradas nas do Templo de Salomão. Dizem que parte do bronze veio do pórtico do Panteão, arrancado por ordem do papa Urbano VIII Barberini — daí o ditado romano "o que os bárbaros não fizeram, os Barberini fizeram".',
    fact: 'Procure as abelhas, símbolo da família Barberini, escondidas nas colunas e nos brasões da base.',
  },
  {
    id: 'roma-tumulo-pedro', city: 'Roma', name: 'Túmulo de São Pedro (Grutas)', emoji: '🕯️', kind: 'Cripta', rarity: 'raro', inside: 'roma-basilica-sao-pedro',
    lat: 41.90204, lng: 12.45318, year: 'séc. I', wiki: 'Grutas Vaticanas',
    story: 'Sob o piso da basílica ficam as Grutas Vaticanas, com túmulos de dezenas de papas, incluindo João Paulo II antes da canonização. Ainda mais abaixo está a necrópole romana onde, nos anos 1940, arqueólogos encontraram ossos que Paulo VI anunciou em 1968 como sendo, muito provavelmente, de Pedro.',
    tip: 'As Grutas são grátis (saída rumo à cúpula). A necrópole (Scavi) exige reserva com meses de antecedência.',
  },
  {
    id: 'roma-capela-sistina', city: 'Roma', name: 'Capela Sistina', emoji: '🎨', kind: 'Afresco', rarity: 'lendario',
    lat: 41.90294, lng: 12.45444, year: '1508–1512 · 1536–1541', wiki: 'Capela Sistina',
    story: 'É aqui que os cardeais se trancam para eleger o papa no conclave. Michelangelo, que se considerava escultor e não pintor, passou quatro anos de pé sobre andaimes pintando o teto com mais de 300 figuras do Gênesis — incluindo a Criação de Adão. Vinte e cinco anos depois voltou para pintar o Juízo Final na parede do altar.',
    fact: 'Os nus do Juízo Final escandalizaram a Igreja: depois da morte de Michelangelo, Daniele da Volterra foi contratado para pintar panos sobre eles e ganhou o apelido de "Il Braghettone" (o fazedor de cuecas).',
    tip: 'Proibido fotografar e falar alto. Olhe a Criação de Adão no centro do teto, a 1/3 do caminho a partir da entrada.',
  },
  {
    id: 'roma-museus-vaticanos', city: 'Roma', name: 'Museus Vaticanos', emoji: '🏺', kind: 'Museu', rarity: 'epico',
    lat: 41.90651, lng: 12.45366, year: '1506', wiki: 'Museus Vaticanos',
    story: 'Nasceram com uma única estátua: o Laocoonte, descoberto num vinhedo romano em 1506 e comprado pelo papa Júlio II um mês depois. Hoje são 7 km de galerias com obras reunidas por papas durante cinco séculos — das múmias egípcias às Salas de Rafael, terminando na Capela Sistina.',
    fact: 'A escada em espiral dupla de Giuseppe Momo (1932) tem duas rampas que nunca se cruzam: uma para subir, outra para descer.',
  },
  {
    id: 'roma-escola-atenas', city: 'Roma', name: 'Escola de Atenas (Salas de Rafael)', emoji: '🖼️', kind: 'Afresco', rarity: 'epico', inside: 'roma-museus-vaticanos',
    lat: 41.90353, lng: 12.45628, year: '1509–1511', wiki: 'A Escola de Atenas',
    story: 'Enquanto Michelangelo pintava a Sistina a poucos metros, o jovem Rafael decorava os aposentos de Júlio II. Na Escola de Atenas reuniu os grandes filósofos gregos e deu a eles rostos de artistas do Renascimento: Platão tem o rosto de Leonardo da Vinci, e Heráclito, sentado e pensativo em primeiro plano, é Michelangelo.',
    fact: 'Rafael se pintou no canto direito, olhando direto para quem vê o afresco.',
  },
  {
    id: 'roma-praca-sao-pedro', city: 'Roma', name: 'Praça de São Pedro', emoji: '🏟️', kind: 'Praça', rarity: 'epico',
    lat: 41.90235, lng: 12.45790, year: '1656–1667', wiki: 'Praça de São Pedro',
    story: 'Bernini desenhou a praça como dois braços abertos da Igreja acolhendo os fiéis. A colunata tem 284 colunas e 140 estátuas de santos no topo. É o palco das bênçãos papais e das multidões que esperam a fumaça branca do conclave.',
    fact: 'Fique sobre um dos dois discos de pedra entre o obelisco e as fontes: as quatro fileiras de colunas se alinham e parecem uma só.',
  },
  {
    id: 'roma-obelisco-vaticano', city: 'Roma', name: 'Obelisco do Vaticano', emoji: '🗼', kind: 'Monumento', rarity: 'raro', inside: 'roma-praca-sao-pedro',
    lat: 41.90224, lng: 12.45726, year: 'c. 1850 a.C. · Roma desde 37 d.C.', wiki: 'Obelisco do Vaticano',
    story: 'Trazido do Egito por Calígula para enfeitar o Circo de Nero — o lugar onde, segundo a tradição, Pedro foi crucificado. É o único obelisco de Roma que nunca caiu. Em 1586, foram precisos 900 homens, 140 cavalos e 47 guindastes para movê-lo até o centro da praça, sob ordens de silêncio absoluto sob pena de morte.',
    fact: 'Diz a lenda que um marinheiro gritou "Água nas cordas!" quando elas começaram a pegar fogo — desobedeceu, salvou a operação e ganhou do papa o privilégio de fornecer as palmas do Domingo de Ramos.',
  },
  {
    id: 'roma-guarda-suica', city: 'Roma', name: 'Guarda Suíça · Portão de Bronze', emoji: '💂', kind: 'Curiosidade', rarity: 'comum', inside: 'roma-praca-sao-pedro',
    lat: 41.90268, lng: 12.45648, year: '1506', wiki: 'Guarda Suíça Pontifícia',
    story: 'O menor exército do mundo protege o papa desde 1506. Em 1527, durante o Saque de Roma, 147 dos 189 guardas morreram defendendo Clemente VII na fuga para o Castelo de Sant\'Angelo. Os recrutas são suíços, católicos, solteiros e com pelo menos 1,74 m.',
    fact: 'O uniforme listrado azul, vermelho e amarelo não foi desenhado por Michelangelo, apesar da lenda: é de 1914.',
  },
  {
    id: 'roma-castel-sant-angelo', city: 'Roma', name: "Castel Sant'Angelo", emoji: '🏰', kind: 'Castelo', rarity: 'epico',
    lat: 41.90306, lng: 12.46633, year: '135 d.C.', wiki: 'Castelo de Santo Ângelo',
    story: 'Começou como mausoléu do imperador Adriano, virou fortaleza, prisão e refúgio dos papas, ligado ao Vaticano por um corredor elevado secreto, o Passetto. O nome vem de 590: durante uma peste, o papa Gregório viu o arcanjo Miguel embainhando a espada no topo — sinal de que a epidemia tinha acabado.',
    fact: 'É o cenário do último ato da ópera Tosca: a heroína se joga do terraço.',
  },
  {
    id: 'roma-ponte-sant-angelo', city: 'Roma', name: "Ponte Sant'Angelo", emoji: '🌉', kind: 'Ponte', rarity: 'comum',
    lat: 41.90183, lng: 12.46637, year: '134 d.C.', wiki: "Ponte Sant'Angelo",
    story: 'Ponte construída por Adriano para chegar ao seu mausoléu. Era o caminho dos peregrinos rumo a São Pedro. Bernini e seus alunos a decoraram com dez anjos, cada um segurando um instrumento da Paixão de Cristo.',
    tip: 'Melhor foto do castelo: do meio da ponte, ao entardecer.',
  },

  // ───────────── ROMA · CENTRO ─────────────
  {
    id: 'roma-pantheon', city: 'Roma', name: 'Panteão', emoji: '🏛️', kind: 'Templo', rarity: 'lendario',
    lat: 41.89861, lng: 12.47687, year: '125 d.C.', wiki: 'Panteão (Roma)',
    story: 'Templo a todos os deuses, reconstruído por Adriano. Quase 1.900 anos depois, sua cúpula de concreto não armado ainda é a maior do mundo: 43,3 m de diâmetro, exatamente igual à altura do chão ao topo, como se uma esfera perfeita coubesse lá dentro. Sobreviveu porque virou igreja em 609. Rafael está enterrado aqui.',
    fact: 'O óculo de 9 m no topo é aberto: quando chove, a água cai no chão de mármore e escoa por 22 furinhos quase invisíveis.',
    tip: 'Ingresso de €5. No 1º domingo do mês é grátis — vá cedo.',
  },
  {
    id: 'roma-trevi', city: 'Roma', name: 'Fontana di Trevi', emoji: '⛲', kind: 'Fonte', rarity: 'lendario',
    lat: 41.90093, lng: 12.48331, year: '1732–1762', wiki: 'Fontana di Trevi',
    story: 'Fica no fim do Aqua Virgo, aqueduto de 19 a.C. que ainda abastece a fonte. O nome viria de "tre vie": o cruzamento de três ruas. No centro, Oceano conduz uma carruagem puxada por cavalos-marinhos — um calmo e um agitado, representando os humores do mar. Anita Ekberg imortalizou a fonte em "La Dolce Vita".',
    fact: 'Cerca de €1,5 milhão em moedas são jogadas por ano; o dinheiro vai para a Caritas, que alimenta pessoas carentes.',
    tip: 'Moeda com a mão direita por cima do ombro esquerdo = você volta a Roma. Antes das 8h a praça é sua.',
  },
  {
    id: 'roma-navona', city: 'Roma', name: 'Piazza Navona · Fonte dos Quatro Rios', emoji: '🌊', kind: 'Praça', rarity: 'epico',
    lat: 41.89897, lng: 12.47309, year: '86 d.C. · fonte 1651', wiki: 'Piazza Navona',
    story: 'O formato alongado não é acaso: a praça ocupa exatamente a pista do Estádio de Domiciano, onde se disputavam corridas a pé. No centro, a fonte de Bernini representa os quatro grandes rios dos continentes conhecidos: Nilo, Ganges, Danúbio e Rio da Prata.',
    fact: 'A lenda diz que a estátua do Rio da Prata ergue o braço com medo de que a igreja de Borromini, rival de Bernini, desabe. É mito: a fonte é anterior à fachada.',
  },
  {
    id: 'roma-torre-argentina', city: 'Roma', name: 'Largo di Torre Argentina', emoji: '🐈', kind: 'Ruínas', rarity: 'raro',
    lat: 41.89545, lng: 12.47680, year: '44 a.C.', wiki: 'Largo di Torre Argentina',
    story: 'Neste sítio arqueológico ficava a Cúria de Pompeu, onde Júlio César foi apunhalado 23 vezes nos Idos de Março de 44 a.C. Hoje as ruínas abrigam um santuário com dezenas de gatos de rua, cuidados por voluntários.',
    fact: 'O nome não tem a ver com a Argentina: vem de Argentoratum, nome latino de Estrasburgo, cidade natal de um bispo que morou ali.',
  },
  {
    id: 'roma-espanha', city: 'Roma', name: 'Escadaria da Praça de Espanha', emoji: '🪜', kind: 'Escadaria', rarity: 'raro',
    lat: 41.90599, lng: 12.48278, year: '1723–1725', wiki: 'Escadaria da Praça da Espanha',
    story: 'Os 135 degraus ligam a embaixada espanhola, embaixo, à igreja francesa de Trinità dei Monti, no alto — foram pagos por um diplomata francês. Ao pé, a Fontana della Barcaccia, de Pietro Bernini (pai de Gian Lorenzo), lembra um barco que encalhou ali na grande enchente do Tibre de 1598.',
    fact: 'Desde 2019 é proibido sentar nos degraus: a multa chega a €400.',
  },
  {
    id: 'roma-popolo', city: 'Roma', name: 'Piazza del Popolo', emoji: '🦁', kind: 'Praça', rarity: 'comum',
    lat: 41.91074, lng: 12.47636, year: 'obelisco 1300 a.C.', wiki: 'Piazza del Popolo',
    story: 'Por séculos foi a entrada de Roma para quem chegava do norte pela Via Flaminia — e o lugar das execuções públicas. No centro, o Obelisco Flaminio, trazido do Egito por Augusto, tem mais de 3.000 anos. As "igrejas gêmeas" não são idênticas: uma tem cúpula oval, a outra redonda.',
    tip: 'Na igreja de Santa Maria del Popolo (grátis) há dois Caravaggios na Capela Cerasi.',
  },
  {
    id: 'roma-pincio', city: 'Roma', name: 'Terraço do Pincio', emoji: '🌄', kind: 'Mirante', rarity: 'comum',
    lat: 41.91140, lng: 12.47930, wiki: 'Pincio',
    story: 'Mirante sobre a Piazza del Popolo com a cúpula de São Pedro no horizonte. Era a colina dos jardins dos ricos na Roma antiga; Lúculo, famoso pelos banquetes, tinha uma vila aqui.',
    tip: 'Ótimo para o pôr do sol, com vista para a cúpula do Vaticano.',
  },

  // ───────────── ROMA · ANTIGA ─────────────
  {
    id: 'roma-coliseu', city: 'Roma', name: 'Coliseu', emoji: '🏟️', kind: 'Anfiteatro', rarity: 'lendario',
    lat: 41.89021, lng: 12.49223, year: '72–80 d.C.', wiki: 'Coliseu',
    story: 'O Anfiteatro Flaviano recebia até 50 mil pessoas para lutas de gladiadores, caçadas de animais e execuções. Foi inaugurado por Tito com 100 dias de jogos. Sob a arena, o hipogeu tinha elevadores e alçapões que faziam leões e cenários surgirem do chão. Os buracos nas paredes são de onde se arrancaram os grampos de metal na Idade Média.',
    fact: 'Um toldo retrátil, o velarium, era manobrado por marinheiros da frota imperial para fazer sombra sobre a plateia.',
    tip: 'Ingresso com horário marcado (12:45 no dia 02/11). Leve o documento: o nome é conferido.',
  },
  {
    id: 'roma-arco-constantino', city: 'Roma', name: 'Arco de Constantino', emoji: '🏛️', kind: 'Arco triunfal', rarity: 'raro',
    lat: 41.88980, lng: 12.49061, year: '315 d.C.', wiki: 'Arco de Constantino',
    story: 'Celebra a vitória de Constantino sobre Maxêncio na Ponte Mílvia, em 312 — a batalha em que ele teria visto uma cruz no céu e se convertido ao cristianismo. Boa parte dos relevos foi "reaproveitada" de monumentos de Trajano, Adriano e Marco Aurélio, com os rostos refeitos para parecerem Constantino.',
  },
  {
    id: 'roma-forum', city: 'Roma', name: 'Fórum Romano', emoji: '🏚️', kind: 'Ruínas', rarity: 'epico',
    lat: 41.89246, lng: 12.48533, year: 'séc. VII a.C.', wiki: 'Fórum Romano',
    story: 'O coração político, religioso e comercial da Roma antiga: aqui ficavam o Senado (a Cúria), os templos, os tribunais e a Via Sacra, por onde passavam os desfiles de triunfo. Júlio César foi cremado no local onde hoje se vê o Templo do Divino Júlio — ainda há quem deixe flores ali.',
    fact: 'Na Idade Média o Fórum ficou soterrado e virou pasto; era chamado de Campo Vaccino, o "campo das vacas".',
  },
  {
    id: 'roma-palatino', city: 'Roma', name: 'Monte Palatino', emoji: '👑', kind: 'Colina', rarity: 'raro',
    lat: 41.88894, lng: 12.48743, year: '753 a.C.', wiki: 'Monte Palatino',
    story: 'Segundo a lenda, Rômulo fundou Roma aqui depois de matar o irmão Remo. Os imperadores construíram seus palácios nesta colina — tantos e tão grandes que a palavra "palácio", em várias línguas, vem de Palatino.',
    tip: 'Mesmo ingresso do Coliseu. Os Jardins Farnese têm a melhor vista do Fórum.',
  },
  {
    id: 'roma-campidoglio', city: 'Roma', name: 'Praça do Campidoglio', emoji: '🐎', kind: 'Praça', rarity: 'raro',
    lat: 41.89335, lng: 12.48293, year: '1536', wiki: 'Praça do Campidoglio',
    story: 'O Capitólio era a colina mais sagrada de Roma, com o templo de Júpiter. A praça atual foi desenhada por Michelangelo, com o piso em estrela que parece curvar. No centro, uma cópia da estátua equestre de Marco Aurélio — a original, em bronze, sobreviveu porque por séculos acreditou-se que era Constantino, o imperador cristão.',
    tip: 'Contorne o Palazzo Senatorio pela direita: há um terraço grátis com vista panorâmica do Fórum.',
  },
  {
    id: 'roma-vittoriano', city: 'Roma', name: 'Altar da Pátria (Vittoriano)', emoji: '🦅', kind: 'Monumento', rarity: 'comum',
    lat: 41.89462, lng: 12.48325, year: '1885–1935', wiki: 'Monumento a Vítor Emanuel II',
    story: 'Homenagem a Vítor Emanuel II, primeiro rei da Itália unificada, e túmulo do Soldado Desconhecido. Os romanos o apelidaram de "máquina de escrever" e "bolo de casamento" pelo mármore branco que destoa dos tons ocres da cidade.',
    tip: 'O elevador panorâmico (pago) leva ao terraço com a melhor vista 360° do centro.',
  },
  {
    id: 'roma-bocca-verita', city: 'Roma', name: 'Bocca della Verità', emoji: '😮', kind: 'Curiosidade', rarity: 'raro',
    lat: 41.88814, lng: 12.48159, year: 'séc. I', wiki: 'Bocca della Verità',
    story: 'O disco de mármore com rosto de deus fluvial provavelmente era uma tampa de bueiro romana. Na Idade Média nasceu a lenda: quem mentisse com a mão dentro da boca a perderia. Ficou famosa com Audrey Hepburn e Gregory Peck em "A Princesa e o Plebeu" (1953).',
    tip: 'Fila rápida cedo; a foto custa uma doação simbólica.',
  },
  {
    id: 'roma-circo-maximo', city: 'Roma', name: 'Circo Máximo', emoji: '🏇', kind: 'Ruínas', rarity: 'comum',
    lat: 41.88611, lng: 12.48523, year: 'séc. VI a.C.', wiki: 'Circo Máximo',
    story: 'O maior estádio da Antiguidade: 600 m de pista para corridas de bigas, com lugar para cerca de 150 mil espectadores. Hoje é um gramado onde acontecem shows e as comemorações de títulos da seleção italiana e da Roma.',
  },
  {
    id: 'roma-buraco-fechadura', city: 'Roma', name: 'Buraco da Fechadura do Aventino', emoji: '🔑', kind: 'Segredo', rarity: 'epico',
    lat: 41.88293, lng: 12.47904, wiki: 'Villa del Priorato di Malta',
    story: 'Pelo buraco da fechadura do portão dos Cavaleiros de Malta você vê a cúpula de São Pedro perfeitamente emoldurada por um túnel de sebes. De um só ponto se enxergam três "países": o território da Ordem de Malta, a Itália e o Vaticano.',
    tip: 'Fila de 10–20 min à tarde. O Jardim das Laranjeiras, a 2 min, tem vista do pôr do sol.',
  },
  {
    id: 'roma-santa-maria-maior', city: 'Roma', name: 'Santa Maria Maggiore', emoji: '⛪', kind: 'Basílica', rarity: 'raro',
    lat: 41.89756, lng: 12.49855, year: '432 d.C.', wiki: 'Basílica de Santa Maria Maior',
    story: 'Segundo a lenda, a Virgem apareceu em sonho ao papa Libério e pediu uma igreja onde nevasse — e nevou no Esquilino em pleno agosto de 358. Os mosaicos da nave são do século V, dos mais antigos de Roma. O teto foi dourado com o primeiro ouro trazido da América por Colombo.',
    fact: 'Todo 5 de agosto pétalas brancas caem do teto na missa, lembrando a neve milagrosa.',
  },
  {
    id: 'roma-santa-maria-trastevere', city: 'Roma', name: 'Santa Maria in Trastevere', emoji: '✨', kind: 'Basílica', rarity: 'comum',
    lat: 41.88947, lng: 12.46996, year: 'séc. III–XII', wiki: 'Santa Maria in Trastevere',
    story: 'Uma das igrejas mais antigas de Roma, talvez a primeira dedicada a Maria. Os mosaicos dourados da abside, do século XII, brilham ao entardecer. Trastevere, "além do Tibre", era o bairro dos pescadores e imigrantes — hoje é o bairro das trattorias.',
  },
  {
    id: 'roma-gianicolo', city: 'Roma', name: 'Mirante do Gianicolo', emoji: '🌅', kind: 'Mirante', rarity: 'raro',
    lat: 41.89175, lng: 12.46143, wiki: 'Janículo',
    story: 'A colina não está entre as sete clássicas, mas tem a vista mais bonita da cidade. Foi palco da defesa da República Romana de Garibaldi contra os franceses em 1849 — daí a grande estátua equestre dele.',
    fact: 'Desde 1847, todo dia ao meio-dia um canhão dispara um tiro de festim para os sinos da cidade acertarem a hora.',
  },
  {
    id: 'roma-tartarugas', city: 'Roma', name: 'Fontana delle Tartarughe', emoji: '🐢', kind: 'Fonte', rarity: 'comum',
    lat: 41.89383, lng: 12.47774, year: '1581–1588', wiki: 'Fontana delle Tartarughe',
    story: 'Pequena joia no Gueto Judeu: quatro jovens erguem tartarugas até a bacia superior. As tartarugas foram acrescentadas um século depois, provavelmente por Bernini. O Gueto, criado em 1555, é um dos mais antigos do mundo — e o lugar das alcachofras fritas "alla giudia".',
  },

  // ───────────── LISBOA ─────────────
  {
    id: 'lis-torre-belem', city: 'Lisboa', name: 'Torre de Belém', emoji: '🏰', kind: 'Fortaleza', rarity: 'lendario',
    lat: 38.69158, lng: -9.21598, year: '1514–1519', wiki: 'Torre de Belém',
    story: 'Construída para defender a entrada do porto de Lisboa no auge das Grandes Navegações, era o último pedaço de Portugal que os navegadores viam ao partir. O estilo manuelino mistura cordas, esferas armilares e cruzes da Ordem de Cristo esculpidas em pedra.',
    fact: 'Na fachada oeste há a primeira representação de um rinoceronte na Europa — o mesmo que o rei Manuel I enviou de presente ao papa e que naufragou no caminho.',
  },
  {
    id: 'lis-jeronimos', city: 'Lisboa', name: 'Mosteiro dos Jerónimos', emoji: '⛪', kind: 'Mosteiro', rarity: 'lendario',
    lat: 38.69791, lng: -9.20675, year: '1501–1601', wiki: 'Mosteiro dos Jerónimos',
    story: 'Pago com a "vintena da pimenta", imposto sobre as especiarias trazidas da Índia, foi erguido onde Vasco da Gama passou a última noite em oração antes de partir, em 1497. Abriga os túmulos de Vasco da Gama e do poeta Luís de Camões. Resistiu ao terremoto de 1755, que destruiu a cidade.',
    tip: 'A igreja é gratuita; o claustro é pago.',
  },
  {
    id: 'lis-pasteis-belem', city: 'Lisboa', name: 'Pastéis de Belém', emoji: '🥮', kind: 'Doçaria', rarity: 'epico',
    lat: 38.69750, lng: -9.20320, year: '1837', wiki: 'Pastel de nata',
    story: 'Com a extinção das ordens religiosas em 1834, os monges dos Jerónimos venderam a receita do pastel de nata a um comerciante, que abriu a fábrica em 1837. A receita original continua secreta: dizem que só três mestres pasteleiros a conhecem e assinam um termo de sigilo.',
    tip: 'Peça no balcão para viagem. Canela e açúcar por cima.',
  },
  {
    id: 'lis-padrao', city: 'Lisboa', name: 'Padrão dos Descobrimentos', emoji: '⛵', kind: 'Monumento', rarity: 'raro',
    lat: 38.69361, lng: -9.20573, year: '1960', wiki: 'Padrão dos Descobrimentos',
    story: 'Caravela de pedra com 52 m de altura, liderada pelo Infante D. Henrique, seguido por 32 figuras das navegações, como Vasco da Gama, Cabral e Camões. Foi erguida nos 500 anos da morte do Infante.',
    fact: 'A rosa dos ventos no chão, com um mapa-múndi de 50 m, foi presente da África do Sul. Procure o Brasil e o ano de 1500.',
  },
  {
    id: 'lis-comercio', city: 'Lisboa', name: 'Praça do Comércio', emoji: '👑', kind: 'Praça', rarity: 'epico',
    lat: 38.70760, lng: -9.13650, year: '1755–1775', wiki: 'Praça do Comércio',
    story: 'Aqui ficava o Paço da Ribeira, o palácio real, destruído pelo terremoto e tsunami de 1755. O Marquês de Pombal reconstruiu a Baixa com ruas em grade e prédios antissísmicos, e a praça virou porta de entrada da cidade pelo rio. Em 1908, o rei D. Carlos e o herdeiro foram assassinados aqui.',
    tip: 'Atravesse o Arco da Rua Augusta: o terraço no topo tem vista da praça e do Tejo.',
  },
  {
    id: 'lis-santa-justa', city: 'Lisboa', name: 'Elevador de Santa Justa', emoji: '🛗', kind: 'Elevador', rarity: 'raro',
    lat: 38.71210, lng: -9.13940, year: '1902', wiki: 'Elevador de Santa Justa',
    story: 'Torre de ferro neogótica que liga a Baixa ao Largo do Carmo. Foi projetada por Raoul Mesnier du Ponsard, engenheiro nascido no Porto e discípulo de Gustave Eiffel — e no início funcionava a vapor.',
    tip: 'Fila longa embaixo; dá para chegar ao mirante de cima a pé pelo Largo do Carmo.',
  },
  {
    id: 'lis-se', city: 'Lisboa', name: 'Sé de Lisboa', emoji: '⛪', kind: 'Catedral', rarity: 'comum',
    lat: 38.70990, lng: -9.13330, year: '1147', wiki: 'Sé de Lisboa',
    story: 'Construída logo após D. Afonso Henriques conquistar Lisboa dos mouros, no lugar da antiga mesquita. Parece uma fortaleza com suas torres com ameias. Santo Antônio foi batizado aqui em 1195.',
    tip: 'O elétrico 28 passa na frente — foto clássica.',
  },
  {
    id: 'lis-santa-luzia', city: 'Lisboa', name: 'Miradouro de Santa Luzia', emoji: '🌅', kind: 'Mirante', rarity: 'raro',
    lat: 38.71180, lng: -9.13010, wiki: 'Miradouro de Santa Luzia',
    story: 'Terraço com azulejos e buganvílias sobre os telhados de Alfama e o Tejo. Nas paredes, painéis de azulejo mostram a Praça do Comércio antes do terremoto e a conquista de Lisboa aos mouros.',
  },
  {
    id: 'lis-castelo', city: 'Lisboa', name: 'Castelo de São Jorge', emoji: '🏯', kind: 'Castelo', rarity: 'epico',
    lat: 38.71390, lng: -9.13350, year: 'séc. XI', wiki: 'Castelo de São Jorge',
    story: 'Fortaleza moura conquistada em 1147 por Afonso Henriques com ajuda de cruzados a caminho da Terra Santa. Foi palácio real até o século XVI; aqui o rei recebeu Vasco da Gama na volta da Índia.',
    fact: 'Diz a lenda que o cavaleiro Martim Moniz morreu prendendo o corpo na porta do castelo para impedir que fosse fechada — a praça Martim Moniz leva seu nome.',
  },
  {
    id: 'lis-brasileira', city: 'Lisboa', name: 'A Brasileira · Fernando Pessoa', emoji: '☕', kind: 'Café', rarity: 'comum',
    lat: 38.71070, lng: -9.14200, year: '1905', wiki: 'A Brasileira',
    story: 'Aberto para vender café do Brasil, foi o ponto de encontro de artistas e escritores do Chiado. Fernando Pessoa era frequentador assíduo — hoje sua estátua de bronze está sentada à mesa na calçada.',
    fact: 'Lisboetas pedem "uma bica" — dizem que vem de "Beba Isto Com Açúcar", cartaz que A Brasileira usava para convencer clientes a tomar o café amargo.',
  },
  {
    id: 'lis-carmo', city: 'Lisboa', name: 'Convento do Carmo', emoji: '🏚️', kind: 'Ruínas', rarity: 'raro',
    lat: 38.71200, lng: -9.14060, year: '1389', wiki: 'Convento do Carmo (Lisboa)',
    story: 'O teto da igreja desabou no terremoto de 1755, numa manhã de Todos os Santos, com a igreja cheia. Os arcos góticos ficaram de pé sem telhado, como memória da tragédia, e hoje abrigam um museu arqueológico a céu aberto.',
  },

  // ───────────── VENEZA ─────────────
  {
    id: 'ven-sao-marcos', city: 'Veneza', name: 'Basílica de São Marcos', emoji: '⛪', kind: 'Basílica', rarity: 'lendario',
    lat: 45.43450, lng: 12.33970, year: '1063–1094', wiki: 'Basílica de São Marcos',
    story: 'Em 828, dois mercadores venezianos roubaram o corpo do evangelista Marcos em Alexandria, escondido sob carne de porco para os guardas muçulmanos não revistarem. Veneza ergueu esta basílica para ele, coberta por 8.000 m² de mosaicos dourados — por isso o apelido "Igreja de Ouro".',
    fact: 'Os quatro cavalos de bronze da fachada foram saqueados de Constantinopla em 1204; Napoleão os levou a Paris e eles só voltaram em 1815. Os originais ficam dentro, no museu.',
  },
  {
    id: 'ven-campanile', city: 'Veneza', name: 'Campanile de São Marcos', emoji: '🔔', kind: 'Torre', rarity: 'raro',
    lat: 45.43398, lng: 12.33903, year: '1912 (orig. séc. XII)', wiki: 'Campanário de São Marcos',
    story: 'A torre de 98 m que se vê de toda a laguna desabou inteira em 14 de julho de 1902 — sem ferir ninguém, exceto o gato do zelador. Foi reconstruída "com’era, dov’era" (como era, onde era) e reinaugurada exatamente dez anos depois.',
    tip: 'Elevador até o topo: vista de toda Veneza e, em dias claros, dos Alpes.',
  },
  {
    id: 'ven-palacio-ducal', city: 'Veneza', name: 'Palácio Ducal', emoji: '🏛️', kind: 'Palácio', rarity: 'epico',
    lat: 45.43373, lng: 12.34040, year: '1340', wiki: 'Palácio Ducal (Veneza)',
    story: 'Sede do Doge e do governo da Sereníssima República por quase mil anos. A Sala do Grande Conselho tem uma das maiores pinturas a óleo do mundo, o Paraíso de Tintoretto. Casanova ficou preso aqui e protagonizou uma fuga lendária pelo telhado em 1756.',
  },
  {
    id: 'ven-suspiros', city: 'Veneza', name: 'Ponte dos Suspiros', emoji: '😮‍💨', kind: 'Ponte', rarity: 'raro',
    lat: 45.43400, lng: 12.34090, year: '1600', wiki: 'Ponte dos Suspiros',
    story: 'Liga o Palácio Ducal às prisões novas. O nome, inventado por Lord Byron no século XIX, viria dos suspiros dos condenados vendo Veneza pela última vez pelas janelinhas de pedra.',
    tip: 'Foto clássica da Ponte della Paglia, na Riva degli Schiavoni.',
  },
  {
    id: 'ven-rialto', city: 'Veneza', name: 'Ponte de Rialto', emoji: '🌉', kind: 'Ponte', rarity: 'lendario',
    lat: 45.43801, lng: 12.33590, year: '1588–1591', wiki: 'Ponte de Rialto',
    story: 'Por quase 300 anos foi a única ponte sobre o Grande Canal. As versões de madeira anteriores pegaram fogo e desabaram; a de pedra, de Antonio da Ponte, recebeu críticas de que cairia — e está de pé há mais de 400 anos sobre 12 mil estacas de madeira.',
    tip: 'Cedinho (antes das 8h) a ponte fica vazia para fotos.',
  },
  {
    id: 'ven-mercado-rialto', city: 'Veneza', name: 'Mercado de Rialto', emoji: '🐟', kind: 'Mercado', rarity: 'comum',
    lat: 45.43960, lng: 12.33430, year: 'séc. XI', wiki: 'Mercado de Rialto',
    story: 'O mercado de peixe e hortifrúti funciona aqui há quase mil anos. Uma placa de mármore do século XVI lista o tamanho mínimo permitido para cada peixe vendido — uma das primeiras leis de pesca sustentável.',
    tip: 'Peixaria aberta de terça a sábado, de manhã.',
  },
  {
    id: 'ven-salute', city: 'Veneza', name: 'Santa Maria della Salute', emoji: '⛪', kind: 'Basílica', rarity: 'epico',
    lat: 45.43080, lng: 12.33460, year: '1631–1687', wiki: 'Santa Maria della Salute',
    story: 'Promessa da cidade à Virgem para acabar com a peste de 1630, que matou um terço dos venezianos. Repousa sobre mais de 1 milhão de estacas de madeira. Todo 21 de novembro, os venezianos atravessam uma ponte flutuante sobre o Grande Canal para agradecer.',
  },
  {
    id: 'ven-accademia', city: 'Veneza', name: 'Ponte da Accademia', emoji: '🌉', kind: 'Ponte', rarity: 'comum',
    lat: 45.43170, lng: 12.32910, year: '1933', wiki: "Ponte dell'Accademia",
    story: 'Ponte de madeira provisória construída em 1933... que nunca foi substituída. Do alto, tem a vista mais famosa do Grande Canal, com a Salute ao fundo.',
  },
  {
    id: 'ven-bovolo', city: 'Veneza', name: 'Scala Contarini del Bovolo', emoji: '🐌', kind: 'Escadaria', rarity: 'raro',
    lat: 45.43500, lng: 12.33410, year: 'c. 1499', wiki: 'Palazzo Contarini del Bovolo',
    story: 'Escadaria em caracol escondida num pátio — "bovolo" é caracol em veneziano. A família Contarini a construiu para exibir riqueza. Aparece no filme "Othello", de Orson Welles.',
  },
  {
    id: 'ven-relogio', city: 'Veneza', name: 'Torre do Relógio', emoji: '🕰️', kind: 'Torre', rarity: 'comum',
    lat: 45.43450, lng: 12.33850, year: '1499', wiki: "Torre dell'Orologio (Veneza)",
    story: 'Relógio astronômico que mostra horas, fases da lua e signos do zodíaco, para os mercadores saberem a época certa de zarpar. No topo, dois "mouros" de bronze batem o sino a cada hora há mais de 500 anos.',
  },
  {
    id: 'ven-acqua-alta', city: 'Veneza', name: 'Libreria Acqua Alta', emoji: '📚', kind: 'Livraria', rarity: 'raro',
    lat: 45.43780, lng: 12.34230, wiki: 'Libreria Acqua Alta',
    story: 'Livraria onde os livros ficam em banheiras, barcos e até numa gôndola, para se salvarem das enchentes (acqua alta). Nos fundos, uma escada feita de livros velhos sobe para ver o canal. Os gatos da casa dormem entre as pilhas.',
  },
  {
    id: 'ven-burano', city: 'Veneza', name: 'Casas coloridas de Burano', emoji: '🏘️', kind: 'Ilha', rarity: 'epico',
    lat: 45.48530, lng: 12.41730, wiki: 'Burano',
    story: 'Diz a tradição que os pescadores pintavam as casas em cores fortes para reconhecê-las na neblina da laguna. Até hoje é preciso pedir autorização à prefeitura para mudar a cor — e ela indica as cores permitidas para cada lote. A ilha também é famosa pela renda feita à mão.',
    fact: 'O campanário da igreja de San Martino é visivelmente torto.',
  },
  {
    id: 'ven-murano', city: 'Veneza', name: 'Vidro de Murano', emoji: '🏺', kind: 'Ilha', rarity: 'raro',
    lat: 45.45720, lng: 12.35780, year: '1291', wiki: 'Murano',
    story: 'Em 1291, a República mandou todas as fornalhas de vidro para Murano, para evitar incêndios em Veneza — e para guardar os segredos dos mestres. Vidreiros eram tratados como nobres, mas eram proibidos de sair: quem fugisse podia ser perseguido.',
    tip: 'Várias fornalhas fazem demonstrações gratuitas de sopro de vidro.',
  },
  {
    id: 'ven-san-giorgio', city: 'Veneza', name: 'San Giorgio Maggiore', emoji: '⛪', kind: 'Basílica', rarity: 'comum',
    lat: 45.42880, lng: 12.34350, year: '1566–1610', wiki: 'San Giorgio Maggiore (igreja)',
    story: 'A igreja de Palladio numa ilha bem em frente à Praça São Marcos. Monet pintou-a várias vezes ao entardecer. O campanário tem uma vista de São Marcos melhor (e com menos fila) que o próprio Campanile.',
  },

  // ───────────── PARIS ─────────────
  {
    id: 'par-eiffel', city: 'Paris', name: 'Torre Eiffel', emoji: '🗼', kind: 'Torre', rarity: 'lendario',
    lat: 48.85837, lng: 2.29448, year: '1887–1889', wiki: 'Torre Eiffel',
    story: 'Construída para a Exposição Universal de 1889, nos 100 anos da Revolução Francesa, deveria ser desmontada em 20 anos. Artistas a chamavam de "inútil e monstruosa". Foi salva por servir de antena para a telegrafia sem fio — e virou o símbolo da França.',
    fact: 'No calor, o ferro dilata e a torre fica até 15 cm mais alta.',
    tip: 'Nas primeiras horas de cada noite ela pisca por 5 minutos, a cada hora cheia.',
  },
  {
    id: 'par-trocadero', city: 'Paris', name: 'Trocadéro', emoji: '📸', kind: 'Mirante', rarity: 'epico',
    lat: 48.86160, lng: 2.28890, year: '1937', wiki: 'Trocadéro',
    story: 'A esplanada do Palais de Chaillot tem a vista mais famosa da Torre Eiffel. O nome lembra a batalha de Trocadero, na Espanha (1823). Foi daqui que Hitler posou para sua única foto com a Torre, em 1940.',
    tip: 'Pôr do sol e o brilho da torre na hora cheia. Cuidado com golpistas de pulseirinhas e abaixo-assinados.',
  },
  {
    id: 'par-arco-triunfo', city: 'Paris', name: 'Arco do Triunfo', emoji: '🏛️', kind: 'Arco triunfal', rarity: 'epico',
    lat: 48.87380, lng: 2.29500, year: '1806–1836', wiki: 'Arco do Triunfo (Paris)',
    story: 'Encomendado por Napoleão após a vitória em Austerlitz, só foi concluído 15 anos depois de sua morte. Sob o arco está o Túmulo do Soldado Desconhecido da Primeira Guerra, com uma chama reacesa todos os dias às 18h30 desde 1923.',
    tip: 'Use a passagem subterrânea: nunca atravesse a rotatória de 12 avenidas.',
  },
  {
    id: 'par-concorde', city: 'Paris', name: 'Place de la Concorde · Obelisco', emoji: '🗿', kind: 'Praça', rarity: 'raro',
    lat: 48.86560, lng: 2.32120, year: 'obelisco 1250 a.C.', wiki: 'Praça da Concórdia',
    story: 'Durante a Revolução se chamava Praça da Revolução: a guilhotina executou aqui Luís XVI, Maria Antonieta e mais de mil pessoas. O obelisco de Luxor, com 3.300 anos, foi presente do Egito em 1831 e levou dois anos para chegar.',
  },
  {
    id: 'par-louvre', city: 'Paris', name: 'Museu do Louvre', emoji: '🔺', kind: 'Museu', rarity: 'lendario',
    lat: 48.86100, lng: 2.33570, year: '1793 · pirâmide 1989', wiki: 'Museu do Louvre',
    story: 'Foi fortaleza medieval, depois palácio dos reis até Luís XIV se mudar para Versalhes. Virou museu na Revolução. É o museu mais visitado do mundo. A pirâmide de vidro de I. M. Pei foi odiada na inauguração e hoje é tão icônica quanto o próprio palácio.',
    fact: 'Em outubro de 2025, ladrões levaram joias da coroa francesa da Galeria de Apolo em menos de 8 minutos, usando um elevador de carga.',
  },
  {
    id: 'par-monalisa', city: 'Paris', name: 'Mona Lisa', emoji: '🖼️', kind: 'Pintura', rarity: 'lendario', inside: 'par-louvre',
    lat: 48.85980, lng: 2.33530, year: '1503–1519', wiki: 'Mona Lisa',
    story: 'Leonardo da Vinci levou o retrato de Lisa Gherardini consigo até a morte, na França. Até 1911 era só mais uma obra do museu — até ser roubada por um funcionário italiano, Vincenzo Peruggia. Os dois anos de manchetes a tornaram a pintura mais famosa do mundo.',
    fact: 'É bem menor do que parece: 77 × 53 cm.',
    tip: 'Sala des États (Ala Denon, 1º andar). Na saída, vire-se: o enorme "Bodas de Caná" fica bem em frente.',
  },
  {
    id: 'par-venus-milo', city: 'Paris', name: 'Vênus de Milo', emoji: '🏺', kind: 'Escultura', rarity: 'epico', inside: 'par-louvre',
    lat: 48.85990, lng: 2.33760, year: 'c. 150 a.C.', wiki: 'Vênus de Milo',
    story: 'Encontrada em 1820 por um camponês na ilha grega de Milos. Ninguém sabe ao certo o que os braços faziam — teorias falam em uma maçã, um espelho ou um escudo. Foi comprada por um diplomata francês e dada a Luís XVIII.',
  },
  {
    id: 'par-tuileries', city: 'Paris', name: 'Jardim das Tulherias', emoji: '🌳', kind: 'Jardim', rarity: 'comum',
    lat: 48.86340, lng: 2.32750, year: '1564', wiki: 'Jardim das Tulherias',
    story: 'O nome vem das fábricas de telhas (tuiles) que existiam aqui. Catarina de Médici criou o jardim; André Le Nôtre, o paisagista de Versalhes, o redesenhou no estilo francês geométrico.',
  },
  {
    id: 'par-notre-dame', city: 'Paris', name: 'Notre-Dame de Paris', emoji: '⛪', kind: 'Catedral', rarity: 'lendario',
    lat: 48.85296, lng: 2.34990, year: '1163–1345 · reaberta 2024', wiki: 'Catedral de Notre-Dame de Paris',
    story: 'Obra-prima gótica onde Napoleão se coroou imperador. Quase foi demolida no século XIX até Victor Hugo escrever "O Corcunda de Notre-Dame" para salvá-la. Em abril de 2019, um incêndio derrubou a flecha; após cinco anos de restauração com técnicas medievais, reabriu em dezembro de 2024.',
    fact: 'Diante da fachada, uma estrela de bronze no chão marca o "Ponto Zero": todas as distâncias rodoviárias da França são medidas a partir dele.',
  },
  {
    id: 'par-sainte-chapelle', city: 'Paris', name: 'Sainte-Chapelle', emoji: '💎', kind: 'Capela', rarity: 'epico',
    lat: 48.85540, lng: 2.34500, year: '1242–1248', wiki: 'Sainte-Chapelle',
    story: 'Luís IX construiu a capela para guardar a Coroa de Espinhos, que comprou do imperador de Constantinopla por mais do que custou o prédio. As 15 janelas de vitral, com 15 m de altura, contam 1.113 cenas bíblicas — parece estar dentro de uma joia.',
  },
  {
    id: 'par-shakespeare', city: 'Paris', name: 'Shakespeare and Company', emoji: '📖', kind: 'Livraria', rarity: 'comum',
    lat: 48.85260, lng: 2.34710, year: '1951', wiki: 'Shakespeare and Company',
    story: 'Livraria anglófona em frente a Notre-Dame. A loja original, de Sylvia Beach, publicou "Ulisses" de James Joyce e recebia Hemingway e Fitzgerald. Jovens escritores ainda podem dormir entre as estantes em troca de algumas horas de trabalho e uma autobiografia de uma página.',
  },
  {
    id: 'par-pantheon', city: 'Paris', name: 'Panthéon', emoji: '🏛️', kind: 'Mausoléu', rarity: 'raro',
    lat: 48.84620, lng: 2.34600, year: '1758–1790', wiki: 'Panteão (Paris)',
    story: 'Projetado como igreja, virou mausoléu dos "grandes homens" da França na Revolução: Voltaire, Rousseau, Victor Hugo, Marie Curie. Em 1851, Léon Foucault pendurou aqui seu pêndulo para provar que a Terra gira.',
  },
  {
    id: 'par-luxembourg', city: 'Paris', name: 'Jardim de Luxemburgo', emoji: '⛵', kind: 'Jardim', rarity: 'comum',
    lat: 48.84620, lng: 2.33720, year: '1612', wiki: 'Jardim de Luxemburgo',
    story: 'Maria de Médici construiu o palácio para lembrar sua Florença natal. Hoje abriga o Senado francês. As crianças alugam barquinhos de madeira para soltar no grande lago, tradição desde 1927.',
  },
  {
    id: 'par-sacre-coeur', city: 'Paris', name: 'Sacré-Cœur', emoji: '⛪', kind: 'Basílica', rarity: 'epico',
    lat: 48.88670, lng: 2.34310, year: '1875–1914', wiki: 'Basílica de Sacré-Cœur',
    story: 'No ponto mais alto de Paris, a basílica branca foi construída após a derrota para a Prússia em 1870. A pedra de travertino libera calcita quando chove: por isso ela fica cada vez mais branca com o tempo.',
    tip: 'Funicular com bilhete de metrô. Vista de graça das escadarias.',
  },
  {
    id: 'par-je-taime', city: 'Paris', name: 'Muro dos Eu Te Amo', emoji: '💕', kind: 'Curiosidade', rarity: 'raro',
    lat: 48.88480, lng: 2.33840, year: '2000', wiki: 'Muro dos Eu Te Amo',
    story: 'No pequeno Square Jehan-Rictus, em Montmartre, 612 azulejos de lava esmaltada trazem "eu te amo" escrito 311 vezes em cerca de 250 idiomas. Procure o português!',
  },
  {
    id: 'par-moulin-rouge', city: 'Paris', name: 'Moulin Rouge', emoji: '💃', kind: 'Cabaré', rarity: 'comum',
    lat: 48.88410, lng: 2.33230, year: '1889', wiki: 'Moulin Rouge',
    story: 'Aberto no mesmo ano da Torre Eiffel, foi o berço do cancan moderno. Toulouse-Lautrec frequentava o cabaré e fez dele tema de seus cartazes mais famosos.',
  },
  {
    id: 'par-opera', city: 'Paris', name: 'Ópera Garnier', emoji: '🎭', kind: 'Teatro', rarity: 'raro',
    lat: 48.87200, lng: 2.33160, year: '1861–1875', wiki: 'Ópera Garnier',
    story: 'Palácio de ouro e mármore criado por Charles Garnier para Napoleão III. Sob ele há um reservatório de água real, que inspirou o lago subterrâneo de "O Fantasma da Ópera". O teto da plateia foi pintado por Chagall em 1964.',
  },
  {
    id: 'par-alexandre', city: 'Paris', name: 'Pont Alexandre III', emoji: '🌉', kind: 'Ponte', rarity: 'raro',
    lat: 48.86390, lng: 2.31350, year: '1896–1900', wiki: 'Ponte Alexandre III',
    story: 'A ponte mais ornamentada de Paris celebra a aliança franco-russa, com a primeira pedra lançada pelo czar Nicolau II. Tem um único arco de aço baixinho, para não atrapalhar a vista dos Invalides.',
  },
  {
    id: 'par-vendome', city: 'Paris', name: 'Place Vendôme', emoji: '💍', kind: 'Praça', rarity: 'comum',
    lat: 48.86750, lng: 2.32940, year: '1699', wiki: 'Place Vendôme',
    story: 'A praça das joalherias e do Ritz, onde Coco Chanel viveu por 30 anos. A coluna central foi feita com o bronze de 1.200 canhões tomados em Austerlitz.',
  },
  {
    id: 'par-versalhes', city: 'Paris', name: 'Palácio de Versalhes', emoji: '👑', kind: 'Palácio', rarity: 'lendario',
    lat: 48.80490, lng: 2.12040, year: '1661–1710', wiki: 'Palácio de Versalhes',
    story: 'Luís XIV transformou o pavilhão de caça do pai no palácio mais deslumbrante da Europa e obrigou a nobreza a morar ali, sob seus olhos. Foi a sede do poder até a Revolução, quando a multidão buscou Luís XVI e Maria Antonieta em 1789.',
  },
  {
    id: 'par-espelhos', city: 'Paris', name: 'Galeria dos Espelhos', emoji: '🪞', kind: 'Salão', rarity: 'epico', inside: 'par-versalhes',
    lat: 48.80480, lng: 2.12010, year: '1678–1684', wiki: 'Galeria dos Espelhos',
    story: '357 espelhos numa época em que eles eram luxo produzido em segredo por Veneza — Luís XIV atraiu vidreiros de Murano para fabricá-los na França. Ali foi assinado o Tratado de Versalhes, que encerrou a Primeira Guerra, em 1919.',
  },
];

export const POIS: Poi[] = [...CURATED, ...OBRAS, ...RESTAURANTS, ...(WIKI as Omit<Poi, 'source'>[]).map((p) => ({ ...p, source: 'wiki' as const }))];

export const poiById = new Map(POIS.map((p) => [p.id, p]));

/** Pontos: "Vi" vale o XP da raridade; "Aprendi" (ler a história) vale metade; comer vale um bônus fixo */
export const xpFor = (p: Poi, kind: 'seen' | 'learned') =>
  p.food ? (kind === 'seen' ? 20 : 0) : kind === 'seen' ? RARITY[p.rarity].xp : Math.round(RARITY[p.rarity].xp / 2);
