// 100 lugares para comer, perto dos pontos do roteiro e das hospedagens.
// Faixa de preço por pessoa: € até ~15 · €€ ~15–40 · €€€ acima de ~40.
// "Como chegar" busca pelo nome + endereço no Google Maps (mais confiável que a coordenada).
import type { Poi } from './pois';

type R = [id: string, name: string, emoji: string, kind: string, price: '€' | '€€' | '€€€', lat: number, lng: number, addr: string, desc: string, iconic?: 1];

const ROMA: R[] = [
  // Vaticano · Prati
  ['bonci', 'Pizzarium Bonci', '🍕', 'Pizza al taglio', '€', 41.9066, 12.4466, 'Via della Meloria 43', 'A pizza a metro mais famosa de Roma, de Gabriele Bonci, com coberturas que mudam ao longo do dia. Pede-se por peso, come-se em pé.', 1],
  ['sorpasso', 'Il Sorpasso', '🍷', 'Bistrô', '€€', 41.907, 12.464, 'Via Properzio 31', 'Bistrô animado em Prati com salumi, queijos e massas romanas. Bom para almoço depois do Vaticano.'],
  ['pastasciutta', 'Pastasciutta', '🍝', 'Massa fresca', '€', 41.9058, 12.459, 'Via delle Grazie 5', 'Massa fresca feita na hora e servida em pote, a 5 minutos da Praça de São Pedro. Cacio e pepe e amatriciana por menos de €10.'],
  ['old-bridge', 'Old Bridge Gelateria', '🍦', 'Gelato', '€', 41.9062, 12.455, 'Viale dei Bastioni di Michelangelo 5', 'Gelato cremoso e porções generosas bem em frente à fila dos Museus Vaticanos.'],
  ['dino-tony', 'Hostaria Dino e Tony', '🍝', 'Trattoria', '€€', 41.9083, 12.4573, 'Via Leone IV 60', 'Trattoria familiar sem cardápio fixo: Tony traz os antepastos e a massa do dia. Leve dinheiro.'],
  // Centro · Navona · Panteão · Campo de\' Fiori
  ['roscioli', 'Roscioli Salumeria con Cucina', '🧀', 'Salumeria', '€€€', 41.8937, 12.4734, 'Via dei Giubbonari 21', 'Mercearia e restaurante com uma das carbonaras mais elogiadas da cidade e uma adega enorme. Reserve.', 1],
  ['forno-roscioli', 'Antico Forno Roscioli', '🥖', 'Padaria', '€', 41.8941, 12.4741, 'Via dei Chiavari 34', 'Padaria da família Roscioli: pizza bianca, pizza rossa e supplì para comer andando.'],
  ['forno-campo', "Forno Campo de' Fiori", '🥖', 'Padaria', '€', 41.8956, 12.4719, "Campo de' Fiori 22", 'Pizza bianca recheada com mortadela, direto do forno, na praça do mercado.'],
  ['armando', 'Armando al Pantheon', '🍝', 'Trattoria', '€€', 41.899, 12.476, "Salita de' Crescenzi 31", 'Desde 1961 a poucos passos do Panteão, com cozinha romana clássica. Disputadíssimo: reserve.', 1],
  ['giolitti', 'Giolitti', '🍦', 'Gelato', '€', 41.901, 12.478, 'Via degli Uffici del Vicario 40', 'Gelateria histórica (1900), com chantilly por cima. Pague no caixa antes de pedir.'],
  ['sant-eustachio', "Sant'Eustachio Il Caffè", '☕', 'Café', '€', 41.8981, 12.4752, "Piazza di Sant'Eustachio 82", 'Café de 1938 famoso pelo "gran caffè", cremoso e já adoçado. Peça "amaro" se não quiser açúcar.'],
  ['tazza-oro', "Tazza d'Oro", '☕', 'Café', '€', 41.8995, 12.4775, 'Via degli Orfani 84', 'Torrefação ao lado do Panteão. No calor, peça a granita di caffè con panna.'],
  ['da-francesco', 'Da Francesco', '🍕', 'Pizzaria', '€€', 41.8995, 12.47, 'Piazza del Fico 29', 'Pizzaria e trattoria de bairro atrás da Navona, com mesas na pracinha.'],
  ['supplizio', 'Supplizio', '🍙', 'Supplì', '€', 41.8988, 12.4675, 'Via dei Banchi Vecchi 143', 'Lanchonete dedicada ao supplì, o bolinho de arroz frito com mozzarella derretida por dentro.'],
  ['cul-de-sac', 'Cul de Sac', '🍷', 'Enoteca', '€€', 41.8977, 12.472, 'Piazza di Pasquino 73', 'Uma das primeiras enotecas de Roma (1977), com uma carta de vinhos imensa e patês caseiros.'],
  ['emma', 'Emma Pizzeria', '🍕', 'Pizzaria', '€€', 41.8943, 12.4742, 'Via del Monte della Farina 28', 'Pizza romana fina e crocante com farinha e ingredientes escolhidos pelos Roscioli.'],
  // Gueto
  ['nonna-betta', 'Nonna Betta', '🥬', 'Cozinha judaico-romana', '€€', 41.8925, 12.4778, "Via del Portico d'Ottavia 16", 'Cozinha judaico-romana: prove a alcachofra frita "alla giudia".'],
  ['boccione', 'Pasticceria Boccione', '🥧', 'Doceria', '€', 41.8923, 12.4768, "Via del Portico d'Ottavia 1", 'Doceria kosher sem placa na porta, famosa pela torta de ricota com ginja e a "pizza ebraica".', 1],
  ['baghetto', "Ba'Ghetto", '🥬', 'Cozinha judaico-romana', '€€', 41.8926, 12.479, "Via del Portico d'Ottavia 57", 'Mesas na rua principal do Gueto, com carciofi e pratos kosher.'],
  // Trevi · Spagna
  ['pastificio-guerra', 'Pastificio Guerra', '🍝', 'Massa fresca', '€', 41.9063, 12.48, 'Via della Croce 8', 'Fábrica de massa a dois quarteirões da Escadaria da Espanha que serve dois pratos do dia com taça de vinho por poucos euros.'],
  ['caffe-greco', 'Antico Caffè Greco', '☕', 'Café histórico', '€€€', 41.9056, 12.4813, 'Via dei Condotti 86', 'O café mais antigo de Roma (1760), frequentado por Goethe, Keats e Casanova. Caro, mas é um museu.', 1],
  ['hostaria-romana', 'Hostaria Romana', '🍝', 'Trattoria', '€€', 41.9035, 12.487, 'Via del Boccaccio 1', 'Trattoria a 5 min da Fontana di Trevi, com paredes rabiscadas pelos clientes e massas generosas.'],
  // Trastevere
  ['da-enzo', 'Da Enzo al 29', '🍝', 'Trattoria', '€€', 41.888, 12.4772, 'Via dei Vascellari 29', 'Trattoria minúscula com fila na porta e uma das carbonaras mais famosas. Chegue antes de abrir.', 1],
  ['tonnarello', 'Tonnarello', '🍝', 'Trattoria', '€€', 41.8893, 12.4697, 'Via della Paglia 1', 'Massas servidas na própria frigideira, porções grandes e preço justo. Fila anda rápido.'],
  ['trapizzino', 'Trapizzino Trastevere', '🥪', 'Street food', '€', 41.892, 12.4706, 'Piazza Trilussa 46', 'Triângulo de pizza recheado com ensopados romanos — almôndegas, frango à cacciatora, língua.'],
  ['dar-poeta', 'Dar Poeta', '🍕', 'Pizzaria', '€€', 41.8906, 12.4683, 'Vicolo del Bologna 45', 'Pizzaria clássica de Trastevere; termine com o calzone de Nutella e ricota.'],
  ['seu', 'Seu Pizza Illuminati', '🍕', 'Pizzaria', '€€', 41.882, 12.471, 'Via Angelo Bargoni 10', 'Pizza contemporânea premiada, de massa leve e coberturas criativas.'],
  ['innocenti', 'Biscottificio Innocenti', '🍪', 'Biscoitaria', '€', 41.887, 12.476, 'Via della Luce 21', 'Biscoitaria artesanal com um forno de 16 metros; os biscoitos são vendidos por peso.'],
  // Monti · Coliseu · Esquilino (Airbnb)
  ['taverna-fori', 'La Taverna dei Fori Imperiali', '🍝', 'Trattoria', '€€', 41.8935, 12.4893, 'Via della Madonna dei Monti 9', 'Trattoria familiar em Monti, a 5 min do Fórum. Ótima depois do Coliseu.'],
  ['tre-scalini', 'Ai Tre Scalini', '🍷', 'Enoteca', '€€', 41.896, 12.492, 'Via Panisperna 251', 'Enoteca de bairro coberta de hera, com tábuas de frios e vinho em taça.'],
  ['panella', 'Panella', '🥐', 'Padaria', '€', 41.8945, 12.5015, 'Via Merulana 54', 'Padaria e café perto do Airbnb, ótima para o café da manhã: cornetti, focaccia e supplì.'],
  ['trattoria-monti', 'Trattoria Monti', '🍝', 'Trattoria', '€€', 41.896, 12.502, 'Via di San Vito 13a', 'Cozinha da região de Marche; famosa pelo raviolão de gema de ovo.'],
  ['mercato-centrale', 'Mercato Centrale Roma', '🧺', 'Mercado gastronômico', '€', 41.8998, 12.5005, 'Via Giovanni Giolitti 36', 'Praça de alimentação dentro da estação Termini com bancas de pizza, trapizzino, massa e gelato.'],
  ['fassi', 'Palazzo del Freddo Fassi', '🍦', 'Gelato', '€', 41.894, 12.507, 'Via Principe Eugenio 65', 'Gelateria fundada em 1880, perto da Piazza Vittorio e do Airbnb. Peça o "sanpietrino".'],
  // Testaccio (rumo ao Aventino)
  ['mordi-vai', 'Mordi e Vai', '🥪', 'Street food', '€', 41.877, 12.475, 'Mercato di Testaccio, box 15', 'Sanduíches de ensopados romanos dentro do mercado de Testaccio; o de picadinho de carne é o clássico.'],
];

