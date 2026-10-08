// Código do nó "Montar Mensagem" do workflow n8n {UNLOCKIFY} - Ouvidoria.
// Recebe o POST do site e monta o texto que vai pro grupo Unlockify Geral.
const NL = String.fromCharCode(10);
const b = ($input.first().json.body) || {};
const s = (v, max) => {
  const t = (v === undefined || v === null) ? "" : String(v).replace(/\s+$/g, "").trim();
  return max ? t.slice(0, max) : t;
};

const nome = s(b.nome, 120);
const empresa = s(b.empresa, 120);
const whatsapp = s(b.whatsapp, 30).replace(/[^0-9]/g, "");
const tipo = s(b.tipo).toLowerCase() === "elogio" ? "elogio" : "reclamacao";
const assunto = s(b.assunto, 80);
const mensagem = s(b.mensagem, 3000);
const notaNum = Math.max(0, Math.min(5, parseInt(b.nota, 10) || 0));
const armadilha = s(b.site_url); // honeypot: humano nunca preenche

const valido = !armadilha && nome.length >= 2 && mensagem.length >= 5;

const estrelas = notaNum ? ("★".repeat(notaNum) + "☆".repeat(5 - notaNum) + " (" + notaNum + "/5)") : "não informada";
const quando = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

const titulo = tipo === "elogio"
  ? "💜 *NOVO ELOGIO — Ouvidoria Unlockify*"
  : "🚨 *NOVA RECLAMAÇÃO — Ouvidoria Unlockify*";

const linhas = [
  titulo,
  "",
  "👤 *Cliente:* " + (nome || "-"),
];
if (empresa) linhas.push("🏢 *Empresa:* " + empresa);
if (whatsapp) linhas.push("📱 *WhatsApp:* " + whatsapp);
if (assunto) linhas.push("📂 *Assunto:* " + assunto);
linhas.push("⭐ *Nota:* " + estrelas);
linhas.push("");
linhas.push("💬 *Mensagem:*");
linhas.push(mensagem);
linhas.push("");
linhas.push("🕒 " + quando);
if (tipo === "reclamacao") {
  linhas.push("");
  linhas.push("_Alguém assume e responde o cliente hoje? Reaja com 👍 quando pegar._");
}

return [{ json: {
  valido: valido,
  tipo: tipo,
  nome: nome,
  grupo_jid: "120363425028018361@g.us",
  texto_grupo: linhas.join(NL)
} }];
