import fs from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

// Orthographic projection of a torus. Depth sorting keeps the rear mesh hidden.
const majorRadius = 1;
const minorRadius = 0.38;
const elevation = (38 * Math.PI) / 180;
const tilt = (-24 * Math.PI) / 180;
const majorSegments = 28;
const minorSegments = 12;
const scale = 30;
const tau = Math.PI * 2;
const project = (u, v) => {
  const radius = majorRadius + minorRadius * Math.cos(v);
  const x = radius * Math.cos(u);
  const y = radius * Math.sin(u);
  const z = minorRadius * Math.sin(v);
  const vertical = y * Math.sin(elevation) - z * Math.cos(elevation);
  return {
    x: 48 + scale * (x * Math.cos(tilt) - vertical * Math.sin(tilt)),
    y: 48 + scale * (x * Math.sin(tilt) + vertical * Math.cos(tilt)),
    depth: y * Math.cos(elevation) + z * Math.sin(elevation),
  };
};

const faces = [];
for (let i = 0; i < majorSegments; i++) {
  for (let j = 0; j < minorSegments; j++) {
    const u = (i * tau) / majorSegments;
    const v = (j * tau) / minorSegments;
    const du = tau / majorSegments;
    const dv = tau / minorSegments;
    const normal =
      Math.cos(v + dv / 2) * Math.sin(u + du / 2) * Math.cos(elevation) +
      Math.sin(v + dv / 2) * Math.sin(elevation);
    if (normal <= 0) continue;
    const vertices = [
      project(u, v),
      project(u + du, v),
      project(u + du, v + dv),
      project(u, v + dv),
    ];
    faces.push({
      depth: vertices.reduce((sum, point) => sum + point.depth, 0) / 4,
      points: vertices
        .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
        .join(" "),
    });
  }
}
faces.sort((a, b) => a.depth - b.depth);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <title>Gabriel I. Alonso — torus</title>
  <g fill="#faf9f6" stroke="#454b43" stroke-width=".55" stroke-linejoin="round">
${faces.map((face) => `    <polygon points="${face.points}"/>`).join("\n")}
  </g>
</svg>\n`;
fs.writeFileSync(new URL("../public/logo.svg", import.meta.url), svg);
const png = new Resvg(svg, {
  fitTo: { mode: "width", value: 540 },
  background: "#faf9f6",
})
  .render()
  .asPng();
await sharp(png)
  .resize(180, 180)
  .png({ palette: true })
  .toFile(
    new URL("../public/icons/apple-touch-icon.png", import.meta.url).pathname,
  );
console.log("Generated the torus SVG and matching home-screen icon.");
