"""Tour cinematográfico 3D: reconstrução por profundidade (Depth Anything V2) + câmera virtual
com ray-marching por pixel (dolly, órbita, grua, pan), água animada, bloom nas luzes,
transições em chicote com motion blur e grade de cor.
uso: python3 -I render3.py <work_dir> <vo_dir> <out.mp4> <vertical|horizontal> [preview] [workers]
"""
import sys, os, json, subprocess, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
cv2.setNumThreads(1)

WORK, VO, OUT, FMT = sys.argv[1:5]
PREVIEW = len(sys.argv) > 5 and sys.argv[5] == "preview"
NW = int(sys.argv[6]) if len(sys.argv) > 6 else 4
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

# movimentos: dolly, dolly_l, dolly_r, orbit_l, orbit_r, crane, pan_l, pan_r
LINES = [
    dict(scenes=[("img02", "crane")], eyebrow="TOUR PELA CASA", title="VEM CONHECER\nESSA CASA", hook=True),
    dict(scenes=[("img01", "pan_l"), ("img03", "dolly_l")], eyebrow="SALA INTEGRADA", title="Ampla, com LED\nno teto"),
    dict(scenes=[("img07", "orbit_r"), ("img04", "dolly")], eyebrow="PORTAS DE VIDRO", title="Abertas para\na piscina"),
    dict(scenes=[("img02", "orbit_l")], eyebrow="ÁREA DA PISCINA", title="Perfeita para\nrelaxar"),
    dict(scenes=[("img05", "orbit_r"), ("img11", "dolly_r")], eyebrow="COZINHA", title="Planejada com\nilha central"),
    dict(scenes=[("img10", "pan_r")], eyebrow="QUARTO", title="Amplo e bem\niluminado"),
    dict(scenes=[("img12", "dolly")], eyebrow="QUARTO", title="Ótimo espaço e\njanela grande"),
    dict(scenes=[("img09", "orbit_l")], eyebrow="BANHEIRO", title="Box de vidro e\nacabamento moderno"),
    dict(scenes=[("img14", "dolly_l")], eyebrow="QUARTO", title="Mesmo padrão\nde acabamento"),
    dict(scenes=[("img13", "orbit_r")], eyebrow="BANHEIRO", title="Acabamento\nmoderno"),
    dict(scenes=[("img08", "dolly")], eyebrow="ÁREA EXTERNA", title="Muro alto e\nconcertina"),
    dict(scenes=[("img06", "crane")], cta=True),
]
# a 1ª fala do roteiro de voz cobre as linhas 0 e 1 (gancho + sala); mapeia falas -> linhas
VO_OF_LINE = [None, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
MIN_SCENE = 4.0
LEAD = 0.4
TAIL = 2.4
WHIP = 0.30        # meia duração da transição em chicote

durs_vo = [float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{VO}/l{i+1}.wav"]))
           for i in range(11)]
blocks, vo_starts = [], []
t = 0.0
for i, L in enumerate(LINES):
    n = len(L["scenes"])
    if i == 0:
        d = 3.2            # gancho só com imagem + texto + música
        vo_starts.append(None)
    else:
        vi = VO_OF_LINE[i] - 1
        lead = 0.35
        tail = TAIL if L.get("cta") else 0.6
        d = max(lead + durs_vo[vi] + tail, n * MIN_SCENE)
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
# direção do chicote alterna
for i, sc in enumerate(scenes):
    sc["whip_in"] = 0 if i == 0 else (1 if i % 2 else -1)
    sc["whip_out"] = 0 if i == len(scenes) - 1 else (1 if (i + 1) % 2 else -1)

# ---------------- cena 3D ----------------
SRC_HFOV = math.radians(92)
cache = {}
def load(name):
    if name not in cache:
        bgr = cv2.imread(f"{WORK}/{name}.jpg")
        im = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32)
        H, W = im.shape[:2]
        d = np.load(f"{WORK}/{name}_depth.npy").astype(np.float32)
        d = cv2.GaussianBlur(d, (0, 0), 7)
        dmin = 1 / 7.0
        Z = 1.0 / (dmin + d * (1 - dmin))       # 1 (perto) .. 7 (fundo)
        # máscara de água/LED da piscina (azul/magenta saturado)
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
        h, s, v = hsv[..., 0] * 2, hsv[..., 1] / 255, hsv[..., 2] / 255
        water = ((h > 195) & (h < 330) & (s > 0.35) & (v > 0.25)).astype(np.float32)
        water = cv2.GaussianBlur(cv2.morphologyEx(water, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)), (0, 0), 6)
        # luzes (LED/spots) para bloom
        lum = im.mean(axis=2) / 255
        lights = np.clip((lum - 0.80) / 0.2, 0, 1).astype(np.float32)
        f = (W / 2) / math.tan(SRC_HFOV / 2)
        cache[name] = dict(im=im, Z=Z.astype(np.float32), water=water, lights=lights, f=f, W=W, H=H)
    return cache[name]

