import os from 'os';
import { getEnvVar, run } from './utils';

const home = getEnvVar('HOME');
const terminal = getEnvVar('TERMINAL');
const editor = getEnvVar('EDITOR');

const configs: Record<string, string | undefined> = {
  bash: `${home}/.bashrc`,
  bash_aliases: `${home}/.bash_aliases`,
  compton: `${home}/.config/compton/compton.conf`,
  dunst: `${home}/.config/dunst/dunstrc`,
  fontconfig: `${home}/.config/fontconfig/fonts.conf`,
  i3: `${home}/.config/i3/config`,
  i3status: `${home}/.config/i3status/config`,
  profile: `${home}/.profile`,
  ranger: `${home}/.config/ranger/rc.conf`,
  vim: `${home}/.vimrc`,
  xresources: `${home}/.Xresources`,
};

const dmenuResult = run({
  command: 'dmenu',
  args: ['-i', '-p', 'Edit config file:'],
  options: { input: Object.keys(configs).join(os.EOL), silentExit: true },
});

const configPath = configs[dmenuResult.stdout.trim()];
if (!configPath) throw new Error('Invalid config option');

run({
  command: terminal,
  args: ['-e', editor, configPath],
});
