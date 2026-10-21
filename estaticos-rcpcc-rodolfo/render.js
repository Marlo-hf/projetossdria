const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const tpl = require('./template');
const pecas = {
  'rcpcc-10-cheque-especial': {
    headline: 'Dívida de R$&nbsp;48&nbsp;mil no cheque especial pode ser <em>REDUZIDA</em>.',
    valor: 'R$ 7.200', pct: '85,0%',
    alerta: '<b>Juro acima do teto que o Banco Central fixou para o cheque especial e tarifa de excesso cobrada todo mês.</b> A perícia do contrato aponta o que foi pago a mais.',
    cta: 'Quero a perícia do contrato',
  },
  'rcpcc-11-varios-bancos': {
    headline: 'Dívida de R$&nbsp;92&nbsp;mil em vários bancos pode ser <em>REDUZIDA</em>.',
    valor: 'R$ 13.500', pct: '85,3%',
    alerta: '<b>Cartão, cheque especial e empréstimo, cada um com juro sobre juro e tarifa cobrada de novo a cada renegociação.</b> A análise aponta o que foi pago a mais.',
    cta: 'Quero analisar minhas dívidas',
  },
  'rcpcc-12-venda-casada': {
    headline: 'Empréstimo de R$&nbsp;58&nbsp;mil com seguro pode ser <em>REDUZIDO</em>.',
    valor: 'R$ 8.100', pct: '86,0%',
    alerta: '<b>Seguro e título de capitalização empurrados junto com o empréstimo são venda casada.</b> A perícia aponta o que foi cobrado sem você pedir.',
    cta: 'Quero a perícia do contrato',
  },
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const [nome, dados] of Object.entries(pecas)) {
    const html = path.join(__dirname, nome + '.html');
    fs.writeFileSync(html, tpl(dados));
    await p.goto('file://' + html, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(__dirname, nome + '.png') });
  }
  await b.close();
})();
