"""Trilha sintetizada + SFX + narração -> mix.wav
uso: python3 -I audio.py <timeline.json> <vo_dir> <out.wav>
"""
import sys, json, numpy as np, wave
TL, VO, OUT = sys.argv[1:4]
J = json.load(open(TL))
SR = 48000
T = J["total"]
N = int(T * SR) + SR
rng = np.random.default_rng(7)

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)

def lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    # filtro one-pole vetorizado via lfilter manual (simples)
    from itertools import accumulate
    out = np.zeros_like(x)
    acc = 0.0
    for i in range(0, len(x), 4096):
        seg = x[i:i + 4096]
        o = np.empty_like(seg)
        for j, v in enumerate(seg):
            acc = (1 - a) * v + a * acc
            o[j] = acc
        out[i:i + 4096] = o
    return out

try:
    from scipy.signal import lfilter, butter
    def lp(x, fc, order=2):
        b, a = butter(order, fc / (SR / 2), "low"); return lfilter(b, a, x)
    def hp(x, fc, order=2):
        b, a = butter(order, fc / (SR / 2), "high"); return lfilter(b, a, x)
    def bp(x, lo, hi):
        b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], "band"); return lfilter(b, a, x)
except ImportError:
    raise SystemExit("instale scipy")

BPM = 92
beat = 60 / BPM
bar = beat * 4
# progressão: Fmaj9 - Am7 - Dm9 - Bbmaj7(#11)
CH = [[53, 57, 60, 64, 67], [57, 60, 64, 67, 71], [50, 57, 60, 64, 65], [46, 53, 57, 62, 64]]
BASS = [41, 45, 38, 46]
t = np.arange(N) / SR
music = np.zeros(N)

# pad
pad = np.zeros(N)
nb = int(T / bar) + 2
for b in range(nb):
    ch = CH[b % 4]
    s0 = int(b * bar * SR); s1 = min(N, int((b + 1) * bar * SR + 0.6 * SR))
    if s0 >= N: break
    tt = np.arange(s1 - s0) / SR
    env = np.minimum(1, tt / 0.8) * np.minimum(1, np.maximum(0, (bar + 0.6 - tt) / 0.9))
    seg = np.zeros(s1 - s0)
    for n in ch:
        f = midi(n)
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12)
            ph = rng.random() * 2 * np.pi
            seg += (np.sin(2 * np.pi * ff * tt + ph) * 0.6 + 0.25 * np.sin(4 * np.pi * ff * tt + ph))
    pad[s0:s1] += seg * env
pad = lp(pad, 1800) * 0.022

# baixo
bass = np.zeros(N)
for b in range(nb):
    s0 = int(b * bar * SR)
    if s0 >= N: break
    for k in (0, 2.5):
        st = s0 + int(k * beat * SR); L = int(beat * 1.4 * SR)
        if st + L > N: L = N - st
        if L <= 0: continue
        tt = np.arange(L) / SR
        f = midi(BASS[b % 4])
        bass[st:st + L] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.2) * np.minimum(1, tt / 0.01)
bass = lp(bass, 400) * 0.16

# pluck arpejo (Karplus-Strong)
def pluck(f, dur):
    L = int(SR / f); buf = rng.uniform(-1, 1, L)
    n = int(dur * SR); out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % L]
        buf[i % L] = 0.5 * (buf[i % L] + buf[(i + 1) % L]) * 0.996
    return out
arp = np.zeros(N)
pat = [0, 2, 1, 3, 4, 3, 2, 1]
pcache = {}
for b in range(nb):
    ch = CH[b % 4]
    for k in range(8):
        st = int((b * bar + k * beat / 2) * SR)
        if st >= N: break
        n = ch[pat[k] % len(ch)] + 12
        if n not in pcache: pcache[n] = pluck(midi(n), 0.9)
        p = pcache[n]; L = min(len(p), N - st)
        arp[st:st + L] += p[:L] * (0.9 if k % 2 == 0 else 0.6)
arp = lp(arp, 3500) * 0.05

# bateria suave (entra após o gancho)
drums = np.zeros(N)
hook_end = J["hook_end"]
def kick():
    L = int(0.35 * SR); tt = np.arange(L) / SR
    f = 45 + 80 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
