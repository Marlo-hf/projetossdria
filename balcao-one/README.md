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
- **Logo: 34 x 39,8 cm**, com o nome **unlockify** embaixo, ocupando 52 cm de largura. A fonte é a Quicksand Bold e o texto já está convertido em curvas.
- O conjunto de logo e nome mede 52 x 57 cm e fica centralizado no painel frontal de 80 cm, com 14 cm livres de cada lado.
- Fundo: degradê roxo com fragmentos das letras do nome, no estilo da vinheta da marca. Nada importante fica sobre as dobras.

## Como regenerar
`fonte/gerar_arte.py` gera o SVG. Os tamanhos são em mm, e a fonte Quicksand (licença OFL) fica na mesma pasta:
```
cd fonte && python3 gerar_arte.py --logo-w 340 --nome unlockify --nome-w 520 --seed 8 --out arte.svg
```
