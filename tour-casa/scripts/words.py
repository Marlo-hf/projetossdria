import sys, json
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
import numpy as np, wave
wf = wave.open(sys.argv[1]); a = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768
segs, _ = m.transcribe(a, language="pt", word_timestamps=True, vad_filter=False)
W = [dict(w=w.word.strip(), s=round(w.start, 3), e=round(w.end, 3)) for s in segs for w in s.words]
json.dump(W, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
print(" ".join(f"{x['w']}[{x['s']:.2f}-{x['e']:.2f}]" for x in W))
