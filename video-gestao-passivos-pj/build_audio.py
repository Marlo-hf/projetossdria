import json, subprocess, numpy as np, wave, unicodedata
SR = 44100
script = json.load(open('script.json'))

def norm(w): return ''.join(c for c in unicodedata.normalize('NFD', w.lower()) if unicodedata.category(c) != 'Mn').strip('.,:?!')
def load_mp3(p):
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw, np.float32).copy()

LEAD, GAP, TAIL = 0.20, 0.30, 1.8
t = LEAD; scenes = []; voice_clips = []
for s in script:
    a = load_mp3(f"audio/{s['id']}.mp3")
    words = [{'w': w, 'n': norm(w), 's': round(t+a0, 3), 'e': round(t+a1, 3)} for a0, a1, w in json.load(open(f"audio/{s['id']}.mp3.json"))]
    toks = s['text'].split(); assert len(toks) == len(words), s['id']
    for w, tk in zip(words, toks): w['p'] = tk
    dur = len(a)/SR
    scenes.append({'id': s['id'], 'tag': s['tag'], 'start': round(t if s['id'] != 's1' else 0, 3), 'vstart': round(t,3), 'vend': round(t+dur,3), 'words': words, 'cap': [len(g.split()) for g in s['cap'].split('|')]})
    voice_clips.append((t, a)); t += dur + GAP
total = t - GAP + TAIL
for i, sc in enumerate(scenes):
    sc['end'] = round(scenes[i+1]['start'] if i+1 < len(scenes) else total, 3)

def wt(sid, word, k=0):
    ws = [w for w in next(s for s in scenes if s['id']==sid)['words'] if w['n'].startswith(word)]
    return ws[k]['s']
ev = {
 's2_cards': [wt('s2','capital'), wt('s2','cheque'), wt('s2','cartao')], 's2_chart': wt('s2','os'),
 's3_loop': wt('s3','pegar'),
 's5_check': [wt('s5','diagnostico') + i*0.42 for i in range(5)],
 's6_hl': [wt('s6','juros'), wt('s6','tarifas'), wt('s6','clausulas')],
 's7_level': wt('s7','estrategia'),
 's8_up': wt('s8','reorganizar'),
 's9_save': wt('s9','salve'), 's9_share': wt('s9','mande'),
}
json.dump({'total': round(total,3), 'fps': 30, 'scenes': scenes, 'ev': ev}, open('timeline.json','w'), ensure_ascii=False, indent=1)

N = int(total*SR); rng = np.random.default_rng(7)
voice = np.zeros(N, np.float32)
for st, a in voice_clips: i = int(st*SR); voice[i:i+len(a)] += a[:N-i]

# --- music: soft pad + pulse, dark (Am) for the problem, brighter (C/F/G) from the solution on
def lp(x, a):  # one-pole lowpass
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a*(x[i]-acc); y[i] = acc
    return y
def note(m): return 440*2**((m-69)/12)
music = np.zeros(N, np.float32); tt = np.arange(N)/SR
turn = scenes[4]['start']
bar = 60/92*4
prog_dark = [[57,60,64],[53,57,60],[55,59,62],[52,56,59]]      # Am F G E
prog_light = [[48,52,55,60],[53,57,60,65],[57,60,64,69],[55,59,62,67]]  # C F Am G
b = 0.0; k = 0
while b < total:
    chord = (prog_dark if b < turn - 0.01 else prog_light)[k % 4]
    i0, i1 = int(b*SR), min(N, int((b+bar+0.6)*SR))
    seg = tt[i0:i1]-b; env = np.minimum(1, seg/0.8)*np.minimum(1, np.maximum(0,(bar+0.6-seg))/0.6)
    sig = sum(np.sin(2*np.pi*note(m)*d*seg + 0.3*np.sin(2*np.pi*0.3*seg)) for m in chord for d in (0.997, 1.003))
    sig += 0.5*np.sin(2*np.pi*note(chord[0]-12)*seg)
    music[i0:i1] += (sig*env*0.035).astype(np.float32)
    b += bar; k += 1
beat = 60/92; b = 0.0
while b < total - 1.0:
    i0 = int(b*SR); n = int(0.25*SR); s = np.arange(min(n, N-i0))/SR
    kick = np.sin(2*np.pi*(50+80*np.exp(-s*30))*s)*np.exp(-s*12)
    music[i0:i0+len(s)] += (kick*(0.10 if b >= turn else 0.07)).astype(np.float32)
    h0 = int((b+beat/2)*SR); hn = min(int(0.05*SR), N-h0)
    if hn > 0:
        hat = rng.standard_normal(hn)*np.exp(-np.arange(hn)/SR*90); hat = hat - lp(hat, 0.5)
        music[h0:h0+hn] += (hat*0.025).astype(np.float32)
    b += beat
fade = np.minimum(1, np.minimum(tt/1.0, (total-tt)/1.6)).astype(np.float32)
music *= fade

# --- sfx
sfx = np.zeros(N, np.float32)
def add(at, x, g):
    i = int(at*SR); x = x[:max(0, N-i)]; sfx[i:i+len(x)] += (x*g).astype(np.float32)
def whoosh(d=0.45):
    n = int(d*SR); s = np.arange(n)/n; x = rng.standard_normal(n)
    out = np.empty(n); acc = 0.0
    for i in range(n):
        a = 0.02 + 0.25*np.sin(np.pi*s[i]); acc += a*(x[i]-acc); out[i] = acc
    return out*np.sin(np.pi*s)**2*3
def pop(f=880):
    n = int(0.12*SR); s = np.arange(n)/SR
    return np.sin(2*np.pi*(f+f*0.6*np.exp(-s*40))*s)*np.exp(-s*35)
def riser(d):
    n = int(d*SR); s = np.arange(n)/SR
    return np.sin(2*np.pi*(200*s + 400*s*s/d))*(s/d)**2*0.5 + lp(rng.standard_normal(n), 0.1)*(s/d)**3
for sc in scenes[1:]: add(sc['start']-0.15, whoosh(), 0.35)
for x in ev['s2_cards']: add(x, pop(660), 0.25)
for x in ev['s5_check']: add(x, pop(990), 0.22)
for x in ev['s6_hl']: add(x, pop(780), 0.22)
add(ev['s9_save'], pop(880), 0.25); add(ev['s9_share'], pop(1100), 0.25)
add(turn-1.6, riser(1.6), 0.18)

# duck music under voice
env = np.convolve(np.abs(voice), np.ones(int(0.25*SR))/(0.25*SR), mode='same')
duck = 1 - 0.45*np.clip(env/0.03, 0, 1)
mix = voice*1.0 + music*duck + sfx
mix = mix/np.max(np.abs(mix))*0.89
pcm = (np.clip(mix, -1, 1)*32767).astype(np.int16)
with wave.open('mix.wav','wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('total', total, ev)
