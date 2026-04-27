#!/usr/bin/env python3
"""
Update approved 3D contribution banner.
Generates isometric cube grid from GitHub contribution data.

Usage:
    python3 scripts/update-approved-3d-banner.py --version v35 --reveal   # preview
    python3 scripts/update-approved-3d-banner.py --overwrite-approved    # update approved v32 files
"""

import argparse
import os
import sys
import re
import math
import subprocess
from pathlib import Path

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    from matplotlib.patches import FancyBboxPatch
except ImportError:
    print("ERROR: matplotlib required. Run: pip install matplotlib")
    sys.exit(1)


# ─── Colour palette (approved blue-gold theme) ───────────────────────────────
C_BG      = "#eef4ff"   # card background
C_GRID    = "#8bb8ff"   # grid line / card border
C0        = "#eef4ff"   # 0 contributions
C1        = "#d6e8ff"   # 1-3 contributions
C2        = "#8bb8ff"   # 4-6 contributions
C3        = "#4f8dff"   # 7-9 contributions
C4        = "#1f5fd6"   # 10+ contributions (deepest)
GOLD      = "#f5c86b"   # accent / title colour
WHITE     = "#ffffff"


# ─── GitHub GraphQL ────────────────────────────────────────────────────────────
def fetch_contributions(token: str) -> dict:
    """Fetch 53 weeks of contribution counts via GitHub GraphQL."""
    query = """
    {
      viewer {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
    """
    import urllib.request
    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=query.encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "WilliamK112/3d-banner-updater",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    import json
    result = json.loads(data)
    if "errors" in result:
        raise RuntimeError(f"GraphQL error: {result['errors']}")
    cal = result["data"]["viewer"]["contributionsCollection"]["contributionCalendar"]
    return {
        "total": cal["totalContributions"],
        "weeks": [w["contributionDays"] for w in cal["weeks"]],
    }


# ─── Isometric cube helper ─────────────────────────────────────────────────────
def iso_cube(ax, cx, cy, cz, size, face_colors):
    """
    Draw a 3D isometric cube at (cx,cy,cz) with given face colours.
    cx,cy = bottom-centre x,y in data coords; cz = 'height' in data coords
    face_colors = (top, left, right) hex strings.
    """
    d = size
    # Isometric projection: 30° from horizontal
    # Top face (diamond)
    top = [
        (cx,              cy - d * 0.866),
        (cx + d * 0.5,    cy - d * 0.433),
        (cx,              cy - d * 0.0),
        (cx - d * 0.5,    cy - d * 0.433),
    ]
    # Left face
    left = [
        (cx - d * 0.5,    cy - d * 0.433),
        (cx,              cy),
        (cx,              cy + cz),
        (cx - d * 0.5,    cy - d * 0.433 + cz),
    ]
    # Right face
    right = [
        (cx,              cy),
        (cx + d * 0.5,    cy - d * 0.433),
        (cx + d * 0.5,   cy - d * 0.433 + cz),
        (cx,              cy + cz),
    ]
    for pts, col in [(top, face_colors[0]), (left, face_colors[1]), (right, face_colors[2])]:
        poly = plt.Polygon(pts, closed=True, facecolor=col, edgecolor="none", linewidth=0)
        ax.add_patch(poly)


def contrib_color(count: int) -> tuple:
    if count == 0: return (C0, C0, C0)
    if count <= 3: return (C1, C1, C1)
    if count <= 6: return (C2, C2, C2)
    if count <= 9: return (C3, C3, C3)
    return (C4, C4, C4)


