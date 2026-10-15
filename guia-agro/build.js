// Gera guia.html (A4, 8 páginas) com ilustrações do agro no fundo.
const fs = require('fs');
const path = require('path');
const S = require('./scenes');

const GOLD = '#d8a845';
const DARK = '#10231a';

const logo = `<span class="logo"><svg viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="${GOLD}"/><path d="M7 18v-6a5 5 0 0 1 10 0v6z" fill="${DARK}"/></svg></span>`;

const footer = (n, light = false) =>
  `<div class="foot ${light ? 'light' : ''}"><span><b>UNLOCKIFY</b> · Tráfego pago para advocacia do agro</span><span>${n}</span></div>`;

// ---------- banda ilustrada no topo das páginas internas ----------
function band(scene, eyebrow, titleHtml, h = 92) {
  return `<header class="band" style="height:${h}mm">
    <div class="band-art">${scene}</div>
    <div class="band-shade"></div>
    <div class="band-txt"><div class="eyebrow">${eyebrow}</div><h2>${titleHtml}</h2></div>
  </header>`;
}

// faixa de paisagem discreta no rodapé das páginas claras
const groundStrip = (seed, extras = []) =>
  `<div class="ground">${S.landscape({
    w: 600, h: 120, horizon: 70, seed, topFade: 0, rowOp: 0.35,
    palette: { sky1: '#f7f2e6', sky2: '#f3ead2', sky3: '#ecdcb2', far: '#dfe3c8', mid: '#cfd8b8', near: '#c3cfa6', field1: '#dde3c6', field2: '#cfd9b4', rows: '#b9c597' },
    props: extras,
    wheat: { n: 34, min: 26, max: 62, s: 0.6 },
  })}</div>`;

// ---------- CAPA ----------
const cover = `
<section class="page cover">
  <div class="cover-art">${S.landscape({
    w: 600, h: 850, horizon: 560, sunX: 430, sunY: 540, sunR: 34, seed: 5, skyMid: 0.62, vx: 430,
    birds: [140, 380, 1.4],
    back: [S.silos(470, 562, 0.75, '#0f2016'), S.pivot(30, 566, 0.5, '#0f2016')],
    props: [S.combine(70, 690, 1.35, '#07120c')],
    wheat: { n: 70, min: 70, max: 190, s: 1.5 },
    topFade: 0.95,
  })}</div>
  <div class="cover-inner">
    <div class="brand">${logo}<span>UNLOCKIFY DIGITAL</span></div>
    <div class="pill">GUIA PRÁTICO · ADVOCACIA DO AGRONEGÓCIO</div>
    <h1>Tráfego pago para advocacia do <em>agro</em></h1>
    <p class="lead">Como fazer o produtor rural endividado encontrar o seu escritório — com lead qualificado, linguagem do campo e dentro das regras da OAB.</p>
    <div class="cover-tags"><span>🌾 Lead qualificado</span><span>🚜 Linguagem do campo</span><span>⚖️ Regras da OAB</span></div>
  </div>
  <div class="cover-foot">
    <div><b>Material gratuito</b><br>para advogados que atuam com crédito e dívida rural</div>
    <div class="r"><b>unlockify.com.br</b><br>Tráfego · Automação · IA para escritórios</div>
  </div>
</section>`;

