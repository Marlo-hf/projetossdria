"""Tour "caminhando pela casa": câmera em primeira pessoa sobre fotos com profundidade (Depth Anything V2).
uso: python3 -I render2.py <work_dir> <vo_dir> <out.mp4> <vertical|horizontal> [preview]
vo_dir precisa de lN.wav (uma por fala) ; tempos saem em <out>.json
"""
import sys, os, json, subprocess, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WORK, VO, OUT, FMT = sys.argv[1:5]
PREVIEW = len(sys.argv) > 5 and sys.argv[5] == "preview"
FPS = 30
OW, OH = (1080, 1920) if FMT == "vertical" else (1920, 1080)
if PREVIEW:
    OW, OH = OW // 2, OH // 2
V = FMT == "vertical"
S = OW / (1080 if V else 1920)

FONT_XB = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
FONT_SB = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
GOLD = (232, 194, 122)
WHITE = (255, 255, 255)

# caminho pela casa: (imagem, movimento). walk = anda pra frente ; look_r/look_l = anda devagar virando o olhar
LINES = [
    dict(scenes=[("img01", "look_l"), ("img03", "walk")], eyebrow="TOUR PELA CASA", title="VEM CONHECER\nESSA CASA", hook=True),
    dict(scenes=[("img07", "look_l"), ("img04", "walk")], eyebrow="SALA INTEGRADA", title="Portas de vidro\npara a piscina"),
    dict(scenes=[("img02", "walk")], eyebrow="ÁREA DA PISCINA", title="Piscina com\niluminação"),
    dict(scenes=[("img05", "look_r"), ("img11", "walk")], eyebrow="COZINHA", title="Planejada com\nilha central"),
    dict(scenes=[("img10", "look_r")], eyebrow="QUARTO", title="Amplo e bem\niluminado"),
    dict(scenes=[("img12", "walk")], eyebrow="QUARTO", title="Ótimo espaço e\njanela grande"),
    dict(scenes=[("img09", "look_l")], eyebrow="BANHEIRO", title="Box de vidro e\nacabamento moderno"),
    dict(scenes=[("img14", "walk")], eyebrow="QUARTO", title="Mesmo padrão\nde acabamento"),
    dict(scenes=[("img13", "look_r")], eyebrow="BANHEIRO", title="Acabamento\nmoderno"),
    dict(scenes=[("img08", "walk")], eyebrow="ÁREA EXTERNA", title="Muro alto e\nconcertina"),
    dict(scenes=[("img02", "look_r")], cta=True),
]
MIN_SCENE = 3.9   # segundos mínimos por cômodo (ritmo calmo)
LEAD = 0.5
TAIL = 2.2
XF = 0.55         # duração da "passagem" entre cômodos

durs = [float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{VO}/l{i+1}.wav"]))
        for i in range(len(LINES))]
blocks, vo_starts = [], []
t = 0.0
for i, L in enumerate(LINES):
    n = len(L["scenes"])
    lead = LEAD if i == 0 else 0.35
    tail = TAIL if L.get("cta") else 0.55
    d = max(lead + durs[i] + tail, n * MIN_SCENE)
    vo_starts.append(t + lead)
    blocks.append((t, t + d))
    t += d
TOTAL = t
NF = int(round(TOTAL * FPS))
scenes = []
for i, L in enumerate(LINES):
    b0, b1 = blocks[i]
    n = len(L["scenes"])
    for k, (img, mv) in enumerate(L["scenes"]):
        scenes.append(dict(img=img, mv=mv, t0=b0 + (b1 - b0) * k / n, t1=b0 + (b1 - b0) * (k + 1) / n, line=i))

# ---------------- imagens ----------------
cache = {}
def load(name):
    if name not in cache:
        im = cv2.cvtColor(cv2.imread(f"{WORK}/{name}.jpg"), cv2.COLOR_BGR2RGB).astype(np.float32)
        hsv = cv2.cvtColor(im / 255.0, cv2.COLOR_RGB2HSV)
        hsv[..., 1] = np.clip(hsv[..., 1] * 1.12, 0, 1)
        im = np.clip((cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB) * 255.0 - 128) * 1.06 + 128 + np.array([4, 1, -3]), 0, 255)
        d = cv2.GaussianBlur(np.load(f"{WORK}/{name}_depth.npy").astype(np.float32), (0, 0), 10)
        cache[name] = (im.astype(np.float32), d)
    return cache[name]

