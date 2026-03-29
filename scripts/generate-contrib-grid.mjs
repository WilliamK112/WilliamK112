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
        totalContributions
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
const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar;
const totalContributions = calendar?.totalContributions ?? 0;
const weeks = calendar?.weeks ?? [];

if (weeks.length === 0) {
  console.error("No contribution weeks found");
  process.exit(1);
}

// Take last 21 weeks (5 months) for compact grid
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

// Colors matching GitHub's palette but more refined
const colors = {
  none: "#ebedf0",
  first: "#9be9a8",
  second: "#40c463",
  third: "#30a14e",
  fourth: "#216e39",
};

function getColor(count) {
  if (count === 0) return colors.none;
  if (count <= 3) return colors.first;
  if (count <= 6) return colors.second;
  if (count <= 9) return colors.third;
  return colors.fourth;
}

const tileSize = 11;
const tileGap = 3;
const startX = 10;
const startY = 30;

// Build SVG
const svgParts = [];

svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${startX * 2 + cols * (tileSize + tileGap)} ${startY + rows * (tileSize + tileGap) + 20}" width="${cols * (tileSize + tileGap) + 20}" height="${rows * (tileSize + tileGap) + 50}" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">`);

// Minimal gradient background
svgParts.push(`  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f6f8fa"/>
    </linearGradient>
  </defs>`);

svgParts.push(`  <rect width="100%" height="100%" fill="url(#bg)" rx="6"/>`);

// Month labels
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthPositions = [];

for (let x = 0; x < cols; x += 1) {
  const firstDay = recentWeeks[x]?.contributionDays?.[0];
  if (firstDay?.date) {
    const month = new Date(firstDay.date).getMonth();
    if (monthPositions.length === 0 || monthPositions[monthPositions.length - 1].month !== month) {
      monthPositions.push({ month, x });
    }
  }
}

for (const mp of monthPositions) {
  const xPos = startX + mp.x * (tileSize + tileGap);
  svgParts.push(`  <text x="${xPos}" y="20" font-size="10" fill="#57606a">${monthNames[mp.month]}</text>`);
}

// Contribution tiles
for (let y = 0; y < rows; y += 1) {
  for (let x = 0; x < cols; x += 1) {
    const count = grid[y][x];
    const color = getColor(count);
    const cx = startX + x * (tileSize + tileGap);
    const cy = startY + y * (tileSize + tileGap);
    svgParts.push(`  <rect x="${cx}" y="${cy}" width="${tileSize}" height="${tileSize}" fill="${color}" rx="2"/>`);
  }
}

// Total count label
svgParts.push(`  <text x="${startX}" y="${startY + rows * (tileSize + tileGap) + 16}" font-size="11" fill="#57606a"><tspan font-weight="600">${totalContributions}</tspan> contributions in the last 5 months</text>`);

svgParts.push(`</svg>`);

await fs.mkdir("assets", { recursive: true });
await fs.writeFile("assets/contrib-grid.svg", svgParts.join("\n"), "utf8");
console.log("generated assets/contrib-grid.svg");