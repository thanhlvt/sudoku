// Node's built-in Web Storage global (added behind --experimental-webstorage
// in Node 23, enabled by default from Node 25) shadows jsdom's Storage
// implementation in tests that use `// @vitest-environment jsdom`, breaking
// every storage test. Disabling it via NODE_OPTIONS only works on Node
// versions that actually define the flag — older Node (e.g. the Node 20 used
// in CI) rejects any unknown NODE_OPTIONS flag outright. So gate it on
// `process.allowedNodeEnvironmentFlags` instead of hardcoding a version.
import { spawnSync } from 'node:child_process';

const flag = '--no-experimental-webstorage';
const extra = process.allowedNodeEnvironmentFlags.has(flag) ? flag : '';
const nodeOptions = [process.env.NODE_OPTIONS, extra].filter(Boolean).join(' ');

const result = spawnSync('vitest', process.argv.slice(2), {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
});

process.exit(result.status ?? 1);