def clamp01(x): return min(max(x, 0.0), 1.0)
def ease_io(x): x = clamp01(x); return 0.5 - 0.5 * math.cos(math.pi * x)

# posição ao longo do cômodo: velocidade de caminhada constante, mais rápida
# nas pontas (chegando / atravessando para o próximo cômodo)
_U = np.linspace(0, 1, 2001)
_V = 1 + 2.2 * np.exp(-_U / 0.07) + 2.6 * np.exp(-(1 - _U) / 0.07)
_P = np.concatenate([[0], np.cumsum((_V[1:] + _V[:-1]) / 2)]); _P /= _P[-1]
def walkpos(u): return float(np.interp(clamp01(u), _U, _P))
def walkvel(u): return float(np.interp(clamp01(u), _U, _V)) / float(np.trapezoid(_V, _U))

def render_scene(sc, t, blur=0.0):
    im, D = load(sc["img"])
    H, W = D.shape
    T0 = sc["t0"] - XF / 2
    dur = (sc["t1"] + XF / 2) - T0
    u = (t - T0) / dur
    p = walkpos(u)
    mv = sc["mv"]
    aspect = OW / OH
    hv1 = min(H, W / aspect)
    tt = t - T0
    # passos: balanço vertical (2 passos/s) + leve gingado lateral e inclinação
    step = 1.85
    bob_y = math.sin(2 * math.pi * step * tt) * 0.0045
    bob_x = math.sin(math.pi * step * tt + 0.7) * 0.0035
    roll = math.sin(math.pi * step * tt + 1.3) * 0.0035   # rad
    if mv == "walk":
        z = 1.07 + 0.26 * p; dz = 0.42 * p; cx = 0.5 + 0.04 * math.sin(p * math.pi * 0.9 - 0.4); cy = 0.5
    elif mv == "look_r":
        z = 1.09 + 0.10 * p; dz = 0.16 * p; cx = 0.22 + 0.56 * ease_io(p); cy = 0.5
    else:  # look_l
        z = 1.09 + 0.10 * p; dz = 0.16 * p; cx = 0.78 - 0.56 * ease_io(p); cy = 0.5
    hv = hv1 / z
    wv = hv * aspect
    cxp = wv / 2 + (W - wv) * cx if W > wv else W / 2
    cyp = H / 2 + (H - hv) * (cy - 0.5)
    cxp += bob_x * wv; cyp += bob_y * hv
    xs = np.linspace(-0.5, 0.5, OW, dtype=np.float32)[None, :] * wv
    ys = np.linspace(-0.5, 0.5, OH, dtype=np.float32)[:, None] * hv
    cr, sr = math.cos(roll), math.sin(roll)
    bx = cxp + xs * cr - ys * sr
    by = cyp + xs * sr + ys * cr
    d = cv2.remap(D, bx, by, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    # olhar girando: parallax lateral (perto anda mais que o fundo)
    par = {"look_r": 1.0, "look_l": -1.0}.get(mv, 0.0)
    off = (p - 0.5) * 0.06 * wv * (d - 0.5) * par
    mx = bx + off
    my = by
    outs = []
    nb = 5 if blur > 0.01 else 1
    for kb in range(nb):
        k = (1.0 + dz * (d - 0.3)) * (1 + blur * kb / max(nb - 1, 1))
        mxx = cxp + (mx - cxp) / k
        myy = cyp + (my - cyp) / k
        outs.append(cv2.remap(im, mxx, myy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT))
    return outs[0] if nb == 1 else np.mean(outs, axis=0)

# ---------------- UI ----------------
def font(p, s): return ImageFont.truetype(p, int(round(s * S)))

def text_layer(lines, f, color, spacing, align="left", track=0):
    dummy = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    widths = [dummy.textlength(l, font=f) + track * (len(l) - 1) for l in lines]
    lh = f.size * spacing
    pad = int(24 * S)
    w = int(max(widths)) + 2 * pad
    h = int(lh * len(lines) + f.size * 0.35) + 2 * pad
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0)); sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dr, ds = ImageDraw.Draw(img), ImageDraw.Draw(sh)
    for i, l in enumerate(lines):
        x = pad if align == "left" else (w - widths[i]) / 2
        y = pad + i * lh
        if track:
            for ch in l:
                dr.text((x, y), ch, font=f, fill=color + (255,)); ds.text((x, y + 3 * S), ch, font=f, fill=(0, 0, 0, 210))
                x += dummy.textlength(ch, font=f) + track
        else:
            dr.text((x, y), l, font=f, fill=color + (255,)); ds.text((x, y + 3 * S), l, font=f, fill=(0, 0, 0, 210))
    sh = sh.filter(ImageFilter.GaussianBlur(10 * S))
    img = Image.alpha_composite(Image.alpha_composite(sh, sh), img)
    return np.asarray(img).astype(np.float32) / 255.0

