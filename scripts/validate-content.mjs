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
}

for (const path of legacyDocuments) {
  validateImageReferences(path, readFileSync(path, 'utf8'));
}

for (const [id, pair] of locales) {
  if (!pair.has('zh') || !pair.has('en')) warnings.push(`content '${id}' is missing a ${pair.has('zh') ? 'en' : 'zh'} locale`);
}

for (const message of errors) console.error(`ERROR ${message}`);
for (const message of warnings) console.warn(`WARN  ${message}`);
console.log(`Content validation: ${documents.length} front-matter document files, ${legacyDocuments.length} legacy document files, ${errors.length} error(s), ${warnings.length} warning(s)`);
if (errors.length > 0) process.exitCode = 1;
