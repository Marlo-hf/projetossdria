"""Gera a arte do adesivo do Balcão ONE (187 x 86 cm com sangria) em SVG.
Unidades do SVG: milímetros (viewBox 0 0 1870 860)."""
import math, random, sys

W, H = 1870.0, 860.0
BLEED_X, BLEED_Y = 15.0, 10.0
PANELS = [160, 360, 800, 360, 160]          # larguras dos painéis (mm)
CX, CY = W / 2, H / 2                       # centro do painel frontal = centro do adesivo

# ---------------- Logo (medido no vídeo, coordenadas do frame 2160x3840) ----------------
F = dict(x0=570.25, x1=1592.0, y0=1320.0, y1=2515.0)
SW = 196.5                       # espessura do traço
XL, XR = 668.5, 1487.0           # eixos das hastes
YTL, YTR = 1418.25, 1665.25      # centros das pontas arredondadas (esq./dir.)
R_ARC = (XR - XL) / 2
YC = F["y1"] - SW / 2 - R_ARC    # centro do arco do U
DOT = (1487.0, 1427.0, 105.0)    # bolinha do "i"
import argparse
ap = argparse.ArgumentParser()
ap.add_argument("--logo-w", type=float, default=340.0, help="largura da logo em mm")
ap.add_argument("--nome", default="unlockify")
ap.add_argument("--nome-w", type=float, default=520.0, help="largura do nome em mm")
ap.add_argument("--gap", type=float, default=62.0, help="espaço entre a logo e o topo do nome (mm)")
ap.add_argument("--fonte", default="Quicksand-Bold.ttf")
ap.add_argument("--seed", type=int, default=8)
ap.add_argument("--sem-i", action="store_true", help="logo só com o U (sem a bolinha do i, hastes iguais)")
ap.add_argument("--out", default="arte.svg")
ARGS = ap.parse_args()
if ARGS.sem_i:
    YTR = YTL                   # haste direita na mesma altura da esquerda (U simétrico, como no início da vinheta)
    F["x1"] = XR + SW / 2       # sem a bolinha, a logo termina na haste direita
LOGO_W = ARGS.logo_w
s = LOGO_W / (F["x1"] - F["x0"])
LOGO_H = (F["y1"] - F["y0"]) * s

# ---- nome em curvas (fonte Quicksand Bold, licença OFL) ----
def nome_paths(texto, largura, fonte):
    import uharfbuzz as hb
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    blob = hb.Blob.from_file_path(fonte); face = hb.Face(blob); font = hb.Font(face)
    buf = hb.Buffer(); buf.add_str(texto); buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": False})
    tt = TTFont(fonte); gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    track = 0.02 * tt["head"].unitsPerEm
    x = 0; glifos = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        glifos.append((order[info.codepoint], x + pos.x_offset))
        x += pos.x_advance + track
    # caixa real do desenho
    from fontTools.pens.boundsPen import BoundsPen
    xmin = ymin = 1e9; xmax = ymax = -1e9
    for g, gx in glifos:
        bp = BoundsPen(gs); gs[g].draw(bp)
        if bp.bounds:
            a, b, c, d = bp.bounds
            xmin, ymin, xmax, ymax = min(xmin, a + gx), min(ymin, b), max(xmax, c + gx), max(ymax, d)
    k = largura / (xmax - xmin)
    return glifos, gs, k, (xmin, ymin, xmax, ymax), tt["OS/2"].sxHeight

NOME_GLIFOS, NOME_GS, NK, NB, NXH = nome_paths(ARGS.nome, ARGS.nome_w, ARGS.fonte)
NOME_W = ARGS.nome_w
NOME_ASC = NB[3] * NK          # altura acima da linha de base (mm)
NOME_DESC = -NB[1] * NK        # descendente (mm)
# centraliza o conjunto (topo da logo até a linha de base do nome) no centro do painel
GRUPO_H = LOGO_H + ARGS.gap + NOME_ASC
LX0 = CX - LOGO_W / 2
LY0 = CY - GRUPO_H / 2
BASE_Y = LY0 + LOGO_H + ARGS.gap + NOME_ASC
NX0 = CX - NOME_W / 2

def nome_svg():
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    ds = []
    for g, gx in NOME_GLIFOS:
        pen = SVGPathPen(NOME_GS, ntos=lambda v: f"{v:.2f}")
        tp = TransformPen(pen, (NK, 0, 0, -NK, NX0 + (gx - NB[0]) * NK, BASE_Y))
        NOME_GS[g].draw(tp)
        ds.append(pen.getCommands())
    return f'<path id="nome" d="{" ".join(ds)}" fill="#EEEBFF"/>'

