import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cleanPlantUml, plantUmlSlug } from '../src/utils/plantuml.mjs';

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, 'content');
const publicOutputDir = path.join(repoRoot, 'public', 'plantuml');
const logDir = path.join(repoRoot, 'logs');
const textLogPath = path.join(logDir, 'plantuml-render.log');
const jsonLogPath = path.join(publicOutputDir, 'render-log.json');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'system-design-notes-plantuml-'));
const plantumlJar = process.env.PLANTUML_JAR || path.join(repoRoot, '.cache', 'plantuml.jar');
const logEntries = [];

function walk(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walk(fullPath));
    } else if (/\.md$/i.test(entry.name)) {
      result.push(fullPath);
    }
  }

  return result;
}

function extractPlantUmlBlocks(markdown) {
  const blocks = [];
  const fence = /```([^\n`]*)\n([\s\S]*?)```/g;
  let match;
  while ((match = fence.exec(markdown))) {
    const language = match[1].trim().split(/\s+/)[0].toLowerCase();
    const code = match[2];
    if (!['plantuml', 'puml', 'uml'].includes(language) && !/^@start(?:uml|mindmap|wbs|gantt|json|yaml)\b/i.test(code.trim())) {
      continue;
    }

    blocks.push({
      code: cleanPlantUml(code),
      line: markdown.slice(0, match.index).split('\n').length,
    });
  }
  return blocks;
}

function writeLogs(summary) {
  fs.mkdirSync(logDir, { recursive: true });
  fs.mkdirSync(publicOutputDir, { recursive: true });

  const lines = [
    `PlantUML render log`,
    `time=${new Date().toISOString()}`,
    `plantumlJar=${plantumlJar}`,
    `contentRoot=${path.relative(repoRoot, contentRoot)}`,
    `outputDir=${path.relative(repoRoot, publicOutputDir)}`,
    `total=${summary.total}`,
    `rendered=${summary.rendered}`,
    `failed=${summary.failed}`,
    '',
    ...logEntries.map(entry => [
      `[${entry.status}] ${entry.slug}`,
      `  output: ${entry.output}`,
      `  sources: ${entry.sources.map(source => `${source.file}:${source.line}`).join(', ')}`,
      entry.error ? `  error: ${entry.error.replace(/\s+/g, ' ').trim()}` : '',
    ].filter(Boolean).join('\n')),
    '',
  ];

  fs.writeFileSync(textLogPath, lines.join('\n'), 'utf8');
  fs.writeFileSync(jsonLogPath, JSON.stringify({ ...summary, generatedAt: new Date().toISOString(), entries: logEntries }, null, 2), 'utf8');
}

function ensureRuntime() {
  if (!fs.existsSync(plantumlJar)) {
    throw new Error(
      `PlantUML jar not found at ${plantumlJar}. Set PLANTUML_JAR or download the pinned jar before running this script.`,
    );
  }

  try {
    execFileSync('java', ['-version'], { stdio: 'ignore' });
  } catch {
    throw new Error('Java runtime not found. Install default-jre-headless before rendering PlantUML.');
  }
}

function main() {
  ensureRuntime();
  fs.rmSync(publicOutputDir, { recursive: true, force: true });
  fs.mkdirSync(publicOutputDir, { recursive: true });

  const diagrams = new Map();
  for (const file of walk(contentRoot)) {
    const markdown = fs.readFileSync(file, 'utf8');
    for (const { code, line } of extractPlantUmlBlocks(markdown)) {
      const slug = plantUmlSlug(code);
      if (diagrams.has(slug) && diagrams.get(slug).code !== code) {
        throw new Error(`PlantUML filename collision: ${slug}`);
      }
      if (!diagrams.has(slug)) {
        diagrams.set(slug, { code, sources: [] });
      }
      diagrams.get(slug).sources.push({ file: path.relative(repoRoot, file), line });
    }
  }

  let rendered = 0;
  let failed = 0;

  for (const [slug, diagram] of diagrams) {
    const sourcePath = path.join(tempDir, `${slug}.puml`);
    const outputPath = path.join(publicOutputDir, `${slug}.svg`);
    fs.writeFileSync(sourcePath, `${diagram.code}\n`, 'utf8');

    try {
      execFileSync(
        'java',
        ['-Djava.awt.headless=true', '-jar', plantumlJar, '-tsvg', '-failfast2', '-o', publicOutputDir, sourcePath],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
      rendered++;
      logEntries.push({
        status: 'rendered',
        slug,
        output: path.relative(repoRoot, outputPath),
        sources: diagram.sources,
      });
    } catch (error) {
      failed++;
      logEntries.push({
        status: 'failed',
        slug,
        output: path.relative(repoRoot, outputPath),
        sources: diagram.sources,
        error: `${error.stdout || ''}\n${error.stderr || ''}`.trim() || error.message,
      });
    }
  }

  writeLogs({ total: diagrams.size, rendered, failed });
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(`Rendered ${rendered}/${diagrams.size} PlantUML diagram(s) to ${path.relative(repoRoot, publicOutputDir)}`);
  console.log(`Wrote PlantUML logs to ${path.relative(repoRoot, textLogPath)} and ${path.relative(repoRoot, jsonLogPath)}`);

  if (failed > 0) {
    throw new Error(`${failed} PlantUML diagram(s) failed to render. See ${path.relative(repoRoot, textLogPath)}.`);
  }
}

try {
  main();
} catch (error) {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