def blit(frame, layer, x, y, alpha):
    if alpha <= 0.001: return
    h, w = layer.shape[:2]; x, y = int(round(x)), int(round(y))
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, OW), min(y + h, OH)
    if x1 <= x0 or y1 <= y0: return
    L = layer[y0 - y:y1 - y, x0 - x:x1 - x]
    a = L[..., 3:4] * alpha
    frame[y0:y1, x0:x1] = frame[y0:y1, x0:x1] * (1 - a) + L[..., :3] * 255.0 * a

def expo_out(x): x = clamp01(x); return 1 - 2 ** (-10 * x) if x < 1 else 1.0
def p3_in(x): return clamp01(x) ** 3

UI_X = 72 * S
TITLE_BOTTOM = (1250 if V else 960) * S
layers = []
for L in LINES:
    if L.get("cta"): layers.append(None); continue
    hook = L.get("hook")
    big = (112 if hook else 84) if V else (100 if hook else 74)
    layers.append((text_layer([L["eyebrow"]], font(FONT_SB, 34 if V else 30), GOLD, 1.2, track=int(5 * S)),
                   text_layer(L["title"].split("\n"), font(FONT_XB, big), WHITE, 1.08)))
cta_eb = text_layer(["GOSTOU DA CASA?"], font(FONT_SB, 36 if V else 32), GOLD, 1.2, align="center", track=int(5 * S))
cta_title = text_layer(["AGENDE SUA", "VISITA"], font(FONT_XB, 124 if V else 110), WHITE, 1.05, align="center")
cta_sub = text_layer(["Toque no botão abaixo e", "fale com a gente"] if V else ["Toque no botão e fale com a gente"],
                     font(FONT_SB, 48 if V else 42), WHITE, 1.25, align="center")