def lx(x): return LX0 + (x - F["x0"]) * s
def ly(y): return LY0 + (y - F["y0"]) * s

logo = f'''
  <g id="logo">
    <path d="M {lx(XL):.2f} {ly(YTL):.2f} L {lx(XL):.2f} {ly(YC):.2f}
             A {R_ARC*s:.2f} {R_ARC*s:.2f} 0 0 0 {lx(XR):.2f} {ly(YC):.2f}
             L {lx(XR):.2f} {ly(YTR):.2f}"
          fill="none" stroke="url(#logoGrad)" stroke-width="{SW*s:.2f}" stroke-linecap="round"/>
    {"" if ARGS.sem_i else f'<circle cx="{lx(DOT[0]):.2f}" cy="{ly(DOT[1]):.2f}" r="{DOT[2]*s:.2f}" fill="url(#logoGrad)"/>'}
  </g>'''

# ---------------- Padrão de fundo (fragmentos de letras com traço arredondado) ----------------
G_SW = 40.0          # espessura do traço dos glifos de fundo (mm)
OUT_T = 4.5          # espessura da linha dos glifos vazados

# glifos em unidades (1 unidade ~ escala); cada um: (lista de paths, lista de bolinhas (x,y,r_em_sw), raio de contorno)
GLYPHS = {
    "U":     (["M -1 -1.25 L -1 0.15 A 1 1 0 0 0 1 0.15 L 1 -1.25"], [], 1.75),
    "Ui":    (["M -1 -1.25 L -1 0.15 A 1 1 0 0 0 1 0.15 L 1 -0.55"], [(1, -1.2, 0.53)], 1.75),
    "n":     (["M -1 1.25 L -1 -0.15 A 1 1 0 0 1 1 -0.15 L 1 1.25"], [], 1.75),
    "C":     (["M 0.7 -0.95 A 1.15 1.15 0 1 0 0.7 0.95"], [], 1.4),
    "ring":  (["M -1.05 0 A 1.05 1.05 0 1 0 1.05 0 A 1.05 1.05 0 1 0 -1.05 0"], [], 1.35),
    "i":     (["M 0 -0.35 L 0 1.25"], [(0, -1.05, 0.53)], 1.45),
    "check": (["M -1.1 -0.1 L -0.35 0.65 L 1.15 -0.85"], [], 1.4),
    "L":     (["M -0.85 -1.25 L -0.85 0.85 L 1.05 0.85"], [], 1.6),
    "t":     (["M -0.3 -1.3 L -0.3 0.45 A 0.75 0.75 0 0 0 0.45 1.2 L 0.8 1.2", "M -0.95 -0.45 L 0.55 -0.45"], [], 1.6),
    "r":     (["M -0.75 1.25 L -0.75 0 A 1 1 0 0 1 0.25 -1 L 0.85 -1"], [], 1.55),
    "j":     (["M 0.5 -1.25 L 0.5 0.35 A 0.85 0.85 0 0 1 -1.2 0.35"], [], 1.55),
    "arc":   (["M -1.2 0.3 A 1.3 1.3 0 0 1 1.2 0.3"], [], 1.3),
    "line":  (["M -1.1 0 L 1.1 0"], [], 1.15),
    "dot":   ([], [(0, 0, 0.9)], 0.6),
}

def glyph_svg(name, x, y, sc, rot, style, alpha, gid):
    paths, dots, _ = GLYPHS[name]
    tr = f'translate({x:.1f} {y:.1f}) rotate({rot}) scale({sc:.2f})'
    sw = G_SW / sc
    body = "".join(f'<path d="{d}"/>' for d in paths)
    dots_svg = "".join(f'<circle cx="{dx}" cy="{dy}" r="{dr*G_SW/sc:.3f}"/>' for dx, dy, dr in dots)
    if style == "solid":
        return (f'<g transform="{tr}" opacity="{alpha:.3f}" stroke="#C1B5F7" fill="none" '
                f'stroke-width="{sw:.3f}" stroke-linecap="round" stroke-linejoin="round">{body}'
                f'<g stroke="none" fill="#C1B5F7">{dots_svg}</g></g>')
    # vazado: contorno do traço calculado como polígono (sem máscara), compatível com PDF vetorial
    from shapely.geometry import LineString, Point
    from shapely.ops import unary_union
    from shapely import affinity
    import svgelements
    outer, inner = [], []
    for d in paths:
        p = svgelements.Path(d)
        n = 160
        pts = [(p.point(k / n).x, p.point(k / n).y) for k in range(n + 1)]
        ls = LineString(pts)
        outer.append(ls.buffer(G_SW / 2 / sc, quad_segs=24))
        inner.append(ls.buffer((G_SW / 2 - OUT_T) / sc, quad_segs=24))
    for dx, dy, dr in dots:
        outer.append(Point(dx, dy).buffer(dr * G_SW / sc, quad_segs=24))
        inner.append(Point(dx, dy).buffer((dr * G_SW - OUT_T) / sc, quad_segs=24))
    ring = unary_union(outer).difference(unary_union(inner))
    ring = affinity.scale(ring, sc, sc, origin=(0, 0))
    ring = affinity.rotate(ring, rot, origin=(0, 0))
    ring = affinity.translate(ring, x, y)
    polys = getattr(ring, "geoms", [ring])
    dd = []
    for poly in polys:
        for r in [poly.exterior, *poly.interiors]:
            c = list(r.coords)
            dd.append("M " + " L ".join(f"{a:.1f} {b:.1f}" for a, b in c) + " Z")
    return f'<path d="{" ".join(dd)}" fill="#CEC4FA" fill-rule="evenodd" opacity="{alpha:.3f}"/>'

