# Gera os QR Codes usados no verso do folder.
# Uso: python3 gerar-qr.py   (precisa de: pip install segno)
import segno, urllib.parse

# 1) WhatsApp do Marlon (DDI + DDD + número) com mensagem pronta
NUMERO = "5534996535202"
MSG = "Olá, Marlon! Vim pelo folder da Unlockify."
whats = f"https://wa.me/{NUMERO}?text={urllib.parse.quote(MSG)}"

# 2) Site da agência (a página institucional; a raiz do domínio abre outra página)
SITE = "https://unlockify.com.br/institucional/"

for nome, url in [("qr-whatsapp", whats), ("qr-site", SITE)]:
    qr = segno.make(url, error="m")
    qr.save(f"assets/{nome}.svg", scale=10, border=0, dark="#161826", light=None)
    print(nome, "→", url, "| versão", qr.version)