def arrow_layer():
    s = int(120 * S); img = Image.new("RGBA", (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(img); c = s // 2; w = max(3, int(12 * S))
    d.line([(c, int(12 * S)), (c, s - int(22 * S))], fill=GOLD + (255,), width=w)
    d.line([(c - int(34 * S), s - int(56 * S)), (c, s - int(20 * S)), (c + int(34 * S), s - int(56 * S))], fill=GOLD + (255,), width=w, joint="curve")
    return np.asarray(img).astype(np.float32) / 255.0
ARROW = arrow_layer()

yy = np.linspace(0, 1, OH, dtype=np.float32)[:, None]; xx = np.linspace(0, 1, OW, dtype=np.float32)[None, :]
def smooth(a, b, x):
    x = np.clip((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x)
vig = 1 - 0.26 * np.clip(((xx - 0.5) ** 2 + (yy - 0.5) ** 2) * 2.2, 0, 1)
tb = TITLE_BOTTOM / OH
shade = (1 - 0.50 * smooth(tb - 0.30, tb + 0.02, yy)) * (1 - 0.28 * smooth(0.14, 0.0, yy))
VIG = (vig * shade)[..., None]; VIG_CTA = (vig * 0.55)[..., None]
CI = len(LINES) - 1

def draw_ui(frame, t):
    for i, L in enumerate(LINES):
        if L.get("cta"): continue
        b0, b1 = blocks[i]
        hook = L.get("hook")
        tin = 0.0 if hook else b0 + 0.25
        tout = b1 - 0.15
        if t < tin - 0.01 or t > tout + 0.3: continue
        eb, tl = layers[i]
        ko = p3_in((t - (tout - 0.28)) / 0.28)
        out_a, out_dy = 1 - ko, -30 * S * ko
        if hook and t < 0.6:
            a1 = a2 = 1.0; dy1 = dy2 = 0.0; bar_k = 1.0
        else:
            a1 = expo_out((t - tin) / 0.5); dy1 = 40 * S * (1 - expo_out((t - tin) / 0.55))
            a2 = expo_out((t - tin - 0.12) / 0.5); dy2 = 60 * S * (1 - expo_out((t - tin - 0.12) / 0.6))
            bar_k = expo_out((t - tin) / 0.7)
        y_t = TITLE_BOTTOM - tl.shape[0]; y_e = y_t - eb.shape[0] + 18 * S
        ba = min(a1, out_a)
        bh = int((tl.shape[0] + eb.shape[0] - 70 * S) * bar_k)
        if ba > 0 and bh > 0:
            bw = int(6 * S); bx = int(UI_X - 2 * S); byb = int(TITLE_BOTTOM - 26 * S + out_dy)
            frame[max(byb - bh, 0):byb, bx:bx + bw] = frame[max(byb - bh, 0):byb, bx:bx + bw] * (1 - ba) + np.array(GOLD) * ba
        blit(frame, eb, UI_X - 2 * S, y_e + dy1 + out_dy, a1 * out_a)
        blit(frame, tl, UI_X - 6 * S, y_t + dy2 + out_dy, a2 * out_a)
    tin = vo_starts[CI] - 0.1
    if t >= tin:
        cy = OH * (0.38 if V else 0.34)
        a0 = expo_out((t - tin) / 0.5)
        blit(frame, cta_eb, (OW - cta_eb.shape[1]) / 2, cy - cta_eb.shape[0] + 14 * S + 30 * S * (1 - a0), a0)
        a1 = expo_out((t - tin - 0.1) / 0.55)
        blit(frame, cta_title, (OW - cta_title.shape[1]) / 2, cy + 70 * S * (1 - a1), a1)
        y2 = cy + cta_title.shape[0] + 6 * S
        a2 = expo_out((t - tin - 1.0) / 0.5)
        blit(frame, cta_sub, (OW - cta_sub.shape[1]) / 2, y2 + 40 * S * (1 - a2), a2)
        a3 = expo_out((t - tin - 1.6) / 0.4)
        blit(frame, ARROW, (OW - ARROW.shape[1]) / 2, y2 + cta_sub.shape[0] + 16 * S + 18 * S * abs(math.sin((t - tin) * 3.2)), a3)

ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OW}x{OH}", "-r", str(FPS), "-i", "-",
                       "-c:v", "libx264", "-crf", "24" if PREVIEW else "16", "-preset", "veryfast" if PREVIEW else "medium",
                       "-pix_fmt", "yuv420p", OUT], stdin=subprocess.PIPE)
events = [dict(t=sc["t0"], kind="whoosh" if scenes[i - 1]["line"] != sc["line"] else "soft") for i, sc in enumerate(scenes) if i > 0]
for f in range(NF):
    t = f / FPS
    act = [sc for sc in scenes if sc["t0"] - XF / 2 <= t < sc["t1"] + XF / 2]
    if len(act) == 1:
        sc = act[0]
        # desfoque de movimento nas pontas (velocidade alta)
        T0 = sc["t0"] - XF / 2; u = (t - T0) / (sc["t1"] + XF / 2 - T0)
        v = walkvel(u)
        frame = render_scene(sc, t, blur=max(0.0, (v - 1.6)) * 0.012 if sc["mv"] == "walk" else 0.0)
    else:
        a, b = act[0], act[-1]
        w = ease_io((t - (b["t0"] - XF / 2)) / XF)
        bl = 0.035 * math.sin(math.pi * w)
        fa = render_scene(a, t, blur=bl); fb = render_scene(b, t, blur=bl)
        frame = fa * (1 - w) + fb * w
        # leve "flash" de luz na passagem
        frame = frame * (1 + 0.10 * math.sin(math.pi * w))
    if t >= vo_starts[CI] - 0.4:
        k = ease_io((t - (vo_starts[CI] - 0.4)) / 0.7)
        frame = frame * (VIG * (1 - k) + VIG_CTA * k)
    else:
        frame = frame * VIG
    draw_ui(frame, t)
    ff.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
ff.stdin.close(); ff.wait()
json.dump(dict(total=TOTAL, vo_starts=vo_starts, durs=durs, events=events, cta=vo_starts[CI]), open(OUT + ".json", "w"), indent=1)
print("ok", round(TOTAL, 2), NF)