def build(seed):
    rnd = random.Random(seed)
    # zona livre ao redor da logo
    mx, my = 55.0, 45.0
    zx0, zx1 = min(LX0, NX0) - mx, max(LX0 + LOGO_W, NX0 + NOME_W) + mx
    zy0, zy1 = LY0 - my, BASE_Y + NOME_DESC + my
    def dist_rect(x, y):
        dx = max(zx0 - x, 0, x - zx1); dy = max(zy0 - y, 0, y - zy1)
        return math.hypot(dx, dy)
    names = ["U", "n", "C", "ring", "i", "check", "L", "t", "r", "j", "arc", "line", "Ui", "dot"]
    weights = [9, 7, 8, 5, 7, 6, 5, 4, 5, 4, 7, 5, 3, 6]
    placed = []
    counts = {}
    caps = {"dot": 4, "Ui": 2, "line": 3, "ring": 3, "i": 4}
    for phase, (ntries, smin, smax) in enumerate([(6000, 118, 150), (12000, 90, 120)]):
        for _ in range(ntries):
            name = rnd.choices(names, weights)[0]
            if counts.get(name, 0) >= caps.get(name, 99):
                continue
            if phase == 0 and name in ("dot", "line", "i"):
                continue
            sc = rnd.uniform(smin, smax) if name != "dot" else 50
            R = GLYPHS[name][2] * sc + G_SW / 2
            x = rnd.uniform(-R * 0.45, W + R * 0.45)
            y = rnd.uniform(-R * 0.45, H + R * 0.45)
            if dist_rect(x, y) < R * 0.92:
                continue
            if any(math.hypot(x - px, y - py) < 0.8 * (R + pR) for px, py, pR, *_ in placed):
                continue
            rot = rnd.choice([0, 0, 0, 0, 90, 180, 270, -20, 20, 35, -35, 45, 160, 200])
            if name in ("L", "t", "r", "j"):
                rot = rnd.choice([0, 0, -20, 20, -35])   # evita formas que pareçam números (ex.: "7")
            style = "outline" if rnd.random() < 0.22 and name not in ("dot", "line") else "solid"
            d = min(1.0, math.hypot((x - CX) / (W / 2), (y - CY) / (H / 2)) / 1.1)
            alpha = (0.16 + 0.18 * d) * rnd.uniform(0.85, 1.15)
            if style == "outline":
                alpha = min(0.6, alpha * 1.7)
            counts[name] = counts.get(name, 0) + 1
            placed.append((x, y, R, name, sc, rot, style, alpha))
    return placed

