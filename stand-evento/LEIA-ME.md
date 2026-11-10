# Stand Unlockify: arquivos para o evento

Arquivos pedidos pela organização do evento (Andressa) para produzir o balcão e o backdrop.

## O que mandar

Envie o **`unlockify-arquivos-stand.zip`**. Ele já tem tudo o que foi pedido:

| Pedido | Arquivo |
|---|---|
| Logo em alta, em vetor (PDF, AI ou EPS) | `logo/unlockify-logo-fundo-escuro.pdf` / `.eps` (texto branco) |
| | `logo/unlockify-logo-fundo-claro.pdf` / `.eps` (texto marinho, para balcão claro) |
| | `logo/unlockify-simbolo.pdf` / `.eps` (só o símbolo "Ui") |
| | `logo/unlockify-logo-com-fundo.pdf` (igual ao post, com fundo escuro) |
| Arte do backdrop 2 x 2,50 m | `backdrop/backdrop-unlockify-200x250cm.pdf` (vetor, CMYK) |
| | `backdrop/backdrop-unlockify-200x250cm-100dpi.jpg` (imagem em tamanho real, caso a gráfica prefira) |
| Nome do representante | **precisa ser informado por você** |

Os PNG de 3000 px (fundo transparente) servem para redes sociais e apresentações, não para gráfica.

## Especificações

- **Medida do backdrop:** 2,00 m de largura x 2,50 m de altura (vertical), em tamanho real, sem sangria.
  Se for 2,50 m de largura x 2,00 m de altura, ou se a gráfica pedir sangria, é só ajustar `LARG`/`ALT` em `gerar.py`.
- **Posição do conteúdo:** logo, frase e site ficam todos acima de ~1,15 m do chão, porque o balcão
  na frente do backdrop costuma cobrir a parte de baixo. Veja `backdrop/previa-backdrop.png`.
- **Vetor de verdade:** os textos estão convertidos em curvas (a gráfica não precisa da fonte Inter) e o
  traço do símbolo virou forma preenchida (não deforma se ampliarem no Illustrator).
- **Cor:** PDF e EPS estão em CMYK, com no máximo 280% de tinta. Lilás da marca ≈ C47 M50 Y0 K0.
  O fundo marinho usa um preto composto azulado (≈ C100 M75 Y1 K89 nas bordas), escolhido para
  continuar azul na impressão. A conversão automática para CMYK deixaria o fundo cinza.
- **Cores de tela (RGB):** lilás `#9084D8`, marinho `#161827`, branco `#FFFFFF`.
- **Fonte da marca:** Inter Bold ("Unlockify") e Inter Medium com espaçamento largo ("DIGITAL").

## Mensagem para a Andressa (pronta para colar)

> Oi, Andressa! Tudo certo, vamos participar. 🙌
>
> Seguem os arquivos no zip:
> • Logo em vetor (PDF e EPS): versão para fundo escuro, para fundo claro e o símbolo sozinho. Para o balcão, usem a que combinar com a cor dele.
> • Arte do backdrop em 2,00 m de largura x 2,50 m de altura, em PDF vetorial CMYK (vai também um JPG em tamanho real, caso a gráfica prefira).
> • Representante no stand: **[NOME]**
>
> Se a gráfica precisar de sangria ou de outra medida, me avisa que eu ajusto rapidinho.

## Como gerar de novo

```bash
pip install cairosvg fonttools uharfbuzz pypdf numpy pillow
```

```bash
python3 stand-evento/gerar.py
```

Precisa também do Ghostscript (`gs`) e da fonte Inter instalada (por padrão em
`/usr/share/fonts/opentype/inter`; outro lugar via a variável `INTER_DIR`).
