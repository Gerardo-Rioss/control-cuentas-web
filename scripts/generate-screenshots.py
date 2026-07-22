"""
Control Cuentas — Screenshot & Banner Generator
Creates: banner-github.png, dashboard-mockup.png, login-mockup.png, mobile-mockup.png
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT_DIR = os.path.expanduser("~/AppData/Local/hermes/skills/canvas-design/canvas-fonts")
OUT_DIR = os.path.expanduser("~/repos/gerariosdev/control-cuentas-web/public/screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

# ── Fonts ────────────────────────────────────────────────────────────────
def get_font(name, size):
    path = os.path.join(FONT_DIR, name)
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()

# Fonts for banner
FONT_BANNER_TITLE   = get_font("InstrumentSans-Bold.ttf", 82)
FONT_BANNER_SUB     = get_font("InstrumentSans-Regular.ttf", 34)
FONT_BADGE          = get_font("GeistMono-Regular.ttf", 22)
FONT_BADGE_SM       = get_font("GeistMono-Regular.ttf", 18)
FONT_BODY           = get_font("WorkSans-Regular.ttf", 24)
FONT_BODY_BOLD      = get_font("WorkSans-Bold.ttf", 24)
FONT_SMALL          = get_font("WorkSans-Regular.ttf", 18)
FONT_CARD_TITLE     = get_font("InstrumentSans-Bold.ttf", 20)
FONT_CARD_VAL       = get_font("InstrumentSans-Bold.ttf", 28)
FONT_LOGIN_TITLE    = get_font("InstrumentSans-Bold.ttf", 30)
FONT_LOGIN_LABEL    = get_font("WorkSans-Regular.ttf", 14)
FONT_LOGIN_BTN      = get_font("WorkSans-Bold.ttf", 16)
FONT_MONTH          = get_font("InstrumentSans-Bold.ttf", 18)
FONT_NAV            = get_font("WorkSans-Regular.ttf", 13)
FONT_NAV_ACTIVE     = get_font("WorkSans-Bold.ttf", 13)

# ── Color Palette ────────────────────────────────────────────────────────
C_BG_DARK     = (13, 15, 28)      # Very dark navy
C_BG_MID      = (19, 22, 42)      # Dark blue-purple
C_BG_CARD     = (26, 30, 52)      # Card background
C_BG_CARD2    = (32, 36, 60)      # Slightly lighter card
C_BORDER      = (45, 50, 78)      # Subtle borders
C_PRIMARY     = (16, 185, 129)    # Emerald-500
C_PRIMARY2    = (20, 184, 166)    # Teal-500
C_PRIMARY_DIM = (16, 185, 129, 40)  # Dimmed emerald
C_ACCENT      = (99, 102, 241)    # Indigo-500
C_PURPLE      = (139, 92, 246)    # Violet-500
C_TEXT        = (240, 240, 250)   # Near-white
C_TEXT_MUTED  = (150, 155, 180)   # Muted text
C_TEXT_DIM    = (100, 105, 130)   # Very dim text
C_GREEN       = (16, 185, 129)    # Income green
C_RED         = (239, 68, 68)     # Expense red
C_WHITE       = (255, 255, 255)
C_BLACK       = (0, 0, 0)

# ── Helpers ──────────────────────────────────────────────────────────────

def rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    x1, y1, x2, y2 = xy
    r = min(radius, (x2 - x1) // 2, (y2 - y1) // 2)
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)

def draw_gradient(draw, xy, colors, vertical=True):
    """Draw a linear gradient. colors = list of (pos, (r,g,b)) tuples."""
    x1, y1, x2, y2 = xy
    w, h = x2 - x1, y2 - y1
    steps = 200
    for i in range(steps):
        t = i / (steps - 1)
        # Find the two surrounding stops
        for j in range(len(colors) - 1):
            if colors[j][0] <= t <= colors[j + 1][0]:
                tt = (t - colors[j][0]) / (colors[j + 1][0] - colors[j][0])
                c = tuple(int(a + (b - a) * tt) for a, b in zip(colors[j][1], colors[j + 1][1]))
                break
        else:
            c = colors[-1][1]
        if vertical:
            draw.line([(x1, y1 + t * h), (x2, y1 + t * h)], fill=c, width=2)
        else:
            draw.line([(x1 + t * w, y1), (x1 + t * w, y2)], fill=c, width=2)

def draw_glow(draw, cx, cy, radius, color, steps=60):
    """Draw a radial glow."""
    for i in range(steps, 0, -1):
        r = int(radius * i / steps)
        alpha = int(30 * (1 - i / steps))
        c = (*color[:3], alpha)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)

def draw_blurry_orb(draw, cx, cy, radius, color, blur_radius=40):
    """Draw a soft glowing orb."""
    # Draw multiple layers of circles
    for i in range(5, 0, -1):
        r = int(radius * i / 5)
        alpha = int(15 * (6 - i))
        c = (*color[:3], alpha)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)

def draw_tech_badge(draw, x, y, text, bg_color, fg_color=C_WHITE, font=None, radius=8):
    """Draw a rounded tech badge."""
    if font is None:
        font = FONT_BADGE
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad_x, pad_y = 16, 10
    bw = tw + pad_x * 2
    bh = th + pad_y * 2
    rounded_rect(draw, (x, y, x + bw, y + bh), radius, fill=bg_color)
    draw.text((x + bw // 2 - tw // 2, y + (bh - th) // 2 - 1), text, fill=fg_color, font=font)
    return bw, bh

def draw_text_centered(draw, x, y, text, font, fill, anchor="mm"):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    if anchor == "mm":
        draw.text((x - tw // 2, y - th // 2), text, fill=fill, font=font)
    elif anchor == "lm":
        draw.text((x, y - th // 2), text, fill=fill, font=font)

# ══════════════════════════════════════════════════════════════════════════
# 1. BANNER — 1280x640 GitHub Social Preview
# ══════════════════════════════════════════════════════════════════════════

def create_banner():
    W, H = 1280, 640
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    # Base gradient — dark navy to deep purple
    draw_gradient(draw, (0, 0, W, H), [
        (0.0, (13, 15, 28)),
        (0.4, (18, 18, 42)),
        (0.7, (24, 16, 50)),
        (1.0, (30, 12, 55)),
    ])

    # Glowing orbs
    draw_blurry_orb(draw, 200, 180, 300, (16, 185, 129))
    draw_blurry_orb(draw, 1100, 500, 250, (99, 102, 241))
    draw_blurry_orb(draw, 640, 320, 200, (139, 92, 246))
    draw_blurry_orb(draw, 100, 500, 180, (20, 184, 166))

    # Subtle grid pattern
    for x in range(0, W, 40):
        draw.line([(x, 0), (x, H)], fill=(255, 255, 255, 4), width=1)
    for y in range(0, H, 40):
        draw.line([(0, y), (W, y)], fill=(255, 255, 255, 4), width=1)

    # Decorative circle elements
    draw.ellipse([60, 40, 260, 240], outline=(255, 255, 255, 6), width=1)
    draw.ellipse([1020, 400, 1240, 620], outline=(255, 255, 255, 6), width=1)
    draw.ellipse([500, -100, 900, 300], outline=(16, 185, 129, 15), width=2)

    # Title
    title = "Control Cuentas"
    bbox_t = draw.textbbox((0, 0), title, font=FONT_BANNER_TITLE)
    tw = bbox_t[2] - bbox_t[0]
    draw.text((80, 140), title, fill=C_WHITE, font=FONT_BANNER_TITLE)

    # Gradient underline under title
    draw_gradient(draw, (80, 220, 80 + tw + 20, 226), [
        (0.0, C_PRIMARY),
        (0.5, C_PRIMARY2),
        (1.0, C_ACCENT),
    ])

    # Tagline
    tagline = "Personal Finance Dashboard"
    draw.text((80, 260), tagline, fill=C_TEXT_MUTED, font=FONT_BANNER_SUB)

    # Description
    desc = "Next.js 16 · TypeScript · Prisma 7 · PostgreSQL · Tailwind v4 · shadcn/ui"
    draw.text((80, 310), desc, fill=C_TEXT_DIM, font=FONT_BODY)

    # Tech badges row
    badges = [
        ("Next.js 16", (0, 0, 0)),
        ("TypeScript", (49, 120, 198)),
        ("Prisma 7", (45, 55, 72)),
        ("PostgreSQL", (52, 105, 225)),
        ("Tailwind v4", (6, 182, 212)),
        ("shadcn/ui", (0, 0, 0)),
    ]

    bx, by = 80, 370
    for text, bg in badges:
        bw, bh = draw_tech_badge(draw, bx, by, text, (*bg, 200), C_WHITE, FONT_BADGE)
        bx += bw + 12

    # Vercel deploy badge
    bx2, by2 = 80, 420
    draw_tech_badge(draw, bx2, by2, "Deploy: Vercel", (0, 0, 0, 200), C_WHITE, FONT_BADGE)

    # Right side — decorative Wallet icon representation
    # A geometric wallet / coin illustration
    cx, cy = 980, 300
    # Outer circle
    draw.ellipse([cx - 100, cy - 100, cx + 100, cy + 100],
                 outline=(16, 185, 129, 30), width=3)
    # Inner diamond
    diamond = [(cx, cy - 50), (cx + 40, cy), (cx, cy + 50), (cx - 40, cy)]
    draw.polygon(diamond, outline=(16, 185, 129, 80), width=2)
    # Small $ or coin dots
    for dot_x, dot_y in [(cx - 50, cy - 50), (cx + 50, cy - 40), (cx - 40, cy + 55), (cx + 45, cy + 50)]:
        draw.ellipse([dot_x - 3, dot_y - 3, dot_x + 3, dot_y + 3], fill=(16, 185, 129, 60))

    # Small decorative bars (like a chart)
    for i, h in enumerate([30, 55, 25, 70, 45, 60, 35]):
        bx_i = 1050 + i * 28
        by_i = 470 - h
        draw.rounded_rectangle([bx_i, by_i, bx_i + 14, 470], radius=7,
                               fill=(99, 102, 241, 60 + i * 5))

    # Bottom-right tag
    draw.text((W - 240, H - 50), "github.com/gerariosdev/control-cuentas-web",
              fill=C_TEXT_DIM, font=FONT_SMALL)

    img.save(os.path.join(OUT_DIR, "banner-github.png"))
    print("✅ banner-github.png saved")


# ══════════════════════════════════════════════════════════════════════════
# 2. DASHBOARD MOCKUP — 1200x800 in browser window frame
# ══════════════════════════════════════════════════════════════════════════

def create_dashboard_mockup():
    W, H = 1200, 800
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    # Dark desktop background
    draw.rectangle([0, 0, W, H], fill=(18, 20, 35))

    # ========== Browser Frame ==========
    frame_x, frame_y = 40, 30
    frame_w, frame_h = W - 80, H - 60
    # Window chrome
    rounded_rect(draw, (frame_x, frame_y, frame_x + frame_w, frame_y + frame_h),
                 14, fill=(24, 27, 48), outline=(50, 55, 85, 100))

    # Title bar
    bar_h = 40
    rounded_rect(draw, (frame_x + 1, frame_y + 1, frame_x + frame_w - 1, frame_y + bar_h),
                 12, fill=(30, 33, 55))
    # Cover top rounded corners
    draw.rectangle([frame_x + 1, frame_y + 14, frame_x + frame_w - 1, frame_y + bar_h],
                   fill=(30, 33, 55))

    # Traffic lights
    for i, c in enumerate([(255, 95, 87), (255, 189, 46), (40, 200, 64)]):
        draw.ellipse([frame_x + 16 + i * 26, frame_y + 13, frame_x + 30 + i * 26, frame_y + 27],
                     fill=c)

    # URL bar
    url_x, url_y = frame_x + 100, frame_y + 11
    url_w, url_h = 340, 18
    rounded_rect(draw, (url_x, url_y, url_x + url_w, url_y + url_h), 9,
                 fill=(40, 44, 70))
    draw.text((url_x + 14, url_y + 1), "https://control-cuentas.vercel.app/dashboard",
              fill=C_TEXT_DIM, font=get_font("WorkSans-Regular.ttf", 11))

    # ========== App Content ==========
    cx0 = frame_x + 20
    cy0 = frame_y + bar_h + 20
    cw = frame_w - 40
    ch = frame_h - bar_h - 40

    # Sidebar
    sb_w = 180
    sb_x = cx0
    sb_y = cy0
    sb_h = ch
    rounded_rect(draw, (sb_x, sb_y, sb_x + sb_w, sb_y + sb_h), 10, fill=(22, 25, 45))

    # Logo in sidebar
    icon_size = 32
    icon_x = sb_x + (sb_w - icon_size) // 2
    icon_y = sb_y + 20
    rounded_rect(draw, (icon_x, icon_y, icon_x + icon_size, icon_y + icon_size),
                 8, fill=C_PRIMARY)
    draw.text((icon_x + 7, icon_y + 5), "$", fill=C_WHITE, font=get_font("WorkSans-Bold.ttf", 18))
    draw.text((sb_x + (sb_w - 90) // 2, icon_y + 40), "Control Cuentas",
              fill=C_TEXT, font=get_font("InstrumentSans-Bold.ttf", 11))

    # Nav items
    nav_items = [
        ("Dashboard", True, C_PRIMARY),
        ("Categorías", False, None),
        ("Reportes", False, None),
        ("Configuración", False, None),
    ]
    nav_y = sb_y + 100
    for label, active, accent in nav_items:
        item_h = 32
        if active:
            rounded_rect(draw, (sb_x + 8, nav_y, sb_x + sb_w - 8, nav_y + item_h),
                         6, fill=(16, 185, 129, 30))
            draw.text((sb_x + 20, nav_y + 7), label, fill=C_PRIMARY, font=FONT_NAV_ACTIVE)
        else:
            draw.text((sb_x + 20, nav_y + 7), label, fill=C_TEXT_MUTED, font=FONT_NAV)
        nav_y += item_h + 4

    # Theme toggle at bottom of sidebar
    toggle_y = sb_y + sb_h - 50
    rounded_rect(draw, (sb_x + 12, toggle_y, sb_x + sb_w - 12, toggle_y + 30),
                 6, fill=(36, 40, 65))
    draw.text((sb_x + 20, toggle_y + 7), "🌙 Dark mode", fill=C_TEXT_DIM, font=get_font("WorkSans-Regular.ttf", 10))

    # ========== Main content area ==========
    mc_x = sb_x + sb_w + 20
    mc_y = cy0
    mc_w = cw - sb_w - 20
    mc_h = ch

    # Header & title
    draw.text((mc_x, mc_y), "Dashboard", fill=C_WHITE, font=get_font("InstrumentSans-Bold.ttf", 24))
    draw.text((mc_x, mc_y + 32), "Control de gastos e ingresos", fill=C_TEXT_DIM,
              font=get_font("WorkSans-Regular.ttf", 14))

    # ========== Summary Cards ==========
    card_y = mc_y + 65
    card_w = (mc_w - 24) // 3
    card_h = 85

    cards_data = [
        ("Ingresos", "$12,500", C_GREEN, "↑"),
        ("Egresos", "$8,230", C_RED, "↓"),
        ("Saldo", "$4,270", C_GREEN, "✓"),
    ]
    for i, (title, val, accent, icon) in enumerate(cards_data):
        cx1 = mc_x + i * (card_w + 12)
        rounded_rect(draw, (cx1, card_y, cx1 + card_w, card_y + card_h),
                     12, fill=(26, 30, 52), outline=(40, 45, 72, 80))
        # Icon circle
        rounded_rect(draw, (cx1 + 10, card_y + 12, cx1 + 38, card_y + 40),
                     8, fill=(*accent, 25))
        draw.text((cx1 + 16, card_y + 14), icon, fill=accent, font=get_font("WorkSans-Bold.ttf", 13))
        draw.text((cx1 + 48, card_y + 12), title, fill=C_TEXT_MUTED, font=get_font("WorkSans-Regular.ttf", 11))
        draw.text((cx1 + 48, card_y + 32), val, fill=C_WHITE, font=get_font("InstrumentSans-Bold.ttf", 22))

    # ========== Charts Row ==========
    chart_y = card_y + card_h + 20
    chart_h = 165

    # Pie chart placeholder (left)
    pie_w = int(mc_w * 0.38)
    rounded_rect(draw, (mc_x, chart_y, mc_x + pie_w, chart_y + chart_h),
                 12, fill=(26, 30, 52), outline=(40, 45, 72, 80))
    draw.text((mc_x + 16, chart_y + 12), "Gastos por categoría", fill=C_TEXT,
              font=get_font("WorkSans-Bold.ttf", 11))

    # Draw a pie chart
    pie_cx, pie_cy = mc_x + pie_w // 2, chart_y + chart_h // 2 + 10
    pie_r = 50
    # Segments
    segments = [
        (0, 100, C_PRIMARY, "Alimentos"),
        (100, 170, C_ACCENT, "Servicios"),
        (170, 230, C_PURPLE, "Transporte"),
        (230, 290, (255, 159, 67), "Ocio"),
        (290, 360, (239, 68, 68), "Otros"),
    ]
    for start_deg, end_deg, color, _ in segments:
        for deg in range(start_deg, end_deg):
            rad = math.radians(deg - 90)
            x = pie_cx + pie_r * math.cos(rad)
            y = pie_cy + pie_r * math.sin(rad)
            draw.line([(pie_cx, pie_cy), (x, y)], fill=color, width=3)
    # Inner circle for donut
    draw.ellipse([pie_cx - 22, pie_cy - 22, pie_cx + 22, pie_cy + 22],
                 fill=(26, 30, 52))

    # Legend
    leg_y = chart_y + chart_h - 45
    for i, (_, _, color, label) in enumerate(segments):
        lx = mc_x + 16 + (i % 3) * 75
        ly = leg_y + (i // 3) * 16
        draw.ellipse([lx, ly + 3, lx + 8, ly + 11], fill=color)
        draw.text((lx + 12, ly + 1), label, fill=C_TEXT_MUTED, font=get_font("WorkSans-Regular.ttf", 9))

    # Line/bar chart placeholder (right)
    bar_w = mc_w - pie_w - 12
    rounded_rect(draw, (mc_x + pie_w + 12, chart_y, mc_x + pie_w + 12 + bar_w, chart_y + chart_h),
                 12, fill=(26, 30, 52), outline=(40, 45, 72, 80))
    draw.text((mc_x + pie_w + 28, chart_y + 12), "Evolución mensual", fill=C_TEXT,
              font=get_font("WorkSans-Bold.ttf", 11))

    # Draw a line chart
    line_cx = mc_x + pie_w + 30
    line_cy = chart_y + chart_h - 30
    line_w = bar_w - 40
    line_h = 100

    # Grid lines
    for i in range(5):
        gy = line_cy - i * (line_h // 4)
        draw.line([(line_cx, gy), (line_cx + line_w, gy)], fill=(40, 45, 72, 80), width=1)

    # Data line
    points = [20, 55, 35, 70, 45, 80, 65, 90, 60, 85, 75, 95]
    step_x = line_w / (len(points) - 1)
    for i in range(len(points) - 1):
        x1 = line_cx + i * step_x
        y1 = line_cy - points[i] * line_h // 100
        x2 = line_cx + (i + 1) * step_x
        y2 = line_cy - points[i + 1] * line_h // 100
        draw.line([(x1, y1), (x2, y2)], fill=C_PRIMARY, width=2)
        # Red dots on data points
        draw.ellipse([x1 - 3, y1 - 3, x1 + 3, y1 + 3], fill=C_PRIMARY)
    # Last point
    lx = line_cx + (len(points) - 1) * step_x
    ly = line_cy - points[-1] * line_h // 100
    draw.ellipse([lx - 3, ly - 3, lx + 3, ly + 3], fill=C_PRIMARY)

    # Area fill under the line
    for i in range(len(points) - 1):
        x1 = int(line_cx + i * step_x)
        x2 = int(line_cx + (i + 1) * step_x)
        y1 = line_cy - points[i] * line_h // 100
        y2 = line_cy - points[i + 1] * line_h // 100
        for x in range(x1, x2):
            t = (x - x1) / (x2 - x1) if x2 != x1 else 0
            yy = int(y1 + (y2 - y1) * t)
            draw.line([(x, yy), (x, line_cy)], fill=(16, 185, 129, 20), width=1)

    # X-axis labels
    months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
    for i, m in enumerate(months):
        mx = line_cx + i * (line_w / (len(months) - 1))
        draw.text((mx - 10, line_cy + 5), m, fill=C_TEXT_DIM, font=get_font("WorkSans-Regular.ttf", 9))

    # Y-axis labels
    for i, val in enumerate(["100k", "75k", "50k", "25k", "0"]):
        gy = line_cy - i * (line_h // 4)
        draw.text((line_cx - 28, gy - 6), val, fill=C_TEXT_DIM, font=get_font("WorkSans-Regular.ttf", 9))

    # ========== Recent movements table ==========
    table_y = chart_y + chart_h + 20
    table_h = 160
    rounded_rect(draw, (mc_x, table_y, mc_x + mc_w, table_y + table_h),
                 12, fill=(26, 30, 52), outline=(40, 45, 72, 80))

    draw.text((mc_x + 16, table_y + 12), "Movimientos recientes", fill=C_TEXT,
              font=get_font("WorkSans-Bold.ttf", 11))

    # Table headers
    th_y = table_y + 38
    headers = ["Descripción", "Categoría", "Fecha", "Monto"]
    col_w = [mc_w - 300, 100, 100, 100]
    col_x = mc_x + 16
    for i, (h, w) in enumerate(zip(headers, col_w)):
        draw.text((col_x, th_y), h, fill=C_TEXT_DIM, font=get_font("WorkSans-Regular.ttf", 10))
        col_x += w

    # Table row separator
    draw.rectangle([mc_x + 16, th_y + 20, mc_x + mc_w - 16, th_y + 21], fill=(40, 45, 72, 80))

    # Table rows
    rows = [
        ("Supermercado", "Alimentos", "15/07/26", "-$85.50", False),
        ("Sueldo", "Trabajo", "01/07/26", "+$5,000", True),
        ("Netflix", "Suscripciones", "10/07/26", "-$11.99", False),
        ("Carga SUBE", "Transporte", "08/07/26", "-$3,200", False),
    ]
    for i, (desc, cat, date, amount, is_income) in enumerate(rows):
        ry = th_y + 28 + i * 26
        # Highlight odd rows
        if i % 2 == 1:
            draw.rectangle([mc_x + 12, ry - 2, mc_x + mc_w - 12, ry + 22],
                           fill=(30, 34, 58, 100))
        draw.text((mc_x + 16, ry), desc, fill=C_TEXT, font=get_font("WorkSans-Regular.ttf", 10))
        draw.text((mc_x + 16 + col_w[0], ry), cat, fill=C_TEXT_MUTED, font=get_font("WorkSans-Regular.ttf", 10))
        draw.text((mc_x + 16 + col_w[0] + col_w[1], ry), date, fill=C_TEXT_MUTED, font=get_font("WorkSans-Regular.ttf", 10))
        amt_color = C_GREEN if is_income else C_RED
        draw.text((mc_x + 16 + col_w[0] + col_w[1] + col_w[2], ry), amount, fill=amt_color,
                  font=get_font("WorkSans-Bold.ttf", 10))

    # ========== Bottom nav (mobile visible) ==========
    nav_h = 40
    nav_y2 = frame_y + frame_h - nav_h - 8
    rounded_rect(draw, (frame_x + 80, nav_y2, frame_x + frame_w - 80, nav_y2 + nav_h),
                 10, fill=(22, 25, 45), outline=(40, 45, 72, 60))
    bottom_items = ["🏠", "🏷️", "📊", "⚙️"]
    nav_item_w = (frame_w - 200) // len(bottom_items)
    for i, item in enumerate(bottom_items):
        ix = frame_x + 100 + i * nav_item_w + nav_item_w // 2
        draw.text((ix - 6, nav_y2 + 8), item, fill=C_TEXT_MUTED, font=get_font("WorkSans-Regular.ttf", 16))

    img.save(os.path.join(OUT_DIR, "dashboard-mockup.png"))
    print("✅ dashboard-mockup.png saved")


# ══════════════════════════════════════════════════════════════════════════
# 3. LOGIN MOCKUP — 1200x800 in browser window frame
# ══════════════════════════════════════════════════════════════════════════

def create_login_mockup():
    W, H = 1200, 800
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    # Dark desktop background
    draw.rectangle([0, 0, W, H], fill=(12, 14, 28))

    # ========== Browser Frame ==========
    frame_x, frame_y = 40, 30
    frame_w, frame_h = W - 80, H - 60
    rounded_rect(draw, (frame_x, frame_y, frame_x + frame_w, frame_y + frame_h),
                 14, fill=C_BG_MID, outline=(50, 55, 85, 100))

    # Title bar
    bar_h = 40
    rounded_rect(draw, (frame_x + 1, frame_y + 1, frame_x + frame_w - 1, frame_y + bar_h),
                 12, fill=(28, 31, 52))
    draw.rectangle([frame_x + 1, frame_y + 14, frame_x + frame_w - 1, frame_y + bar_h],
                   fill=(28, 31, 52))

    # Traffic lights
    for i, c in enumerate([(255, 95, 87), (255, 189, 46), (40, 200, 64)]):
        draw.ellipse([frame_x + 16 + i * 26, frame_y + 13, frame_x + 30 + i * 26, frame_y + 27],
                     fill=c)

    # URL bar
    url_x, url_y = frame_x + 100, frame_y + 11
    url_w, url_h = 300, 18
    rounded_rect(draw, (url_x, url_y, url_x + url_w, url_y + url_h), 9, fill=(40, 44, 70))
    draw.text((url_x + 14, url_y + 1), "https://control-cuentas.vercel.app/login",
              fill=C_TEXT_DIM, font=get_font("WorkSans-Regular.ttf", 11))

    # ========== Login Page Content ==========
    # Gradient background (matching actual app)
    cx0 = frame_x + 20
    cy0 = frame_y + bar_h + 10
    cw = frame_w - 40
    ch = frame_h - bar_h - 30

    # Background gradient - teal/emerald
    draw_gradient(draw, (cx0, cy0, cx0 + cw, cy0 + ch), [
        (0.0, (5, 50, 40)),
        (0.5, (6, 60, 52)),
        (1.0, (4, 45, 55)),
    ])

    # Glowing orbs (matching actual login page)
    draw_blurry_orb(draw, cx0 + cw - 100, cy0 + 50, 250, (16, 185, 129))
    draw_blurry_orb(draw, cx0 + 100, cy0 + ch - 50, 200, (20, 184, 166))

    # ========== Login Card ==========
    card_w, card_h2 = 380, 440
    card_x = cx0 + (cw - card_w) // 2
    card_y2 = cy0 + (ch - card_h2) // 2

    # Card shadow
    rounded_rect(draw, (card_x + 4, card_y2 + 4, card_x + card_w + 4, card_y2 + card_h2 + 4),
                 16, fill=(0, 0, 0, 60))

    # Card background
    rounded_rect(draw, (card_x, card_y2, card_x + card_w, card_y2 + card_h2),
                 16, fill=(245, 247, 250))

    # Logo icon
    logo_size = 64
    logox = card_x + (card_w - logo_size) // 2
    logoy = card_y2 + 36
    rounded_rect(draw, (logox, logoy, logox + logo_size, logoy + logo_size),
                 14, fill=C_PRIMARY)
    # Wallet icon inside
    draw.text((logox + 18, logoy + 14), "$", fill=C_WHITE, font=get_font("WorkSans-Bold.ttf", 28))

    # "Control Cuentas" title
    draw.text((card_x + (card_w - 160) // 2, card_y2 + 110), "Control Cuentas",
              fill=(20, 22, 40), font=get_font("InstrumentSans-Bold.ttf", 26))
    draw.text((card_x + (card_w - 210) // 2, card_y2 + 140), "Ingresá tus credenciales para acceder",
              fill=(120, 125, 145), font=get_font("WorkSans-Regular.ttf", 12))

    # Email field
    field_y = card_y2 + 180
    draw.text((card_x + 28, field_y), "Email", fill=(50, 55, 75),
              font=get_font("WorkSans-Regular.ttf", 12))
    field_x1, field_x2 = card_x + 28, card_x + card_w - 28
    rounded_rect(draw, (field_x1, field_y + 22, field_x2, field_y + 50),
                 8, fill=(230, 232, 240))
    draw.text((field_x1 + 10, field_y + 28), "tu@email.com", fill=(160, 165, 180),
              font=get_font("WorkSans-Regular.ttf", 12))
    # Mail icon
    draw.text((field_x2 - 28, field_y + 28), "✉", fill=(160, 165, 180),
              font=get_font("WorkSans-Regular.ttf", 12))

    # Password field
    pw_y = field_y + 65
    draw.text((card_x + 28, pw_y), "Password", fill=(50, 55, 75),
              font=get_font("WorkSans-Regular.ttf", 12))
    rounded_rect(draw, (field_x1, pw_y + 22, field_x2, pw_y + 50),
                 8, fill=(230, 232, 240))
    draw.text((field_x1 + 10, pw_y + 28), "••••••••", fill=(160, 165, 180),
              font=get_font("WorkSans-Regular.ttf", 12))
    # Eye icon
    draw.text((field_x2 - 28, pw_y + 28), "👁", fill=(160, 165, 180),
              font=get_font("WorkSans-Regular.ttf", 12))

    # Login button
    btn_y = pw_y + 62
    btn_h = 44
    draw_gradient(draw, (field_x1, btn_y, field_x2, btn_y + btn_h), [
        (0.0, C_PRIMARY),
        (1.0, C_PRIMARY2),
    ])
    rounded_rect(draw, (field_x1, btn_y, field_x2, btn_y + btn_h),
                 10, fill=None)  # Shape already drawn by gradient above
    # Redraw shape outline over gradient
    draw.rounded_rectangle([field_x1, btn_y, field_x2, btn_y + btn_h],
                           radius=10, outline=None)
    draw.text((card_x + card_w // 2 - 32, btn_y + 12), "Ingresar", fill=C_WHITE,
              font=get_font("WorkSans-Bold.ttf", 16))

    # Demo credentials hint
    draw.text((card_x + (card_w - 170) // 2, btn_y + 60),
              "Demo: demo@controlcuentas.com", fill=(160, 165, 180),
              font=get_font("WorkSans-Regular.ttf", 10))

    img.save(os.path.join(OUT_DIR, "login-mockup.png"))
    print("✅ login-mockup.png saved")


# ══════════════════════════════════════════════════════════════════════════
# 4. MOBILE MOCKUP — 600x900 in phone frame
# ══════════════════════════════════════════════════════════════════════════

def create_mobile_mockup():
    W, H = 600, 900
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    # Dark background
    draw.rectangle([0, 0, W, H], fill=(15, 17, 32))

    # ========== Phone Frame ==========
    phone_w, phone_h = 380, 780
    phone_x = (W - phone_w) // 2
    phone_y = (H - phone_h) // 2

    # Phone body shadow
    rounded_rect(draw, (phone_x + 6, phone_y + 6, phone_x + phone_w + 6, phone_y + phone_h + 6),
                 50, fill=(0, 0, 0, 80))

    # Phone body
    rounded_rect(draw, (phone_x, phone_y, phone_x + phone_w, phone_y + phone_h),
                 48, fill=(20, 22, 42), outline=(50, 55, 85, 60))

    # Notch / dynamic island
    notch_w, notch_h = 100, 26
    notch_x = phone_x + (phone_w - notch_w) // 2
    notch_y = phone_y + 12
    rounded_rect(draw, (notch_x, notch_y, notch_x + notch_w, notch_y + notch_h),
                 13, fill=(12, 14, 28))

    # Screen area
    screen_x = phone_x + 14
    screen_y = phone_y + 48
    screen_w = phone_w - 28
    screen_h = phone_h - 78

    # Screen background - dark mode dashboard
    draw.rectangle([screen_x, screen_y, screen_x + screen_w, screen_y + screen_h],
                   fill=(18, 20, 38))

    # Bottom home indicator
    home_y = screen_y + screen_h - 6
    home_ind_w = 110
    rounded_rect(draw, ((W - home_ind_w) // 2, home_y, (W + home_ind_w) // 2, home_y + 4),
                 2, fill=(50, 55, 75))

    # ========== Mobile App UI ==========
    mx = screen_x
    my = screen_y + 10
    mw = screen_w
    mh = screen_h - 20

    # Status bar area
    draw.text((mx + 14, my), "9:41", fill=C_TEXT, font=get_font("WorkSans-Bold.ttf", 12))
    # Signal, wifi, battery
    draw.text((mx + mw - 60, my), "📶 🔋 96%", fill=C_TEXT_DIM,
              font=get_font("WorkSans-Regular.ttf", 8))

    # Top header bar
    h_y = my + 24
    h_h = 40
    draw.rectangle([mx, h_y, mx + mw, h_y + h_h], fill=(22, 25, 48))
    # Hamburger menu
    for i in range(3):
        draw.rounded_rectangle([mx + 14, h_y + 14 + i * 6, mx + 22, h_y + 15 + i * 6],
                               radius=1, fill=C_TEXT_MUTED)
    # Title
    draw.text((mx + 34, h_y + 10), "Control Cuentas", fill=C_TEXT,
              font=get_font("InstrumentSans-Bold.ttf", 14))
    # Profile icon
    draw.ellipse([mx + mw - 34, h_y + 10, mx + mw - 16, h_y + 28], fill=(40, 44, 70))

    # ========== Content Area ==========
    cx = mx + 10
    cy = h_y + h_h + 12
    cw = mw - 20

    # Summary mini-cards
    scard_w = (cw - 8) // 3
    scard_h = 65
    scards = [
        ("$12.5k", C_GREEN, "↑"),
        ("$8.2k", C_RED, "↓"),
        ("$4.3k", C_GREEN, "✓"),
    ]
    for i, (val, accent, icon) in enumerate(scards):
        scx = cx + i * (scard_w + 4)
        rounded_rect(draw, (scx, cy, scx + scard_w, cy + scard_h),
                     10, fill=(26, 30, 52))
        draw.text((scx + 6, cy + 6), icon, fill=accent, font=get_font("WorkSans-Bold.ttf", 11))
        draw.text((scx + 6, cy + 22), val, fill=C_WHITE, font=get_font("InstrumentSans-Bold.ttf", 14))
        draw.text((scx + 6, cy + 42), "Saldo", fill=C_TEXT_DIM, font=get_font("WorkSans-Regular.ttf", 8))

    # Categories section
    cat_y = cy + scard_h + 14
    draw.text((cx, cat_y), "Categorías", fill=C_TEXT, font=get_font("WorkSans-Bold.ttf", 13))

    cat_items = [
        ("Alimentos", "$2,450", C_PRIMARY, 35),
        ("Servicios", "$1,800", C_ACCENT, 25),
        ("Transporte", "$950", C_PURPLE, 15),
        ("Ocio", "$680", (255, 159, 67), 12),
        ("Salud", "$520", (239, 68, 68), 8),
        ("Educación", "$350", (59, 130, 246), 5),
    ]

    cat_cy = cat_y + 24
    for i, (name, amount, color, pct) in enumerate(cat_items):
        item_y = cat_cy + i * 34
        # Color dot
        draw.ellipse([cx, item_y + 4, cx + 10, item_y + 14], fill=color)
        draw.text((cx + 18, item_y), name, fill=C_TEXT, font=get_font("WorkSans-Regular.ttf", 11))
        draw.text((cx + cw - 50, item_y), amount, fill=C_TEXT_MUTED, font=get_font("WorkSans-Regular.ttf", 11))

        # Progress bar
        bar_y = item_y + 18
        rounded_rect(draw, (cx + 18, bar_y, cx + cw - 50, bar_y + 3), 2, fill=(35, 38, 60))
        bar_w = int((cw - 68) * pct / 100)
        if bar_w > 0:
            rounded_rect(draw, (cx + 18, bar_y, cx + 18 + bar_w, bar_y + 3), 2, fill=color)

    # Bottom navigation
    bnav_y = screen_y + screen_h - 50
    draw.rectangle([mx, bnav_y, mx + mw, screen_y + screen_h], fill=(22, 25, 48))
    bnav_items = ["🏠", "🏷️", "📊", "⚙️"]
    item_w = mw // len(bnav_items)
    for i, item in enumerate(bnav_items):
        ix = mx + i * item_w + item_w // 2
        fill = C_PRIMARY if i == 0 else C_TEXT_DIM
        draw.text((ix - 6, bnav_y + 8), item, fill=fill, font=get_font("WorkSans-Regular.ttf", 18))
        if i == 0:
            draw.text((ix - 14, bnav_y + 28), "Dashboard", fill=C_PRIMARY,
                      font=get_font("WorkSans-Regular.ttf", 7))
        else:
            draw.text((ix - 14, bnav_y + 28), item[1:], fill=C_TEXT_DIM,
                      font=get_font("WorkSans-Regular.ttf", 7))

    img.save(os.path.join(OUT_DIR, "mobile-mockup.png"))
    print("✅ mobile-mockup.png saved")


# ══════════════════════════════════════════════════════════════════════════
# RUN
if __name__ == "__main__":
    create_banner()
    create_dashboard_mockup()
    create_login_mockup()
    create_mobile_mockup()
    print("\n🎉 All screenshots generated successfully!")
    print(f"📁 Output: {OUT_DIR}")