def rot(yaw, pitch, roll):
    cy, sy = math.cos(yaw), math.sin(yaw)
    cp, sp = math.cos(pitch), math.sin(pitch)
    cr, sr = math.cos(roll), math.sin(roll)
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]])   # pitch>0 olha para baixo (y para baixo)
    Rz = np.array([[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]])
    return (Ry @ Rx @ Rz).astype(np.float32)

def clamp01(x): return min(max(x, 0.0), 1.0)
def ease_io(x): x = clamp01(x); return 0.5 - 0.5 * math.cos(math.pi * x)
def smoothstep(x): x = clamp01(x); return x * x * (3 - 2 * x)

AMT = 1.0 if V else 0.45     # no 16:9 sobra menos imagem nas bordas
def camera(mv, p, tt):
    """posição C (x dir, y baixo, z frente), yaw, pitch, roll, zoom"""
    e = ease_io(p) * 0.8 + p * 0.2
    bob = 0.004 * math.sin(2 * math.pi * 0.55 * tt)        # respiração do gimbal
    yaw = pitch = roll = 0.0; C = [0.0, 0.0, 0.0]; z = 1.12 if V else 1.20
    if mv.startswith("dolly"):
        C = [0.0, -0.03 * e, 0.62 * e]
        side = {"dolly_l": -1, "dolly_r": 1}.get(mv, 0)
        yaw = math.radians(7 * AMT) * side * (e - 0.3)
        C[0] = 0.10 * side * e * AMT
    elif mv.startswith("orbit"):
        side = 1 if mv == "orbit_r" else -1
        D = 2.6
        th = math.radians(13 * AMT) * side * (e - 0.5) * 2
        C = [D * math.sin(th), -0.04 * e, D * (1 - math.cos(th)) + 0.22 * e]
        yaw = -th
    elif mv == "crane":
        C = [0.0, -0.30 * e * (1 if V else 0.6), 0.30 * e]
        pitch = math.radians(-4 + 9 * e) * (1 if V else 0.6)
    elif mv.startswith("pan"):
        side = 1 if mv == "pan_r" else -1
        yaw = math.radians(17 * AMT) * side * (e - 0.5) * 2
        C = [0.0, 0.0, 0.25 * e]
    pitch += bob * 0.6; roll += bob * 0.5
    return np.array(C, np.float32), yaw, pitch, roll, z

