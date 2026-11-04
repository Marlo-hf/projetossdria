"""Tour 2.5D: parallax por profundidade (Depth Anything V2) + títulos + CTA.
uso: python3 -I render.py <work_dir> <vo_dir> <out.mp4> <vertical|horizontal> [preview]
"""
import sys, json, subprocess, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WORK, VO, OUT, FMT = sys.argv[1:5]
PREVIEW = len(sys.argv) > 5 and sys.argv[5] == "preview"
FPS = 30
OW, OH = (1080, 1920) if FMT == "vertical" else (1920, 1080)
if PREVIEW:
    OW, OH = OW // 2, OH // 2
S = OW / (1080 if FMT == "vertical" else 1920)  # escala de UI

FONT_B = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
FONT_XB = "/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf"
FONT_SB = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
import os
if not os.path.exists(FONT_XB):
    FONT_XB = FONT_B
GOLD = (232, 194, 122)
WHITE = (255, 255, 255)

# ---------------- roteiro ----------------
# cada linha de narração: cenas (imagem, movimento) + título
LINES = [
    dict(scenes=[("img02", "push")], eyebrow="TOUR PELA CASA", title="CASA NOVA\nCOM PISCINA", hook=True),
    dict(scenes=[("img01", "pan_r")], eyebrow="MODERNA", title="Pensada em\ncada detalhe"),
    dict(scenes=[("img03", "push"), ("img07", "pan_l")], eyebrow="ÁREA SOCIAL", title="Ampla, integrada\ne com vista p/ piscina"),
    dict(scenes=[("img05", "pan_r"), ("img06", "push"), ("img11", "pan_l")], eyebrow="COZINHA PLANEJADA", title="Ilha central e\nacabamento sofisticado"),
    dict(scenes=[("img04", "push")], eyebrow="ILUMINAÇÃO", title="LED embutido\nem cada ambiente"),
    dict(scenes=[("img10", "pan_r"), ("img12", "pan_l"), ("img14", "push")], eyebrow="QUARTOS", title="Espaçosos e\nbem iluminados"),
    dict(scenes=[("img09", "pan_l"), ("img13", "pan_r")], eyebrow="BANHEIROS", title="Box de vidro e\nacabamento moderno"),
    dict(scenes=[("img08", "push")], eyebrow="SEGURANÇA", title="Privacidade para\na sua família"),
    dict(scenes=[("img02", "pull")], cta=True),
]
GAP = 0.32
LEAD = 0.25
TAIL = 1.6
XF = 0.40  # crossfade

durs = []
for i in range(len(LINES)):
    p = f"{VO}/l{i+1}.wav"
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))
    durs.append(d)
t = LEAD
vo_starts = []
for i, d in enumerate(durs):
    vo_starts.append(t)
    t += d + GAP
TOTAL = vo_starts[-1] + durs[-1] + TAIL
NF = int(round(TOTAL * FPS))

# blocos: cada linha ocupa [start_i, start_{i+1}) ; a primeira começa em 0
blocks = []
for i, L in enumerate(LINES):
    b0 = 0.0 if i == 0 else vo_starts[i] - 0.12
    b1 = TOTAL if i == len(LINES) - 1 else vo_starts[i + 1] - 0.12
    blocks.append((b0, b1))
scenes = []
for i, L in enumerate(LINES):
    b0, b1 = blocks[i]
    n = len(L["scenes"])
    for k, (img, mv) in enumerate(L["scenes"]):
        s0 = b0 + (b1 - b0) * k / n
        s1 = b0 + (b1 - b0) * (k + 1) / n
        scenes.append(dict(img=img, mv=mv, t0=s0, t1=s1, line=i))

# ---------------- imagens + profundidade ----------------
cache = {}
def load(name):
    if name not in cache:
        im = cv2.imread(f"{WORK}/{name}.jpg", cv2.IMREAD_COLOR)
        im = cv2.cvtColor(im, cv2.COLOR_BGR2RGB).astype(np.float32)
        # leve realce: contraste/saturação/calor
        hsv = cv2.cvtColor(im / 255.0, cv2.COLOR_RGB2HSV)
        hsv[..., 1] = np.clip(hsv[..., 1] * 1.12, 0, 1)
        im = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB) * 255.0
        im = np.clip((im - 128) * 1.06 + 128 + np.array([4, 1, -3]), 0, 255)
        d = np.load(f"{WORK}/{name}_depth.npy").astype(np.float32)
        d = cv2.GaussianBlur(d, (0, 0), 9)
        cache[name] = (im.astype(np.float32), d)
    return cache[name]