// ---------- P2: O momento do agro ----------
const p2 = `
<section class="page">
  ${band(
    S.landscape({ w: 600, h: 263, horizon: 180, sunX: 120, sunY: 172, sunR: 22, seed: 9, vx: 120,
      back: [S.barn(470, 182, 0.7, '#0f2016')],
      props: [S.tractor(380, 252, 1.1, '#07120c')],
      wheat: { n: 40, min: 30, max: 80, s: 1 } }),
    '01 · O MOMENTO DO AGRO',
    'O produtor está endividado — <em>e procurando saída</em>'
  )}
  <div class="body">
    <p class="intro">Juros altos, quebra de safra, preço da saca abaixo do custo e vencimentos de custeio se acumulando. A demanda por advogado que entende de crédito rural nunca foi tão grande. A pergunta é: quando esse produtor pegar o celular, quem ele vai encontrar?</p>
    <div class="stats">
      <div class="stat-big">
        <div class="stat-art">${S.landscape({ w: 300, h: 300, horizon: 210, sunX: 230, sunY: 205, sunR: 16, seed: 21, vx: 230, topFade: 0.9, props: [S.silos(215, 212, 0.45, '#0a1710')], wheat: { n: 22, min: 20, max: 60, s: 0.8 } })}</div>
        <div class="num">628</div>
        <p>pedidos de recuperação judicial no agro só no 3º trimestre de 2025 — o maior número para o período desde 2021.</p>
        <div class="bar"><span style="width:100%"></span></div>
        <div class="bar small"><span style="width:40%"></span><i>254 no 3º tri de 2024</i></div>
      </div>
      <div class="stat-col">
        <div class="stat"><div class="num s">255</div><p>pedidos foram de <b>produtor rural pessoa física</b> — contra 106 um ano antes.</p></div>
        <div class="stat"><div class="num s">2,5×</div><p>o volume de pedidos em um ano. E a recuperação judicial é só a ponta: muito mais produtores estão renegociando, prorrogando ou alongando dívida.</p></div>
      </div>
    </div>
    <blockquote><b>O produtor rural está no Instagram, no Facebook e no WhatsApp — todo dia, depois da lida.</b> Escritório que depende só de indicação fica limitado à própria cidade e à própria rede de contatos. O tráfego pago coloca o seu escritório na frente do produtor certo, na região certa, na hora em que a dor aparece.</blockquote>
    <p class="src">Fonte: Serasa Experian, levantamento de recuperações judiciais no agronegócio, 3º trimestre de 2025 (divulgado em dez/2025).</p>
  </div>
  ${groundStrip(31)}
  ${footer(2)}
</section>`;

// ---------- P3: Nicho tem regras próprias ----------
const icon = {
  money: '<path d="M12 3v18M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 2.6 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  filter: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
};
const ic = (k) => `<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon[k]}</svg></span>`;
const card = (k, t, d, leafRot) =>
  `<div class="card"><svg class="card-leaf" viewBox="-60 -60 120 120">${S.soyLeaf(0, 10, 1.1, leafRot, '#3f6b3f', 0.12)}</svg>${ic(k)}<h3>${t}</h3><p>${d}</p></div>`;

const p3 = `
<section class="page">
  ${band(
    S.landscape({ w: 600, h: 240, horizon: 160, sunX: 500, sunY: 150, sunR: 20, seed: 14, vx: 500,
      props: [S.cow(70, 226, 0.9, '#07120c'), S.cow(170, 218, 0.75, '#07120c', true), S.cow(250, 208, 0.55, '#0a1710'), S.fence(600, 238, '#07120c', 44)],
      palette: { field1: '#2a4626', field2: '#11261a', rows: '#6d8f4a' }, rowOp: 0.12 }),
    '02 · O NICHO TEM REGRAS PRÓPRIAS',
    'Por que anunciar para o agro <em>não é igual</em> aos outros nichos', 84
  )}
  <div class="body">
    <p class="intro">A mesma campanha que funciona para golpe do Pix ou para dívida de consumidor não funciona para o produtor rural. O público é outro, o ticket é outro e o tempo de decisão é outro.</p>
    <div class="grid2">
      ${card('money', 'Ticket alto, público menor', 'Um único contrato de alongamento ou prorrogação pode valer o ano. Mas o público é restrito e regional — não dá para anunciar para “todo mundo do agro”.', -20)}
      ${card('user', 'Confiança vem antes do clique', 'O produtor é desconfiado e decide devagar, muitas vezes com a família. Ele precisa ver o rosto do advogado e ouvir uma linguagem simples, sem juridiquês.', 25)}
      ${card('cal', 'O calendário manda', 'Vencimento de custeio, fim de colheita, frustração de safra: a dor tem época. Campanha boa acompanha o calendário agrícola da sua região.', 10)}
      ${card('filter', 'Volume não é a meta', 'Lead barato que não tem dívida relevante só ocupa a sua agenda. No agro, o jogo é filtrar: menos contatos, muito mais qualificados.', -35)}
    </div>
    <div class="ratio">
      <div class="ratio-art">${S.landscape({ w: 600, h: 140, horizon: 70, sunX: 520, sunY: 66, sunR: 12, seed: 40, vx: 520, topFade: 0.6, wheat: { n: 50, min: 14, max: 34, s: 0.6 } })}</div>
      <div class="ratio-num">10 &gt; 200</div>
      <p>Dez produtores com dívida relevante e documentação em mãos valem mais do que duzentos curiosos querendo “saber como funciona”.</p>
    </div>
  </div>
  ${footer(3)}
</section>`;

