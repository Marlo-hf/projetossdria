// Conteúdo dos 6 estáticos — Dr. Guilherme Andrade (Andrade Advocacia)
// Modelo visual: estático JMA do José Moura ("Até 360 dias de fôlego para o caixa").
// Para mudar a régua de dívida em todas as peças, altere REGUA.
// Na manchete, o trecho entre [colchetes] vira o destaque vermelho.

const REGUA = 'R$ 300 mil';

const marca = {
  monograma: 'GA',
  linha1: 'ANDRADE',
  linha2: 'ADVOCACIA',
};

// Linha curta logo abaixo do botão: qualifica o lead e reduz o atrito do formulário.
const micro = `Empresas com dívida bancária acima de ${REGUA} · responda em menos de 1 minuto`;

const pecas = [
  {
    id: '01-renegociacao',
    foto: '01-renegociacao.jpg',
    fotoPos: '50% 30%',
    kicker: 'Dívida bancária empresarial',
    manchete: 'O banco ofereceu renegociação? A parcela cai. [A dívida, não.]',
    sub: 'Renegociar não recalcula a dívida: só reparcela a mesma conta, com juros sobre o novo saldo.',
    titulo: 'Renegociação é prazo. Revisão é conta.',
    texto: 'Antes de assinar, vale abrir o contrato item por item. O que foi cobrado a mais pode ser discutido.',
    icones: [
      ['trending-down', 'Parcela<br>menor'],
      ['calendar-clock', 'Prazo<br>maior'],
      ['equal', 'Mesmo saldo<br>devedor'],
      ['percent', 'Juros sobre<br>o novo saldo'],
    ],
    rodape: 'Conteúdo informativo. O que cabe depende do que está escrito no seu contrato.',
    cta: 'Quero a análise do meu caso',
  },
  {
    id: '02-pronampe-aval',
    foto: '02-pronampe.jpg',
    fotoPos: '50% 40%',
    kicker: 'Pronampe em atraso',
    manchete: 'Atrasou o Pronampe? A cobrança pode sair do CNPJ e [chegar no seu CPF.]',
    sub: 'O Pronampe exige garantia pessoal do sócio. Quando a empresa atrasa, o aval que você assinou entra na conta.',
    titulo: 'Cada etapa da cobrança tem defesa.',
    texto: 'Quanto antes o contrato é analisado, mais caminhos costumam existir antes de a cobrança avançar.',
    icones: [
      ['file-warning', 'Protesto<br>do título'],
      ['user-x', 'Negativação<br>do avalista'],
      ['gavel', 'Execução<br>contra o sócio'],
      ['lock', 'Penhora de<br>bens pessoais'],
    ],
    rodape: 'Garantia pessoal do proponente prevista na Lei nº 13.999/2020 (Pronampe).',
    cta: 'Quero proteger meu CPF',
  },
  {
    id: '03-quatro-estagios',
    foto: '03-estagios.jpg',
    fotoPos: '50% 45%',
    kicker: `Dívida bancária acima de ${REGUA}`,
    manchete: 'Em qual destes [4 estágios] está a dívida da sua empresa?',
    sub: 'Cada estágio tem uma saída jurídica diferente e um prazo diferente para agir.',
    titulo: 'Quem está no 1 tem opções que quem está no 4 já não tem.',
    texto: 'Diga o seu estágio no formulário e receba a análise do seu caso.',
    numeros: true,
    icones: [
      ['1', 'Em dia, mas o<br>juro come o caixa'],
      ['2', 'Começou<br>a atrasar'],
      ['3', 'Negativou e<br>travou o crédito'],
      ['4', 'Chegou notificação<br>ou execução'],
    ],
    rodape: 'Conteúdo informativo. Cada caso exige análise individual.',
    cta: 'Responder o formulário',
  },
  {
    id: '04-divida-nao-cai',
    foto: '04-divida-nao-cai.jpg',
    fotoPos: '50% 40%',
    kicker: 'Capital de giro · Cheque especial · Cartão PJ',
    manchete: 'Sua empresa paga todo mês e a dívida [não diminui?]',
    sub: 'Isso costuma ter explicação, e ela está escrita no contrato que você assinou.',
    titulo: 'Juros e encargos mal aplicados podem ser contestados.',
    texto: 'A revisão do contrato mostra o que foi cobrado além do devido e permite rediscutir o saldo.',
    icones: [
      ['percent', 'Juros acima<br>do contratado'],
      ['repeat', 'Juros sobre<br>juros'],
      ['receipt', 'Tarifas que<br>ninguém combinou'],
      ['umbrella', 'Seguros<br>embutidos'],
    ],
    rodape: 'Conteúdo informativo. Cada caso exige análise individual do contrato.',
    cta: 'Quero revisar minha dívida',
  },
  {
    id: '05-banco-tem-advogado',
    foto: '05-banco-advogado.jpg',
    fotoPos: '50% 35%',
    kicker: 'Direito bancário empresarial',
    manchete: 'O banco tem um time de advogados. [E a sua empresa?]',
    sub: 'Capital de giro, Pronampe, cheque especial, cartão PJ: todos esses contratos foram escritos para proteger o banco.',
    titulo: 'Existe defesa para o devedor PJ.',
    texto: 'O banco só torce para você não usar. A análise mostra quais caminhos cabem no seu caso.',
    icones: [
      ['file-search', 'Revisão<br>do contrato'],
      ['scale', 'Tutela<br>de urgência'],
      ['handshake', 'Acordo<br>extrajudicial'],
      ['shield-check', 'Proteção<br>do caixa'],
    ],
    rodape: 'Caminhos previstos em lei. O que cabe depende de cada caso.',
    cta: 'Quero um advogado do meu lado',
  },
  {
    id: '06-antes-do-vencimento',
    foto: '06-vai-atrasar.jpg',
    fotoPos: '50% 30%',
    kicker: 'A parcela do banco vai atrasar?',
    manchete: 'O que você faz [antes do vencimento] muda o que o banco pode fazer depois.',
    sub: 'Depois do atraso, o contrato inteiro pode vencer de uma vez e a cobrança acelera.',
    titulo: 'Quem age cedo negocia de pé.',
    texto: 'Quem espera a execução negocia de joelhos. Antes do atraso ainda existe janela para agir.',
    icones: [
      ['calendar-x', 'Vencimento<br>antecipado'],
      ['ban', 'Negativação<br>do CNPJ'],
      ['lock', 'Bloqueio<br>de conta'],
      ['gavel', 'Execução<br>judicial'],
    ],
    rodape: 'Tutela de urgência prevista no art. 300 do Código de Processo Civil.',
    cta: 'Quero agir antes do atraso',
  },
];

module.exports = { REGUA, marca, micro, pecas };
