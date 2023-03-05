const fs = require('fs');
const os = require('os');
const utils = require('./utils');

const home = utils.getEnvVar('HOME');
const outDir = `${home}/Pictures/Screenshots`;
const tmpDir = '/tmp/EditedScreenshots';
const editCommand = 'gimp';
const filename = '%Y-%m-%d@%H-%M-%S.png';
const msg = `Screenshot saved in ${outDir}`;

/**
 * @param {string[]} scrotArgs
 */
function takeScreenshot(scrotArgs) {
  fs.mkdirSync(outDir, { recursive: true });
  utils.run({
    command: 'scrot',
    args: scrotArgs,
    options: { cmd: outDir },
  });
  utils.alertInfo(msg);
}

function editScreenshot() {
  const commandResult = utils.run({
    command: 'command',
    args: ['-v', editCommand],
    options: { shell: true, exitOnFailure: false },
  });

  if (commandResult.status) {
    throw new Error(`Editor ${editCommand} not installed`);
  }

  fs.mkdirSync(tmpDir, { recursive: true });
  utils.run({
    command: 'scrot',
    args: ['-d', '1', filename, '-e', `${editCommand} $f`],
    options: { cmd: tmpDir },
  });
}

const modes = {
  '1.fullscreen': () => takeScreenshot(['-d', '1', filename]),
  '2.delayed_fullscreen': () => takeScreenshot(['-d', '3', filename]),
  '3.section_or_window': () => takeScreenshot(['-s', filename]),
  '4.edit_fullscreen': () => editScreenshot(),
};

const dmenuResult = utils.run({
  command: 'dmenu',
  args: ['-i', '-l', '4', '-p', 'Screenshot type:'],
  options: { input: Object.keys(modes).join(os.EOL), silentExit: true },
});

// @ts-ignore
const modeFn = modes[dmenuResult.stdout.trim()];
if (!modeFn) throw new Error('Invalid screenshot mode');

modeFn();