// ---------- P4/P5: Método ----------
const step = (n, t, d, exLabel, ex) =>
  `<div class="step"><div class="step-n">${n}</div><div><h3>${t}</h3><p>${d}</p>${ex ? `<div class="ex"><span>${exLabel}</span>${ex}</div>` : ''}</div></div>`;

const p4 = `
<section class="page">
  ${band(
    S.landscape({ w: 600, h: 217, horizon: 150, sunX: 300, sunY: 142, sunR: 24, seed: 18, vx: 300,
      props: [S.combine(40, 208, 0.9, '#07120c'), S.tractor(470, 200, 0.7, '#0a1710')],
      wheat: { n: 30, min: 24, max: 60, s: 0.9 } }),
    '03 · O MÉTODO',
    '5 etapas para o tráfego trazer <em>contrato</em>, não curtida', 76
  )}
  <div class="body steps">
    ${step(1, 'Defina a régua do seu cliente ideal', 'Antes de gastar R$ 1, decida quem você quer atender: tipo de dívida (custeio, investimento, CPR, cédula rural), faixa mínima de valor, culturas e região. Essa régua orienta tudo: público, criativo e formulário.', 'EXEMPLO DE RÉGUA', 'Produtor rural com dívida bancária acima de R$ 1 milhão e frustração de safra nas duas últimas colheitas.')}
    ${step(2, 'Criativo que fala a língua do campo', 'Vídeo curto com o próprio advogado falando direto com o produtor, e estáticos com headline grande e uma ideia só. Abra com algo que o produtor já conhece, pergunte se aquilo resolve o problema dele e mostre o caminho. Nada de artigo de lei no anúncio.', 'EXEMPLO DE GANCHO', '“Todo mundo está falando da renegociação do governo. Mas ela resolve a dívida de quem perdeu a safra? Na maioria dos casos, não. Deixa eu te explicar o porquê.”')}
    ${step(3, 'Formulário que filtra antes de chegar em você', 'Use o formulário do próprio Meta com perguntas de qualificação: valor aproximado da dívida, banco, situação dos pagamentos, atividade. Quem não se encaixa na régua fica de fora — e o seu comercial só conversa com quem tem perfil.', 'NA PRÁTICA', 'Cada lead chega com o resumo do caso. Leads fora da régua viram base para conteúdo e remarketing, não para reunião.')}
  </div>
  ${footer(4)}
</section>`;

const funnel = [
  ['Anúncio para o público certo', 'vídeo + estático'],
  ['Formulário que filtra', 'régua de qualificação'],
  ['WhatsApp + CRM', 'resposta em minutos'],
  ['Reunião com o advogado', ''],
  ['Contrato', ''],
];

const p5 = `
<section class="page">
  ${band(
    S.landscape({ w: 600, h: 229, horizon: 150, sunX: 90, sunY: 142, sunR: 18, seed: 27, vx: 90,
      back: [S.pivot(150, 156, 0.8, '#0f2016')],
      props: [S.silos(420, 222, 1, '#07120c')],
      wheat: { n: 26, min: 24, max: 60, s: 0.9 } }),
    '03 · O MÉTODO (CONTINUAÇÃO)',
    'Do anúncio ao <em>contrato</em>', 80
  )}
  <div class="body steps">
    ${step(4, 'Responda em minutos, não em horas', 'Lead de anúncio esfria rápido: o produtor preencheu o formulário agora, mas daqui a duas horas já está no curral ou falou com outro escritório. Organize o atendimento com CRM e WhatsApp — e, se o volume justificar, uma IA de atendimento que responde na hora, faz as perguntas de qualificação e já agenda a reunião com o advogado.')}
    ${step(5, 'Meça o que paga as contas', 'Curtida e alcance não pagam boleto. Acompanhe <b>custo por lead qualificado, taxa de agendamento, reuniões realizadas e contratos fechados</b>. E dê tempo para a campanha aprender: decisões tomadas em dois dias costumam jogar fora o que estava começando a funcionar.')}
    <div class="eyebrow dark" style="margin-top:6mm">COMO O FUNIL FICA MONTADO</div>
    <div class="funnel">
      ${funnel.map(([a, b], i) => `<div class="f f${i}" style="width:${100 - i * 13}%"><b>${a}</b>${b ? `<small>${b}</small>` : ''}</div>`).join('')}
      <div class="funnel-grain">${Array.from({ length: 7 }, (_, i) => `<i style="left:${46 + (i % 3) * 3}%;top:${i * 9}px"></i>`).join('')}</div>
    </div>
  </div>
  ${groundStrip(44)}
  ${footer(5)}
</section>`;

