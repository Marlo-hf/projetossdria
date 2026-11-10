"""Gera os arquivos do stand: logo Unlockify em vetor e arte do backdrop.

Tudo é vetor, e os textos são convertidos em curvas, então a gráfica não
precisa ter a fonte instalada. Os PDFs e EPS saem em CMYK para impressão.

Uso:  python3 gerar.py
Precisa de: cairosvg, fonttools, uharfbuzz, pypdf, numpy, segno, Pillow, Ghostscript (gs)
e da fonte Inter (Inter-Bold, Inter-SemiBold, Inter-Medium).
"""
import itertools
import os
import shutil
import subprocess
import zipfile

import cairosvg
import numpy as np
import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageCms, ImageDraw, ImageFont
from pypdf import PdfWriter
from pypdf.generic import (ArrayObject, ContentStream, DictionaryObject, FloatObject,
                           NameObject)

AQUI = os.path.dirname(os.path.abspath(__file__))
FONTES = os.environ.get("INTER_DIR", "/usr/share/fonts/opentype/inter")

# ---------------------------------------------------------------- marca
ROXO = "#9084D8"      # símbolo e "DIGITAL"
BRANCO = "#FFFFFF"
MARINHO = "#161827"   # fundo
CINZA_SITE = "#AAA6CC"

# Degradê do fundo, medido no logo original (raio em px da arte de 1080 px).
BRILHO = [(0, "#2E2D4D"), (170, "#272842"), (250, "#23233B"), (300, "#1E2035"),
          (440, "#1B1C30"), (530, "#191A2C"), (760, "#151726")]

# Geometria do símbolo, no sistema de coordenadas da arte original (1080 px).
CX, CY = 540.0, 421.5     # centro do arco do "U"
R = 126.0                 # raio do arco (linha de centro)
HW = 29.75                # meia espessura do traço (traço = 59,5 px)
TOPO_ESQ = 245.0          # centro da ponta arredondada da haste esquerda
TOPO_DIR = 341.0          # centro da ponta arredondada da haste direita (o "i")
PINGO_Y, PINGO_R = 266.0, 33.0

# Caixa da assinatura completa (símbolo + Unlockify + DIGITAL) na arte original.
ASS_TOPO, ASS_BASE = 215.0, 869.0


