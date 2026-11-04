import sys, glob, numpy as np, onnxruntime as ort
from PIL import Image
sess = ort.InferenceSession(sys.argv[1], providers=["CPUExecutionProvider"])
inp = sess.get_inputs()[0].name
print(inp, sess.get_inputs()[0].shape)
for p in sorted(glob.glob(sys.argv[2] + "/img*.jpg")):
    im = Image.open(p).convert("RGB")
    W, H = im.size
    x = np.asarray(im.resize((700, 518), Image.BICUBIC), dtype=np.float32) / 255.0  # multiple of 14
    x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    d = sess.run(None, {inp: x})[0][0]
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)
    out = Image.fromarray((d * 65535).astype(np.uint16)).resize((W, H), Image.BICUBIC)
    np.save(p.replace(".jpg", "_depth.npy"), np.asarray(out, dtype=np.float32) / 65535)
    Image.fromarray((np.asarray(out, dtype=np.float32) / 257).astype(np.uint8)).save(p.replace(".jpg", "_depth.png"))
    print(p)
