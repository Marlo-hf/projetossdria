# -*- coding: utf-8 -*-
"""
Gerador dos criativos estáticos de GOLPE PIX do Dr. Cláudio Salgado.
Padrão 1 adaptado ao Pix: foto real + card de app + headline com palavra em caixa vermelha.
Navy #0d1726, vermelho #d7372f, Montserrat. Saída: fonte/html/*.html -> node render.js -> saida/*.png

Uso:
    python3 gen_salgado_pix.py          # gera os HTML de todos os criativos
    node render.js                      # renderiza os PNG
"""
import os
import re
import html as H

AQUI = os.path.dirname(os.path.abspath(__file__))
HTML_DIR = os.path.join(AQUI, "html")
IMG = os.path.join(AQUI, "img")
FONTS = os.path.join(AQUI, "fonts")

NAVY = "#0d1726"
RED = "#d7372f"
SELO = "DR. CLÁUDIO SALGADO · DIREITO BANCÁRIO"
NOTA = "Conteúdo informativo. Cada caso é analisado individualmente e não há garantia de resultado."

# --------------------------------------------------------------------------------------------
# Texto: [[palavra]] vira a caixa vermelha; **trecho** vira negrito branco.
# --------------------------------------------------------------------------------------------
def rich(t):
    t = H.escape(t, quote=False)
    t = re.sub(r"\[\[(.+?)\]\]", r'<span class="box">\1</span>', t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = t.replace("\n", "<br>")
    return t


# --------------------------------------------------------------------------------------------
# Peças do card de app
# --------------------------------------------------------------------------------------------
def c_head(titulo, meta="", icone=""):
    ic = f'<span class="c-ico">{icone}</span>' if icone else ""
    return f'<div class="c-head">{ic}<span class="c-title">{H.escape(titulo)}</span><span class="c-meta">{H.escape(meta)}</span></div>'

def c_row(label, valor, cls=""):
    return f'<div class="c-row {cls}"><span>{rich(label)}</span><b>{rich(valor)}</b></div>'

def c_big(label, valor, cls=""):
    return f'<div class="c-big {cls}"><span>{rich(label)}</span><b>{rich(valor)}</b></div>'

def c_pill(texto, cor="red"):
    return f'<div class="c-pill {cor}"><i></i>{rich(texto)}</div>'

def c_foot(label, valor, cls=""):
    return f'<div class="c-foot {cls}"><span>{rich(label)}</span><b>{rich(valor)}</b></div>'

def c_note(texto):
    return f'<div class="c-note">{rich(texto)}</div>'

def c_steps(itens):
    """itens: lista de (estado, titulo, detalhe); estado = ok | now | wait | no"""
    out = []
    for est, tit, det in itens:
        out.append(f'<div class="c-step {est}"><i></i><div><b>{rich(tit)}</b><span>{rich(det)}</span></div></div>')
    return '<div class="c-steps">' + "".join(out) + "</div>"

def c_notifs(itens):
    """itens: lista de (app, hora, titulo, texto, destaque_bool)"""
    out = []
    for app, hora, tit, txt, dest in itens:
        out.append(
            f'<div class="n-item{" hot" if dest else ""}"><div class="n-top"><span class="n-app">{H.escape(app)}</span>'
            f'<span class="n-time">{H.escape(hora)}</span></div><b>{rich(tit)}</b><p>{rich(txt)}</p></div>'
        )
    return '<div class="c-notifs">' + "".join(out) + "</div>"

def c_bars(itens):
    """itens: lista de (label, pct 0-100, valor, cor)"""
    out = []
    for lab, pct, val, cor in itens:
        out.append(
            f'<div class="c-bar"><div class="c-bar-l"><span>{rich(lab)}</span><b class="{cor}">{rich(val)}</b></div>'
            f'<div class="c-bar-t"><i class="{cor}" style="width:{pct}%"></i></div></div>'
        )
    return '<div class="c-bars">' + "".join(out) + "</div>"


# --------------------------------------------------------------------------------------------
# CSS
# --------------------------------------------------------------------------------------------
def fontface():
    out = []
    for w in (400, 500, 600, 700, 800, 900):
        out.append(
            "@font-face{font-family:'Montserrat';font-weight:%d;font-style:normal;"
            "src:url('file://%s/montserrat-latin-%d-normal.woff2') format('woff2');}" % (w, FONTS, w)
        )
    return "\n".join(out)

CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:__W__px;height:__H__px;overflow:hidden;background:__NAVY__;font-family:'Montserrat',sans-serif;color:#fff;
  -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.bg{position:absolute;inset:0;background-size:cover;background-repeat:no-repeat}
.shade{position:absolute;inset:0}
.pill{position:absolute;left:56px;top:48px;display:flex;align-items:center;gap:12px;height:44px;padding:0 22px 0 18px;
  border:1.5px solid rgba(255,255,255,.22);border-radius:30px;background:rgba(13,23,38,.55);backdrop-filter:blur(6px);
  font-weight:700;font-size:17px;letter-spacing:.06em;white-space:nowrap}
.pill i{width:10px;height:10px;border-radius:50%;background:__RED__;box-shadow:0 0 0 4px rgba(215,55,47,.25)}
.kicker{font-weight:700;font-size:15px;letter-spacing:.13em;color:#c9d2de;text-transform:uppercase;margin-bottom:18px;white-space:nowrap}
.kicker em{font-style:normal;color:__RED__;margin:0 .45em}
h1{font-weight:800;line-height:1.1;letter-spacing:-.01em}
h1 .box{background:__RED__;color:#fff;padding:0 .16em;border-radius:.09em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.sub{font-weight:500;color:rgba(255,255,255,.86);line-height:1.42}
.sub b{color:#fff;font-weight:700}
.lab{font-weight:700;font-size:13px;letter-spacing:.14em;color:#9fb0c6;text-transform:uppercase;margin:26px 0 12px}
.chips{display:flex;flex-wrap:wrap;gap:10px}
.chip{display:flex;align-items:center;gap:9px;height:44px;padding:0 16px 0 10px;border-radius:24px;background:rgba(255,255,255,.07);
  border:1.5px solid rgba(255,255,255,.13);font-weight:600;font-size:16px;white-space:nowrap}
.chip i{width:22px;height:22px;border-radius:50%;background:__RED__;position:relative;flex:none}
.chip i:after{content:'';position:absolute;left:7px;top:4px;width:5px;height:10px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}
.cta{position:absolute;display:flex;align-items:center;gap:22px;background:#fff;color:__NAVY__;border-radius:50px;font-weight:800;white-space:nowrap;
  box-shadow:0 14px 30px rgba(0,0,0,.25)}
.cta i{border-radius:50%;background:__RED__;display:flex;align-items:center;justify-content:center}
.cta i svg{display:block}
.foot{position:absolute;left:56px;right:56px;font-weight:500;color:rgba(255,255,255,.55)}

/* ---------- card de app ---------- */
.card{position:absolute;background:#fff;color:__NAVY__;border-radius:24px;padding:24px 26px 22px;
  box-shadow:0 34px 70px rgba(0,0,0,.5),0 2px 0 rgba(255,255,255,.4) inset;transform:rotate(-2deg);transform-origin:center}
.c-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.c-ico{align-self:center;width:30px;height:30px;border-radius:9px;background:#eef1f5;display:flex;align-items:center;justify-content:center;flex:none}
.c-title{font-weight:800;font-size:21px;flex:1;white-space:nowrap}
.c-meta{font-weight:500;font-size:13px;color:#7b8796;white-space:nowrap}
.c-row{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:11px 0;border-bottom:1.5px solid #edf0f3;font-size:16px}
.c-row span{font-weight:500;color:#3b4757}
.c-row b{font-weight:800;white-space:nowrap}
.c-row.red b,.c-big.red b,.c-foot.red b{color:__RED__}
.c-row.green b,.c-foot.green b{color:#178a4c}
.c-row.muted b{color:#7b8796;font-weight:700}
.c-big{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:14px 0 6px}
.c-big span{font-weight:700;font-size:17px}
.c-big b{font-weight:800;font-size:31px;letter-spacing:-.01em;white-space:nowrap}
.c-pill{display:inline-flex;align-items:center;gap:9px;margin-top:10px;padding:8px 15px;border-radius:20px;font-weight:700;font-size:15px}
.c-pill i{width:8px;height:8px;border-radius:50%}
.c-pill.red{background:#fdeceb;color:#b52a23}.c-pill.red i{background:__RED__}
.c-pill.amber{background:#fff4e0;color:#9a5b00}.c-pill.amber i{background:#e89a1c}
.c-pill.green{background:#e6f5ec;color:#156c3d}.c-pill.green i{background:#1f9d57}
.c-pill.navy{background:#e9edf3;color:__NAVY__}.c-pill.navy i{background:__NAVY__}
.c-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px;padding:12px 16px;border-radius:14px;background:#f3f5f8;font-size:14px}
.c-foot span{font-weight:600;color:#4a5564}
.c-foot b{font-weight:800;white-space:nowrap}
.c-note{margin-top:10px;font-weight:500;font-size:12px;color:#8a95a3}
.c-steps{display:flex;flex-direction:column;gap:0;margin-top:4px}
.c-step{display:flex;gap:14px;position:relative;padding:0 0 15px 0}
.c-step:not(:last-child):before{content:'';position:absolute;left:10px;top:24px;bottom:2px;width:2px;background:#e3e7ec}
.c-step i{flex:none;width:22px;height:22px;border-radius:50%;margin-top:1px;position:relative;background:#e3e7ec}
.c-step.ok i{background:#1f9d57}.c-step.ok i:after{content:'';position:absolute;left:8px;top:4px;width:4px;height:9px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}
.c-step.now i{background:__RED__;box-shadow:0 0 0 5px rgba(215,55,47,.18)}
.c-step.no i{background:__RED__}.c-step.no i:before,.c-step.no i:after{content:'';position:absolute;left:10px;top:5px;width:2.5px;height:12px;background:#fff;transform:rotate(45deg)}
.c-step.no i:after{transform:rotate(-45deg)}
.c-step.wait i{background:#fff;border:2.5px solid #c9d0d8}
.c-step b{display:block;font-weight:800;font-size:16px;line-height:1.25}
.c-step span{display:block;font-weight:500;font-size:13.5px;color:#6b7684;margin-top:2px;line-height:1.3}
.c-step.no b,.c-step.now b{color:__RED__}
.c-notifs{display:flex;flex-direction:column;gap:10px}
.n-item{background:#f3f5f8;border-radius:16px;padding:12px 15px}
.n-item.hot{background:#fdeceb}
.n-top{display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#7b8796;letter-spacing:.04em;text-transform:uppercase;margin-bottom:4px}
.n-item b{display:block;font-weight:800;font-size:15.5px}
.n-item p{font-weight:500;font-size:14px;color:#4a5564;margin-top:2px;line-height:1.3}
.n-item.hot b{color:#b52a23}
.c-bars{display:flex;flex-direction:column;gap:14px;margin-top:6px}
.c-bar-l{display:flex;justify-content:space-between;font-size:15px;margin-bottom:6px}
.c-bar-l span{font-weight:600;color:#3b4757}
.c-bar-l b{font-weight:800}
.c-bar-t{height:12px;border-radius:8px;background:#edf0f3;overflow:hidden}
.c-bar-t i{display:block;height:100%;border-radius:8px;background:__NAVY__}
.c-bar-t i.red,.c-bar-l b.red{background:__RED__}.c-bar-l b.red{background:none;color:__RED__}
.c-bar-t i.green{background:#1f9d57}.c-bar-l b.green{color:#178a4c}
"""

ARROW = ('<svg width="__S__" height="__S__" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" '
         'stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>')


# --------------------------------------------------------------------------------------------
# Montagem de uma peça
# --------------------------------------------------------------------------------------------
def pagina(c, fmt):
    W, Hh = (1080, 1920) if fmt == "9x16" else (1080, 1080)
    L = c[fmt]  # layout específico do formato
    css = CSS.replace("__W__", str(W)).replace("__H__", str(Hh)).replace("__NAVY__", NAVY).replace("__RED__", RED)

    foto = os.path.join(IMG, c["foto"])
    bg = f'<div class="bg" style="background-image:url(\'file://{foto}\');{L.get("bg", "")}"></div>'
    shade = f'<div class="shade" style="background:{L["shade"]}"></div>'

    kicker = '<em>·</em>'.join(H.escape(k) for k in c["kicker"])
    chips = "".join(f'<div class="chip"><i></i>{H.escape(x)}</div>' for x in c["chips"])
    bloco = (
        f'<div class="kicker">{kicker}</div>'
        f'<h1 data-check="headline" style="font-size:{L["h1"]}px">{rich(c["headline"])}</h1>'
        f'<p class="sub" data-check="sub" style="font-size:{L["sub"]}px;margin-top:{L.get("subgap", 22)}px">{rich(c["sub"])}</p>'
        f'<div class="lab">{H.escape(c["chips_label"])}</div><div class="chips" data-check="chips">{chips}</div>'
    )
    content = f'<div class="content" data-check="content" style="position:absolute;{L["content"]}">{bloco}</div>'

    card = f'<div class="card" data-check="card" style="{L["card"]};zoom:{L.get("card_zoom", 1)}">{c["card"]}</div>'

    s = L["cta_size"]
    arrow = ARROW.replace("__S__", str(int(s * 0.42)))
    cta = (
        f'<div class="cta" data-check="cta" style="{L["cta"]};height:{s}px;padding:0 {int(s*0.14)}px 0 {int(s*0.6)}px;font-size:{L["cta_font"]}px">'
        f'{H.escape(c["cta"])}<i style="width:{int(s*0.72)}px;height:{int(s*0.72)}px">{arrow}</i></div>'
    )
    foot = f'<div class="foot" style="{L["foot"]}">{NOTA}</div>'
    pill = f'<div class="pill" style="{L.get("pill", "")}"><i></i>{SELO}</div>'

    return (
        f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>{c["num"]}_{c["slug"]}_{fmt}</title>'
        f"<style>{fontface()}\n{css}</style></head><body>"
        f"{bg}{shade}{pill}{content}{card}{cta}{foot}</body></html>"
    )


def gerar(criativos):
    os.makedirs(HTML_DIR, exist_ok=True)
    for c in criativos:
        for fmt in ("9x16", "1x1"):
            nome = f'{c["num"]}_{c["slug"]}_{fmt}.html'
            with open(os.path.join(HTML_DIR, nome), "w", encoding="utf-8") as f:
                f.write(pagina(c, fmt))
            print("html", nome)


# --------------------------------------------------------------------------------------------
# Layouts-base (cada criativo pode sobrescrever qualquer chave)
# --------------------------------------------------------------------------------------------
def base_1x1(**kw):
    L = {
        "bg": "background-position:right center;background-size:auto 1080px",
        "shade": "linear-gradient(90deg,rgba(13,23,38,.97) 0%,rgba(13,23,38,.93) 38%,rgba(13,23,38,.55) 58%,rgba(13,23,38,.12) 80%,rgba(13,23,38,.05) 100%),"
                 "linear-gradient(0deg,rgba(13,23,38,.75) 0%,rgba(13,23,38,0) 30%)",
        "content": "left:56px;top:172px;width:580px",
        "h1": 58, "sub": 21, "subgap": 20,
        "card": "left:650px;top:600px;width:390px",
        "cta": "left:56px;top:916px", "cta_size": 68, "cta_font": 21,
        "foot": "top:1026px;font-size:14px",
    }
    L.update(kw)
    return L

def base_9x16(**kw):
    L = {
        "bg": "background-position:center top;background-size:1080px auto",
        "shade": "linear-gradient(180deg,rgba(13,23,38,.35) 0%,rgba(13,23,38,0) 18%,rgba(13,23,38,0) 38%,rgba(13,23,38,.75) 52%,rgba(13,23,38,1) 60%)",
        "content": "left:64px;right:64px;bottom:300px",
        "h1": 74, "sub": 30, "subgap": 26,
        "card": "right:40px;top:400px;width:420px", "card_zoom": 1.22,
        "cta": "left:64px;bottom:112px", "cta_size": 92, "cta_font": 30,
        "foot": "left:64px;right:64px;bottom:44px;font-size:19px",
        "pill": "left:64px;top:64px;height:52px;font-size:20px;padding:0 26px 0 20px",
    }
    L.update(kw)
    return L


if __name__ == "__main__":
    from criativos import CRIATIVOS
    gerar(CRIATIVOS)
