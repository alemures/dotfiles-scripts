const fs = require('fs');
const path = require('path');
const os = require('os');
const utils = require('./utils');

const appDirs = [
  '~/.local/share/applications',
  '/usr/share/applications',
  '/usr/local/share/applications',
];

/** @type {string[]} */
const apps = [];
appDirs
  .filter((dir) => fs.existsSync(dir))
  .forEach((dir) => {
    fs.readdirSync(dir)
      .filter((file) => path.extname(file) === '.desktop')
      .map((file) => path.parse(file).name)
      .sort()
      .forEach((filename) => apps.push(filename));
  });

const dmenuResult = utils.run({
  command: 'dmenu',
  args: ['-i', '-p', 'Run app:'],
  options: { input: apps.join(os.EOL), silentExit: true },
});

const app = dmenuResult.stdout.trim();
if (!apps.includes(app)) throw new Error('Invalid selected app');

utils.run({
  command: 'gtk-launch',
  args: [app],
});
