import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(frontendDirectory, "dist");
await mkdir(outputDirectory, { recursive: true });
await mkdir(path.join(outputDirectory, "src"), { recursive: true });
await cp(path.join(frontendDirectory, "index.html"), path.join(outputDirectory, "index.html"));
await cp(path.join(frontendDirectory, "config.js"), path.join(outputDirectory, "config.js"));
await cp(path.join(frontendDirectory, "src", "assets"), path.join(outputDirectory, "src", "assets"), { recursive: true });
await cp(path.join(frontendDirectory, "robots.txt"), path.join(outputDirectory, "robots.txt"));
const html = await readFile(path.join(outputDirectory, "index.html"), "utf8");
await writeFile(path.join(outputDirectory, "index.html"), html.replace("</head>", '    <meta name="color-scheme" content="light">\n  </head>'));
