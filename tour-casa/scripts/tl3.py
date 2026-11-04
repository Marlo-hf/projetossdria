import json, sys
J = json.load(open(sys.argv[1]))
idx = [i for i, v in enumerate(J["vo_starts"]) if v is not None]
order = sorted(idx, key=lambda i: J["vo_line_of"][i])
out = dict(total=J["total"], vo_starts=[J["vo_starts"][i] for i in order], durs=J["durs"], events=J["events"],
           cta=J["cta"], hook_end=J["events"][0]["t"])
json.dump(out, open(sys.argv[2], "w"), indent=1); print(out["hook_end"], len(out["vo_starts"]))