K = kick()
HAT = lp(hp(rng.uniform(-1, 1, int(0.05 * SR)), 7000), 11000) * np.exp(-np.arange(int(0.05 * SR)) / SR * 70)
CLAP = bp(rng.uniform(-1, 1, int(0.18 * SR)), 900, 4000) * np.exp(-np.arange(int(0.18 * SR)) / SR * 22)
cta = J["cta"]
for b in range(nb):
    for k in range(8):
        tb = b * bar + k * beat / 2
        if tb < hook_end - 0.01 or tb > T - 1.2: continue
        st = int(tb * SR)
        if k in (0, 4, 5) and st + len(K) < N: drums[st:st + len(K)] += K * (0.55 if k != 5 else 0.3)
        if k in (2, 6) and st + len(CLAP) < N: drums[st:st + len(CLAP)] += CLAP * 0.10
        if k % 2 == 1 and st + len(HAT) < N: drums[st:st + len(HAT)] += HAT * 0.07
drums *= 0.5

music = pad + bass + arp + drums
# fim: corta suave nos últimos 0.6s
fade = np.clip((T - t) / 0.6, 0, 1)
music *= fade
# leve entrada
music *= np.clip(t / 0.15, 0, 1)

# narração
def readwav(p):
    with wave.open(p) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    return x
voice = np.zeros(N)
for i, st in enumerate(J["vo_starts"]):
    x = readwav(f"{VO}/l{i+1}.wav")
    s = int(st * SR); voice[s:s + len(x)] += x[:N - s]

# ducking: envelope da voz
env = np.abs(voice)
from scipy.ndimage import maximum_filter1d, uniform_filter1d
env = maximum_filter1d(env, int(0.25 * SR))
env = uniform_filter1d(env, int(0.15 * SR))
env = np.clip(env / (env.max() * 0.25 + 1e-9), 0, 1)
duck = 1 - 0.50 * env  # ~ -7 dB a mais sob a voz
# sobe no CTA após a fala
music *= duck

# SFX
sfx = np.zeros(N)
def whoosh(dur=0.5, strength=1.0):
    L = int(dur * SR); tt = np.arange(L) / SR
    nz = rng.uniform(-1, 1, L)
    # varredura de filtro: banda subindo
    out = np.zeros(L)
    segs = 16
    for k in range(segs):
        a, b = int(k * L / segs), int((k + 1) * L / segs)
        fc = 300 + 5000 * (k / segs) ** 1.5
        y = bp(nz, fc * 0.6, min(fc * 1.6, SR / 2 - 100))
        out[a:b] = y[a:b]
    env = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 2
    return out * env * strength
W = whoosh(0.6, 0.34); Ws = whoosh(0.4, 0.14)
for ev in J["events"]:
    w = W if ev["kind"] == "whoosh" else Ws
    st = int((ev["t"] - len(w) / SR * 0.5) * SR)  # pico perto do corte
    if st < 0: continue
    L = min(len(w), N - st); sfx[st:st + L] += w[:L]
# ding no CTA
def ding(f=1318.5, dur=1.2):
    L = int(dur * SR); tt = np.arange(L) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.01 * tt)) * np.exp(-tt * 4) * np.minimum(1, tt / 0.003)
D = ding() * 0.09
st = int((cta + 1.4) * SR); sfx[st:st + len(D)] += D[:N - st]
# impacto suave no frame 0 (gancho)
I = lp(rng.uniform(-1, 1, int(0.8 * SR)), 180) * np.exp(-np.arange(int(0.8 * SR)) / SR * 5) * 0.5
sfx[:len(I)] += I

mix = voice * 1.0 + music * 1.0 + sfx
mix = mix[:int(T * SR)]
mix = np.stack([mix, mix], 1)
# leve alargamento estéreo da música
m2 = (music[:int(T * SR)])
mix[:, 0] += 0.0;
peak = np.abs(mix).max()
mix = mix / peak * 0.8
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
import os
if os.environ.get("STEMS"):
    for nm, x in (("voice", voice), ("music", music), ("sfx", sfx)):
        x = x[:int(T * SR)] / peak * 0.8
        with wave.open(OUT.replace(".wav", f"_{nm}.wav"), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
print("ok", T)
