"""Cut the three 9:16 School of Athens panels from the wide AI re-render.

Usage: python3 cut_panels.py <wide_rerender.png>

Panel boxes are defined on the 3200x1993 wide canvas (athens_wide_fill_canvas.png)
and scaled to whatever size the re-render came back at.
Writes athens_{left,centre,right}_first_frame_ai_1080.png next to this script.
"""
import sys
from pathlib import Path
from PIL import Image

CANVAS_W, CANVAS_H = 3200, 1993
PANEL_W = 1121  # 1993 * 9/16
PANELS = {"left": 0, "centre": 1058, "right": 2079}

src = Image.open(sys.argv[1]).convert("RGB")
sx, sy = src.width / CANVAS_W, src.height / CANVAS_H
if abs(sx - sy) > 0.01:
    sys.exit(f"Aspect changed in re-render ({src.size}); expected ~{CANVAS_W}x{CANVAS_H} ratio.")

out_dir = Path(__file__).parent
for name, x in PANELS.items():
    box = (round(x * sx), 0, round((x + PANEL_W) * sx), src.height)
    panel = src.crop(box).resize((1080, 1920), Image.LANCZOS)
    path = out_dir / f"athens_{name}_first_frame_ai_1080.png"
    panel.save(path)
    print(path, "from", box)
