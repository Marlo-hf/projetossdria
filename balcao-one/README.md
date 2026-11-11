# Balcão ONE (polionda): adesivo 187 x 86 cm

Arte feita sobre o gabarito `GABARITO_Balcão ONE_POLIONDA_V2` enviado pela gráfica.

## Arquivos para a gráfica (`arquivos-para-grafica/`)
| Arquivo | O que é |
|---|---|
| `BALCAO_ONE_187x86cm_sangria.pdf` | PDF vetorial, página com exatamente 187 x 86 cm (já com sangria), sem a faca |
| `BALCAO_ONE_187x86cm_100dpi.tif` | TIFF RGB com 100 DPI (7362 x 3386 px), sem a faca |
| `BALCAO_ONE_187x86cm_editavel.svg` | Mesma arte em vetor, para abrir no Illustrator ou no Figma |

`BALCAO_ONE_previa_com_faca_NAO_IMPRIMIR.png` mostra as dobras e as cotas. Serve só para conferência e não vai para a gráfica.

## Medidas
- Painéis do balcão: 16 | 36 | 80 | 36 | 16 cm, com 84 cm de altura. Sangria de 1,5 cm nas laterais e de 1 cm em cima e embaixo.
- **Logo: 40 x 46,8 cm**, centralizada no painel frontal de 80 cm. Ficam 20 cm livres de cada lado e 18,6 cm em cima e embaixo.
- Fundo: degradê azul-marinho e roxo, com fragmentos de letras no estilo da vinheta da marca. Nada importante fica sobre as dobras.

## Como regenerar
`fonte/gerar_arte.py` gera o SVG. Ele recebe a largura da logo em mm e a semente do padrão do fundo:
```
python3 fonte/gerar_arte.py 400 8 arte.svg
```
