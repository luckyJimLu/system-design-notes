// Render committed PlantUML diagram sources into images next to the docs:
//
//   content/<chapter>/images/<name>.puml   (editable source, committed)
//   content/<chapter>/images/<name>.svg    (rendered output, committed)
//
// Markdown references the SVG with a plain image link, e.g.
// `![Task mapping](images/task-mapping.svg)`, so the diagram renders in
// GitHub, VS Code preview, dev tools, and the site without any plugin.
//
// Usage: npm run render:diagrams [-- --force]
//   --force  re-render even when the .svg is newer than the .puml
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, 'content');
const logDir = path.join(repoRoot, 'logs');
const textLogPath = path.join(logDir, 'plantuml-render.log');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'system-design-notes-puml-'));
const plantumlJar = process.env.PLANTUML_JAR || path.join(repoRoot, '.cache', 'plantuml.jar');
const cjkFontName = process.env.PLANTUML_CJK_FONT || 'Noto Sans CJK SC';
const force = process.argv.includes('--force');
const logEntries = [];

// Chinese text needs an installed CJK font (e.g. fonts-noto-cjk) plus an explicit
// defaultFontName, otherwise Java AWT renders tofu boxes. The preamble is injected
// only into the temp file that reaches PlantUML; the committed .puml stays clean.
const stylePreamble = [`skinparam defaultFontName "${cjkFontName}"`];

function withSharedStyle(code) {
  const [firstLine, ...rest] = code.replace(/\r\n?/g, '\n').trim().split('\n');
  if (!/^@start/i.test(firstLine)) {
    return ['@startuml', ...stylePreamble, firstLine, ...rest, '@enduml'].join('\n');
  }
  return [firstLine, ...stylePreamble, ...rest].join('\n');
}

function walk(dir, predicate) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(fullPath, predicate));
    else if (predicate(entry.name)) result.push(fullPath);
  }
  return result;
}

function ensureRuntime() {
  if (!fs.existsSync(plantumlJar)) {
    throw new Error(
      `PlantUML jar not found at ${plantumlJar}. Set PLANTUML_JAR or download the jar before running this script.`,
    );
  }
  try {
    execFileSync('java', ['-version'], { stdio: 'ignore' });
  } catch {
    throw new Error('Java runtime not found. Install default-jre-headless before rendering diagrams.');
  }
}

function main() {
  ensureRuntime();
  const sources = walk(contentRoot, (name) => /\.puml$/i.test(name));
  let rendered = 0;
  let skipped = 0;
  let failed = 0;

  for (const sourcePath of sources) {
    const dir = path.dirname(sourcePath);
    const base = path.basename(sourcePath, path.extname(sourcePath));
    const outputPath = path.join(dir, `${base}.svg`);
    const rel = path.relative(repoRoot, sourcePath);

    const upToDate =
      !force &&
      fs.existsSync(outputPath) &&
      fs.statSync(outputPath).mtimeMs >= fs.statSync(sourcePath).mtimeMs;
    if (upToDate) {
      skipped++;
      logEntries.push({ status: 'skipped', source: rel });
      continue;
    }

    const tempSource = path.join(tempDir, `${base}.puml`);
    fs.writeFileSync(tempSource, `${withSharedStyle(fs.readFileSync(sourcePath, 'utf8'))}\n`, 'utf8');

    try {
      execFileSync(
        'java',
        ['-Djava.awt.headless=true', '-jar', plantumlJar, '-tsvg', '-failfast2', '-o', dir, tempSource],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
      rendered++;
      logEntries.push({ status: 'rendered', source: rel, output: path.relative(repoRoot, outputPath) });
    } catch (error) {
      failed++;
      const detail = `${error.stdout || ''}\n${error.stderr || ''}`.trim() || error.message;
      logEntries.push({ status: 'failed', source: rel, error: detail.replace(/\s+/g, ' ').trim() });
    }
  }

  fs.mkdirSync(logDir, { recursive: true });
  const lines = [
    'PlantUML diagram render log',
    `time=${new Date().toISOString()}`,
    `plantumlJar=${plantumlJar}`,
    `total=${sources.length}`,
    `rendered=${rendered}`,
    `skipped=${skipped}`,
    `failed=${failed}`,
    '',
    ...logEntries.map((e) =>
      [`[${e.status}] ${e.source}`, e.output ? `  output: ${e.output}` : '', e.error ? `  error: ${e.error}` : '']
        .filter(Boolean)
        .join('\n'),
    ),
    '',
  ];
  fs.writeFileSync(textLogPath, lines.join('\n'), 'utf8');

  console.log(
    `Diagrams: ${rendered} rendered, ${skipped} up-to-date, ${failed} failed (${sources.length} .puml sources)`,
  );
  console.log(`Log: ${path.relative(repoRoot, textLogPath)}`);
  if (failed > 0) throw new Error(`${failed} diagram(s) failed to render. See ${path.relative(repoRoot, textLogPath)}.`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
