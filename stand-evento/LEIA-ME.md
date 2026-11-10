# Stand Unlockify: arquivos para o evento

Arquivos pedidos pela organização do evento (Andressa) para produzir o balcão e o backdrop.

## O que mandar

Envie o **`unlockify-arquivos-stand.zip`**. Ele tem tudo o que foi pedido, com a marca **só com o nome**
("Unlockify / DIGITAL", sem o símbolo "Ui"), como combinado para o stand:

| Pedido | Arquivo no zip |
|---|---|
| Logo em alta, em vetor (PDF, AI ou EPS) | `logo/unlockify-nome-fundo-escuro.pdf` / `.eps` (texto branco, para balcão escuro) |
| | `logo/unlockify-nome-fundo-claro.pdf` / `.eps` (texto marinho, para balcão claro) |
| Arte do backdrop 2 x 2,50 m | `backdrop/backdrop-unlockify-200x250cm.pdf` (vetor, CMYK) |
| | `backdrop/backdrop-unlockify-200x250cm-100dpi.jpg` (imagem em tamanho real, caso a gráfica prefira) |
| Nome do representante | **precisa ser informado por você** |

Backdrop: "Unlockify / DIGITAL" no topo, chamada "Destrave o crescimento do seu escritório.", linha
"Tráfego pago, automação e IA para Direito Bancário", serviços com ícones e QR code do WhatsApp
(abre a conversa com "Olá! Vim pelo stand da Unlockify no evento."). Veja `backdrop/simulacao-stand.png`.

A pasta `logo/` também guarda as versões com o símbolo "Ui" (`unlockify-logo-*`, `unlockify-simbolo`), para outros usos.
Os PNG de 3000 px (fundo transparente) servem para redes sociais e apresentações, não para gráfica.

## Especificações

- **Medida do backdrop:** 2,00 m de largura x 2,50 m de altura (vertical), em tamanho real, sem sangria.
  Se for 2,50 m de largura x 2,00 m de altura, ou se a gráfica pedir sangria, é só ajustar `LARG`/`ALT` em `gerar.py`.
- **Posição do conteúdo:** todo o texto fica acima de ~1,10 m do chão, porque o balcão na frente do
  backdrop costuma cobrir a parte de baixo. Ali embaixo fica só o fundo (moldura em "U", brilho e piso em perspectiva).
- **QR code:** testado (lê no JPG e no PDF CMYK). Número e mensagem em `WHATSAPP` / `MSG_WHATSAPP` no `gerar.py`.
- **Vetor de verdade:** os textos estão convertidos em curvas (a gráfica não precisa da fonte Inter) e o
  traço do símbolo virou forma preenchida (não deforma se ampliarem no Illustrator).
- **Cor:** PDF e EPS estão em CMYK, com no máximo 280% de tinta (os brilhos usam transparência, PDF 1.4+). Lilás da marca ≈ C47 M50 Y0 K0.
  O fundo marinho usa um preto composto azulado (≈ C100 M75 Y1 K89 nas bordas), escolhido para
  continuar azul na impressão. A conversão automática para CMYK deixaria o fundo cinza.
- **Cores de tela (RGB):** lilás `#9084D8`, marinho `#161827`, branco `#FFFFFF`.
- **Fonte da marca:** Inter Bold ("Unlockify") e Inter Medium com espaçamento largo ("DIGITAL").

## Mensagem para a Andressa (pronta para colar)

> Oi, Andressa! Tudo certo, vamos participar. 🙌
>
> Seguem os arquivos no zip:
> • Logo em vetor (PDF e EPS): versão para fundo escuro e para fundo claro. Para o balcão, usem a que combinar com a cor dele.
> • Arte do backdrop em 2,00 m de largura x 2,50 m de altura, em PDF vetorial CMYK (vai também um JPG em tamanho real, caso a gráfica prefira).
> • Representante no stand: **[NOME]**
>
> Se a gráfica precisar de sangria ou de outra medida, me avisa que eu ajusto rapidinho.

## Como gerar de novo

```bash
pip install cairosvg fonttools uharfbuzz pypdf numpy pillow segno
```

```bash
python3 stand-evento/gerar.py
```

Precisa também do Ghostscript (`gs`) e da fonte Inter instalada (por padrão em
`/usr/share/fonts/opentype/inter`; outro lugar via a variável `INTER_DIR`).
