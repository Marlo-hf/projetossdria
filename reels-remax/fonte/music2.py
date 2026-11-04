import numpy as np, wave, sys
sr=48000; T=25.5; n=int(sr*T); t=np.arange(n)/sr
L=np.zeros(n); R=np.zeros(n); rng=np.random.default_rng(7)
bpm=120; beat=60/bpm
def note(m): return 440*2**((m-69)/12)
def add(sig,start,pan=0.0,gain=1.0):
    i=int(start*sr); e=min(n,i+len(sig)); s=sig[:e-i]*gain
    L[i:e]+=s*np.sqrt((1-pan)/2); R[i:e]+=s*np.sqrt((1+pan)/2)
def env(d,a=.01,r=.2):
    k=np.arange(int(d*sr))/sr; e=np.minimum(1,k/a)*np.minimum(1,np.maximum(0,(d-k)/r)); return k,e
# chords: Am F C G (2s each) -> uplifting
prog=[[57,60,64,69],[53,57,60,65],[48,55,60,64],[55,59,62,67]]
roots=[45,41,48,43]
for bar in range(13):
    st=bar*2.0; ch=prog[bar%4]
    if st>=22: break
    d=2.0 if st<20 else 5.5
    k,e=env(d+.3,a=.35,r=1.0)
    pad=sum(np.sin(2*np.pi*note(m)*k*(1+det))+.3*np.sin(4*np.pi*note(m)*k*(1+det)) for m in ch for det in(-.003,.003))
    lvl=.05
    add(pad*e*lvl,st,-.3); add(pad*e*lvl,st+.01,.3)
    if 0<=st<20:  # bass on beats (8th pulses)
        for q in range(8):
            k2,e2=env(.22,a=.005,r=.15); f=note(roots[bar%4])
            add((np.sin(2*np.pi*f*k2)+.25*np.sin(4*np.pi*f*k2))*e2*.22,st+q*.25)
    if 2<=st<20:  # pluck arpeggio 16ths
        seq=[ch[0]+12,ch[1]+12,ch[2]+12,ch[3]+12,ch[2]+12,ch[1]+12,ch[3]+12,ch[2]+12]
        for q in range(16):
            k3=np.arange(int(.3*sr))/sr; f=note(seq[q%8])
            s=(np.sin(2*np.pi*f*k3)+.2*np.sin(6*np.pi*f*k3))*np.exp(-k3*14)
            add(s*.06,st+q*.125,(-.5 if q%2 else .5))
def kick():
    k=np.arange(int(.35*sr))/sr; f=50+110*np.exp(-k*30); ph=2*np.pi*np.cumsum(f)/sr
    return np.sin(ph)*np.exp(-k*9)*1.0
def hat():
    k=np.arange(int(.06*sr))/sr; x=rng.standard_normal(len(k)); x=np.diff(x,prepend=0); return x*np.exp(-k*70)
def clap():
    k=np.arange(int(.2*sr))/sr; x=rng.standard_normal(len(k)); x=x-np.convolve(x,np.ones(20)/20,'same'); return x*np.exp(-k*22)
for b in range(int(T/beat)):
    tb=b*beat
    if 0<=tb<19.9: add(kick(),tb,0,.55)
    if 0<=tb<19.9: add(hat(),tb+beat/2,.2,.12)
    if 2.7<=tb<19.9 and b%2==1: add(clap(),tb,-.1,.18)
# riser into 3s drop and into end card
def riser(d):
    k=np.arange(int(d*sr))/sr; x=rng.standard_normal(len(k)); y=np.zeros_like(x); a=0
    cut=np.linspace(.02,.5,len(k))
    for i in range(len(x)): a+=cut[i]*(x[i]-a); y[i]=x[i]-a  # rising highpass-ish
    return y*(k/d)**2
add(riser(1.0),18.95,0,.14)
# impacts / whoosh at cuts
def impact():
    k=np.arange(int(1.2*sr))/sr; return (np.sin(2*np.pi*(40+60*np.exp(-k*8))*k)*np.exp(-k*3.5)+.15*rng.standard_normal(len(k))*np.exp(-k*12))
add(impact(),0.0,0,.5); add(impact(),19.96,0,.55)
def whoosh(d=.5):
    k=np.arange(int(d*sr))/sr; x=rng.standard_normal(len(k)); x=np.convolve(x,np.ones(8)/8,'same'); return x*np.sin(np.pi*k/d)**2
for c in (2.47,8.37,12.03): add(whoosh(),c,0,.2)
# final sparkle
for j,m in enumerate([81,84,88,93]):
    k=np.arange(int(1.5*sr))/sr; add(np.sin(2*np.pi*note(m)*k)*np.exp(-k*3)*.05,20.05+j*.09,(j-1.5)/2)
# simple reverb
ir_len=int(1.2*sr); ki=np.arange(ir_len)/sr
for ch_ in (L,R):
    ir=rng.standard_normal(ir_len)*np.exp(-ki*4)*.02; ir[0]=1
    wet=np.fft.irfft(np.fft.rfft(ch_,n+ir_len)*np.fft.rfft(ir,n+ir_len))[:n]
    ch_[:]=wet
fade=np.ones(n); fo=int(1.6*sr); fade[-fo:]=np.linspace(1,0,fo)**2; fade[:int(.02*sr)]=np.linspace(0,1,int(.02*sr))
mix=np.stack([L*fade,R*fade],1); mix=np.tanh(mix/np.abs(mix).max()*1.6)/np.tanh(1.6)*.89
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((mix*32767).astype('<i2').tobytes()); w.close()
