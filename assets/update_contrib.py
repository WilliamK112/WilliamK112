#!/usr/bin/env python3
"""
GitHub Contribution 3D Graph Updater

用法:
    python update_contrib.py              # 默认更新到最新
    python update_contrib.py --dry-run    # 预览不提交
    python update_contrib.py --version v33  # 指定版本号

流程:
1. 从 GitHub API 获取最新贡献数据
2. 生成 3D SVG + PNG
3. 更新 README.md 引用
4. 自动提交并推送
"""
import json
import urllib.request
import subprocess
import argparse
from datetime import date, timedelta
import os

GITHUB_USER = "WilliamK112"
REPO_NAME = "WilliamK112"
ASSETS_DIR = "assets"

def get_contributions():
    """从 API 获取贡献数据"""
    url = f"https://github-contributions-api.jogruber.de/v4/{GITHUB_USER}"
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read())
    
    # 取 2026 年数据
    contrib_map = {}
    for c in data['contributions']:
        if c['date'].startswith('2026'):
            contrib_map[c['date']] = c['level']
    
    total = sum(c['count'] for c in data['contributions'] if c['date'].startswith('2026'))
    return contrib_map, total

def generate_svg(contrib_map, total, version):
    """生成 3D SVG"""
    width, height = 280, 150
    
    def make_tile(x, y, z, active=False):
        h = 2 + z * 3
        cls = "active" if active else "base"
        return f'''<g class="{cls} tile">
<polygon class="left" points="{x},{y} {x+4},{y+1} {x+4},{y+1+h} {x},{y+h}"/>
<polygon class="right" points="{x+8},{y} {x+4},{y+1} {x+4},{y+1+h} {x+8},{y+h}"/>
<polygon class="top" points="{x+4},{y} {x+8},{y+1} {x+4},{y+2} {x},{y+1}"/>
</g>'''
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f6f8fa"/><stop offset="100%" stop-color="#f6f8fa"/></linearGradient>
<linearGradient id="topFace" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#73c6ff"/><stop offset="58%" stop-color="#2f73ff"/><stop offset="100%" stop-color="#f0cb75"/></linearGradient>
<linearGradient id="leftFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2b64e3"/><stop offset="100%" stop-color="#173a78"/></linearGradient>
<linearGradient id="rightFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f0cb75"/><stop offset="100%" stop-color="#8a6a2e"/></linearGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<style>
.title{{font:700 10px -apple-system,BlinkMacSystemFont,Segoe UI,Inter,Arial;fill:#24292f}}
.sub{{font:500 8px -apple-system,BlinkMacSystemFont,Segoe UI,Inter,Arial;fill:#57606a}}
.base .top{{fill:#e7ebef}}.base .left{{fill:#d8dee4}}.base .right{{fill:#cfd8e3}}
.active .top{{fill:url(#topFace)}} .active .left{{fill:url(#leftFace)}} .active .right{{fill:url(#rightFace)}}
.active{{filter:url(#glow)}}
</style>
<rect x="0" y="0" width="{width}" height="{height}" fill="none" rx="4"/>
<text class="title" x="4" y="10">{total} contributions</text>
<text class="sub" x="4" y="18">in the last year</text>
'''
    
    tile_size, start_x, start_y = 4, 30, 51
    for week in range(52):
        for day in range(7):
            x = start_x + week * tile_size
            y = start_y + day * tile_size
            d = date(2026, 1, 1) + timedelta(days=week * 7 + day)
            level = contrib_map.get(d.isoformat(), 0)
            svg += make_tile(x, y, level, level > 0)
    
    svg += "</svg>"
    
    filename = f"blue-gold-3d-contrib-{version}"
    with open(f"{ASSETS_DIR}/{filename}.svg", "w") as f:
        f.write(svg)
    
    # Convert to PNG
    subprocess.run(["rsvg-convert", "-w", "560", "-h", "300", 
                   f"{ASSETS_DIR}/{filename}.svg", "-o", f"{ASSETS_DIR}/{filename}.png"],
                  capture_output=True)
    
    return filename, total

def update_readme(filename, total):
    """更新 README"""
    with open("README.md", "r") as f:
        content = f.read()
    
    # 替换图片引用
    old_pattern = r'!\[\]\(\./assets/blue-gold-3d-contrib-v\d+\.png\)'
    new_img = f'![](.//assets/{filename}.png)'
    
    import re
    content = re.sub(r'!\[\]\(\./assets/blue-gold-3d-contrib-v\d+\.png\)', new_img, content)
    
    # 更新 alt 文字
    content = content.replace(f'alt="{total} contributions in the last year"', 
                             f'alt="{total} contributions in the last year (shape locked)"')
    
    with open("README.md", "w") as f:
        f.write(content)

def main():
    parser = argparse.ArgumentParser(description="Update GitHub 3D contribution graph")
    parser.add_argument("--version", "-v", default="v33", help="Version suffix (default: v33)")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, don't commit")
    args = parser.parse_args()
    
    print(f"🔄 Fetching contributions for {GITHUB_USER}...")
    contrib_map, total = get_contributions()
    print(f"   Total 2026 contributions: {total}")
    
    print(f"🎨 Generating 3D graph (version {args.version})...")
    filename, total = generate_svg(contrib_map, total, args.version)
    print(f"   Created: {filename}.svg + .png")
    
    print(f"📝 Updating README.md...")
    update_readme(filename, total)
    
    if args.dry_run:
        print("✅ Dry run complete (no commit)")
        return
    
    print("🚀 Committing and pushing...")
    subprocess.run(["git", "add", f"assets/{filename}.svg", f"assets/{filename}.png", "README.md"])
    subprocess.run(["git", "commit", "-m", f"feat: update 3D contrib graph to {total} contributions"])
    subprocess.run(["git", "push"])
    print(f"✅ Done! Commit pushed.")

if __name__ == "__main__":
    main()