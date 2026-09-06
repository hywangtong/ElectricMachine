import { readFile } from 'node:fs/promises';

// Set production mode before loading React or the build toolchain.
process.env.NODE_ENV = 'production';
const { createBuilder } = await import('vite');
const { runPrerender } = await import('vinext/internal/build/run-prerender');
// Allow normal event-loop teardown: the upstream CLI's immediate process.exit
// causes a libuv assertion on Windows with this Node runtime.
await (await createBuilder({ logLevel: 'warn' })).buildApp();
const result = await runPrerender({ root: process.cwd() });
if (
  !result?.routes.some(
    (route) => route.route === '/' && route.status === 'rendered',
  ) ||
  result.routes.some((route) => route.status === 'error')
) {
  throw new Error('Course prerender failed: ' + JSON.stringify(result));
}
const html = await readFile(
  new URL('../dist/client/index.html', import.meta.url),
  'utf8',
);
if (!html.includes('电机与拖动') || !html.includes('course-app'))
  throw new Error('Static course HTML is missing');
console.log('Static course built successfully: dist/client');