// ---------- P6: Erros ----------
const err = (t, d, f) => `<div class="err"><div class="x">✕</div><h3>${t}</h3><p>${d} <b>Faça:</b> ${f}</p></div>`;
const p6 = `
<section class="page">
  ${band(
    S.landscape({ w: 600, h: 217, horizon: 150, seed: 33, vx: 330, skyMid: 0.5,
      palette: { sky1: '#141a17', sky2: '#3a3326', sky3: '#9b5a2a', field1: '#3a2f1c', field2: '#140f0a', rows: '#c07a3a', far: '#2c2a1f', mid: '#211f17', near: '#0d0b07' },
      sunX: 330, sunY: 152, sunR: 14,
      back: [`<g opacity=".5" fill="#0d0b07">${S.birds(470, 105, 1.4, '#0d0b07')}</g>`],
      props: [S.barn(80, 182, 0.8, '#0d0b07'), S.fence(600, 210, '#0d0b07', 52)],
      rowOp: 0.18 }),
    '04 · O QUE EVITAR',
    '6 erros que <em>queimam verba</em> no agro', 76
  )}
  <div class="body">
    <p class="intro">Quase toda campanha que “não deu certo” no agro tropeçou em pelo menos um destes pontos.</p>
    <div class="grid2 errs">
      ${err('Impulsionar post pelo botão do Instagram', 'O impulsionamento simples otimiza para alcance e curtida.', 'campanha no Gerenciador de Anúncios com objetivo de cadastro.')}
      ${err('Anunciar para “o agro” em geral', 'Público amplo demais traz estudante, curioso e quem não tem dívida.', 'régua clara e criativo que já filtra no texto.')}
      ${err('Juridiquês e citação de lei no anúncio', 'O produtor não para o dedo para ler artigo de lei.', 'fale da dor dele — safra perdida, banco cobrando, medo de perder a terra.')}
      ${err('Prometer resultado', '“Zere sua dívida”, “ganhe a ação” — além de vedado pela OAB, atrai o cliente errado.', 'explique direitos e caminhos possíveis.')}
      ${err('Demorar para responder o lead', 'Cada hora sem resposta derruba a chance de reunião.', 'alguém (ou uma IA) responsável por responder em minutos.')}
      ${err('Trocar tudo a cada dois dias', 'Mexer em verba, público e criativo o tempo todo zera o aprendizado.', 'ajustes graduais e leitura semanal das métricas.')}
    </div>
  </div>
  ${groundStrip(58, [S.fence(600, 112, '#b6c38f', 40)])}
  ${footer(6)}
</section>`;

// ---------- P7: OAB ----------
const scales = `<g transform="translate(530 192) scale(.8)" fill="#07120c" stroke="#07120c">
  <rect x="-3" y="-120" width="6" height="120"/><rect x="-26" y="-4" width="52" height="8" rx="2"/>
  <path d="M-60 -110 L60 -110" stroke-width="5"/><circle cx="0" cy="-122" r="7"/>
  <path d="M-60 -110 L-78 -66 M-60 -110 L-42 -66 M60 -110 L42 -66 M60 -110 L78 -66" stroke-width="1.6" fill="none"/>
  <path d="M-82 -66 Q-60 -44 -38 -66 Z"/><path d="M38 -66 Q60 -44 82 -66 Z"/></g>`;