def ease_io(x):
    x = min(max(x, 0.0), 1.0)
    return 0.5 - 0.5 * math.cos(math.pi * x)

def render_scene(sc, t):
    im, D = load(sc["img"])
    H, W = D.shape
    dur = sc["t1"] - sc["t0"] + XF
    u = (t - sc["t0"]) / dur
    e = ease_io(u) * 0.85 + u * 0.15
    mv = sc["mv"]
    aspect = OW / OH
    # janela base (altura em px da fonte) para zoom 1
    hv1 = min(H, W / aspect)
    if mv == "push":
        z = 1.06 + 0.16 * e; cx = 0.5 + 0.03 * (e - 0.5); par = (0.0, 0.0); dz = 0.22 * e
    elif mv == "pull":
        z = 1.24 - 0.16 * e; cx = 0.5; par = (0.0, 0.0); dz = 0.20 * (1 - e)
    elif mv == "pan_r":
        z = 1.08 + 0.04 * e; cx = 0.18 + 0.64 * e; par = (1.0, 0.0); dz = 0.05 * e
    else:  # pan_l
        z = 1.08 + 0.04 * e; cx = 0.82 - 0.64 * e; par = (-1.0, 0.0); dz = 0.05 * e
    hv = hv1 / z
    wv = hv * aspect
    # centro em px, limitado à imagem
    cxp = wv / 2 + (W - wv) * cx if W > wv else W / 2
    cyp = H / 2
    xs = np.linspace(-0.5, 0.5, OW, dtype=np.float32)[None, :] * wv
    ys = np.linspace(-0.5, 0.5, OH, dtype=np.float32)[:, None] * hv
    bx = cxp + xs + 0 * ys
    by = cyp + ys + 0 * xs
    d = cv2.remap(D, bx, by, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    # parallax: perto (d~1) se desloca mais que longe
    amp = 0.045 * wv
    off = (e - 0.5) * amp * (d - 0.5)
    mx = bx + par[0] * off
    my = by + par[1] * off
    # dolly: objetos próximos crescem mais (3D)
    k = 1.0 + dz * (d - 0.35)
    mx = cxp + (mx - cxp) / k
    my = cyp + (my - cyp) / k
    out = cv2.remap(im, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    return out

# ---------------- UI (texto) ----------------
def font(p, s):
    return ImageFont.truetype(p, int(round(s * S)))

def text_layer(lines, f, color, spacing, shadow=True, align="left", track=0):
    """retorna RGBA numpy de um bloco de texto com sombra suave"""
    dummy = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    sizes = [dummy.textbbox((0, 0), l, font=f) for l in lines]
    lh = f.size * spacing
    w = max(b[2] + (track * (len(l) - 1) if track else 0) for b, l in zip(sizes, lines)) + int(40 * S)
    h = int(lh * len(lines) + f.size * 0.4) + int(40 * S)
    pad = int(20 * S)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dr, ds = ImageDraw.Draw(img), ImageDraw.Draw(sh)
    for i, l in enumerate(lines):
        bw = sizes[i][2] + (track * (len(l) - 1) if track else 0)
        x = pad if align == "left" else (w - bw) // 2
        y = pad + i * lh
        if track:
            cx_ = x
            for ch in l:
                dr.text((cx_, y), ch, font=f, fill=color + (255,))
                ds.text((cx_, y + 3 * S), ch, font=f, fill=(0, 0, 0, 200))
                cx_ += dummy.textlength(ch, font=f) + track
        else:
            dr.text((x, y), l, font=f, fill=color + (255,))
            ds.text((x, y + 3 * S), l, font=f, fill=(0, 0, 0, 200))
    if shadow:
        sh = sh.filter(ImageFilter.GaussianBlur(10 * S))
        base = Image.alpha_composite(sh, sh)
        img = Image.alpha_composite(base, img)
    return np.asarray(img).astype(np.float32) / 255.0

def blit(frame, layer, x, y, alpha):
    if alpha <= 0.001:
        return
    h, w = layer.shape[:2]
    x, y = int(round(x)), int(round(y))
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, OW), min(y + h, OH)
    if x1 <= x0 or y1 <= y0:
        return
    L = layer[y0 - y:y1 - y, x0 - x:x1 - x]
    a = L[..., 3:4] * alpha
    frame[y0:y1, x0:x1] = frame[y0:y1, x0:x1] * (1 - a) + L[..., :3] * 255.0 * a

def expo_out(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - 2 ** (-10 * x) if x < 1 else 1.0

def p3_in(x):
    x = min(max(x, 0.0), 1.0)
    return x ** 3

V = FMT == "vertical"
UI_X = 72 * S
# base (fundo) do bloco de título
TITLE_BOTTOM = (1250 if V else 960) * S
title_layers = []
for i, L in enumerate(LINES):
    if L.get("cta"):
        title_layers.append(None)
        continue
    hook = L.get("hook")
    big = (118 if hook else 86) if V else (104 if hook else 76)
    eb = text_layer([L["eyebrow"]], font(FONT_SB, 34 if V else 30), GOLD, 1.2, track=int(5 * S))
    tl = text_layer(L["title"].split("\n"), font(FONT_XB, big), WHITE, 1.08)
    title_layers.append((eb, tl))

cta_title = text_layer(["AGENDE SUA", "VISITA"], font(FONT_XB, 124 if V else 110), WHITE, 1.05, align="center")
cta_sub = text_layer(["Toque no botão abaixo e", "fale com a gente agora"] if V else ["Toque no botão e fale com a gente agora"],
                     font(FONT_SB, 46 if V else 42), WHITE, 1.25, align="center")
cta_eb = text_layer(["TOUR PELA CASA"], font(FONT_SB, 34 if V else 30), GOLD, 1.2, align="center", track=int(5 * S))

def arrow_layer():
    s = int(120 * S)
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = s // 2
    wdt = max(3, int(12 * S))
    d.line([(c, int(12 * S)), (c, s - int(22 * S))], fill=GOLD + (255,), width=wdt)
    d.line([(c - int(34 * S), s - int(56 * S)), (c, s - int(20 * S)), (c + int(34 * S), s - int(56 * S))], fill=GOLD + (255,), width=wdt, joint="curve")
    return np.asarray(img).astype(np.float32) / 255.0
ARROW = arrow_layer()

# vinheta + degradê inferior para leitura
yy = np.linspace(0, 1, OH, dtype=np.float32)[:, None]
xx = np.linspace(0, 1, OW, dtype=np.float32)[None, :]
vig = 1 - 0.28 * np.clip(((xx - 0.5) ** 2 + (yy - 0.5) ** 2 * (1 if V else 1)) * 2.2, 0, 1)
def smooth(a, b, x):
    x = np.clip((x - a) / (b - a), 0, 1)
    return x * x * (3 - 2 * x)
tb = TITLE_BOTTOM / OH
shade = 1 - 0.52 * smooth(tb - 0.30, tb + 0.02, yy)
shade = shade * (1 - 0.30 * smooth(0.14, 0.0, yy))  # topo
VIG = (vig * shade)[..., None]
VIG_CTA = (vig * 1.0)[..., None]

def draw_ui(frame, t):
    # títulos por linha
    for i, L in enumerate(LINES):
        if L.get("cta"):
            continue
        b0, b1 = blocks[i]
        tin = 0.0 if L.get("hook") else vo_starts[i] - 0.05
        tout = b1 - 0.02
        if t < tin - 0.01 or t > tout + 0.3:
            continue
        eb, tl = title_layers[i]
        out_a = 1 - p3_in((t - (tout - 0.25)) / 0.25)
        out_dy = -30 * S * p3_in((t - (tout - 0.25)) / 0.25)
        if L.get("hook") and t < 0.6:
            a1 = a2 = 1.0; dy1 = dy2 = 0.0  # visível desde o frame 0
            sc = 1.0
        else:
            a1 = expo_out((t - tin) / 0.45); dy1 = 40 * S * (1 - expo_out((t - tin) / 0.5))
            a2 = expo_out((t - tin - 0.1) / 0.45); dy2 = 60 * S * (1 - expo_out((t - tin - 0.1) / 0.55))
        y_t = TITLE_BOTTOM - tl.shape[0]
        y_e = y_t - eb.shape[0] + 14 * S
        # barra dourada
        bar_a = min(a1, out_a)
        if bar_a > 0:
            bw = int(6 * S); bh = int((tl.shape[0] + eb.shape[0] - 60 * S) * expo_out((t - tin) / 0.6 if not (L.get("hook") and t < 0.6) else 1))
            bx = int(UI_X - 4 * S); byb = int(TITLE_BOTTOM - 22 * S + out_dy)
            if bh > 0:
                frame[max(byb - bh, 0):byb, bx:bx + bw] = frame[max(byb - bh, 0):byb, bx:bx + bw] * (1 - bar_a) + np.array(GOLD) * bar_a
        blit(frame, eb, UI_X, y_e + dy1 + out_dy, a1 * out_a)
        blit(frame, tl, UI_X - 4 * S, y_t + dy2 + out_dy, a2 * out_a)
    # CTA
    ci = len(LINES) - 1
    tin = vo_starts[ci] - 0.05
    if t >= tin:
        cy = (OH * 0.40) if V else (OH * 0.36)
        a0 = expo_out((t - tin) / 0.45)
        blit(frame, cta_eb, (OW - cta_eb.shape[1]) / 2, cy - cta_eb.shape[0] + 10 * S + 30 * S * (1 - a0), a0)
        a1 = expo_out((t - tin - 0.08) / 0.5)
        sc_dy = 70 * S * (1 - a1)
        blit(frame, cta_title, (OW - cta_title.shape[1]) / 2, cy + sc_dy, a1)
        a2 = expo_out((t - tin - 0.9) / 0.5)
        y2 = cy + cta_title.shape[0] + 10 * S
        blit(frame, cta_sub, (OW - cta_sub.shape[1]) / 2, y2 + 40 * S * (1 - a2), a2)
        a3 = expo_out((t - tin - 1.4) / 0.4)
        bob = 18 * S * abs(math.sin((t - tin) * 3.2))
        y3 = y2 + cta_sub.shape[0] + 20 * S
        blit(frame, ARROW, (OW - ARROW.shape[1]) / 2, y3 + bob, a3)

# ---------------- loop ----------------
ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OW}x{OH}", "-r", str(FPS),
                       "-i", "-", "-c:v", "libx264", "-crf", "16" if not PREVIEW else "24", "-preset", "medium" if not PREVIEW else "veryfast",
                       "-pix_fmt", "yuv420p", OUT], stdin=subprocess.PIPE)
