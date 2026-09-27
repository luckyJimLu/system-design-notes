import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from 'vite';
import { cleanPlantUml, plantUmlSlug } from '../src/utils/plantuml.mjs';

const source = '@startuml\nskinparam shadowing false\n\nstart\n:ISR/Task A;\n:\u5355\u4e00 Task B;\nstop\n@enduml';

test('filenames ignore line endings and surrounding whitespace', () => {
  assert.equal(plantUmlSlug(source), plantUmlSlug(`\n${source.replace(/\n/g, '\r\n')}\n`));
  assert.equal(plantUmlSlug('Alice -> Bob'), plantUmlSlug('@startuml\nAlice -> Bob\n@enduml'));
  assert.notEqual(plantUmlSlug(source), plantUmlSlug(source.replace('Task B', 'Task C')));
});

test('browser bundle resolves every rendered source to an existing SVG', async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      lib: { entry: 'src/utils/plantuml.mjs', name: 'PlantUml', formats: ['iife'] },
    },
  });
  const context = {};
  const bundle = Array.isArray(result) ? result[0] : result;
  runInNewContext(bundle.output.find(item => item.type === 'chunk').code, context);
  const browserSlug = context.PlantUml.plantUmlSlug;
  assert.equal(browserSlug(source), plantUmlSlug(source));

  const log = JSON.parse(readFileSync('public/plantuml/render-log.json', 'utf8'));
  assert.ok(log.total > 0);
  assert.equal(log.failed, 0);
  for (const entry of log.entries) {
    for (const location of entry.sources) {
      const lines = readFileSync(location.file, 'utf8').split('\n');
      const codeLines = lines.slice(location.line);
      const closingFence = codeLines.findIndex(line => /^```/.test(line));
      assert.ok(closingFence >= 0, location.file);
      const code = cleanPlantUml(codeLines.slice(0, closingFence).join('\n'));
      assert.equal(`public/plantuml/${browserSlug(code)}.svg`, entry.output, location.file);
      assert.ok(existsSync(entry.output), entry.output);
      assert.match(readFileSync(entry.output, 'utf8'), /<svg\b/);
    }
  }
});
