import sys, json, wave, numpy as np, subprocess
words = json.load(open(sys.argv[2])); out = sys.argv[3]
starts = ["Vem", "Tudo", "E", "Voltando", "Agora", "Esse", "O", "E", "Mais", "Na", "Gostou"]
# localizar o início de cada frase em ordem
idx, j = [], 0
for k, s in enumerate(starts):
    while not words[j]["w"].lower().startswith(s.lower()) or (k and s == "Esse" and "outro" not in words[j+1]["w"]) or (k and j and not words[j-1]["w"].endswith((".", ",", "?", "!"))):
        j += 1
    idx.append(j); j += 1
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", sys.argv[1], "-ar", "48000", "-ac", "1", out + "/full.wav"], check=True)
w = wave.open(out + "/full.wav"); SR = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
env = np.convolve(np.abs(x), np.ones(480) / 480, mode="same")
cuts = [0.0]
for k in idx[1:]:
    a, b = words[k - 1]["e"] - 0.12, words[k]["s"] + 0.12
    sa, sb = int(a * SR), int(b * SR)
    m = sa + int(np.argmin(env[sa:sb]))
    cuts.append(m / SR)
cuts.append(len(x) / SR)
for i in range(len(starts)):
    a, b = int(cuts[i] * SR), int(cuts[i + 1] * SR)
    seg = x[a:b].copy()
    # tira silêncio das pontas e faz fades de 12 ms
    nz = np.where(np.abs(seg) > 0.01)[0]
    if len(nz): seg = seg[max(nz[0] - int(0.03 * SR), 0):min(nz[-1] + int(0.08 * SR), len(seg))]
    f = int(0.012 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    with wave.open(f"{out}/l{i+1}.wav", "wb") as o:
        o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes((seg * 32767).astype(np.int16).tobytes())
    print(i + 1, round(len(seg) / SR, 2), " ".join(ww["w"] for ww in words[idx[i]:(idx[i + 1] if i + 1 < len(idx) else None)]))