events = []
for si, sc in enumerate(scenes):
    if si > 0:
        events.append(dict(t=sc["t0"], kind="whoosh" if scenes[si - 1]["line"] != sc["line"] else "soft"))
ci = len(LINES) - 1
for f in range(NF):
    t = f / FPS
    act = [sc for sc in scenes if sc["t0"] - XF / 2 <= t < sc["t1"] + XF / 2]
    if len(act) == 1 or (len(act) and act[0]["t0"] <= 0.001 and t < XF / 2):
        frame = render_scene(act[-1], t)
    else:
        a, b = act[0], act[-1]
        w = ease_io((t - (b["t0"] - XF / 2)) / XF)
        frame = render_scene(a, t) * (1 - w) + render_scene(b, t) * w
    if t >= vo_starts[ci] - 0.3:
        k = ease_io((t - (vo_starts[ci] - 0.3)) / 0.6)
        frame = frame * (VIG * (1 - k) + VIG_CTA * 0.55 * k)
    else:
        frame = frame * VIG
    draw_ui(frame, t)
    if t > TOTAL - 0.5:
        frame *= max(0.0, (TOTAL - t) / 0.5) * 0.0 + 1.0  # sem fade p/ preto (anúncio em loop)
    ff.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
ff.stdin.close(); ff.wait()
json.dump(dict(total=TOTAL, vo_starts=vo_starts, durs=durs, events=events,
               cta=vo_starts[ci]), open(OUT + ".json", "w"), indent=1)
print("ok", TOTAL, NF)