const p7 = `
<section class="page">
  ${band(
    S.landscape({ w: 600, h: 200, horizon: 150, sunX: 530, sunY: 110, sunR: 26, seed: 52, vx: 530,
      props: [scales, S.wheatStalk(590, 200, 90, -16, 1.4, '#07120c'), S.wheatStalk(470, 200, 70, 14, 1.2, '#07120c')],
      wheat: { n: 24, min: 20, max: 50, s: 0.9 } }),
    '05 · ÉTICA E PUBLICIDADE',
    'Anunciar <em>dentro das regras</em> da OAB', 70
  )}
  <div class="body">
    <p class="intro">O Provimento 205/2021 do Conselho Federal da OAB permite o marketing jurídico e o impulsionamento pago de conteúdo, desde que a publicidade tenha caráter informativo e não vire mercantilização da advocacia.</p>
    <div class="grid2 rules">
      <div class="rule ok"><h3>Pode</h3><ul>
        <li>Conteúdo educativo sobre direitos do produtor rural endividado</li>
        <li>Anúncios pagos e impulsionamento de conteúdo informativo</li>
        <li>Mostrar o advogado, o escritório e as áreas de atuação</li>
        <li>Explicar caminhos possíveis: renegociação, prorrogação, alongamento</li>
        <li>Formulário para o produtor pedir contato e análise do caso</li></ul></div>
      <div class="rule no"><h3>Não pode</h3><ul>
        <li>Prometer resultado ou garantir êxito</li>
        <li>Divulgar valores de honorários, descontos ou gratuidade como chamariz</li>
        <li>Usar casos concretos de clientes para ofertar serviço</li>
        <li>Linguagem sensacionalista, apelativa ou de “oferta”</li>
        <li>Ostentação de bens ou informações que induzam a erro</li></ul></div>
    </div>
    <div class="test">
      <div class="test-art"><svg viewBox="0 0 600 120" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">${S.wheatField(600, 120, 77, '#d8a845', 40, 30, 90, 0.9)}</svg></div>
      <h3>O teste antes de publicar</h3>
      <p>Pergunte: “este anúncio informa o produtor sobre um direito ou está vendendo um resultado?” Se a resposta for a segunda, reescreva. Anúncio informativo, além de seguro, converte melhor com um público desconfiado como o do campo.</p>
    </div>
    <p class="src">Este material é um guia de marketing e não substitui a leitura do Provimento 205/2021 e do Código de Ética e Disciplina da OAB.</p>
  </div>
  ${groundStrip(71)}
  ${footer(7)}
</section>`;

// ---------- P8: Checklist + sobre ----------
const checks = [
  'Sei exatamente qual produtor quero atender (tipo de dívida, valor mínimo, região).',
  'Tenho vídeos curtos gravados por mim, falando a língua do produtor.',
  'Meu formulário filtra quem não tem o perfil antes de chegar no WhatsApp.',
  'Alguém (ou uma IA) responde o lead em minutos, inclusive à noite.',
  'Acompanho custo por lead qualificado, agendamentos e contratos — não curtidas.',
  'Meus anúncios passam no teste da OAB: informam, não prometem.',
];
const p8 = `
<section class="page last">
  <div class="body" style="padding-top:16mm">
    <div class="eyebrow dark">06 · CHECKLIST</div>
    <h2 class="h2dark">Seu escritório está <em>pronto</em> para anunciar?</h2>
    <svg class="check-leaf" viewBox="-80 -80 160 160">${S.soyLeaf(0, 30, 1.8, 15, '#3f6b3f', 0.13)}</svg>
    <ul class="checks">${checks.map((c) => `<li><span class="box"></span>${c}</li>`).join('')}</ul>
  </div>
  <div class="about">
    <div class="about-art">${S.landscape({ w: 600, h: 420, horizon: 250, sunX: 120, sunY: 245, sunR: 26, seed: 61, vx: 120, topFade: 0.97,
      back: [S.silos(430, 252, 0.7, '#0f2016')],
      props: [S.cow(330, 330, 0.8, '#07120c', true), S.cow(410, 322, 0.6, '#0a1710'), S.fence(600, 360, '#07120c', 40)],
      wheat: { n: 50, min: 30, max: 90, s: 1 } })}</div>
    <div class="about-shade"></div>
    <div class="about-txt">
      <div class="eyebrow">QUEM PREPAROU ESTE MATERIAL</div>
      <h2>Unlockify Digital — feita por advogado, para advogado</h2>
      <p>Somos uma agência especializada em tráfego pago, automação e inteligência artificial para escritórios de advocacia. O nosso fundador é advogado e atua na advocacia desde 2010 — por isso a gente entende o seu cliente, a sua rotina e os limites éticos da profissão. Hoje gerimos campanhas de cerca de 20 escritórios em todo o Brasil, inclusive no nicho de dívida rural.</p>
      <div class="chips"><span>Tráfego pago (Meta Ads)</span><span>Dívida rural e alongamento</span><span>Gestão de passivos</span><span>IA de atendimento no WhatsApp</span><span>Parceiro oficial Kommo</span></div>
      <div class="ctas">
        <a class="cta gold" href="https://wa.me/5534996535202"><small>FALE COM A GENTE</small>WhatsApp (34) 99653-5202</a>
        <a class="cta line" href="https://unlockify.com.br"><small>SITE</small>unlockify.com.br</a>
      </div>
    </div>
  </div>
</section>`;

const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Tráfego pago para advocacia do agro</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${css}</style></head><body>
${cover}${p2}${p3}${p4}${p5}${p6}${p7}${p8}
</body></html>`;
fs.writeFileSync(path.join(__dirname, 'guia.html'), html);
console.log('ok', html.length);
