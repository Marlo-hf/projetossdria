# Gera o QR Code do WhatsApp do Marlon usado no verso do folder.
# Uso: python3 gerar-qr.py   (precisa de: pip install segno)
import segno, urllib.parse
NUMERO = "5534996535202"  # WhatsApp que o QR abre (DDI + DDD + número)
MSG = "Olá, Marlon! Vim pelo folder da Unlockify."
url = f"https://wa.me/{NUMERO}?text={urllib.parse.quote(MSG)}"
qr = segno.make(url, error="m")
qr.save("assets/qr-whatsapp.svg", scale=10, border=0, dark="#161826", light=None)
print(url, "| versão", qr.version)
