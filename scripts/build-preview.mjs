// Run after npm run build. Makes a file-openable preview, with the production JS/CSS.
import fs from "node:fs";
const html = fs.readFileSync("dist/index.html", "utf8");
const jsPath = html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/)[1];
const cssPath = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/)[1];
const js = fs
  .readFileSync("dist" + jsPath, "utf8")
  .replaceAll("/images/", "./images/")
  .replaceAll("</script", "<\\/script");
const css = fs.readFileSync("dist" + cssPath, "utf8");
const out = html
  .replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/, "")
  .replace(/<link[^>]+href="[^"]+\.css"[^>]*>/, () => `<style>${css}</style>`)
  .replace("/favicon.svg", "./favicon.svg")
  .replace("</body>", () => `<script type="module">${js}</script></body>`);
fs.writeFileSync("dist/preview.html", out);
fs.writeFileSync(
  "dist/mobile-preview.html",
  '<!doctype html><title>NRICart mobile layout test</title><style>body{margin:0;background:#d4d2c5;display:flex;justify-content:center}iframe{width:390px;height:844px;border:0;background:#f2ead9}</style><iframe title="NRICart mobile preview" src="./preview.html"></iframe>',
);
