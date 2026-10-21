const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const tpl = require('./template');
const CTA = 'Toque em <em>Cadastre-se</em> e preencha ↓';
const pecas = {
  'rcpcc-juros-abusivos': {
    pre: 'Paga todo mês e a <b>dívida no banco</b>', palavra: 'NÃO DIMINUI?', pos: 'Pode ter <b>juro abusivo</b> no seu contrato.',
    bullets: ['Cartão e cheque especial viraram bola de neve?', 'Dá pra revisar o contrato e negociar!', 'Fale com um advogado especialista!'],
  },
  'rcpcc-venda-casada': {
    pre: 'Te empurraram <b>seguro</b> no empréstimo?', palavra: 'VENDA CASADA', pos: 'é <b>proibida</b> pelo Código do Consumidor.',
    bullets: ['Seguro ou capitalização que você não pediu?', 'Esses valores podem ser questionados!', 'Fale com um advogado especialista!'],
  },
  'rcpcc-cobranca': {
    pre: 'O banco não para de', palavra: 'TE COBRAR?', pos: 'Não aceite o <b>primeiro acordo</b> por telefone.',
    bullets: ['A parcela cai, mas o total explode!', 'Um advogado analisa e negocia por você!', 'Fale com um advogado especialista!'],
  },
};
(async () => {
  const b = await chromium.launch();
  for (const formato of ['feed', 'story']) {
    const p = await b.newPage({ viewport: { width: 1080, height: formato === 'story' ? 1920 : 1350 } });
    for (const [nome, d] of Object.entries(pecas)) {
      const html = path.join(__dirname, `${nome}-${formato}.html`);
      fs.writeFileSync(html, tpl({ ...d, formato, cta: CTA }));
      await p.goto('file://' + html, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      await p.screenshot({ path: html.replace('.html', '.png') });
    }
  }
  await b.close();
})();
