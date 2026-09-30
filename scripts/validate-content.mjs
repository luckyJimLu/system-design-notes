import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const contentRoot = fileURLToPath(new URL('../content', import.meta.url));
const errors = [];
const warnings = [];
const documents = [];
const legacyDocuments = [];

function walkContent(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walkContent(path);
    else if (/^index\.(zh|en)\.md$/.test(entry.name)) documents.push(path);
    else if (/\.md$/i.test(entry.name)) legacyDocuments.push(path);
  }
}

function parseMetadata(path, source) {
  if (!source.startsWith('---')) {
    errors.push(`${relative(process.cwd(), path)}: missing front matter`);
    return {};
  }
  const end = source.indexOf('\n---', 3);
  if (end < 0) {
    errors.push(`${relative(process.cwd(), path)}: unterminated front matter`);
    return {};
  }

  const metadata = {};
  for (const line of source.slice(4, end).split(/\r?\n/)) {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, raw] = match;
    metadata[key] = raw.trim();
  }
  return metadata;
}

walkContent(contentRoot);

function validateImageReferences(path, source) {
  for (const match of source.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
    const imagePath = match[1].split('#')[0].split('?')[0];
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) continue;
    const resolved = join(path.split('/').slice(0, -1).join('/'), imagePath);
    if (!existsSync(resolved)) errors.push(`${relative(process.cwd(), path)}: missing asset '${imagePath}'`);
  }
}

const ids = new Map();
const orders = new Map();
const locales = new Map();

// PlantUML must be authored as committed image assets, not embedded code:
//   content/<chapter>/images/<name>.puml  ->  content/<chapter>/images/<name>.svg
// and referenced from markdown as ![](images/<name>.svg).
function validateNoPlantUmlFences(path, source) {
  const fence = /```([^\n`]*)\n([\s\S]*?)```/g;
  let match;
  while ((match = fence.exec(source))) {
    const language = match[1].trim().split(/\s+/)[0].toLowerCase();
    const code = match[2];
    if (
      ['plantuml', 'puml', 'uml'].includes(language) ||
      /^@start(?:uml|mindmap|wbs|gantt|json|yaml)\b/i.test(code.trim())
    ) {
      const line = source.slice(0, match.index).split('\n').length;
      errors.push(
        `${relative(process.cwd(), path)}:${line}: embedded PlantUML code block is not allowed; ` +
        `save the diagram as content/<chapter>/images/<name>.puml, run 'npm run render:diagrams', ` +
        `and reference ![](images/<name>.svg) instead`,
      );
    }
  }
}

function validateDiagramAssets() {
  const queue = [contentRoot];
  while (queue.length > 0) {
    const dir = queue.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        queue.push(path);
        continue;
      }
      if (/\.puml$/i.test(entry.name) && !existsSync(path.replace(/\.puml$/i, '.svg'))) {
        errors.push(`${relative(process.cwd(), path)}: missing rendered .svg; run 'npm run render:diagrams' and commit both files`);
      }
      if (!/\.svg$/i.test(entry.name)) continue;
      const svgPath = path;
      const pumlPath = svgPath.replace(/\.svg$/i, '.puml');
      if (!existsSync(pumlPath)) {
        errors.push(
          `${relative(process.cwd(), svgPath)}: rendered diagram has no matching .puml source; ` +
          `every committed diagram image must have an editable .puml source next to it`,
        );
        continue;
      }
      if (statSync(pumlPath).mtimeMs > statSync(svgPath).mtimeMs) {
        warnings.push(
          `${relative(process.cwd(), svgPath)}: .puml source is newer than the .svg; run 'npm run render:diagrams'`,
        );
      }
    }
  }
}

for (const path of documents) {
  const relativePath = relative(process.cwd(), path);
  const source = readFileSync(path, 'utf8');
  const metadata = parseMetadata(path, source);
  const locale = path.endsWith('.en.md') ? 'en' : 'zh';
  const folder = path.split('/').at(-2) || path.split('\\').at(-2) || 'document';
  const id = (metadata.id || '').replace(/^['"]|['"]$/g, '');

  if (!id) errors.push(`${relativePath}: id is required`);
  if (!metadata.title) warnings.push(`${relativePath}: title is missing`);
  if (metadata.order && !/^\d+$/.test(metadata.order)) {
    errors.push(`${relativePath}: order must be an integer`);
  }

  if (id) {
    const idEntries = ids.get(id) || new Map();
    if (idEntries.has(locale)) errors.push(`${relativePath}: duplicate id '${id}' for locale '${locale}' (already used by ${idEntries.get(locale)})`);
    idEntries.set(locale, relativePath);
    ids.set(id, idEntries);
  }

  if (metadata.order) {
    const orderEntries = orders.get(metadata.order) || new Map();
    if (orderEntries.has(locale) && !orderEntries.get(locale).startsWith(`content/${folder}/`)) {
      warnings.push(`${relativePath}: order ${metadata.order} is also used by ${orderEntries.get(locale)}`);
    }
    orderEntries.set(locale, relativePath);
    orders.set(metadata.order, orderEntries);
  }

  const localeKey = id || folder;
  const pair = locales.get(localeKey) || new Set();
  pair.add(locale);
  locales.set(localeKey, pair);

  validateImageReferences(path, source);
  validateNoPlantUmlFences(path, source);
}

for (const path of legacyDocuments) {
  const source = readFileSync(path, 'utf8');
  validateImageReferences(path, source);
  validateNoPlantUmlFences(path, source);
}

validateDiagramAssets();

for (const [id, pair] of locales) {
  if (!pair.has('zh') || !pair.has('en')) warnings.push(`content '${id}' is missing a ${pair.has('zh') ? 'en' : 'zh'} locale`);
}

for (const message of errors) console.error(`ERROR ${message}`);
for (const message of warnings) console.warn(`WARN  ${message}`);
console.log(`Content validation: ${documents.length} front-matter document files, ${legacyDocuments.length} legacy document files, ${errors.length} error(s), ${warnings.length} warning(s)`);
if (errors.length > 0) process.exitCode = 1;