# ─── Renderer ─────────────────────────────────────────────────────────────────
def render_banner(weeks_data: list, total: int, output_svg: str, output_png: str,
                  reveal: bool = False):
    """
    Render the approved white-card isometric cube grid.
    53 columns (weeks) × 7 rows (days).
    """
    CELL   = 0.85   # horizontal spacing
    ROW_H  = 0.60   # vertical step per day
    CUBE_D = 0.45   # cube base half-width
    MIN_H  = 0.08   # minimum cube height for 0 contributions
    MAX_H  = 1.10   # max cube height for 10+ contributions
    TOP_PAD   = 1.4
    BOT_PAD   = 0.3
    LEFT_PAD  = 0.5
    RIGHT_PAD = 0.5

    n_weeks = len(weeks_data)
    n_days_max = 7

    fig_w = LEFT_PAD + n_weeks * CELL + RIGHT_PAD
    fig_h = TOP_PAD + n_days_max * ROW_H + BOT_PAD

    fig, ax = plt.subplots(figsize=(fig_w, fig_h), dpi=120)
    fig.patch.set_facecolor(C_BG)
    ax.set_facecolor(C_BG)

    # Title
    title_color = GOLD if not reveal else "#888888"
    ax.text(
        fig_w / 2, fig_h - 0.55,
        f"github contributions",
        fontsize=7, fontweight="bold", color=title_color,
        ha="center", va="top",
        fontfamily="monospace",
    )
    ax.text(
        fig_w / 2, fig_h - 0.95,
        f"{total:,} in the last year",
        fontsize=5.5, color=title_color,
        ha="center", va="top",
        fontfamily="monospace",
    )

    max_count = max(
        max(day["contributionCount"] for day in week) if week else 0
        for week in weeks_data
    )
    if max_count == 0:
        max_count = 1

    # Draw cubes
    for col, week in enumerate(weeks_data):
        x = LEFT_PAD + col * CELL + CELL / 2
        for row in range(7):
            # Pad short weeks at the start
            if row < len(week):
                count = week[row]["contributionCount"]
            else:
                count = 0

            height_frac = count / max_count if max_count > 0 else 0
            cz = MIN_H + height_frac * (MAX_H - MIN_H)

            y_base = TOP_PAD + (6 - row) * ROW_H  # top row = day 0 (Sunday)

            iso_cube(
                ax,
                cx=x,
                cy=y_base,
                cz=cz,
                size=CUBE_D,
                face_colors=contrib_color(count),
            )

    # Card border
    card_x = LEFT_PAD - 0.15
    card_y = BOT_PAD - 0.05
    card_w = n_weeks * CELL + 0.30
    card_h = TOP_PAD + n_days_max * ROW_H + 0.10
    card = FancyBboxPatch(
        (card_x, card_y), card_w, card_h,
        boxstyle="round,pad=0.05",
        linewidth=1.2,
        edgecolor=C_GRID,
        facecolor="none",
    )
    ax.add_patch(card)

    ax.set_xlim(0, fig_w)
    ax.set_ylim(0, fig_h)
    ax.set_aspect("equal")
    ax.axis("off")

    fig.savefig(output_svg, bbox_inches="tight", facecolor=C_BG)
    plt.close(fig)
    print(f"Saved SVG: {output_svg}")

    # Convert SVG → PNG with librsvg
    if output_png:
        result = subprocess.run(
            ["rsvg-convert", "-w", "900", "-h", "180", "-f", "png",
             "-o", output_png, output_svg],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            print(f"WARNING: rsvg-convert failed: {result.stderr}")
        else:
            print(f"Saved PNG: {output_png}")


# ─── README updater ──────────────────────────────────────────────────────────
def update_readme_alt(total: int):
    readme = Path("README.md")
    if not readme.exists():
        return
    content = readme.read_text(encoding="utf-8")
    # Match: <!-- contributions count start -->NUMBER<!-- contributions count end -->
    pattern = r"(<!-- contributions count start -->)\d+(<!-- contributions count end -->)"
    replacement = f"\\g<1>{total}\\g<2>"
    new_content = re.sub(pattern, replacement, content)
    if new_content != content:
        readme.write_text(new_content, encoding="utf-8")
        print(f"Updated README.md contribution count → {total}")


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Update approved 3D contribution banner")
    parser.add_argument("--version", default="v35", help="Banner version label (default: v35)")
    parser.add_argument("--reveal", action="store_true", help="Show preview instead of overwriting")
    parser.add_argument("--overwrite-approved", action="store_true",
                        help="Overwrite approved v32 assets and update README")
    args = parser.parse_args()

    token = os.environ.get("GITHUB_TOKEN", "")
    if not token:
        print("WARNING: GITHUB_TOKEN not set; trying local gh auth")
        try:
            import urllib.request
            result = subprocess.run(
                ["gh", "auth", "token"], capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                token = result.stdout.strip()
        except Exception as e:
            print(f"Could not get gh token: {e}")
    if not token:
        print("ERROR: No GitHub token available. Set GITHUB_TOKEN env var.")
        sys.exit(1)

    print("Fetching GitHub contributions...")
    contrib_data = fetch_contributions(token)
    weeks = contrib_data["weeks"]
    total  = contrib_data["total"]
    print(f"Total contributions: {total:,} across {len(weeks)} weeks")

    if args.overwrite_approved:
        out_svg = "assets/blue-gold-3d-contrib-v32.svg"
        out_png = "assets/blue-gold-3d-contrib-v32.png"
        os.makedirs("assets", exist_ok=True)
        render_banner(weeks, total, out_svg, out_png, reveal=False)
        update_readme_alt(total)
    elif args.reveal:
        out_svg = f"assets/blue-gold-3d-contrib-{args.version}.svg"
        out_png = f"assets/blue-gold-3d-contrib-{args.version}.png"
        os.makedirs("assets", exist_ok=True)
        render_banner(weeks, total, out_svg, out_png, reveal=True)
    else:
        print("No action. Use --reveal to preview or --overwrite-approved to update.")


if __name__ == "__main__":
    main()
