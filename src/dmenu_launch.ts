import fs from 'fs';
import path from 'path';
import os from 'os';
import { run } from './utils';

const appDirs = [
  '~/.local/share/applications',
  '/usr/share/applications',
  '/usr/local/share/applications',
];

const apps: string[] = [];
appDirs
  .filter((dir) => fs.existsSync(dir))
  .forEach((dir) => {
    fs.readdirSync(dir)
      .filter((file) => path.extname(file) === '.desktop')
      .map((file) => path.parse(file).name)
      .sort()
      .forEach((filename) => apps.push(filename));
  });

const dmenuResult = run({
  command: 'dmenu',
  args: ['-i', '-p', 'Run app:'],
  options: { input: apps.join(os.EOL), silentExit: true },
});

const app = dmenuResult.stdout.trim();
if (!apps.includes(app)) throw new Error('Invalid selected app');

run({
  command: 'gtk-launch',
  args: [app],
});
