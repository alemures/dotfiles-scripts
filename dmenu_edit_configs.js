const os = require('os');
const utils = require('./utils');

const home = utils.getEnvVar('HOME');
const terminal = utils.getEnvVar('TERMINAL');
const editor = utils.getEnvVar('EDITOR');

const configs = {
  bash: `${home}/.bashrc`,
  bash_aliases: `${home}/.bash_aliases`,
  dunst: `${home}/.config/dunst/dunstrc`,
  i3: `${home}/.config/i3/config`,
  i3status: `${home}/.config/i3status/config`,
  profile: `${home}/.profile`,
  ranger: `${home}/.config/ranger/rc.conf`,
  vim: `${home}/.vimrc`,
  xresources: `${home}/.Xresources`,
};

const dmenuResult = utils.run({
  command: 'dmenu',
  args: ['-i', '-p', 'Edit config file:'],
  options: { input: Object.keys(configs).join(os.EOL), silentExit: true },
});

// @ts-ignore
const configPath = configs[dmenuResult.stdout.trim()];
if (!configPath) throw new Error('Invalid config option');

utils.run({
  command: terminal,
  args: ['-e', editor, configPath],
});
