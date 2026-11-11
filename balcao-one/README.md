# Balcão ONE (polionda): adesivo 187 x 86 cm

Arte feita sobre o gabarito `GABARITO_Balcão ONE_POLIONDA_V2` enviado pela gráfica. Há duas versões: uma com fundo branco e outra com fundo roxo. Nas duas aparece só a logo (o U, sem o i) com o nome **unlockify** embaixo.

## Arquivos para a gráfica (`arquivos-para-grafica/`)
| Pasta | Arquivos |
|---|---|
| `fundo-branco/` | `..._sangria.pdf` (vetor, 187 x 86 cm), `..._100dpi.tif` (7362 x 3386 px) e `..._editavel.svg` |
| `fundo-roxo/` | os mesmos três arquivos, com fundo em degradê roxo |

Nenhum arquivo traz a faca. As imagens `BALCAO_ONE_previa_fundo_*_NAO_IMPRIMIR.png` mostram as dobras e as cotas. Servem só para conferência e não vão para a gráfica.

## Medidas
- Painéis do balcão: 16 | 36 | 80 | 36 | 16 cm, com 84 cm de altura. Sangria de 1,5 cm nas laterais e de 1 cm em cima e embaixo.
- **Logo (U): 33,8 x 39,8 cm.**
- **Nome "unlockify": 52 cm de largura.** A fonte é a Quicksand Bold e o texto já está convertido em curvas.
- O conjunto de logo e nome mede 52 x 57 cm e fica centralizado no painel frontal de 80 cm, com 14 cm livres de cada lado.
- Cores: a logo usa um degradê lavanda, de #A89EF3 a #8579E2. No fundo branco o nome é roxo-escuro (#2E2170) e no fundo roxo é quase branco (#EEEBFF).

## Como regenerar
`fonte/gerar_arte.py` gera o SVG. Os tamanhos são em mm. Use `--fundo branco`, `--fundo roxo` ou `--fundo padrao` (roxo com os desenhos de letras):
```
python3 fonte/gerar_arte.py --fonte fonte/Quicksand-Bold.ttf --fundo roxo --sem-i --logo-w 338 --out arte.svg
```
