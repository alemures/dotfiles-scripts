import fs from 'fs';
import os from 'os';
import { run, alertInfo, getEnvVar } from './utils';

const home = getEnvVar('HOME');
const outDir = `${home}/Pictures/Screenshots`;
const tmpDir = '/tmp/EditedScreenshots';
const editCommand = 'gimp';
const filename = '%Y-%m-%d@%H-%M-%S.png';
const msg = `Screenshot saved in ${outDir}`;

function takeScreenshot(scrotArgs: string[]) {
  fs.mkdirSync(outDir, { recursive: true });
  run({
    command: 'scrot',
    args: scrotArgs,
    options: { cmd: outDir },
  });
  alertInfo(msg);
}

function editScreenshot() {
  const commandResult = run({
    command: 'command',
    args: ['-v', editCommand],
    options: { shell: true, exitOnFailure: false },
  });

  if (commandResult.status) {
    throw new Error(`Editor ${editCommand} not installed`);
  }

  fs.mkdirSync(tmpDir, { recursive: true });
  run({
    command: 'scrot',
    args: ['-d', '1', filename, '-e', `${editCommand} $f`],
    options: { cmd: tmpDir },
  });
}

const modes: Record<string, (() => void) | undefined> = {
  '1.fullscreen': () => takeScreenshot(['-d', '1', filename]),
  '2.delayed_fullscreen': () => takeScreenshot(['-d', '3', filename]),
  '3.section_or_window': () => takeScreenshot(['-s', filename]),
  '4.edit_fullscreen': () => editScreenshot(),
};

const dmenuResult = run({
  command: 'dmenu',
  args: ['-i', '-l', '4', '-p', 'Screenshot type:'],
  options: { input: Object.keys(modes).join(os.EOL), silentExit: true },
});

const modeFn = modes[dmenuResult.stdout.trim()];
if (!modeFn) throw new Error('Invalid screenshot mode');

modeFn();
