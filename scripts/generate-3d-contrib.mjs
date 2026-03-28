import fs from "node:fs/promises";

const username = process.env.GITHUB_USER || "WilliamK112";
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("GITHUB_TOKEN is required");
  process.exit(1);
}

const query = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            contributionCount
            contributionLevel
            date
          }
        }
      }
    }
  }
}
`;

const resp = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query, variables: { login: username } }),
});

if (!resp.ok) {
  console.error(`GraphQL request failed: ${resp.status}`);
  console.error(await resp.text());
  process.exit(1);
}

const json = await resp.json();
const weeks = json?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
if (!Array.isArray(weeks) || weeks.length === 0) {
  console.error("No contribution weeks found");
  process.exit(1);
}

const recentWeeks = weeks.slice(-28);
const rows = 7;
const cols = recentWeeks.length;

const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
for (let x = 0; x < cols; x += 1) {
  const days = recentWeeks[x]?.contributionDays ?? [];
  for (let y = 0; y < Math.min(rows, days.length); y += 1) {
    grid[y][x] = days[y]?.contributionCount ?? 0;
  }
}

const maxCount = Math.max(1, ...grid.flat());
const sx = 12;
const sy = 7;
const ox = 100;
const oy = 118;
const minH = 1;
const maxH = 52;

function barHeight(count) {
  if (count <= 0) return 0;
  const n = Math.log1p(count) / Math.log1p(maxCount);
  return Math.round(minH + n * (maxH - minH));
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cube(x, y, h, active, delay) {
  const top = [
    [x, y - h],
    [x + sx, y - h + sy],
    [x, y - h + 2 * sy],
    [x - sx, y - h + sy],
  ];
  const left = [
    [x - sx, y - h + sy],
    [x, y - h + 2 * sy],
    [x, y + 2 * sy],
    [x - sx, y + sy],
  ];
  const right = [
    [x + sx, y - h + sy],
    [x, y - h + 2 * sy],
    [x, y + 2 * sy],
    [x + sx, y + sy],
  ];

  const cls = active ? "active tile" : "base tile";
  const style = active ? ` style="animation-delay:${delay.toFixed(2)}s"` : "";
  const p = (pts) => pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" ");

  return `
  <g class="${cls}"${style}>
    <polygon class="left" points="${p(left)}"/>
    <polygon class="right" points="${p(right)}"/>
    <polygon class="top" points="${p(top)}"/>
  </g>`;
}

const svg = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="260" viewBox="0 0 960 260">`);
svg.push(`  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#061433"/>
      <stop offset="100%" stop-color="#0b224d"/>
    </linearGradient>
    <linearGradient id="topFace" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6cc1ff"/>
      <stop offset="60%" stop-color="#3478ff"/>
      <stop offset="100%" stop-color="#f0c66d"/>
    </linearGradient>
    <linearGradient id="leftFace" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2d67e8"/>
      <stop offset="100%" stop-color="#173a7c"/>
    </linearGradient>
    <linearGradient id="rightFace" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f0c66d"/>
      <stop offset="100%" stop-color="#8a6a2e"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`);

svg.push(`  <style>
    .title{font:700 18px -apple-system,BlinkMacSystemFont,Segoe UI,Inter,Arial;fill:#d9e7ff}
    .sub{font:500 12px -apple-system,BlinkMacSystemFont,Segoe UI,Inter,Arial;fill:#97b4ee}
    .tile{opacity:.97}
    .base .top{fill:#1b3266}.base .left{fill:#13264f}.base .right{fill:#244d8b}
    .active .top{fill:url(#topFace)} .active .left{fill:url(#leftFace)} .active .right{fill:url(#rightFace)}
    .active{filter:url(#glow);animation:float 3.0s ease-in-out infinite;transform-origin:center;}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
  </style>`);

svg.push(`  <rect x="0" y="0" width="960" height="260" fill="url(#bg)" rx="16"/>`);
svg.push(`  <text class="title" x="28" y="34">3D Contributions · Live Data (Blue ↔ Gold)</text>`);
svg.push(`  <text class="sub" x="28" y="54">Auto-generated from ${esc(username)} GitHub contributions · max day: ${maxCount}</text>`);

for (let s = 0; s <= cols + rows - 2; s += 1) {
  for (let y = 0; y < rows; y += 1) {
    const x = s - y;
    if (x < 0 || x >= cols) continue;

    const count = grid[y][x];
    const h = barHeight(count);
    const bx = ox + (x - y) * sx;
    const by = oy + (x + y) * sy;
    const active = h > 0;
    const delay = ((x + y) % 12) * 0.12;
    svg.push(cube(bx, by, h, active, delay));
  }
}

svg.push(`</svg>`);

await fs.mkdir("assets", { recursive: true });
await fs.writeFile("assets/blue-gold-3d-contrib.svg", svg.join("\n"), "utf8");
console.log("generated assets/blue-gold-3d-contrib.svg");
