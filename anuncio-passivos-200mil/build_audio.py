import json, subprocess, numpy as np, wave, unicodedata
SR = 44100
script = json.load(open('script.json'))
rng = np.random.default_rng(11)

def norm(w): return ''.join(c for c in unicodedata.normalize('NFD', w.lower()) if unicodedata.category(c) != 'Mn').strip('.,:?!')
def load_mp3(p):
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw, np.float32).copy()

LEAD, GAP, TAIL = 0.25, 0.28, 2.2
EXTRA_GAP = {'s4': 0.45}                      # breathing room at the turning point
t = LEAD; scenes = []; clips = []
for s in script:
    t += EXTRA_GAP.get(s['id'], 0)
    a = load_mp3(f"audio/{s['id']}.mp3")
    toks = s['cap'].replace(' | ', ' ').split()
    tw = json.load(open(f"audio/{s['id']}.mp3.json")); assert len(tw) == len(toks), s['id']
    words = [{'p': tk, 'n': norm(tk), 's': round(t+a0, 3), 'e': round(t+a1, 3)} for (a0, a1, _), tk in zip(tw, toks)]
    scenes.append({'id': s['id'], 'tag': s['tag'], 'start': round(t, 3), 'words': words,
                   'cap': [len(g.split()) for g in s['cap'].split('|')]})
    clips.append((t, a)); t += len(a)/SR + GAP
total = round(t - GAP + TAIL, 3)
scenes[0]['start'] = 0
for i, sc in enumerate(scenes):
    sc['end'] = scenes[i+1]['start'] if i+1 < len(scenes) else total

def W(sid, word):
    ws = next(s for s in scenes if s['id'] == sid)['words']
    for w in ws:
        if w['n'] == word: return w['s']
    raise KeyError((sid, word))
EV = {'s1_deve':('s1','deve'),'s1_mil':('s1','mil'),'s1_assista':('s1','assista'),
 's2_capital':('s2','capital'),'s2_cheque':('s2','cheque'),'s2_cartao':('s2','cartao'),'s2_emprestimo':('s2','emprestimo'),'s2_juros':('s2','juros'),'s2_caixa':('s2','caixa'),
 's3_negociar':('s3','negociar'),'s3_gerente':('s3','gerente'),'s3_empurra':('s3','empurra'),
 's4_gestao':('s4','gestao'),'s4_analisa':('s4','analisa'),'s4_negociacao':('s4','negociacao'),'s4_reorganizar':('s4','reorganizar'),'s4_proteger':('s4','proteger'),
 's5_divida':('s5','divida'),'s5_saiba':('s5','saiba'),'s5_formulario':('s5','formulario'),'s5_rapido':('s5','rapido'),'s5_analisado':('s5','analisado'),'s5_especialista':('s5','especialista')}
ev = {k: W(*v) for k, v in EV.items()}
S = {s['id']: s for s in scenes}
json.dump({'total': total, 'fps': 30, 'scenes': scenes, 'ev': ev}, open('timeline.json','w'), ensure_ascii=False, indent=1)

N = int(total*SR); tt = np.arange(N)/SR
voice = np.zeros(N, np.float32)
for st, a in clips: i = int(st*SR); voice[i:i+len(a)] += a[:N-i]

def reverb(x, secs=2.2, wet=.35):
    n = int(secs*SR); ir = rng.standard_normal(n)*np.exp(-np.arange(n)/SR*3.2); ir[0] = 0
    L = 1 << int(np.ceil(np.log2(len(x)+n)))
    y = np.fft.irfft(np.fft.rfft(x, L)*np.fft.rfft(ir, L), L)[:len(x)]
    return x*(1-wet) + y/np.max(np.abs(y)+1e-9)*np.max(np.abs(x))*wet*1.4
def f(m): return 440*2**((m-69)/12)
def piano(m, d=2.4):
    n = int(d*SR); s = np.arange(n)/SR; fr = f(m)
    x = sum(a*np.sin(2*np.pi*fr*h*s)*np.exp(-s*(1.6+h*1.2)) for h, a in ((1,1),(2,.45),(3,.18),(4,.08)))
    return x*np.minimum(1, s/0.006)
def pad(ms, d):
    n = int(d*SR); s = np.arange(n)/SR
    x = sum(np.sin(2*np.pi*f(m)*dt*s + .4*np.sin(2*np.pi*.25*s)) for m in ms for dt in (.996, 1.004))
    return x*np.minimum(1, s/1.2)*np.minimum(1, (d-s)/1.0)

music = np.zeros(N)
def put(at, x, g):
    i = int(at*SR)
    if i >= N: return
    x = x[:N-i]; music[i:i+len(x)] += x*g