# ---------------------------------------------------------------- texto em curvas
class Texto:
    """Converte texto em contorno SVG, com kerning e espaçamento entre letras."""

    _cache = {}

    def __init__(self, arquivo):
        if arquivo not in Texto._cache:
            caminho = os.path.join(FONTES, arquivo)
            face = hb.Face(hb.Blob.from_file_path(caminho))
            tt = TTFont(caminho)
            Texto._cache[arquivo] = (hb.Font(face), face.upem, tt.getGlyphSet(), tt.getGlyphOrder())
        self.font, self.upem, self.glyphs, self.ordem = Texto._cache[arquivo]

    def contorno(self, texto, tam, x, base, track=0.0, ancora="meio"):
        """Devolve (d, caixa). `track` em em, aplicado só entre letras.
        A âncora usa a tinta real das letras, não a largura de avanço."""
        buf = hb.Buffer()
        buf.add_str(texto)
        buf.guess_segment_properties()
        hb.shape(self.font, buf, {"kern": True, "liga": True})
        k = tam / self.upem
        itens, cx = [], 0.0
        x0 = x1 = None
        for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
            nome = self.ordem[info.codepoint]
            bp = BoundsPen(self.glyphs)
            self.glyphs[nome].draw(bp)
            gx = cx + pos.x_offset
            if bp.bounds:
                a, b = gx + bp.bounds[0], gx + bp.bounds[2]
                x0 = a if x0 is None else min(x0, a)
                x1 = b if x1 is None else max(x1, b)
            itens.append((nome, gx, pos.y_offset))
            cx += pos.x_advance + (track * self.upem if i < len(buf.glyph_infos) - 1 else 0)
        largura = (x1 - x0) * k
        if ancora == "meio":
            inicio = x - largura / 2 - x0 * k
        elif ancora == "inicio":
            inicio = x - x0 * k
        else:
            inicio = x - largura - x0 * k
        pen = SVGPathPen(self.glyphs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
        for nome, gx, gy in itens:
            tp = TransformPen(pen, (k, 0, 0, -k, inicio + gx * k, base - gy * k))
            self.glyphs[nome].draw(tp)
        esq = inicio + x0 * k
        return pen.getCommands(), (esq, esq + largura)


# ---------------------------------------------------------------- peças
def simbolo_d():
    """Símbolo "Ui" como forma preenchida (traço já expandido em contorno)."""
    e, d = CX - R, CX + R
    ro, ri = R + HW, R - HW
    return (
        f"M{e - HW},{TOPO_ESQ} L{e - HW},{CY} "
        f"A{ro},{ro} 0 0 0 {d + HW},{CY} "
        f"L{d + HW},{TOPO_DIR} A{HW},{HW} 0 0 0 {d - HW},{TOPO_DIR} "
        f"L{d - HW},{CY} A{ri},{ri} 0 0 1 {e + HW},{CY} "
        f"L{e + HW},{TOPO_ESQ} A{HW},{HW} 0 0 0 {e - HW},{TOPO_ESQ} Z "
        f"M{d - PINGO_R},{PINGO_Y} A{PINGO_R},{PINGO_R} 0 1 0 {d + PINGO_R},{PINGO_Y} "
        f"A{PINGO_R},{PINGO_R} 0 1 0 {d - PINGO_R},{PINGO_Y} Z"
    )


NOME_MARCA = "Unlockfy"  # grafia pedida para o stand (sem o "i" de Unlockify)


def assinatura(cor_nome=BRANCO, cor_marca=ROXO, so_simbolo=False, so_nome=False):
    """Assinatura vertical nas coordenadas da arte original (1080 px).
    so_nome: só "Unlockify / DIGITAL", sem o símbolo "Ui"."""
    partes = [] if so_nome else [f'<path fill="{cor_marca}" d="{simbolo_d()}"/>']
    if not so_simbolo:
        nome, _ = Texto("Inter-Bold.otf").contorno(NOME_MARCA, 107.6, CX, 787.0)
        digital, _ = Texto("Inter-Medium.otf").contorno("DIGITAL", 45.4, CX, 869.0, track=0.49)
        partes.append(f'<path fill="{cor_nome}" d="{nome}"/>')
        partes.append(f'<path fill="{cor_marca}" d="{digital}"/>')
    return "\n".join(partes)


NOME_TOPO = 704.0  # topo das ascendentes do nome na arte original


def caixa_assinatura(so_simbolo=False, so_nome=False):
    if so_nome:
        esq, dir_ = Texto("Inter-Bold.otf").contorno(NOME_MARCA, 107.6, CX, 787.0)[1]
        return (min(esq, 389.0), NOME_TOPO, max(dir_, 691.0), ASS_BASE)  # 389-691: "DIGITAL"
    if so_simbolo:
        return (CX - R - HW, TOPO_ESQ - HW, CX + R + PINGO_R, CY + R + HW)
    esq, dir_ = Texto("Inter-Bold.otf").contorno(NOME_MARCA, 107.6, CX, 787.0)[1]
    return (min(esq, CX - R - HW), ASS_TOPO, max(dir_, CX + R + PINGO_R), ASS_BASE)


def degrade(id_, cx, cy, escala):
    stops = "".join(
        f'<stop offset="{r / BRILHO[-1][0]:.4f}" stop-color="{c}"/>' for r, c in BRILHO)
    return (f'<radialGradient id="{id_}" gradientUnits="userSpaceOnUse" cx="{cx:.2f}" '
            f'cy="{cy:.2f}" r="{BRILHO[-1][0] * escala:.2f}">{stops}</radialGradient>')


def cor_no_fundo(dist):
    """Cor do degradê a uma distância do centro (mesma escala de BRILHO)."""
    def rgb(h):
        return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    for (r0, c0), (r1, c1) in zip(BRILHO, BRILHO[1:]):
        if dist <= r1:
            t = (dist - r0) / (r1 - r0)
            a, b = rgb(c0), rgb(c1)
            return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))
    return rgb(BRILHO[-1][1])