const LISBOA: R[] = [
  ['nunes', 'Nunes Real Marisqueira', '🦐', 'Marisqueira', '€€€', 38.697, -9.214, 'Rua Bartolomeu Dias 172', 'Marisqueira tradicional em Belém, com santola, gambas e o prego no pão para fechar.'],
  ['darwins', "Darwin's Café", '🌊', 'Restaurante', '€€€', 38.693, -9.2215, 'Fundação Champalimaud, Av. Brasília', 'Restaurante envidraçado à beira do Tejo, ao lado da Torre de Belém.'],
  ['pao-queijo', 'Pão Pão Queijo Queijo', '🥙', 'Lanchonete', '€', 38.6976, -9.202, 'Rua de Belém 124', 'Sanduíches e pitas baratos ao lado dos Pastéis de Belém.'],
  ['time-out', 'Time Out Market', '🧺', 'Mercado gastronômico', '€€', 38.7069, -9.1459, 'Mercado da Ribeira, Av. 24 de Julho', 'Mercado da Ribeira com bancas de chefs portugueses. Bom para um grupo em que cada um quer uma coisa.', 1],
  ['trevo', 'O Trevo', '🥪', 'Bifanas', '€', 38.7108, -9.1435, 'Praça Luís de Camões 48', 'Balcão simples no Chiado com uma das bifanas mais famosas de Lisboa.'],
  ['manteigaria', 'Manteigaria', '🥮', 'Pastel de nata', '€', 38.7106, -9.144, 'Rua do Loreto 2', 'Para muitos lisboetas, o melhor pastel de nata da cidade. Sai quente a toda hora.', 1],
  ['flores', 'Taberna da Rua das Flores', '🍷', 'Taberna', '€€', 38.7098, -9.145, 'Rua das Flores 103', 'Petiscos portugueses criativos num salão pequeno; menu em quadro-negro. Sem reservas.'],
  ['avillez', 'Cantinho do Avillez', '🍽️', 'Restaurante', '€€€', 38.7085, -9.143, 'Rua dos Duques de Bragança 7', 'O lado descontraído do chef José Avillez, com pratos portugueses e de viagem.'],
  ['ginjinha', 'A Ginjinha', '🍒', 'Bar', '€', 38.714, -9.1385, 'Largo de São Domingos 8', 'Balcão de 1840 que serve só ginjinha, licor de ginja, com ou sem a fruta.', 1],
  ['nacional', 'Confeitaria Nacional', '🎂', 'Confeitaria', '€', 38.7135, -9.138, 'Praça da Figueira 18B', 'Confeitaria de 1829, a que trouxe o bolo-rei para Portugal.'],
  ['casa-india', 'Casa da Índia', '🍗', 'Churrasqueira', '€', 38.7105, -9.1455, 'Rua do Loreto 49', 'Churrasqueira popular no Bairro Alto: frango assado, sardinhas e preço baixo.'],
  ['nicola', 'Café Nicola', '☕', 'Café histórico', '€€', 38.7137, -9.1398, 'Praça D. Pedro IV 24', 'Café art déco no Rossio, frequentado pelo poeta Bocage no século XVIII.'],
  ['ze-mouraria', 'Zé da Mouraria', '🐟', 'Tasca', '€€', 38.716, -9.1355, 'Rua João do Outeiro 24', 'Tasca de almoço com bacalhau e pratos para dividir: um prato serve dois.'],
  ['sal-grosso', 'Taberna Sal Grosso', '🧂', 'Taberna', '€€', 38.7135, -9.1245, 'Calçada do Forte 22', 'Taberna pequena em Alfama com petiscos portugueses modernos. Reserve.'],
  ['santo-antonio', 'Pastelaria Santo António', '🥮', 'Pastel de nata', '€', 38.7105, -9.1335, 'Rua do Milagre de Santo António 10', 'Pastelaria em Alfama, perto da Sé, premiada pelos pastéis de nata.'],
  ['piteu', 'O Pitéu da Graça', '🍲', 'Tasca', '€€', 38.7165, -9.131, 'Largo da Graça 95', 'Cozinha caseira portuguesa no bairro da Graça, perto do miradouro.'],
  ['ramiro', 'Cervejaria Ramiro', '🦞', 'Marisqueira', '€€€', 38.7206, -9.1355, 'Av. Almirante Reis 1', 'A marisqueira mais famosa de Lisboa, na mesma avenida dos hotéis. Feche com o prego no pão.', 1],
];

