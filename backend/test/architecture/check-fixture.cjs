const { spawnSync } = require('node:child_process');
const path = require('node:path');

const checker = path.resolve(__dirname, '../../node_modules/.bin/depcruise');
const fixture = 'test/architecture/fixtures/domain-imports-prisma.ts';
const result = spawnSync(
  checker,
  [
    '--config',
    '.dependency-cruiser.cjs',
    '--output-type',
    'err',
    fixture,
  ],
  { cwd: path.resolve(__dirname, '../..'), encoding: 'utf8' },
);
const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;

if (result.error || result.status === 0 || !output.includes('domain-and-application-must-not-import-framework-or-orm')) {
  console.error(
    'Architecture checker did not reject the Prisma import fixture.',
  );
  if (result.error) {
    console.error(result.error.message);
  }
  if (output) {
    console.error(output);
  }
  process.exitCode = 1;
} else {
  console.log('Architecture checker rejected the Prisma import fixture.');
}
