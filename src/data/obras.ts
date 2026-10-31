// Obras e objetos que dá para ver na viagem — ficam "dentro" de um lugar do catálogo.
import type { Poi } from './pois';

const o = (p: Omit<Poi, 'obra'>): Poi => ({ ...p, obra: true });

export const OBRAS: Poi[] = [
  // ───────────── ROMA · VATICANO ─────────────
  o({
    id: 'obra-criacao-adao', city: 'Roma', name: 'A Criação de Adão', emoji: '👆', kind: 'Afresco', rarity: 'lendario', inside: 'roma-capela-sistina',
    lat: 41.90297, lng: 12.45452, year: 'c. 1512', wiki: 'A Criação de Adão',
    story: 'O dedo de Deus quase tocando o de Adão é uma das imagens mais reproduzidas da história. Ao contrário do mito, Michelangelo não pintou deitado: ficou de pé, com a cabeça inclinada para trás, sobre um andaime que ele mesmo projetou — e reclamou em um poema que a tinta pingava no rosto e o pescoço doía.',
    fact: 'Médicos notaram que o manto vermelho em volta de Deus tem o formato de um cérebro humano, com cerebelo e artérias. Michelangelo dissecava cadáveres para estudar anatomia.',
  }),
  o({
    id: 'obra-juizo-final', city: 'Roma', name: 'O Juízo Final', emoji: '🔥', kind: 'Afresco', rarity: 'epico', inside: 'roma-capela-sistina',
    lat: 41.90291, lng: 12.45421, year: '1536–1541', wiki: 'O Juízo Final (Michelangelo)',
    story: 'A parede do altar inteira, com mais de 300 figuras, mostra Cristo julgando os vivos e os mortos. Michelangelo tinha 61 anos e pintou um Cristo musculoso e sem barba, cercado de santos nus — o que escandalizou a Cúria.',
    fact: 'São Bartolomeu segura a própria pele esfolada; o rosto desfigurado na pele é um autorretrato de Michelangelo. E Minos, no inferno, tem orelhas de burro e o rosto de Biagio da Cesena, mestre de cerimônias que criticou a obra.',
  }),
  o({
    id: 'obra-laocoonte', city: 'Roma', name: 'Laocoonte e seus filhos', emoji: '🐍', kind: 'Escultura', rarity: 'epico', inside: 'roma-museus-vaticanos',
    lat: 41.9056, lng: 12.4547, year: 'séc. I a.C.', wiki: 'Laocoonte e seus filhos',
    story: 'O sacerdote troiano que alertou contra o cavalo de madeira é atacado com os filhos por serpentes enviadas pelos deuses. A escultura foi achada num vinhedo em 1506; Michelangelo estava presente na escavação. Foi a primeira peça dos Museus Vaticanos.',
    fact: 'O braço direito de Laocoonte sumiu e foi "restaurado" esticado para cima. Em 1906 acharam o braço original, dobrado para trás — Michelangelo havia apostado nisso 400 anos antes.',
  }),
  o({
    id: 'obra-apolo-belvedere', city: 'Roma', name: 'Apolo de Belvedere', emoji: '🏹', kind: 'Escultura', rarity: 'raro', inside: 'roma-museus-vaticanos',
    lat: 41.90566, lng: 12.45457, year: 'c. 130 d.C.', wiki: 'Apolo do Belvedere',
    story: 'Cópia romana de um bronze grego, foi considerada por séculos a escultura mais perfeita da Antiguidade. Napoleão a levou para o Louvre em 1798; voltou ao Vaticano em 1816.',
  }),
  o({
    id: 'obra-torso-belvedere', city: 'Roma', name: 'Torso de Belvedere', emoji: '💪', kind: 'Escultura', rarity: 'raro', inside: 'roma-museus-vaticanos',
    lat: 41.9054, lng: 12.455, year: 'séc. I a.C.', wiki: 'Torso do Belvedere',
    story: 'Só sobrou o tronco de um herói sentado — e foi o bastante para influenciar o Renascimento. Michelangelo o estudou tanto que se recusou a completar os membros quando o papa pediu: disse que era perfeito como estava. Os nus da Capela Sistina devem muito a ele.',
  }),
  o({
    id: 'obra-galeria-mapas', city: 'Roma', name: 'Galeria dos Mapas', emoji: '🗺️', kind: 'Galeria', rarity: 'raro', inside: 'roma-museus-vaticanos',
    lat: 41.9046, lng: 12.4556, year: '1580–1585', wiki: 'Galeria dos Mapas',
    story: 'Corredor de 120 m com 40 mapas pintados de todas as regiões da Itália, feitos a partir dos desenhos do geógrafo Ignazio Danti. O teto dourado é tão rico que muitos visitantes nem olham para os mapas.',
    fact: 'Procure Veneza no mapa: ela já aparece com o formato de peixe que tem até hoje.',
  }),
  o({
    id: 'obra-transfiguracao', city: 'Roma', name: 'A Transfiguração (Rafael)', emoji: '🌟', kind: 'Pintura', rarity: 'raro', inside: 'roma-museus-vaticanos',
    lat: 41.906, lng: 12.4534, year: '1516–1520', wiki: 'Transfiguração (Rafael)',
    story: 'Último quadro de Rafael, que morreu aos 37 anos antes de terminar a parte de baixo (concluída por seus alunos). A pintura ficou exposta ao lado do seu corpo no velório. Fica na Pinacoteca Vaticana.',
  }),
  o({
    id: 'obra-escada-momo', city: 'Roma', name: 'Escada em espiral de Momo', emoji: '🌀', kind: 'Arquitetura', rarity: 'comum', inside: 'roma-museus-vaticanos',
    lat: 41.9064, lng: 12.4539, year: '1932', wiki: 'Escada de Bramante',
    story: 'A escada em dupla hélice da saída dos museus é uma das mais fotografadas do mundo. Homenageia a escada de Bramante (1505), que ficava fechada ao público e permitia subir a cavalo.',
  }),
  o({
    id: 'obra-sao-pedro-bronze', city: 'Roma', name: 'Estátua de bronze de São Pedro', emoji: '🦶', kind: 'Escultura', rarity: 'comum', inside: 'roma-basilica-sao-pedro',
    lat: 41.90213, lng: 12.4536, year: 'séc. XIII', wiki: 'Estátua de São Pedro (Arnolfo di Cambio)',
    story: 'Pedro sentado, segurando as chaves do céu. Peregrinos tocam ou beijam o pé direito há séculos — tanto que os dedos ficaram lisos e quase desapareceram.',
  }),
  o({
    id: 'obra-catedra-pedro', city: 'Roma', name: 'Cátedra de São Pedro', emoji: '🪑', kind: 'Escultura', rarity: 'raro', inside: 'roma-basilica-sao-pedro',
    lat: 41.90205, lng: 12.45255, year: '1657–1666', wiki: 'Cátedra de São Pedro',
    story: 'No fundo da basílica, Bernini criou um trono de bronze dourado sustentado por quatro doutores da Igreja, guardando uma cadeira de madeira que a tradição atribuía a Pedro. Acima, a janela de alabastro com a pomba do Espírito Santo brilha ao fim da tarde.',
    fact: 'A pomba tem envergadura de quase 2 metros, apesar de parecer pequena lá de baixo.',
  }),

  // ───────────── ROMA · CENTRO ─────────────
  o({
    id: 'obra-moises', city: 'Roma', name: 'Moisés de Michelangelo', emoji: '📜', kind: 'Escultura', rarity: 'lendario',
    lat: 41.89379, lng: 12.49304, year: '1513–1515', wiki: 'Moisés (Michelangelo)',
    story: 'Na pequena igreja de San Pietro in Vincoli, a 10 min do Coliseu, está a estátua que Michelangelo fez para o túmulo de Júlio II. Diz a lenda que, ao terminar, ele bateu no joelho de Moisés com o martelo e gritou "Por que não falas?", tão viva parecia.',
    fact: 'Os chifres na cabeça vêm de um erro de tradução da Bíblia latina: "raios de luz" virou "chifres".',
    tip: 'Grátis. Na mesma igreja estão as correntes que teriam prendido São Pedro.',
  }),
  o({
    id: 'obra-vocacao-mateus', city: 'Roma', name: 'Vocação de São Mateus (Caravaggio)', emoji: '🕯️', kind: 'Pintura', rarity: 'epico',
    lat: 41.89961, lng: 12.47468, year: '1599–1600', wiki: 'A Vocação de São Mateus',
    story: 'Na igreja de San Luigi dei Francesi, entre o Panteão e a Navona, Caravaggio pintou Cristo apontando para o cobrador de impostos Mateus numa taberna escura, com um facho de luz cortando a cena. Foi a obra que o tornou famoso.',
    tip: 'Grátis. Leve uma moeda: a luz da capela Contarelli acende por alguns minutos.',
  }),
  o({
    id: 'obra-elefante-bernini', city: 'Roma', name: 'Elefante de Bernini (Pulcino)', emoji: '🐘', kind: 'Escultura', rarity: 'raro',
    lat: 41.89813, lng: 12.47758, year: '1667', wiki: 'Elefante e Obelisco',
    story: 'Atrás do Panteão, um pequeno elefante carrega um obelisco egípcio nas costas: símbolo de que é preciso uma mente forte para sustentar a sabedoria. Os romanos o apelidaram de "Pulcino della Minerva" (pintinho), por ser baixinho e gordinho.',
    fact: 'O elefante está de costas para o convento dos dominicanos, que atrapalharam o projeto — e, dizem, levanta a cauda para eles de propósito.',
  }),
  o({
    id: 'obra-tumulo-rafael', city: 'Roma', name: 'Túmulo de Rafael', emoji: '⚰️', kind: 'Túmulo', rarity: 'raro', inside: 'roma-pantheon',
    lat: 41.89855, lng: 12.4768, year: '1520', wiki: 'Rafael Sanzio',
    story: 'O pintor pediu para ser enterrado no Panteão. O epitáfio, escrito pelo cardeal Bembo, diz: "Aqui jaz Rafael, por quem a Natureza temeu ser vencida enquanto ele vivia, e, quando morreu, temeu morrer com ele".',
  }),
  o({
    id: 'obra-lupa-capitolina', city: 'Roma', name: 'Loba Capitolina', emoji: '🐺', kind: 'Escultura', rarity: 'epico', inside: 'roma-campidoglio',
    lat: 41.89285, lng: 12.4825, wiki: 'Loba Capitolina',
    story: 'A loba que amamentou Rômulo e Remo, símbolo de Roma, está nos Museus Capitolinos. Por séculos foi tida como etrusca, do século V a.C.; análises recentes sugerem que é medieval. Os gêmeos foram acrescentados no Renascimento.',
  }),
  o({
    id: 'obra-cabeca-constantino', city: 'Roma', name: 'Cabeça colossal de Constantino', emoji: '🗿', kind: 'Escultura', rarity: 'raro', inside: 'roma-campidoglio',
    lat: 41.8929, lng: 12.4827, year: 'c. 313 d.C.', wiki: 'Colosso de Constantino',
    story: 'No pátio dos Museus Capitolinos estão os pedaços de uma estátua de 12 metros do imperador: a cabeça de 2,5 m, uma mão apontando para o céu, um pé gigante. O resto do corpo era de madeira e bronze.',
  }),
  o({
    id: 'obra-caravaggio-popolo', city: 'Roma', name: 'Caravaggios da Capela Cerasi', emoji: '🎨', kind: 'Pintura', rarity: 'raro', inside: 'roma-popolo',
    lat: 41.9115, lng: 12.4762, year: '1600–1601', wiki: 'Santa Maria del Popolo',
    story: 'Na igreja de Santa Maria del Popolo, a Conversão de São Paulo e a Crucificação de São Pedro mostram o realismo cru de Caravaggio: Paulo caído do cavalo, cuja garupa ocupa metade do quadro, e Pedro sendo erguido de cabeça para baixo por trabalhadores com os pés sujos.',
  }),

  // ───────────── LISBOA ─────────────
  o({
    id: 'obra-tumulo-vasco', city: 'Lisboa', name: 'Túmulo de Vasco da Gama', emoji: '⚓', kind: 'Túmulo', rarity: 'epico', inside: 'lis-jeronimos',
    lat: 38.69785, lng: -9.2066, year: '1880', wiki: 'Vasco da Gama',
    story: 'Na entrada da igreja dos Jerónimos, o navegador que abriu o caminho marítimo para a Índia repousa num túmulo decorado com caravelas e esferas armilares. Em frente está o de Luís de Camões, que contou a viagem em "Os Lusíadas".',
    fact: 'Não se sabe se os restos de Camões estão mesmo ali: ele morreu pobre, vítima da peste, e foi enterrado numa vala comum.',
  }),
  o({
    id: 'obra-rinoceronte', city: 'Lisboa', name: 'Rinoceronte da Torre de Belém', emoji: '🦏', kind: 'Escultura', rarity: 'raro', inside: 'lis-torre-belem',
    lat: 38.6915, lng: -9.2161, year: '1515', wiki: 'Rinoceronte de Dürer',
    story: 'Uma gárgula em forma de rinoceronte lembra Ganda, o animal enviado da Índia ao rei D. Manuel em 1515 — o primeiro visto na Europa desde Roma. Albrecht Dürer o desenhou sem nunca tê-lo visto, só por descrições, e a gravura virou o rinoceronte "oficial" por 200 anos.',
  }),
  o({
    id: 'obra-eletrico-28', city: 'Lisboa', name: 'Elétrico 28', emoji: '🚋', kind: 'Ícone', rarity: 'raro',
    lat: 38.711, lng: -9.1345, year: '1914', wiki: 'Linha 28 (Carris)',
    story: 'Os bondinhos amarelos "Remodelados", de madeira, sobem ladeiras de até 13,5% entre Martim Moniz e Campo de Ourique, passando por Graça, Alfama, Sé, Baixa e Chiado. É o passeio mais clássico de Lisboa.',
    tip: 'Cuidado com batedores de carteira; para fotos, espere na curva da Sé.',
  }),

  // ───────────── VENEZA ─────────────
  o({
    id: 'obra-pala-doro', city: 'Veneza', name: "Pala d'Oro", emoji: '💎', kind: 'Ourivesaria', rarity: 'epico', inside: 'ven-sao-marcos',
    lat: 45.43455, lng: 12.34, year: '976–1345', wiki: "Pala d'Oro",
    story: 'Retábulo de ouro atrás do altar de São Marcos, com cerca de 1.900 pedras preciosas: esmeraldas, safiras, pérolas, rubis. Parte dos esmaltes bizantinos foi saqueada de Constantinopla em 1204.',
    fact: 'Napoleão levou centenas de pedras em 1797 — mas não percebeu que muitas das que sobraram eram verdadeiras.',
  }),
  o({
    id: 'obra-cavalos-sao-marcos', city: 'Veneza', name: 'Cavalos de São Marcos', emoji: '🐴', kind: 'Escultura', rarity: 'epico', inside: 'ven-sao-marcos',
    lat: 45.43448, lng: 12.3395, year: 'séc. II–IV?', wiki: 'Cavalos de São Marcos',
    story: 'A única quadriga de bronze da Antiguidade que sobreviveu. Ficava no Hipódromo de Constantinopla, foi saqueada pelos venezianos em 1204, levada por Napoleão para o Arco do Carrossel em Paris e devolvida em 1815. Os da fachada são cópias; os originais estão no museu da basílica.',
  }),
  o({
    id: 'obra-paraiso-tintoretto', city: 'Veneza', name: 'O Paraíso de Tintoretto', emoji: '☁️', kind: 'Pintura', rarity: 'epico', inside: 'ven-palacio-ducal',
    lat: 45.43385, lng: 12.3402, year: '1588–1592', wiki: 'Paraíso (Tintoretto)',
    story: 'Na Sala do Grande Conselho, a tela de 22 × 9 metros com cerca de 500 figuras foi por muito tempo a maior pintura a óleo do mundo. Tintoretto tinha 70 anos e foi ajudado pelo filho Domenico.',
    fact: 'No friso da sala estão os retratos dos doges — e um retângulo preto no lugar de Marino Falier, decapitado em 1355 por traição.',
  }),
  o({
    id: 'obra-leao-sao-marcos', city: 'Veneza', name: 'Leão alado de São Marcos', emoji: '🦁', kind: 'Escultura', rarity: 'raro',
    lat: 45.4333, lng: 12.3399, wiki: 'Leão de São Marcos',
    story: 'No alto de uma das duas colunas da Piazzetta, o leão alado é o símbolo de Veneza e do evangelista Marcos. A estátua de bronze pode ter origem chinesa ou persa e ganhou asas depois. Entre as duas colunas aconteciam as execuções públicas.',
    fact: 'Venezianos supersticiosos até hoje evitam passar entre as duas colunas.',
  }),
  o({
    id: 'obra-assuncao-ticiano', city: 'Veneza', name: 'Assunção da Virgem (Ticiano)', emoji: '🙏', kind: 'Pintura', rarity: 'raro',
    lat: 45.437, lng: 12.3264, year: '1516–1518', wiki: 'Assunção da Virgem (Ticiano)',
    story: 'No altar da Basílica dos Frari, em San Polo, a tela de 7 metros mostra Maria subindo ao céu em vermelho vibrante. Os frades acharam a obra ousada demais no início. Ticiano está enterrado na mesma igreja.',
  }),

  // ───────────── PARIS ─────────────
  o({
    id: 'obra-vitoria-samotracia', city: 'Paris', name: 'Vitória de Samotrácia', emoji: '🪽', kind: 'Escultura', rarity: 'lendario', inside: 'par-louvre',
    lat: 48.8603, lng: 2.3364, year: 'c. 190 a.C.', wiki: 'Vitória de Samotrácia',
    story: 'A deusa Nice pousa na proa de um navio, com o vento colando as roupas ao corpo. Foi achada em 110 pedaços na ilha grega de Samotrácia em 1863. Domina o alto da escadaria Daru, num dos cenários mais teatrais do Louvre.',
    fact: 'A mão direita foi encontrada em 1950 e está numa vitrine ao lado. A cabeça nunca apareceu.',
  }),
  o({
    id: 'obra-liberdade', city: 'Paris', name: 'A Liberdade Guiando o Povo', emoji: '🇫🇷', kind: 'Pintura', rarity: 'epico', inside: 'par-louvre',
    lat: 48.8597, lng: 2.3344, year: '1830', wiki: 'A Liberdade guiando o povo',
    story: 'Delacroix pintou a revolta de julho de 1830 com Marianne, de seios à mostra e bandeira na mão, avançando sobre barricadas. Inspirou a Estátua da Liberdade e o personagem Gavroche, de "Os Miseráveis".',
  }),
  o({
    id: 'obra-jangada-medusa', city: 'Paris', name: 'A Jangada da Medusa', emoji: '🌊', kind: 'Pintura', rarity: 'raro', inside: 'par-louvre',
    lat: 48.85965, lng: 2.3346, year: '1818–1819', wiki: 'A Balsa da Medusa',
    story: 'Géricault retratou os sobreviventes de um naufrágio real de 1816, abandonados numa jangada por oficiais incompetentes; de 147, só 15 sobreviveram, alguns recorrendo ao canibalismo. Para pintar, ele estudou cadáveres no necrotério.',
  }),
  o({
    id: 'obra-coroacao-napoleao', city: 'Paris', name: 'A Coroação de Napoleão', emoji: '👑', kind: 'Pintura', rarity: 'raro', inside: 'par-louvre',
    lat: 48.85975, lng: 2.3342, year: '1805–1807', wiki: 'A Coroação de Napoleão',
    story: 'Tela de quase 10 metros de Jacques-Louis David: Napoleão coroa Josefina em Notre-Dame, com o papa apenas abençoando. A mãe de Napoleão aparece sentada na tribuna — mas ela nem foi à cerimônia.',
  }),
  o({
    id: 'obra-bodas-cana', city: 'Paris', name: 'As Bodas de Caná', emoji: '🍷', kind: 'Pintura', rarity: 'raro', inside: 'par-louvre',
    lat: 48.85983, lng: 2.33538, year: '1563', wiki: 'As Bodas de Caná',
    story: 'A maior pintura do Louvre (6,8 × 9,9 m) fica de frente para a Mona Lisa, e quase todo mundo dá as costas para ela. Veronese pôs Cristo no centro de um banquete veneziano com 130 figuras — e os músicos são retratos de Ticiano, Tintoretto e dele mesmo.',
  }),
  o({
    id: 'obra-escravos-michelangelo', city: 'Paris', name: 'Escravos de Michelangelo', emoji: '⛓️', kind: 'Escultura', rarity: 'raro', inside: 'par-louvre',
    lat: 48.8595, lng: 2.336, year: '1513–1516', wiki: 'Escravo Moribundo',
    story: 'O Escravo Moribundo e o Escravo Rebelde foram feitos para o túmulo de Júlio II — o mesmo projeto do Moisés que fica em Roma. Michelangelo os deu de presente a um exilado florentino na França.',
  }),
  o({
    id: 'obra-ninfeias', city: 'Paris', name: 'As Ninfeias de Monet', emoji: '🪷', kind: 'Pintura', rarity: 'epico',
    lat: 48.8638, lng: 2.3227, year: '1914–1926', wiki: 'Museu da Orangerie',
    story: 'No Museu da Orangerie, nas Tulherias, duas salas ovais foram desenhadas pelo próprio Monet para receber oito painéis gigantes do lago de seu jardim em Giverny. Ele os ofereceu à França no dia seguinte ao armistício de 1918, como monumento à paz.',
    tip: 'Fica no caminho entre a Concorde e o Louvre; costuma ter menos fila no fim da tarde.',
  }),
  o({
    id: 'obra-rosaceas', city: 'Paris', name: 'Rosáceas de Notre-Dame', emoji: '🌹', kind: 'Vitral', rarity: 'raro', inside: 'par-notre-dame',
    lat: 48.853, lng: 2.3496, year: 'séc. XIII', wiki: 'Catedral de Notre-Dame de Paris',
    story: 'As três rosáceas góticas, com quase 13 m de diâmetro, sobreviveram ao incêndio de 2019. A rosácea norte ainda tem a maior parte dos vidros originais do século XIII.',
  }),
  o({
    id: 'obra-teto-chagall', city: 'Paris', name: 'Teto de Chagall', emoji: '🎨', kind: 'Pintura', rarity: 'raro', inside: 'par-opera',
    lat: 48.87195, lng: 2.3317, year: '1964', wiki: 'Ópera Garnier',
    story: 'Marc Chagall, aos 77 anos, pintou de graça o teto da plateia da Ópera Garnier com cenas de 14 óperas e balés. A obra moderna sobre a decoração dourada do século XIX causou polêmica — hoje é um dos tesouros do prédio.',
  }),
  o({
    id: 'obra-pendulo-foucault', city: 'Paris', name: 'Pêndulo de Foucault', emoji: '🌍', kind: 'Ciência', rarity: 'raro', inside: 'par-pantheon',
    lat: 48.84625, lng: 2.34605, year: '1851', wiki: 'Pêndulo de Foucault',
    story: 'Sob a cúpula do Panthéon, uma esfera de 28 kg pendurada por um fio de 67 m oscila e muda lentamente de direção. Em 1851, Léon Foucault mostrou ao público, pela primeira vez, a prova visível de que a Terra gira.',
  }),
  o({
    id: 'obra-quarto-rei', city: 'Paris', name: 'Quarto do Rei', emoji: '🛏️', kind: 'Salão', rarity: 'raro', inside: 'par-versalhes',
    lat: 48.80495, lng: 2.1205, year: '1701', wiki: 'Palácio de Versalhes',
    story: 'No centro exato do palácio, de frente para o nascer do sol, ficava o quarto de Luís XIV, o Rei Sol. Acordar e deitar o rei eram cerimônias públicas, com nobres disputando a honra de lhe entregar a camisa. Ele morreu ali em 1715.',
  }),
];
