import asyncio, edge_tts, ssl, os, json, sys
import edge_tts.communicate as cm
cm._SSL_CTX=ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
TEXT=("Procurando um lote pronto pra construir? Então olha esse aqui, no Jardim Peluzzo. "
"São 300 metros quadrados, todo murado, com documentação regularizada, e aceita financiamento. "
"Fica pertinho do Batalhão e da UPA, num bairro em constante valorização. "
"Tudo isso por 265 mil reais. Chama a Remax Realizações e agende a sua visita!")
voice, rate, out = sys.argv[1], sys.argv[2], sys.argv[3]
async def main():
    c=edge_tts.Communicate(TEXT,voice,rate=rate,boundary="WordBoundary",proxy=os.environ.get("HTTPS_PROXY"))
    wb=[]
    with open(out+".mp3","wb") as f:
        async for ch in c.stream():
            if ch["type"]=="audio": f.write(ch["data"])
            elif ch["type"]=="WordBoundary": wb.append([round(ch["offset"]/1e7,3),round(ch["duration"]/1e7,3),ch["text"]])
    json.dump(wb,open(out+".json","w"),ensure_ascii=False)
    print(len(wb), wb)
asyncio.run(main())
