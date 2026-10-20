// Runs the Android Gradle wrapper from android/ on any OS: `node scripts/gradle.mjs assembleDebug`.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const androidDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'android');
const wrapper = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

const result = spawnSync(wrapper, process.argv.slice(2), {
  cwd: androidDir,
  stdio: 'inherit',
  shell: process.platform === 'win32', // .bat files can only be spawned through a shell
});
process.exit(result.status ?? 1);