const VENEZA: R[] = [
  // Cannaregio (hotel)
  ['al-timon', 'Al Timon', '🥩', 'Bacaro', '€€', 45.4442, 12.329, 'Fondamenta dei Ormesini 2754', 'Cicchetti e vinho num barco atracado no canal; à noite é o point dos venezianos.'],
  ['dalla-marisa', 'Trattoria Dalla Marisa', '🍝', 'Trattoria', '€€', 45.444, 12.3195, 'Fondamenta San Giobbe 652b', 'Menu fixo e caseiro, perto do hotel: você escolhe carne ou peixe e a Marisa decide o resto.'],
  ['paradiso-perduto', 'Paradiso Perduto', '🎶', 'Osteria', '€€', 45.4448, 12.3325, 'Fondamenta della Misericordia 2540', 'Osteria barulhenta com mesas compridas, frutos do mar e música ao vivo.'],
  ['promessi-sposi', 'Osteria Ai Promessi Sposi', '🍝', 'Osteria', '€€', 45.4405, 12.338, "Calle de l'Oca 4367", 'Osteria veneziana entre Rialto e Ca\' d\'Oro, com cicchetti no balcão e pratos de peixe.'],
  ['dal-mas', 'Pasticceria Dal Mas', '🥐', 'Confeitaria', '€', 45.4421, 12.3225, 'Rio Terà Lista di Spagna 150', 'Confeitaria clássica a 3 min do hotel: cornetti e café para começar o dia.'],
  ['alaska', 'Gelateria Alaska', '🍦', 'Gelato', '€', 45.4405, 12.327, 'Calle Larga dei Bari 1159', 'Gelato artesanal com sabores incomuns (alcachofra, gengibre).'],
  // Rialto · San Polo
  ['do-spade', 'Cantina Do Spade', '🍷', 'Bacaro', '€€', 45.4392, 12.3341, 'Calle de le Do Spade 860', 'Bacaro de 1488 perto do mercado de Rialto, com cicchetti e pratos de peixe.'],
  ['all-arco', "All'Arco", '🥖', 'Cicchetti', '€', 45.4389, 12.3346, "Calle de l'Arco 436", 'Balcão minúsculo de cicchetti feitos na hora com o peixe do mercado ao lado. Só no almoço.', 1],
  ['do-mori', 'Cantina Do Mori', '🍷', 'Bacaro', '€', 45.439, 12.335, 'Calle dei Do Mori 429', 'Considerado o bacaro mais antigo de Veneza (1462). Panelas de cobre penduradas no teto.', 1],
  ['carampane', 'Antiche Carampane', '🐟', 'Osteria', '€€€', 45.4383, 12.3307, 'Rio Terà de le Carampane 1911', 'Peixe da laguna em ruela escondida; a placa avisa "sem pizza, sem lasanha".'],
  ['suso', 'Gelatoteca Suso', '🍦', 'Gelato', '€', 45.4376, 12.3375, 'Calle de la Bissa 5453', 'Gelato artesanal a 2 min da Ponte de Rialto.'],
  // San Marco · Castello
  ['dal-moro', "Dal Moro's", '🍝', 'Massa para viagem', '€', 45.4362, 12.3405, 'Calle de la Casseleria 5324', 'Massa fresca em caixinha para comer andando, perto de San Marco.'],
  ['florian', 'Caffè Florian', '☕', 'Café histórico', '€€€', 45.4337, 12.3383, 'Piazza San Marco 57', 'O café mais antigo da Itália em funcionamento (1720). Caríssimo com orquestra; no balcão sai bem mais barato.', 1],
  ['rosa-salva', 'Rosa Salva', '🥐', 'Confeitaria', '€', 45.439, 12.3418, 'Campo Santi Giovanni e Paolo 6779', 'Confeitaria tradicional num dos campos mais bonitos de Castello.'],
  // Dorsoduro
  ['schiavi', 'Cantine del Vino già Schiavi', '🍷', 'Bacaro', '€', 45.4303, 12.3268, 'Fondamenta Nani 992', 'Bacaro em frente ao estaleiro de gôndolas de San Trovaso; cicchetti a ~€2.', 1],
  ['tonolo', 'Pasticceria Tonolo', '🧁', 'Confeitaria', '€', 45.4355, 12.3255, 'Calle San Pantalon 3764', 'Confeitaria de 1886, famosa pelos bignè e pela frittella no carnaval.'],
  ['ai-artisti', 'Osteria Enoteca Ai Artisti', '🍷', 'Osteria', '€€', 45.432, 12.327, 'Fondamenta de la Toletta 1169', 'Pequena osteria com mesas no canal e cardápio sazonal.'],
  // Burano
  ['da-romano', 'Trattoria da Romano', '🐟', 'Trattoria', '€€€', 45.4855, 12.417, 'Via Baldassarre Galuppi 221', 'Desde 1920 em Burano; o risotto de gò (peixe da laguna) é a especialidade.', 1],
];

