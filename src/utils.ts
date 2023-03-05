import {
  spawnSync,
  SpawnSyncOptionsWithStringEncoding,
  SpawnSyncReturns,
} from 'child_process';
import os from 'os';
import path from 'path';

const scriptName = path.basename(process.argv[process.argv.length - 1]);
const isDebug = getEnvVar('DEBUG', '');

process.on('uncaughtException', function (err) {
  if (isDebug) console.error('ERROR:', err);
  alertError(err.message);
});

class XResources {
  values: Map<string, string>;
  constructor() {
    this.values = XResources.load();
  }
  get(key: string) {
    const value = this.values.get(key);
    if (value) {
      return value;
    }
    throw new Error(`Missing or empty '${key}' key in XResources file`);
  }
  static load() {
    const result = run({
      command: 'xrdb',
      args: ['-query'],
    });
    const values = new Map<string, string>();
    result.stdout
      .trim()
      .split(os.EOL)
      .forEach((item) => {
        const colonPosition = item.indexOf(':');
        values.set(
          item.substring(0, colonPosition).trim(),
          item.substring(colonPosition + 1).trim()
        );
      });
    return values;
  }
}

const xResources = new XResources();

const theme = {
  foreground: xResources.get('*.foreground'),
  background: xResources.get('*.background'),
  color0: xResources.get('*.color0'),
  color1: xResources.get('*.color1'),
  color2: xResources.get('*.color2'),
  color3: xResources.get('*.color3'),
  color4: xResources.get('*.color4'),
  color5: xResources.get('*.color5'),
  color6: xResources.get('*.color6'),
  color7: xResources.get('*.color7'),
  color8: xResources.get('*.color8'),
  color9: xResources.get('*.color9'),
  color10: xResources.get('*.color10'),
  color11: xResources.get('*.color11'),
  color12: xResources.get('*.color12'),
  color13: xResources.get('*.color13'),
  color14: xResources.get('*.color14'),
  color15: xResources.get('*.color15'),
};

export function getEnvVar(name: string, defaultValue?: string) {
  const value = process.env[name];
  if (value !== undefined) {
    return value;
  } else if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Missing env variable ${name}`);
}

export function alertInfo(message: string) {
  spawnSync('notify-send', ['-u', 'normal', '-t', '5000', scriptName, message]);
}

export function alertError(message: string) {
  spawnSync('notify-send', [
    '-u',
    'critical',
    '-t',
    '5000',
    scriptName,
    message,
  ]);
}

export function checkExitOnFailure(
  spawnResult: SpawnSyncReturns<string>,
  command: string,
  silentExit: boolean
) {
  let error;
  let status;

  if (spawnResult.status) {
    error = new Error(
      spawnResult.stderr.trim() ||
        `Command ${command} error status: ${spawnResult.status}`
    );
    status = spawnResult.status;
  } else if (spawnResult.error) {
    error = spawnResult.error;
    status = -1;
  }

  if (error && status) {
    if (!silentExit) {
      alertError(error.message);
    }

    if (isDebug) console.error('ERROR:', error);
    process.exit(status);
  }
}

interface RunArgsOptions {
  input?: string;
  cmd?: string;
  shell?: boolean;
  exitOnFailure?: boolean;
  silentExit?: boolean;
}

interface RunArgs {
  command: string;
  args?: string[];
  options?: RunArgsOptions;
}

export function run({ command, args = [], options = {} }: RunArgs) {
  const spawnOptions = {
    encoding: 'utf8',
    input: options.input,
    cwd: options.cmd,
    shell: options.shell,
  } as SpawnSyncOptionsWithStringEncoding;

  const exitOnFailure =
    options.exitOnFailure !== undefined ? options.exitOnFailure : true;
  const silentExit =
    options.silentExit !== undefined ? options.silentExit : false;

  // Automatically add dmenu style arguments
  if (command === 'dmenu') {
    args = args.concat(getDMenuStyleArgs());
  }

  if (isDebug) console.log('COMMAND:', command, args);

  const result = spawnSync(command, args, spawnOptions);
  if (exitOnFailure) {
    checkExitOnFailure(result, command, silentExit);
  }
  return result;
}

function getDMenuStyleArgs() {
  const xResourcesFont = xResources.get('URxvt.font');
  // Removes "xft:" prefix
  const font = xResourcesFont.substring(4);
  return [
    '-fn',
    font,
    '-sb',
    theme.color6,
    '-nb',
    theme.background,
    '-nf',
    theme.foreground,
    '-sf',
    theme.color8,
  ];
}
