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
const weeks = json?.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];

// Last 21 weeks matching grid
const recentWeeks = weeks.slice(-21);
const rows = 7;
const cols = recentWeeks.length;

const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

for (let x = 0; x < cols; x += 1) {
  const days = recentWeeks[x]?.contributionDays ?? [];
  for (let y = 0; y < Math.min(rows, days.length); y += 1) {
    grid[y][x] = days[y]?.contributionCount ?? 0;
  }
}

const tileSize = 11;
const tileGap = 3;
const startX = 10;
const startY = 10;

const svgParts = [];

const width = cols * (tileSize + tileGap) + 20;
const height = rows * (tileSize + tileGap) + 30;

svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:transparent">`);

// CSS for snake animation
svgParts.push(`  <style>
    @keyframes snake {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -60; }
    }
    .snake-path {
      fill: none;
      stroke: url(#snakeGradient);
      stroke-width: 6;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 8 12;
      animation: snake 1s linear infinite;
    }
    .snake-dot {
      fill: #238636;
      filter: drop-shadow(0 0 3px #2ea043);
    }
  </style>`);

svgParts.push(`  <defs>
    <linearGradient id="snakeGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2ea043"/>
      <stop offset="100%" stop-color="#3fb950"/>
    </linearGradient>
  </defs>`);

// Generate a winding snake path based on actual contribution data
// Snake winds through cells with contributions
const pathPoints = [];

for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) {
    if (grid[y][x] > 0) {
      const px = startX + x * (tileSize + tileGap) + tileSize / 2;
      const py = startY + y * (tileSize + tileGap) + tileSize / 2;
      pathPoints.push({ x: px, y: py, count: grid[y][x] });
    }
  }
}

if (pathPoints.length > 0) {
  // Sort to create a winding path (snake pattern)
  pathPoints.sort((a, b) => {
    const colDiff = Math.abs(a.x - b.x);
    if (colDiff < 20) return a.y - b.y;
    return a.x - b.x;
  });

  // Build path string
  let pathD = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
  
  for (let i = 1; i < Math.min(pathPoints.length, 30); i++) {
    const p = pathPoints[i];
    pathD += ` L ${p.x} ${p.y}`;
  }

  svgParts.push(`  <path class="snake-path" d="${pathD}"/>`);

  // Add animated dots at interval points
  for (let i = 0; i < Math.min(pathPoints.length, 8); i++) {
    const p = pathPoints[i * 4] || pathPoints[pathPoints.length - 1];
    svgParts.push(`  <circle class="snake-dot" cx="${p.x}" cy="${p.y}" r="3">
      <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" begin="${i * 0.2}s"/>
    </circle>`);
  }
}

svgParts.push(`</svg>`);

await fs.mkdir("assets", { recursive: true });
await fs.writeFile("assets/snake.svg", svgParts.join("\n"), "utf8");
console.log("generated assets/snake.svg");