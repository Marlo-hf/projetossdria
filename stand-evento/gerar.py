"""Gera os arquivos do stand: logo Unlockify em vetor e arte do backdrop.

Tudo é vetor, e os textos são convertidos em curvas, então a gráfica não
precisa ter a fonte instalada. Os PDFs e EPS saem em CMYK para impressão.

Uso:  python3 gerar.py
Precisa de: cairosvg, fonttools, uharfbuzz, pypdf, numpy, Pillow, Ghostscript (gs)
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


def assinatura(cor_nome=BRANCO, cor_marca=ROXO, so_simbolo=False):
    """Assinatura vertical nas coordenadas da arte original (1080 px)."""
    partes = [f'<path fill="{cor_marca}" d="{simbolo_d()}"/>']
    if not so_simbolo:
        nome, _ = Texto("Inter-Bold.otf").contorno("Unlockify", 107.6, CX, 787.0)
        digital, _ = Texto("Inter-Medium.otf").contorno("DIGITAL", 45.4, CX, 869.0, track=0.49)
        partes.append(f'<path fill="{cor_nome}" d="{nome}"/>')
        partes.append(f'<path fill="{cor_marca}" d="{digital}"/>')
    return "\n".join(partes)


def caixa_assinatura(so_simbolo=False):
    if so_simbolo:
        return (CX - R - HW, TOPO_ESQ - HW, CX + R + PINGO_R, CY + R + HW)
    return (295.0, ASS_TOPO, 791.0, ASS_BASE)


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
            _recursos_cmyk(xo.get("/Resources"), leitor)
            _conteudo_cmyk(xo, leitor)


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
    }
    for nome, kw in variantes.items():
        x0, y0, x1, y1 = caixa_assinatura(kw.get("so_simbolo", False))
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
ALTURA_BALCAO = 1100.0       # mm a partir do chão (referência só na prévia)


def backdrop(pasta):
    os.makedirs(pasta, exist_ok=True)
    s = 1.35       # mm por px da arte original -> assinatura com ~67 cm de largura
    topo = 130.0   # mm do topo até o alto do símbolo

    def X(px):
        return LARG / 2 + (px - CX) * s

    def Y(py):
        return topo + (py - ASS_TOPO) * s

    brilho_cx, brilho_cy, brilho_esc = X(CX), Y(400), s * 1.6

    semi = Texto("Inter-SemiBold.otf")
    med = Texto("Inter-Medium.otf")
    # Tudo o que importa fica acima de ALTURA_BALCAO, com folga.
    y_div = Y(ASS_BASE) + 60
    l1, _ = semi.contorno("Tráfego pago, automação e IA", 66, LARG / 2, y_div + 95)
    l2, _ = semi.contorno("para escritórios de advocacia", 66, LARG / 2, y_div + 175)
    y_site = y_div + 260
    site, _ = med.contorno("unlockify.com.br", 42, LARG / 2, y_site, track=0.06)
    assert ALT - (y_site + 12) > ALTURA_BALCAO + 40, "texto do backdrop muito baixo"

    corpo = "\n".join([
        f'<rect width="{LARG}" height="{ALT}" fill="url(#brilho)"/>',
        pontilhado(LARG, ALT, 38, 2.1, brilho_cx, brilho_cy, brilho_esc),
        f'<g transform="translate({X(0):.3f},{Y(0):.3f}) scale({s})">{assinatura()}</g>',
        f'<rect x="{LARG / 2 - 60}" y="{y_div - 2.5}" width="120" height="5" rx="2.5" fill="{ROXO}"/>',
        f'<path fill="{BRANCO}" d="{l1}"/>',
        f'<path fill="{ROXO}" d="{l2}"/>',
        f'<path fill="{CINZA_SITE}" d="{site}"/>',
    ])
    defs = degrade("brilho", brilho_cx, brilho_cy, brilho_esc)
    arte = svg(int(LARG), int(ALT), "mm", corpo, defs)
    nome = os.path.join(pasta, "backdrop-unlockify-200x250cm")
    rgb = exportar(arte, nome, eps=False)

    # JPG em tamanho real a 100 dpi, para gráficas que preferem imagem
    gs("-sDEVICE=jpeg", "-r100", "-dJPEGQ=92", "-dTextAlphaBits=4", "-dGraphicsAlphaBits=4",
       f"-sOutputFile={nome}-100dpi.jpg", rgb)
    os.remove(rgb)
    os.remove(nome + ".svg")  # o SVG de 2,5 m não é útil para a gráfica

    # Prévia pequena com a linha do balcão, só para conferência
    larg_px = 900
    k = larg_px / LARG
    cairosvg.svg2png(bytestring=arte.encode(), write_to=nome + ".tmp.png", output_width=larg_px)
    im = Image.open(nome + ".tmp.png").convert("RGB")
    os.remove(nome + ".tmp.png")
    sobre = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(sobre)
    yb = (ALT - ALTURA_BALCAO) * k
    d.rectangle([0, yb, im.width, im.height], fill=(255, 255, 255, 38))
    for xx in range(0, im.width, 18):
        d.line([xx, yb, xx + 9, yb], fill=(255, 210, 90, 255), width=2)
    fonte = ImageFont.truetype(os.path.join(FONTES, "Inter-Medium.otf"), 18)
    d.text((14, yb + 10), "↓ área que o balcão tende a cobrir (≈ 1,10 m do chão)",
           font=fonte, fill=(255, 210, 90, 255))
    d.text((14, im.height - 30), "PRÉVIA · não enviar para impressão", font=fonte,
           fill=(255, 255, 255, 170))
    Image.alpha_composite(im.convert("RGBA"), sobre).convert("RGB").save(
        os.path.join(pasta, "previa-backdrop.png"))


# ---------------------------------------------------------------- pacote
def pacote(pasta_logo, pasta_backdrop, destino):
    """Zip só com o que a organização do evento pediu."""
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        for arq in sorted(os.listdir(pasta_logo)):
            if arq.endswith((".pdf", ".eps", ".png")):
                z.write(os.path.join(pasta_logo, arq), f"logo/{arq}")
        for arq in ("backdrop-unlockify-200x250cm.pdf", "backdrop-unlockify-200x250cm-100dpi.jpg"):
            z.write(os.path.join(pasta_backdrop, arq), f"backdrop/{arq}")


if __name__ == "__main__":
    for p in ("logo", "backdrop"):
        shutil.rmtree(os.path.join(AQUI, p), ignore_errors=True)
    logos(os.path.join(AQUI, "logo"))
    backdrop(os.path.join(AQUI, "backdrop"))
    pacote(os.path.join(AQUI, "logo"), os.path.join(AQUI, "backdrop"),
           os.path.join(AQUI, "unlockify-arquivos-stand.zip"))
    print("ok")
