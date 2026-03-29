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

const recentWeeks = weeks.slice(-53);
recentWeeks.reverse();
const rows = 7;
const cols = recentWeeks.length;

const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
const levelGrid = Array.from({ length: rows }, () => Array(cols).fill("NONE"));

for (let x = 0; x < cols; x += 1) {
  const days = recentWeeks[x]?.contributionDays ?? [];
  for (let y = 0; y < Math.min(rows, days.length); y += 1) {
    const day = days[y] ?? {};
    grid[y][x] = day.contributionCount ?? 0;
    levelGrid[y][x] = day.contributionLevel ?? "NONE";
  }
}

const maxCount = Math.max(1, ...grid.flat());

// Layout tuned for "full-board fit" (no crop) inside one dark-blue hero card
// Keep a dedicated title band, then place full 53-week board below it.
const cellW = 4;
const cellH = 1;
const startX = 34; // prevents left-face clipping at y=6
const startY = 52; // preserves clear title/subtitle area (no overlap)

function levelScore(level) {
  switch (level) {
    case "FOURTH_QUARTILE": return 4;
    case "THIRD_QUARTILE": return 3;
    case "SECOND_QUARTILE": return 2;
    case "FIRST_QUARTILE": return 1;
    default: return 0;
  }
}

function barHeight(count, level) {
  if (count <= 0) return 2;
  const n = Math.sqrt(count / maxCount);
  const levelBoost = levelScore(level) * 3;
  return Math.round(2 + n * 14 + levelBoost);
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cube(x, y, h, active, delay) {
  const top = [
    [x, y - h],
    [x + cellW, y - h + cellH],
    [x, y - h + 2 * cellH],
    [x - cellW, y - h + cellH],
  ];
  const left = [
    [x - cellW, y - h + cellH],
    [x, y - h + 2 * cellH],
    [x, y + 2 * cellH],
    [x - cellW, y + cellH],
  ];
  const right = [
    [x + cellW, y - h + cellH],
    [x, y - h + 2 * cellH],
    [x, y + 2 * cellH],
    [x + cellW, y + cellH],
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

const svgWidth = 280;
const svgHeight = 150;

const svg = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`);
svg.push(`  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#05122f"/>
      <stop offset="100%" stop-color="#0c224f"/>
    </linearGradient>
    <linearGradient id="topFace" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#73c6ff"/>
      <stop offset="58%" stop-color="#2f73ff"/>
      <stop offset="100%" stop-color="#f0cb75"/>
    </linearGradient>
    <linearGradient id="leftFace" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2b64e3"/>
      <stop offset="100%" stop-color="#173a78"/>
    </linearGradient>
    <linearGradient id="rightFace" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f0cb75"/>
      <stop offset="100%" stop-color="#8a6a2e"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`);

svg.push(`  <style>
    .title{font:700 10px -apple-system,BlinkMacSystemFont,Segoe UI,Inter,Arial;fill:#d9e7ff}
    .sub{font:500 8px -apple-system,BlinkMacSystemFont,Segoe UI,Inter,Arial;fill:#97b4ee}
    .base .top{fill:#1a315f}.base .left{fill:#14274d}.base .right{fill:#244a84}
    .active .top{fill:url(#topFace)} .active .left{fill:url(#leftFace)} .active .right{fill:url(#rightFace)}
    .active{filter:url(#glow)}
  </style>`);

svg.push(`  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="url(#bg)" rx="4"/>`);
svg.push(`  <text class="title" x="4" y="10">3D Activity</text>`);
svg.push(`  <text class="sub" x="4" y="18">53w · max ${maxCount}</text>`);

for (let s = 0; s <= cols + rows - 2; s += 1) {
  for (let y = 0; y < rows; y += 1) {
    const x = s - y;
    if (x < 0 || x >= cols) continue;

    const count = grid[y][x];
    const level = levelGrid[y][x];
    const h = barHeight(count, level);
    const bx = startX + (x - y) * cellW;
    const by = startY + (x + y) * cellH;
    const active = count > 0;
    const delay = ((x + y) % 14) * 0.05;
    svg.push(cube(bx, by, h, active, delay));
  }
}

svg.push(`</svg>`);

await fs.mkdir("assets", { recursive: true });
await fs.writeFile("assets/blue-gold-3d-contrib.svg", svg.join("\n"), "utf8");
console.log("generated assets/blue-gold-3d-contrib.svg");