const PARIS: R[] = [
  // Gare de Lyon · Bastille (hotel)
  ['train-bleu', 'Le Train Bleu', '🚂', 'Brasserie histórica', '€€€', 48.8447, 2.3735, 'Gare de Lyon, Place Louis-Armand', 'Restaurante belle époque dentro da Gare de Lyon (1901), com tetos pintados. Ao lado do hotel.', 1],
  ['baron-rouge', 'Le Baron Rouge', '🍷', 'Bar à vin', '€', 48.849, 2.378, '1 Rue Théophile Roussel', 'Bar de vinhos ao lado do mercado d\'Aligre; ostras no domingo e vinho do barril.'],
  ['ble-sucre', 'Blé Sucré', '🥐', 'Padaria', '€', 48.85, 2.3765, '7 Rue Antoine Vollon', 'Croissants e madeleines famosos, num square tranquilo perto do hotel.'],
  ['septime', 'Septime', '🍽️', 'Bistronomia', '€€€', 48.8535, 2.381, '80 Rue de Charonne', 'Um dos bistrôs de chef mais disputados de Paris; reserva abre com semanas de antecedência.'],
  ['bofinger', 'Bofinger', '🦪', 'Brasserie', '€€€', 48.8535, 2.3685, '5 Rue de la Bastille', 'Brasserie alsaciana de 1864, com cúpula de vitral, chucrute e frutos do mar.'],
  // Marais · Île Saint-Louis
  ['as-fallafel', "L'As du Fallafel", '🥙', 'Falafel', '€', 48.8574, 2.3591, '34 Rue des Rosiers', 'O falafel mais famoso de Paris, na rua judaica do Marais. A fila anda rápido.', 1],
  ['breizh', 'Breizh Café', '🥞', 'Crêperie', '€€', 48.8607, 2.3626, '109 Rue Vieille du Temple', 'Galettes bretãs de trigo-sarraceno com ingredientes de primeira e sidra artesanal.'],
  ['berthillon', 'Berthillon', '🍨', 'Sorveteria', '€', 48.8517, 2.3567, '31 Rue Saint-Louis en l\'Île', 'Sorvete artesanal parisiense desde 1954, na Île Saint-Louis.', 1],
  ['enfants-rouges', 'Marché des Enfants Rouges', '🧺', 'Mercado', '€€', 48.8628, 2.362, '39 Rue de Bretagne', 'O mercado coberto mais antigo de Paris (1615), com bancas de comida do mundo inteiro.'],
  ['chez-janou', 'Chez Janou', '🍷', 'Bistrô provençal', '€€', 48.8559, 2.3667, '2 Rue Roger Verlomme', 'Bistrô provençal perto da Place des Vosges, famoso pela mousse de chocolate servida à vontade.'],
  ['carette-vosges', 'Carette Place des Vosges', '🧁', 'Salão de chá', '€€', 48.8555, 2.3655, '25 Place des Vosges', 'Salão de chá sob as arcadas da praça mais bonita de Paris; macarons e chocolate quente.'],
  // Saint-Germain · Quartier Latin
  ['flore', 'Café de Flore', '☕', 'Café histórico', '€€€', 48.8541, 2.3326, '172 Bd Saint-Germain', 'Café de Sartre e Simone de Beauvoir. Caro, mas é uma instituição.', 1],
  ['deux-magots', 'Les Deux Magots', '☕', 'Café histórico', '€€€', 48.854, 2.3333, '6 Place Saint-Germain-des-Prés', 'Vizinho do Flore, frequentado por Hemingway e Picasso.'],
  ['procope', 'Le Procope', '🍷', 'Restaurante histórico', '€€€', 48.8531, 2.3388, '13 Rue de l\'Ancienne Comédie', 'O café mais antigo de Paris (1686): Voltaire, Benjamin Franklin e Napoleão, que teria deixado o chapéu como garantia de pagamento.'],
  ['polidor', 'Polidor', '🍲', 'Bistrô', '€€', 48.85, 2.34, '41 Rue Monsieur-le-Prince', 'Bistrô de 1845 que aparece em "Meia-Noite em Paris"; cozinha francesa caseira.'],
  ['shakespeare-cafe', 'Shakespeare and Company Café', '📚', 'Café', '€', 48.8524, 2.3472, '37 Rue de la Bûcherie', 'Café da livraria, com vista para Notre-Dame.'],
  ['poilane', 'Poilâne', '🍞', 'Padaria', '€', 48.851, 2.329, '8 Rue du Cherche-Midi', 'Padaria de 1932 famosa pelo pão de fermentação natural e pelos biscoitos punitions.'],
  // Louvre · Opéra · Tuileries
  ['angelina', 'Angelina', '🍫', 'Salão de chá', '€€', 48.865, 2.3285, '226 Rue de Rivoli', 'Salão de chá de 1903 em frente às Tulherias; o chocolate quente "L\'Africain" é lendário.', 1],
  ['chartier', 'Bouillon Chartier', '🍲', 'Bouillon', '€', 48.872, 2.3436, '7 Rue du Faubourg Montmartre', 'Salão belle époque de 1896 com cozinha francesa clássica a preços baixíssimos. Fila rápida.', 1],
  ['grand-vefour', 'Le Grand Véfour', '🍽️', 'Alta gastronomia', '€€€', 48.866, 2.3378, '17 Rue de Beaujolais', 'Restaurante do século XVIII nos jardins do Palais-Royal, frequentado por Napoleão e Victor Hugo.'],
  // Champs-Élysées · Torre Eiffel
  ['laduree', 'Ladurée Champs-Élysées', '🍬', 'Confeitaria', '€€', 48.8712, 2.303, '75 Av. des Champs-Élysées', 'A casa que popularizou o macaron moderno; a loja dos Champs-Élysées tem salão de chá.'],
  ['relais-entrecote', "Le Relais de l'Entrecôte", '🥩', 'Bistrô', '€€', 48.8688, 2.3022, '15 Rue Marbeuf', 'Só um prato: entrecôte com molho secreto e batata frita à vontade. Sem reservas.'],
  ['cafe-constant', 'Café Constant', '🍷', 'Bistrô', '€€', 48.858, 2.303, '139 Rue Saint-Dominique', 'Bistrô de bairro do chef Christian Constant, a 10 min da Torre Eiffel.'],
  ['cafe-marche', 'Café du Marché', '☕', 'Café', '€€', 48.8565, 2.3065, '38 Rue Cler', 'Café na Rue Cler, a rua-mercado do roteiro, com pratos do dia fartos.'],
  ['carette-troca', 'Carette Trocadéro', '🧁', 'Salão de chá', '€€', 48.863, 2.2875, '4 Place du Trocadéro', 'Salão de chá de 1927 colado à esplanada do Trocadéro; parada antes do brilho da Torre.'],
  // Montmartre · Pigalle
  ['bouillon-pigalle', 'Bouillon Pigalle', '🍲', 'Bouillon', '€', 48.8825, 2.3375, '22 Bd de Clichy', 'Bouillon moderno com clássicos franceses baratos, aberto até tarde, ao pé de Montmartre.'],
  ['consulat', 'Le Consulat', '🍷', 'Café', '€€', 48.8866, 2.3393, '18 Rue Norvins', 'Café de esquina pintado por Utrillo, no coração de Montmartre.'],
  ['maison-rose', 'La Maison Rose', '🌸', 'Restaurante', '€€', 48.8875, 2.3395, '2 Rue de l\'Abreuvoir', 'A casinha rosa mais fotografada de Paris, pintada por Utrillo; hoje serve cozinha simples.', 1],
  ['pain-idees', 'Du Pain et des Idées', '🥐', 'Padaria', '€', 48.871, 2.363, '34 Rue Yves Toudic', 'Padaria de 1889 perto do Canal Saint-Martin, famosa pelo "escargot" de pistache.'],
  // Versalhes
  ['angelina-versailles', 'Angelina (Palácio de Versalhes)', '🍫', 'Salão de chá', '€€', 48.8045, 2.121, 'Pavillon d\'Orléans, Château de Versailles', 'Filial do Angelina dentro do palácio: pausa para o chocolate quente entre os salões e os jardins.'],
];

const toPoi = (city: Poi['city']) => ([id, name, emoji, kind, price, lat, lng, addr, desc, iconic]: R): Poi => ({
  id: `food-${city.slice(0, 3).toLowerCase()}-${id}`,
  city,
  name,
  emoji,
  kind,
  rarity: iconic ? 'raro' : 'comum',
  lat,
  lng,
  story: desc,
  addr,
  price,
  food: true,
});

export const RESTAURANTS: Poi[] = [
  ...ROMA.map(toPoi('Roma')),
  ...LISBOA.map(toPoi('Lisboa')),
  ...VENEZA.map(toPoi('Veneza')),
  ...PARIS.map(toPoi('Paris')),
];