def pontilhado(largura, altura, passo, raio, cx, cy, escala, alfa=0.07):
    """Grade de pontos discreta. A cor de cada ponto já vem misturada com o
    fundo (branco a 7%), para não depender de transparência na impressão."""
    grupos = {}
    nx, ny = int(largura // passo) + 1, int(altura // passo) + 1
    ox = (largura - (nx - 1) * passo) / 2
    oy = (altura - (ny - 1) * passo) / 2
    for j in range(ny):
        for i in range(nx):
            x, y = ox + i * passo, oy + j * passo
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / escala
            base = cor_no_fundo(dist)
            mistura = tuple(round(c + (255 - c) * alfa) for c in base)
            cor = "#%02X%02X%02X" % mistura
            if cor not in grupos:
                fixar_cmyk_ponto(mistura, dist)
            grupos.setdefault(cor, []).append(
                f"M{x - raio:.2f},{y:.2f}a{raio},{raio} 0 1 0 {2 * raio},0a{raio},{raio} 0 1 0 {-2 * raio},0z")
    return "\n".join(f'<path fill="{c}" d="{"".join(ps)}"/>' for c, ps in sorted(grupos.items()))


def svg(largura, altura, unidade, corpo, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{largura}{unidade}" '
            f'height="{altura}{unidade}" viewBox="0 0 {largura} {altura}">'
            f"<defs>{defs}</defs>\n{corpo}\n</svg>\n")


# ---------------------------------------------------------------- conversões
def gs(*args):
    subprocess.run(["gs", "-q", "-dNOPAUSE", "-dBATCH", "-dSAFER", *args], check=True)


PERFIL_CMYK = os.environ.get("PERFIL_CMYK", "/usr/share/color/icc/ghostscript/default_cmyk.icc")
TINTA_MAX = 280  # soma máxima de C+M+Y+K, em %, segura para lona e tecido
_CMYK_sRGB = ImageCms.buildTransform(PERFIL_CMYK, ImageCms.createProfile("sRGB"), "CMYK", "RGB",
                                     renderingIntent=ImageCms.Intent.RELATIVE_COLORIMETRIC)
_cache_cmyk = {}
_grade = None


def _lab(rgb):
    """sRGB 0-255 -> CIELAB (D65)."""
    c = np.asarray(rgb, float).reshape(-1, 3) / 255
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ m.T / np.array([0.95047, 1, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.column_stack([116 * f[:, 1] - 16, 500 * (f[:, 0] - f[:, 1]), 200 * (f[:, 1] - f[:, 2])])


def _simular(cmyks):
    """Como cada combinação CMYK (0-100) aparece, segundo o perfil, em Lab."""
    a = np.round(np.asarray(cmyks, float) * 2.55).astype(np.uint8)
    n, larg = len(a), 1024
    alt = -(-n // larg)
    buf = np.zeros((alt * larg, 4), np.uint8)
    buf[:n] = a
    rgb = np.array(ImageCms.applyTransform(Image.fromarray(buf.reshape(alt, larg, 4), "CMYK"), _CMYK_sRGB))
    return _lab(rgb.reshape(-1, 3)[:n])


def _de94(alvo, labs):
    dl = labs[:, 0] - alvo[0]
    c1, c2 = np.hypot(*alvo[1:]), np.hypot(labs[:, 1], labs[:, 2])
    dc = c2 - c1
    dh2 = np.maximum((labs[:, 1] - alvo[1]) ** 2 + (labs[:, 2] - alvo[2]) ** 2 - dc ** 2, 0)
    return np.sqrt(dl ** 2 + (dc / (1 + 0.045 * c1)) ** 2 + dh2 / (1 + 0.015 * c1) ** 2)


def cmyk(r, g, b):
    """RGB 0-1 -> CMYK 0-1.

    Procura a combinação CMYK (com no máximo TINTA_MAX de tinta) que, pelo
    perfil, fica mais perto da cor da tela (ΔE94, que preserva a luminosidade).
    A conversão automática do perfil deixa o fundo marinho acinzentado; assim
    o fundo continua azul-arroxeado na impressão."""
    global _grade
    chave = tuple(round(float(v) * 255) for v in (r, g, b))
    if chave in _cache_cmyk:
        return _cache_cmyk[chave]
    if chave == (255, 255, 255):
        _cache_cmyk[chave] = (0.0, 0.0, 0.0, 0.0)
        return _cache_cmyk[chave]
    if _grade is None:
        passos = range(0, 101, 4)
        g4 = np.array([c for c in itertools.product(passos, repeat=4) if sum(c) <= TINTA_MAX], float)
        _grade = (g4, _simular(g4))
    alvo = _lab([chave])[0]
    g4, labs = _grade
    melhor = g4[_de94(alvo, labs).argmin()]
    # refina de 1 em 1 % em volta do melhor ponto da grade grossa
    viz = np.array(list(itertools.product(range(-3, 4), repeat=4)), float) + melhor
    viz = viz[(viz.min(1) >= 0) & (viz.max(1) <= 100) & (viz.sum(1) <= TINTA_MAX)]
    melhor = viz[_de94(alvo, _simular(viz)).argmin()]
    _cache_cmyk[chave] = tuple(round(v / 100, 2) for v in melhor)
    return _cache_cmyk[chave]


def cmyk_fundo(dist):
    """CMYK do degradê a uma distância do centro, interpolado como o PDF faz."""
    stops = [(r, cmyk(*(int(c[i:i + 2], 16) / 255 for i in (1, 3, 5)))) for r, c in BRILHO]
    for (r0, c0), (r1, c1) in zip(stops, stops[1:]):
        if dist <= r1:
            t = (dist - r0) / (r1 - r0)
            return np.array([a + (b - a) * t for a, b in zip(c0, c1)])
    return np.array(stops[-1][1])


def fixar_cmyk_ponto(rgb_ponto, dist):
    """Os pontos do fundo usam a mesma receita CMYK do degradê embaixo deles,
    só com menos preto (K). Assim eles não mudam de tom na gráfica."""
    chave = tuple(rgb_ponto)
    if chave in _cache_cmyk or chave in {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for _, c in BRILHO}:
        return
    base = cmyk_fundo(dist) * 100
    cands = np.array([[*base[:3], max(base[3] - d, 0)] for d in range(0, 41)])
    alvo = _lab([rgb_ponto])[0]
    melhor = cands[_de94(alvo, _simular(cands)).argmin()]
    _cache_cmyk[chave] = tuple(round(v / 100, 2) for v in melhor)


def _num(v):
    return FloatObject(round(v, 4))


def _funcao_cmyk(f):
    f = f.get_object()
    tipo = f["/FunctionType"]
    if tipo == 2:
        if len(f["/C0"]) == 4:  # mesma função usada por outro degradê: já convertida
            return
        for chave in ("/C0", "/C1"):
            f[NameObject(chave)] = ArrayObject(_num(v) for v in cmyk(*f[chave]))
        if "/Range" in f:
            f[NameObject("/Range")] = ArrayObject(_num(v) for v in (0, 1) * 4)
    elif tipo == 3:
        for sub in f["/Functions"]:
            _funcao_cmyk(sub)
    else:
        raise ValueError(f"função de degradê tipo {tipo} não suportada")


def _recursos_cmyk(res, leitor):
    if res is None:
        return
    res = res.get_object()
    for sh in (res.get("/Shading") or {}).values():
        sh = sh.get_object()
        if sh["/ColorSpace"] == "/DeviceRGB":
            sh[NameObject("/ColorSpace")] = NameObject("/DeviceCMYK")
            _funcao_cmyk(sh["/Function"])
    for pat in (res.get("/Pattern") or {}).values():
        pat = pat.get_object()
        if "/Shading" in pat:
            _recursos_cmyk(DictionaryObject({NameObject("/Shading"): DictionaryObject(
                {NameObject("/s"): pat["/Shading"]})}), leitor)
        if "/Resources" in pat:
            _recursos_cmyk(pat["/Resources"], leitor)
            _conteudo_cmyk(pat, leitor)
    for xo in (res.get("/XObject") or {}).values():
        xo = xo.get_object()
        if xo.get("/Subtype") == "/Image":
            raise ValueError("PDF tem imagem rasterizada; esperava só vetor")
        if xo.get("/Subtype") == "/Form":
            _grupo_cmyk(xo)
            _recursos_cmyk(xo.get("/Resources"), leitor)
            _conteudo_cmyk(xo, leitor)
    # As máscaras de transparência (/SMask em /ExtGState) ficam em tons de cinza
    # de propósito: elas só dizem "quanto aparece", não têm cor.


def _grupo_cmyk(obj):
    """Grupo de transparência passa a misturar as cores em CMYK."""
    grupo = obj.get("/Group")
    if grupo is not None:
        grupo = grupo.get_object()
        if grupo.get("/CS") == "/DeviceRGB":
            grupo[NameObject("/CS")] = NameObject("/DeviceCMYK")


def _ops_cmyk(cs):
    for i, (args, op) in enumerate(cs.operations):
        if op in (b"rg", b"RG"):
            novo = b"k" if op == b"rg" else b"K"
            cs.operations[i] = ([_num(v) for v in cmyk(*args)], novo)
        elif op in (b"cs", b"CS", b"sc", b"SC", b"scn", b"SCN", b"g", b"G"):
            if op in (b"g", b"G") and float(args[0]) in (0.0, 1.0):
                continue
            if args and args[0] == "/Pattern":
                continue
            if op in (b"scn", b"SCN") and len(args) == 1 and isinstance(args[0], NameObject):
                continue  # pinta com um degradê (/Pattern), convertido nos recursos
            raise ValueError(f"operador de cor não tratado: {op}")
    return cs


def _conteudo_cmyk(stream_obj, leitor):
    cs = _ops_cmyk(ContentStream(stream_obj, leitor))
    stream_obj.set_data(cs.get_data())


def pdf_para_cmyk(entrada, saida):
    """Troca todas as cores RGB do PDF do Cairo por CMYK, mantendo os degradês
    em vetor (o Ghostscript transformaria o degradê em imagem)."""
    w = PdfWriter(clone_from=entrada)
    for pag in w.pages:
        _grupo_cmyk(pag)
        _recursos_cmyk(pag.get("/Resources"), w)
        cs = _ops_cmyk(ContentStream(pag.get_contents(), w))
        pag.replace_contents(cs)
    w.add_metadata({"/Title": os.path.basename(saida), "/Creator": "Unlockify / gerar.py"})
    with open(saida, "wb") as f:
        w.write(f)


def exportar(svg_txt, destino, png_largura=None, eps=True):
    """SVG (RGB, para tela) + PDF CMYK + EPS CMYK (+ PNG opcional)."""
    with open(destino + ".svg", "w") as f:
        f.write(svg_txt)
    rgb = destino + ".rgb.pdf"
    cairosvg.svg2pdf(bytestring=svg_txt.encode(), write_to=rgb)
    pdf_para_cmyk(rgb, destino + ".pdf")
    if eps:
        gs("-sDEVICE=eps2write", f"-sOutputFile={destino}.eps", destino + ".pdf")
    if png_largura:
        cairosvg.svg2png(bytestring=svg_txt.encode(), write_to=destino + ".png",
                         output_width=png_largura)
    return rgb


# ---------------------------------------------------------------- logos
def logos(pasta):
    os.makedirs(pasta, exist_ok=True)
    largura_mm = 300.0  # tamanho da prancheta; é vetor, amplia sem perder qualidade
    variantes = {
        "unlockify-logo-fundo-escuro": dict(cor_nome=BRANCO),
        "unlockify-logo-fundo-claro": dict(cor_nome=MARINHO),
        "unlockify-simbolo": dict(so_simbolo=True),
        "unlockify-nome-fundo-escuro": dict(cor_nome=BRANCO, so_nome=True),
        "unlockify-nome-fundo-claro": dict(cor_nome=MARINHO, so_nome=True),
    }
    for nome, kw in variantes.items():
        x0, y0, x1, y1 = caixa_assinatura(kw.get("so_simbolo", False), kw.get("so_nome", False))
        m = 0.08 * (x1 - x0)
        w, h = x1 - x0 + 2 * m, y1 - y0 + 2 * m
        esc = largura_mm / w
        corpo = (f'<g transform="scale({esc:.6f}) translate({m - x0:.3f},{m - y0:.3f})">'
                 f"{assinatura(**kw)}</g>")
        rgb = exportar(svg(round(largura_mm, 2), round(h * esc, 2), "mm", corpo), os.path.join(pasta, nome), 3000)
        os.remove(rgb)

    # versão com fundo, igual à arte original (quadrada)
    lado = 1080
    corpo = (f'<rect width="{lado}" height="{lado}" fill="url(#g)"/>'
             + pontilhado(lado, lado, 27, 1.5, CX, 400, 1.0)
             + assinatura())
    esc = 300.0 / lado
    corpo = f'<g transform="scale({esc:.6f})">{corpo}</g>'
    defs = degrade("g", CX, 400, 1.0)  # coordenadas do retângulo, que está dentro do grupo
    rgb = exportar(svg(300, 300, "mm", corpo, defs), os.path.join(pasta, "unlockify-logo-com-fundo"), 3000,
                   eps=False)  # o EPS viraria imagem no degradê; fica só o PDF
    os.remove(rgb)


# ---------------------------------------------------------------- backdrop
LARG, ALT = 2000.0, 2500.0   # mm: 2,00 m de largura x 2,50 m de altura
ALTURA_BALCAO = 1100.0       # mm a partir do chão: o que fica abaixo disso o balcão tende a cobrir
LILAS_CLARO = "#C9C2FF"
CINZA_TEXTO = "#C5C1E4"
WHATSAPP = "5534996535202"
MSG_WHATSAPP = "Olá! Vim pelo stand da Unlockfy no evento."


def u_linha(cx, cy, r, y_esq, y_dir):
    """Linha central de um "U" como o do logo: haste direita mais curta."""
    return f"M{cx - r},{y_esq} L{cx - r},{cy} A{r},{r} 0 0 0 {cx + r},{cy} L{cx + r},{y_dir}"


def qr_path(dado, x, y, lado):
    """QR code como um único path (módulos escuros), dentro de um quadrado."""
    import segno
    qr = segno.make(dado, error="m")
    linhas = [list(r) for r in qr.matrix]
    n = len(linhas)
    m = lado / n  # coordenadas em módulos inteiros quando lado == n
    partes = []
    for j, linha in enumerate(linhas):
        i = 0
        while i < n:
            if linha[i]:
                k = i
                while k < n and linha[k]:
                    k += 1
                partes.append(f"M{x + i * m:g},{y + j * m:g}h{(k - i) * m:g}v{m:g}h{-(k - i) * m:g}z")
                i = k
            else:
                i += 1
    return "".join(partes), n


ICONES = {
    # desenhados numa caixa de 100 x 100 centrada em (0, 0), em traço
    "grafico": '<path d="M-36,24 L-12,0 L6,16 L34,-14"/><path d="M14,-15 L35,-15 L35,6"/>'
               '<path d="M-38,40 L38,40"/>',
    "chat": '<path d="M-30,-34 H30 A12,12 0 0 1 42,-22 V14 A12,12 0 0 1 30,26 H-6 L-26,42 V26 H-30 '
            'A12,12 0 0 1 -42,14 V-22 A12,12 0 0 1 -30,-34 Z"/>'
            '<path stroke="none" fill="currentColor" d="M0,-24 C2,-12 6,-8 18,-5 C6,-2 2,2 0,14 '
            'C-2,2 -6,-2 -18,-5 C-6,-8 -2,-12 0,-24 Z"/>',
    "fluxo": '<circle cx="-26" cy="-22" r="12"/><circle cx="26" cy="-22" r="12"/><circle cx="0" cy="26" r="12"/>'
             '<path d="M-14,-22 H14"/><path d="M-20,-11 L-6,15"/><path d="M20,-11 L6,15"/>',
}


def icone(nome, cx, cy, tam, cor):
    k = tam / 100
    return (f'<g transform="translate({cx:.2f},{cy:.2f}) scale({k:.4f})" fill="none" stroke="{cor}" '
            f'color="{cor}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">'
            f"{ICONES[nome].replace('currentColor', cor)}</g>")


def fundo_backdrop():
    """Fundo comum às duas opções: degradê, brilhos, pontos, piso em perspectiva
    e a moldura gigante em "U" (a alça do cadeado aberto do logo)."""
    defs = f"""
<linearGradient id="base" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="{ALT}">
  <stop offset="0" stop-color="#1A1B3A"/><stop offset="0.55" stop-color="#121329"/><stop offset="1" stop-color="#0C0D20"/></linearGradient>
<radialGradient id="brilhoTopo" gradientUnits="userSpaceOnUse" cx="1000" cy="380" r="900">
  <stop offset="0" stop-color="#8E80FF" stop-opacity="0.55"/><stop offset="0.45" stop-color="#7466E8" stop-opacity="0.22"/>
  <stop offset="1" stop-color="#5E50D8" stop-opacity="0"/></radialGradient>
<radialGradient id="brilhoMeio" gradientUnits="userSpaceOnUse" cx="1000" cy="900" r="1000"
  gradientTransform="translate(0 900) scale(1 0.5) translate(0 -900)">
  <stop offset="0" stop-color="#6F61F0" stop-opacity="0.30"/><stop offset="1" stop-color="#6F61F0" stop-opacity="0"/></radialGradient>
<radialGradient id="brilhoBase" gradientUnits="userSpaceOnUse" cx="1000" cy="2050" r="1250"
  gradientTransform="translate(0 2050) scale(1 0.55) translate(0 -2050)">
  <stop offset="0" stop-color="#9A8CFF" stop-opacity="0.70"/><stop offset="0.35" stop-color="#7466E8" stop-opacity="0.35"/>
  <stop offset="1" stop-color="#5E50D8" stop-opacity="0"/></radialGradient>
<linearGradient id="linhaU" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="{ALT}">
  <stop offset="0" stop-color="{LILAS_CLARO}" stop-opacity="0.05"/><stop offset="0.45" stop-color="{LILAS_CLARO}" stop-opacity="0.55"/>
  <stop offset="1" stop-color="{LILAS_CLARO}" stop-opacity="1"/></linearGradient>
<linearGradient id="piso" gradientUnits="userSpaceOnUse" x1="0" y1="1700" x2="0" y2="{ALT}">
  <stop offset="0" stop-color="#A79BFF" stop-opacity="0"/><stop offset="1" stop-color="#A79BFF" stop-opacity="0.45"/></linearGradient>
<clipPath id="dentroU"><path d="{u_linha(1000, 1500, 800, -10, -10)} Z"/></clipPath>
"""
    # piso em perspectiva (parte de baixo, atrás do balcão; dá profundidade)
    fuga_x, fuga_y, y0 = 1000, 1350, 1720
    linhas = [f"M{fuga_x + (x - fuga_x) * (y0 - fuga_y) / (ALT + 400 - fuga_y):.1f},{y0} L{x},{ALT + 400}"
              for x in range(-2600, 4601, 240)]
    y, passo = y0, 30.0
    while y < ALT:
        linhas.append(f"M0,{y:.1f} H{LARG}")
        passo *= 1.32
        y += passo
    piso = (f'<g clip-path="url(#dentroU)"><path d="{" ".join(linhas)}" fill="none" '
            f'stroke="url(#piso)" stroke-width="3"/></g>')

    # pontos discretos
    pontos = []
    for j in range(int(ALT // 40) + 1):
        for i in range(int(LARG // 40) + 1):
            x, yy = 20 + i * 40, 20 + j * 40
            pontos.append(f"M{x - 2},{yy}a2,2 0 1 0 4,0a2,2 0 1 0 -4,0z")
    pontos = f'<path fill="#FFFFFF" fill-opacity="0.06" d="{"".join(pontos)}"/>'

    # moldura: três "U" concêntricos; o de dentro tem o pingo do "i" do símbolo
    cy = 1500
    moldura = "".join([
        f'<path d="{u_linha(1000, cy, 920, -10, 380)}" fill="none" stroke="url(#linhaU)" stroke-width="3" stroke-opacity="0.45"/>',
        f'<path d="{u_linha(1000, cy, 860, -10, 470)}" fill="none" stroke="url(#linhaU)" stroke-width="5" stroke-opacity="0.7"/>',
        f'<path d="{u_linha(1000, cy, 800, -10, 560)}" fill="none" stroke="url(#linhaU)" stroke-width="10" stroke-linecap="round"/>',
        f'<circle cx="1800" cy="478" r="26" fill="{LILAS_CLARO}" fill-opacity="0.75"/>',  # pingo do "i"
    ])
    corpo = "\n".join([
        f'<rect width="{LARG}" height="{ALT}" fill="url(#base)"/>',
        f'<rect width="{LARG}" height="{ALT}" fill="url(#brilhoMeio)"/>',
        f'<rect width="{LARG}" height="{ALT}" fill="url(#brilhoBase)"/>',
        pontos, piso,
        f'<rect width="{LARG}" height="{ALT}" fill="url(#brilhoTopo)"/>',
        moldura,
    ])
    return defs, corpo


def logo_em(x_centro, topo, s, so_nome=False):
    """Assinatura posicionada: centro horizontal, topo da arte, escala (mm/px)."""
    y0 = NOME_TOPO if so_nome else ASS_TOPO
    return (f'<g transform="translate({x_centro - CX * s:.3f},{topo - y0 * s:.3f}) scale({s})">'
            f"{assinatura(so_nome=so_nome)}</g>"), topo + (ASS_BASE - y0) * s


def texto_degrade(id_, d, esq, dir_, c0, c1):
    defs = (f'<linearGradient id="{id_}" gradientUnits="userSpaceOnUse" x1="{esq:.1f}" y1="0" x2="{dir_:.1f}" y2="0">'
            f'<stop offset="0" stop-color="{c0}"/><stop offset="1" stop-color="{c1}"/></linearGradient>')
    return defs, f'<path fill="url(#{id_})" d="{d}"/>'


def backdrop_arte():
    """Chamada forte + serviços + QR do WhatsApp."""
    defs, fundo = fundo_backdrop()
    preto = Texto("InterDisplay-Black.otf")
    semi = Texto("Inter-SemiBold.otf")
    med = Texto("Inter-Medium.otf")
    reg = Texto("Inter-Regular.otf")
    logo, y = logo_em(1000, 80, 0.77)

    h1, _ = preto.contorno("Destrave o crescimento", 126, 1000, y + 205, track=-0.02)
    h2, (e2, d2) = preto.contorno("do seu escritório.", 126, 1000, y + 350, track=-0.02)
    g2_defs, h2_el = texto_degrade("h2", h2, e2, d2, LILAS_CLARO, "#9A8CFF")
    sub, _ = med.contorno("Tráfego pago, automação e IA para Direito Bancário", 50, 1000, y + 440)

    # cartão com serviços + QR
    cx0, cy0, cw, ch = 255, y + 495, 1490, 320
    servicos = [("grafico", "Tráfego pago", "Meta Ads"),
                ("chat", "IA de atendimento", "no WhatsApp"),
                ("fluxo", "Automação + CRM", "parceiro oficial Kommo")]
    col_w = 1150 / 3
    itens = [f'<rect x="{cx0}" y="{cy0}" width="{cw}" height="{ch}" rx="44" fill="#FFFFFF" fill-opacity="0.06" '
             f'stroke="{LILAS_CLARO}" stroke-opacity="0.45" stroke-width="3"/>']
    for k, (ic, t1, t2) in enumerate(servicos):
        x = cx0 + 30 + col_w * (k + 0.5)
        itens.append(f'<circle cx="{x:.1f}" cy="{cy0 + 95}" r="56" fill="#9A8CFF" fill-opacity="0.22"/>')
        itens.append(icone(ic, x, cy0 + 95, 66, LILAS_CLARO))
        a, _ = semi.contorno(t1, 38, x, cy0 + 210)
        b, _ = reg.contorno(t2, 30, x, cy0 + 258)
        itens.append(f'<path fill="{BRANCO}" d="{a}"/><path fill="{CINZA_TEXTO}" d="{b}"/>')
        if k:
            xd = cx0 + 30 + col_w * k
            itens.append(f'<rect x="{xd - 1.5:.1f}" y="{cy0 + 50}" width="3" height="{ch - 100}" fill="{LILAS_CLARO}" fill-opacity="0.25"/>')
    # QR do WhatsApp
    from urllib.parse import quote
    url = f"https://wa.me/{WHATSAPP}?text={quote(MSG_WHATSAPP)}"
    lado_tile, xq = 225, cx0 + cw - 35 - 225
    yq = cy0 + 25
    import segno
    n = len(list(segno.make(url, error="m").matrix))
    qd, _ = qr_path(url, 0, 0, n)  # em módulos inteiros, sem arredondamento
    margem = 14
    itens.append(f'<rect x="{xq}" y="{yq}" width="{lado_tile}" height="{lado_tile}" rx="22" fill="{BRANCO}"/>')
    itens.append(f'<g transform="translate({xq + margem},{yq + margem}) scale({(lado_tile - 2 * margem) / n:.6f})">'
                 f'<path fill="{MARINHO}" d="{qd}"/></g>')
    cap, _ = semi.contorno("Fale no WhatsApp", 26, xq + lado_tile / 2, yq + lado_tile + 42)
    itens.append(f'<path fill="{BRANCO}" d="{cap}"/>')

    corpo = "\n".join([fundo, logo, f'<path fill="{BRANCO}" d="{h1}"/>', h2_el,
                       f'<path fill="{CINZA_TEXTO}" d="{sub}"/>', *itens])
    fim = cy0 + ch
    assert ALT - fim > ALTURA_BALCAO - 30, f"conteúdo desce demais: {ALT - fim:.0f} mm do chão"
    return svg(int(LARG), int(ALT), "mm", corpo, defs + g2_defs)


def mockup(arte_png, logo_png, destino):
    """Simulação de frente do stand: backdrop + balcão com o logo."""
    from PIL import ImageFilter
    W, H, px_m = 1600, 1250, 400
    cena = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(cena)
    chao = 1120
    for yy in range(H):  # parede clara e piso
        if yy < chao:
            t = yy / chao
            c = tuple(int(a + (b - a) * t) for a, b in zip((236, 236, 241), (214, 215, 223)))
        else:
            t = (yy - chao) / (H - chao)
            c = tuple(int(a + (b - a) * t) for a, b in zip((190, 191, 200), (170, 171, 181)))
        d.line([(0, yy), (W, yy)], fill=c)
    bw, bh = int(2.0 * px_m), int(2.5 * px_m)
    bx, by = (W - bw) // 2, chao - bh
    sombra = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sombra).rectangle([bx + 18, by + 22, bx + bw + 18, chao + 6], fill=120)
    cena.paste((40, 40, 60), (0, 0), sombra.filter(ImageFilter.GaussianBlur(28)))
    arte = Image.open(arte_png).convert("RGB").resize((bw, bh), Image.LANCZOS)
    cena.paste(arte, (bx, by))
    # balcão 1,10 m x 1,00 m, um pouco à frente
    cw, ch = int(1.1 * px_m), int(1.0 * px_m)
    cxb, base = (W - cw) // 2, chao + 70
    s2 = Image.new("L", (W, H), 0)
    ImageDraw.Draw(s2).ellipse([cxb - 40, base - 25, cxb + cw + 40, base + 30], fill=150)
    cena.paste((30, 30, 45), (0, 0), s2.filter(ImageFilter.GaussianBlur(18)))
    d = ImageDraw.Draw(cena)
    d.rectangle([cxb, base - ch, cxb + cw, base], fill=(22, 24, 39))
    d.rectangle([cxb - 14, base - ch - 26, cxb + cw + 14, base - ch], fill=(245, 245, 250))
    d.rectangle([cxb, base - 14, cxb + cw, base], fill=(14, 15, 28))
    lg = Image.open(logo_png).convert("RGBA")
    lw = int(cw * 0.5)
    lg = lg.resize((lw, int(lg.height * lw / lg.width)), Image.LANCZOS)
    cena.paste(lg, (cxb + (cw - lw) // 2, base - ch + (ch - lg.height) // 2 - 5), lg)
    f = ImageFont.truetype(os.path.join(FONTES, "Inter-Medium.otf"), 22)
    d.text((24, H - 40), "Simulação do stand (medidas aproximadas: backdrop 2,00 x 2,50 m, balcão ~1,10 x 1,00 m)",
           font=f, fill=(90, 90, 105))
    cena.save(destino)


def backdrop(pasta, pasta_logo):
    os.makedirs(pasta, exist_ok=True)
    for gerar in (backdrop_arte,):
        arte = gerar()
        nome = os.path.join(pasta, "backdrop-unlockify-200x250cm")
        rgb = exportar(arte, nome, eps=False)
        # JPG em tamanho real a 100 dpi, para gráficas que preferem imagem
        gs("-sDEVICE=jpeg", "-r100", "-dJPEGQ=92", "-dTextAlphaBits=4", "-dGraphicsAlphaBits=4",
           f"-sOutputFile={nome}-100dpi.jpg", rgb)
        os.remove(rgb)
        os.remove(nome + ".svg")
        prev = os.path.join(pasta, "previa-backdrop.png")
        cairosvg.svg2png(bytestring=arte.encode(), write_to=prev, output_width=1000)
        mockup(prev, os.path.join(pasta_logo, "unlockify-logo-fundo-escuro.png"),
               os.path.join(pasta, "simulacao-stand.png"))


# ---------------------------------------------------------------- pacote
def pacote(pasta_logo, pasta_backdrop, destino):
    """Zip só com o que a organização do evento pediu (logo + backdrop)."""
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        for arq in sorted(os.listdir(pasta_logo)):
            if arq.startswith("unlockify-logo-fundo-") and arq.endswith((".pdf", ".eps", ".png")):
                z.write(os.path.join(pasta_logo, arq), f"logo/{arq}")
        for suf in (".pdf", "-100dpi.jpg"):
            arq = f"backdrop-unlockify-200x250cm{suf}"
            z.write(os.path.join(pasta_backdrop, arq), f"backdrop/{arq}")


if __name__ == "__main__":
    import sys
    so_previa = "--previa" in sys.argv
    if so_previa:  # iteração rápida do layout: só PNGs
        cairosvg.svg2png(bytestring=backdrop_arte().encode(), write_to="/tmp/previa-backdrop.png", output_width=800)
        sys.exit()
    for p in ("logo", "backdrop"):
        shutil.rmtree(os.path.join(AQUI, p), ignore_errors=True)
    for z in os.listdir(AQUI):
        if z.endswith(".zip"):
            os.remove(os.path.join(AQUI, z))
    logos(os.path.join(AQUI, "logo"))
    backdrop(os.path.join(AQUI, "backdrop"), os.path.join(AQUI, "logo"))
    pacote(os.path.join(AQUI, "logo"), os.path.join(AQUI, "backdrop"),
           os.path.join(AQUI, "unlockify-arquivos-stand.zip"))
    print("ok")