def svg(seed, guides=False):
    placed = build(seed)
    glyphs = "\n".join(glyph_svg(n, x, y, sc, rot, st, a, i)
                       for i, (x, y, R, n, sc, rot, st, a) in enumerate(placed))
    guide = ""
    if guides:
        xs = [BLEED_X]
        for p in PANELS: xs.append(xs[-1] + p)
        lines = "".join(f'<line x1="{x}" y1="0" x2="{x}" y2="{H}"/>' for x in xs[1:-1])
        guide = (f'<g fill="none" stroke="#FF2E9A" stroke-width="1.6" stroke-dasharray="10 7">{lines}</g>'
                 f'<rect x="{BLEED_X}" y="{BLEED_Y}" width="{W-2*BLEED_X}" height="{H-2*BLEED_Y}" '
                 f'fill="none" stroke="#00E0A0" stroke-width="1.6"/>')
        # cotas (somente prévia): larguras dos painéis e tamanho da logo
        lab = ""
        for i, p in enumerate(PANELS):
            mid = xs[i] + p / 2
            lab += (f'<text x="{mid:.1f}" y="{H-22}" text-anchor="middle" font-family="DejaVu Sans, Arial" '
                    f'font-size="24" font-weight="bold" fill="#00E0A0">{p//10} cm</text>')
        gx0, gx1 = min(LX0, NX0), max(LX0 + LOGO_W, NX0 + NOME_W)
        gy0, gy1 = LY0, BASE_Y + NOME_DESC
        lab += (f'<rect x="{gx0:.1f}" y="{gy0:.1f}" width="{gx1-gx0:.1f}" height="{gy1-gy0:.1f}" fill="none" '
                f'stroke="#FFD23F" stroke-width="2" stroke-dasharray="8 6"/>')
        cm = lambda v: f"{v/10:.1f}".replace(".", ",").replace(",0", "")
        lab += (f'<text x="{CX:.1f}" y="{gy0-14:.1f}" text-anchor="middle" font-family="DejaVu Sans, Arial" '
                f'font-size="24" font-weight="bold" fill="#FFD23F">LOGO {cm(LOGO_W)} x {cm(LOGO_H)} cm  ·  '
                f'NOME {cm(NOME_W)} cm de largura</text>')
        lab += (f'<text x="{CX:.1f}" y="{gy1+34:.1f}" text-anchor="middle" font-family="DejaVu Sans, Arial" '
                f'font-size="20" fill="#FFD23F">conjunto {cm(gx1-gx0)} x {cm(gy1-gy0)} cm, centralizado no painel frontal (80 x 84 cm)</text>')
        guide += lab
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:g} {H:g}" width="{W/10:g}cm" height="{H/10:g}cm">
  <title>Balcão ONE – adesivo 187x86 cm (com sangria)</title>
  <defs>
    <linearGradient id="bgBase" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3D2D88"/>
      <stop offset="0.45" stop-color="#26195C"/>
      <stop offset="1" stop-color="#302172"/>
    </linearGradient>
    <radialGradient id="glowTL" gradientUnits="userSpaceOnUse" cx="80" cy="40" r="900">
      <stop offset="0" stop-color="#7B5BE6" stop-opacity="0.62"/>
      <stop offset="1" stop-color="#7B5BE6" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowBR" gradientUnits="userSpaceOnUse" cx="{W-60}" cy="{H+40}" r="760">
      <stop offset="0" stop-color="#6447C9" stop-opacity="0.6"/>
      <stop offset="1" stop-color="#6447C9" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowLogo" gradientUnits="userSpaceOnUse" cx="{CX}" cy="{CY}" r="{GRUPO_H*0.85:.1f}">
      <stop offset="0" stop-color="#9D86F7" stop-opacity="0.22"/>
      <stop offset="0.55" stop-color="#9D86F7" stop-opacity="0.07"/>
      <stop offset="1" stop-color="#9D86F7" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" gradientUnits="userSpaceOnUse" cx="{CX}" cy="{CY}" r="{W*0.62:.1f}">
      <stop offset="0" stop-color="#140C34" stop-opacity="0.5"/>
      <stop offset="0.6" stop-color="#140C34" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#140C34" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="logoGrad" gradientUnits="userSpaceOnUse" x1="0" y1="{LY0:.1f}" x2="0" y2="{LY0+LOGO_H:.1f}">
      <stop offset="0" stop-color="#A89EF3"/>
      <stop offset="1" stop-color="#8579E2"/>
    </linearGradient>
  </defs>
  <rect width="{W:g}" height="{H:g}" fill="url(#bgBase)"/>
  <rect width="{W:g}" height="{H:g}" fill="url(#glowTL)"/>
  <rect width="{W:g}" height="{H:g}" fill="url(#glowBR)"/>
  <g id="padrao">
{glyphs}
  </g>
  <rect width="{W:g}" height="{H:g}" fill="url(#vignette)"/>
  <rect width="{W:g}" height="{H:g}" fill="url(#glowLogo)"/>
{logo}
  {nome_svg()}
{guide}
</svg>'''

if __name__ == "__main__":
    out = ARGS.out
    open(out, "w").write(svg(ARGS.seed))
    open(out.replace(".svg", "_guias.svg"), "w").write(svg(ARGS.seed, guides=True))
    print(f"logo {LOGO_W:.1f} x {LOGO_H:.1f} mm em ({LX0:.1f},{LY0:.1f}); nome {NOME_W:.0f} mm, "
          f"asc {NOME_ASC:.1f} desc {NOME_DESC:.1f}, base y {BASE_Y:.1f}; grupo y {LY0:.1f}..{BASE_Y+NOME_DESC:.1f}")