turn = S['s4']['start']
bpm = 96; beat = 60/bpm; bar = beat*4
dark = [(57,[45,57,60,64]),(53,[41,53,57,60]),(55,[43,55,59,62]),(52,[40,52,56,59])]   # Am F G E
light = [(48,[36,55,60,64]),(55,[43,55,59,62]),(57,[45,57,60,64]),(53,[41,53,57,65])] # C G Am F
b = 0.0; k = 0
while b < total - 1:
    prog = dark if b < turn - .01 else light
    root, ch = prog[k % 4]
    put(b, pad(ch[1:], bar+1.0), .010)
    put(b, np.sin(2*np.pi*f(ch[0])*np.arange(int(bar*SR))/SR)*np.minimum(1, np.arange(int(bar*SR))/SR/.3)*np.exp(-np.arange(int(bar*SR))/SR*.4), .05)
    arp = [ch[1], ch[2], ch[3], ch[2]+12, ch[3], ch[2], ch[1]+12, ch[3]]
    for j, m in enumerate(arp):                       # 8th-note felt-piano arpeggio
        if b < turn and j % 2: continue               # sparser in the problem half
        put(b + j*beat/2, piano(m+12, 1.8), .045 if b >= turn else .05)
    b += bar; k += 1
# soft pulse after the turn
b = turn
while b < total - 2:
    n = int(.3*SR); s = np.arange(n)/SR
    put(b, np.sin(2*np.pi*(48+70*np.exp(-s*28))*s)*np.exp(-s*10), .16)
    b += beat
music = reverb(music)
music *= np.minimum(1, np.minimum(tt/1.5, (total-tt)/2.0))
# dip right before the turn for impact
music *= 1 - .85*np.exp(-((tt-(turn-.15))/.35)**2)

sfx = np.zeros(N)
def add(at, x, g):
    i = int(at*SR); x = x[:max(0, N-i)]; sfx[i:i+len(x)] += x*g
def lp(x, a):
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a[i]*(x[i]-acc); y[i] = acc
    return y
def whoosh(d=.55):
    n = int(d*SR); s = np.arange(n)/n
    return lp(rng.standard_normal(n), .015+.22*np.sin(np.pi*s)**2)*np.sin(np.pi*s)**1.5*2.5
def tick(fr=1800):
    n = int(.06*SR); s = np.arange(n)/SR
    return np.sin(2*np.pi*fr*s)*np.exp(-s*90)
def pop(fr=700):
    n = int(.18*SR); s = np.arange(n)/SR
    return np.sin(2*np.pi*(fr+fr*.8*np.exp(-s*45))*s)*np.exp(-s*26)
def boom():
    n = int(2.2*SR); s = np.arange(n)/SR
    return np.sin(2*np.pi*(38+60*np.exp(-s*6))*s)*np.exp(-s*1.8) + lp(rng.standard_normal(n), np.full(n, .04))*np.exp(-s*4)*.8
def riser(d=2.0):
    n = int(d*SR); s = np.arange(n)/SR; u = s/d
    return lp(rng.standard_normal(n), .01+.3*u**2)*u**2.5*2 + np.sin(2*np.pi*(120*s+300*s*u))*u**3*.3
def swell():
    n = int(1.6*SR); s = np.arange(n)/SR
    return np.sin(2*np.pi*55*s)*np.sin(np.pi*s/1.6)**2
for sc in scenes[1:]:
    if sc['id'] != 's4': add(sc['start']-.22, whoosh(), .30)
add(turn-2.0, riser(2.0), .25); add(turn, boom(), .5)
for k2 in ('s2_capital','s2_cheque','s2_cartao','s2_emprestimo','s4_analisa','s4_negociacao','s4_reorganizar'): add(ev[k2], pop(680), .22)
add(ev['s1_mil'], swell(), .35); add(ev['s3_empurra'], swell(), .3)
for k2 in ('s5_saiba','s5_rapido'): add(ev[k2] + .1, tick(), .35)
add(ev['s5_analisado'], pop(990), .28)
for i in range(10): add(ev['s5_formulario'] + .3 + i*.11, tick(2600), .07)   # typing into the form
env = np.convolve(np.abs(voice), np.ones(int(.3*SR))/(.3*SR), mode='same')
duck = 1 - .55*np.clip(env/.03, 0, 1)
mix = voice + music*duck + sfx
mix = mix/np.max(np.abs(mix))*.9
with wave.open('mix.wav','wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix,-1,1)*32767).astype(np.int16).tobytes())
print('total', total); [print(s['id'], s['start'], s['end']) for s in scenes]