GX = None
def render_view(sc, C, R, zoom, tt, light_gain=1.0):
    global GX
    A = load(sc["img"])
    W, H, f = A["W"], A["H"], A["f"]
    # câmera de saída: mesma altura de campo vertical da foto
    f_out = f * (OH / H) * zoom * (1 if V else (OW / W) / (OH / H))
    if GX is None:
        GX = ((np.arange(OW, dtype=np.float32) + 0.5 - OW / 2)[None, :] * np.ones((OH, 1), np.float32),
              (np.arange(OH, dtype=np.float32) + 0.5 - OH / 2)[:, None] * np.ones((1, OW), np.float32))
    rx = GX[0] / f_out; ry = GX[1] / f_out
    # raio no mundo
    dx = R[0, 0] * rx + R[0, 1] * ry + R[0, 2]
    dy = R[1, 0] * rx + R[1, 1] * ry + R[1, 2]
    dz = R[2, 0] * rx + R[2, 1] * ry + R[2, 2]
    dz = np.maximum(dz, 1e-3)
    Zw = np.full((OH, OW), 3.0, np.float32)
    cx, cy = W / 2, H / 2
    for it in range(6):
        lam = (Zw - C[2]) / dz
        X = C[0] + lam * dx; Y = C[1] + lam * dy
        Zs = np.maximum(C[2] + lam * dz, 0.05)
        sx = (f * X / Zs + cx).astype(np.float32); sy = (f * Y / Zs + cy).astype(np.float32)
        Znew = cv2.remap(A["Z"], sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        Zw = Zw * 0.35 + Znew * 0.65 if it < 3 else Znew
    lam = (Zw - C[2]) / dz
    X = C[0] + lam * dx; Y = C[1] + lam * dy; Zs = np.maximum(C[2] + lam * dz, 0.05)
    sx = (f * X / Zs + cx).astype(np.float32); sy = (f * Y / Zs + cy).astype(np.float32)
    # água: refração animada dentro da máscara
    wm = cv2.remap(A["water"], sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    if wm.max() > 0.05:
        ph = tt * 1.6
        ox = (np.sin(sy * 0.045 + ph * 2.1) + 0.6 * np.sin(sx * 0.031 - ph * 1.3 + sy * 0.02)) * 2.2
        oy = (np.cos(sx * 0.040 + ph * 1.7) + 0.6 * np.sin(sy * 0.052 + ph * 2.6)) * 1.6
        sx = sx + wm * ox; sy = sy + wm * oy
    img = cv2.remap(A["im"], sx, sy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    if wm.max() > 0.05:
        caust = (np.sin(sx * 0.035 + 2.2 * np.sin(sy * 0.021 + tt * 0.9) + tt * 1.3) * np.sin(sy * 0.042 + 2.0 * np.sin(sx * 0.027 - tt * 0.7) - tt * 1.1)) ** 4
        caust = cv2.GaussianBlur(caust.astype(np.float32), (0, 0), 1.5)
        img = img * (1 + wm[..., None] * (0.16 * caust[..., None] - 0.03))
    lt = cv2.remap(A["lights"], sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    return img, lt * light_gain

def grade(img, lights):
    small = cv2.resize(lights, (OW // 4, OH // 4), interpolation=cv2.INTER_AREA)
    glow = cv2.GaussianBlur(small, (0, 0), 5 * S + 2) * 0.6 + cv2.GaussianBlur(small, (0, 0), 16 * S + 4) * 0.5
    glow = cv2.resize(glow, (OW, OH), interpolation=cv2.INTER_LINEAR)[..., None]
    x = img / 255.0
    x = x + glow * np.array([1.0, 0.84, 0.62], np.float32) * 0.35
    # contraste suave em S + rolagem de altas luzes
    x = 0.5 + (x - 0.5) * 1.08
    hi = 0.86
    x = np.where(x > hi, hi + (1 - np.exp(-(x - hi) / (1 - hi))) * (1 - hi), x)
    x = np.maximum(x, 0) ** 1.04
    lum = (x * np.array([0.3, 0.59, 0.11], np.float32)).sum(axis=2, keepdims=True)
    x = lum + (x - lum) * 1.14
    x = x + (0.03 * (1 - lum)) * np.array([-0.3, 0.05, 0.35], np.float32) + (0.03 * lum) * np.array([0.35, 0.12, -0.3], np.float32)
    return np.clip(x * 255.0, 0, 255)

def scene_frame(sc, t):
    T0, T1 = sc["t0"] - WHIP, sc["t1"] + WHIP
    u = (t - T0) / (T1 - T0)
    tt = t - T0
    C, yaw, pitch, roll, zoom = camera(sc["mv"], clamp01(u), tt)
    blur = 0.0
    # chicote de saída / entrada: giro rápido + desfoque direcional
    if sc["whip_out"] and t > sc["t1"] - WHIP:
        k = clamp01((t - (sc["t1"] - WHIP)) / (2 * WHIP))
        a = k ** 2.2
        yaw += sc["whip_out"] * math.radians(42) * a
        blur = max(blur, a)
    if sc["whip_in"] and t < sc["t0"] + WHIP:
        k = clamp01(((sc["t0"] + WHIP) - t) / (2 * WHIP))
        a = k ** 2.2
        yaw -= sc["whip_in"] * math.radians(42) * a
        blur = max(blur, a)
    gain = 1.0
    if sc["line"] == 0:
        gain = 0.55 + 0.45 * smoothstep((t - 0.2) / 1.4)    # luzes "acendendo" no gancho
    img, lt = render_view(sc, C, rot(yaw, pitch, roll), zoom, tt, gain)
    if sc["line"] == 0 and t < 1.6:
        img = img * (0.86 + 0.14 * smoothstep((t - 0.1) / 1.4))
    if blur > 0.02:
        L = int(1 + blur ** 1.3 * 300 * S)
        img = cv2.blur(img, (L, 1)); lt = cv2.blur(lt, (L, 1))
    return img, lt

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


# ---------------- loop (paralelo por blocos de quadros) ----------------
def render_frame(f):
    t = f / FPS
    act = [sc for sc in scenes if sc["t0"] - WHIP <= t < sc["t1"] + WHIP]
    if len(act) == 1:
        img, lt = scene_frame(act[0], t)
    else:
        a, b = act[0], act[-1]
        w = smoothstep((t - (b["t0"] - 0.06)) / 0.12)
        if w <= 0.0: img, lt = scene_frame(a, t)
        elif w >= 1.0: img, lt = scene_frame(b, t)
        else:
            ia, la = scene_frame(a, t); ib, lb = scene_frame(b, t)
            img = ia * (1 - w) + ib * w; lt = la * (1 - w) + lb * w
    frame = grade(img, lt)
    if t >= vo_starts[CI] - 0.4:
        k = ease_io((t - (vo_starts[CI] - 0.4)) / 0.7)
        frame = frame * (VIG * (1 - k) + VIG_CTA * k)
    else:
        frame = frame * VIG
    rng = np.random.default_rng(f)
    frame += rng.normal(0, 2.2, (OH, OW, 1)).astype(np.float32)
    draw_ui(frame, t)
    return np.clip(frame, 0, 255).astype(np.uint8)

def worker(wi, f0, f1, path):
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OW}x{OH}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-crf", "24" if PREVIEW else "15", "-preset", "veryfast" if PREVIEW else "medium",
                           "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        ff.stdin.write(render_frame(f).tobytes())
    ff.stdin.close(); ff.wait()

if __name__ == "__main__":
    import multiprocessing as mp
    only = os.environ.get("FRAMES")  # ex "0,90,300" para conferir quadros
    if only:
        for f in map(int, only.split(",")):
            Image.fromarray(render_frame(f)).save(f"{OUT}_f{f:05d}.png")
        sys.exit(0)
    bounds = np.linspace(0, NF, NW + 1).astype(int)
    parts = [f"{OUT}.part{i}.mp4" for i in range(NW)]
    ps = [mp.Process(target=worker, args=(i, bounds[i], bounds[i + 1], parts[i])) for i in range(NW)]
    [p.start() for p in ps]; [p.join() for p in ps]
    with open(OUT + ".txt", "w") as fl:
        fl.writelines(f"file '{os.path.abspath(p)}'\n" for p in parts)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", OUT + ".txt", "-c", "copy", OUT], check=True)
    for p in parts: os.remove(p)
    vs = [v for v in vo_starts]
    json.dump(dict(total=TOTAL, vo_starts=vs, durs=durs_vo, vo_line_of=VO_OF_LINE,
                   events=[dict(t=sc["t0"], kind="whoosh") for sc in scenes[1:]], cta=vo_starts[CI]), open(OUT + ".json", "w"), indent=1)
    print("ok", round(TOTAL, 2), NF)
