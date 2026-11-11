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
LOGO_W = float(sys.argv[1]) if len(sys.argv) > 1 else 400.0     # largura da logo (mm)
s = LOGO_W / (F["x1"] - F["x0"])
LOGO_H = (F["y1"] - F["y0"]) * s
LX0, LY0 = CX - LOGO_W / 2, CY - LOGO_H / 2

def lx(x): return LX0 + (x - F["x0"]) * s
def ly(y): return LY0 + (y - F["y0"]) * s

logo = f'''
  <g id="logo">
    <path d="M {lx(XL):.2f} {ly(YTL):.2f} L {lx(XL):.2f} {ly(YC):.2f}
             A {R_ARC*s:.2f} {R_ARC*s:.2f} 0 0 0 {lx(XR):.2f} {ly(YC):.2f}
             L {lx(XR):.2f} {ly(YTR):.2f}"
          fill="none" stroke="url(#logoGrad)" stroke-width="{SW*s:.2f}" stroke-linecap="round"/>
    <circle cx="{lx(DOT[0]):.2f}" cy="{ly(DOT[1]):.2f}" r="{DOT[2]*s:.2f}" fill="url(#logoGrad)"/>
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
        return (f'<g transform="{tr}" opacity="{alpha:.3f}" stroke="#A9A6DA" fill="none" '
                f'stroke-width="{sw:.3f}" stroke-linecap="round" stroke-linejoin="round">{body}'
                f'<g stroke="none" fill="#A9A6DA">{dots_svg}</g></g>')
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
    return f'<path d="{" ".join(dd)}" fill="#B9B6E6" fill-rule="evenodd" opacity="{alpha:.3f}"/>'

def build(seed):
    rnd = random.Random(seed)
    # zona livre ao redor da logo
    mx, my = 55.0, 45.0
    zx0, zx1 = LX0 - mx, LX0 + LOGO_W + mx
    zy0, zy1 = LY0 - my, LY0 + LOGO_H + my
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
        lab += (f'<rect x="{LX0:.1f}" y="{LY0:.1f}" width="{LOGO_W:.1f}" height="{LOGO_H:.1f}" fill="none" '
                f'stroke="#FFD23F" stroke-width="2" stroke-dasharray="8 6"/>'
                f'<text x="{CX:.1f}" y="{LY0-14:.1f}" text-anchor="middle" font-family="DejaVu Sans, Arial" '
                f'font-size="26" font-weight="bold" fill="#FFD23F">LOGO {LOGO_W/10:.0f} x {LOGO_H/10:.1f} cm</text>'.replace(f"{LOGO_H/10:.1f} cm", f"{LOGO_H/10:.1f} cm".replace(".", ",")))
        lab += (f'<text x="{CX:.1f}" y="{LY0+LOGO_H+38:.1f}" text-anchor="middle" font-family="DejaVu Sans, Arial" '
                f'font-size="22" fill="#FFD23F">centralizada no painel frontal (80 x 84 cm)</text>')
        guide += lab
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:g} {H:g}" width="{W/10:g}cm" height="{H/10:g}cm">
  <title>Balcão ONE – adesivo 187x86 cm (com sangria)</title>
  <defs>
    <linearGradient id="bgBase" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2B2852"/>
      <stop offset="0.45" stop-color="#171B30"/>
      <stop offset="1" stop-color="#1B2036"/>
    </linearGradient>
    <radialGradient id="glowTL" gradientUnits="userSpaceOnUse" cx="80" cy="40" r="900">
      <stop offset="0" stop-color="#5A4FA6" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#5A4FA6" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowBR" gradientUnits="userSpaceOnUse" cx="{W-60}" cy="{H+40}" r="760">
      <stop offset="0" stop-color="#3F3C78" stop-opacity="0.7"/>
      <stop offset="1" stop-color="#3F3C78" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowLogo" gradientUnits="userSpaceOnUse" cx="{CX}" cy="{CY}" r="{LOGO_H*0.95:.1f}">
      <stop offset="0" stop-color="#8E82EA" stop-opacity="0.22"/>
      <stop offset="0.55" stop-color="#8E82EA" stop-opacity="0.07"/>
      <stop offset="1" stop-color="#8E82EA" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" gradientUnits="userSpaceOnUse" cx="{CX}" cy="{CY}" r="{W*0.62:.1f}">
      <stop offset="0" stop-color="#0E1222" stop-opacity="0.55"/>
      <stop offset="0.6" stop-color="#0E1222" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#0E1222" stop-opacity="0"/>
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
{guide}
</svg>'''

if __name__ == "__main__":
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else 7
    out = sys.argv[3] if len(sys.argv) > 3 else "arte.svg"
    open(out, "w").write(svg(seed))
    open(out.replace(".svg", "_guias.svg"), "w").write(svg(seed, guides=True))
    print(f"logo {LOGO_W:.1f} x {LOGO_H:.1f} mm, origem ({LX0:.1f},{LY0:.1f})")
