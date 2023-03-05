const { spawnSync } = require('child_process');
const os = require('os');
const path = require('path');

const scriptName = path.basename(process.argv[process.argv.length - 1]);
const isDebug = getEnvVar('DEBUG', '');

process.on('uncaughtException', function (err) {
  if (isDebug) console.error('ERROR:', err);
  alertError(err.message);
});

class XResources {
  constructor() {
    this.values = XResources.load();
  }
  /**
   * @param {string} key
   */
  get(key) {
    const value = this.values.get(key);
    if (value) {
      return value;
    }
    throw new Error(`Missing '${key}' key in XResources file`);
  }
  static load() {
    const result = run({
      command: 'xrdb',
      args: ['-query'],
    });
    /**@type {Map<string, string>} */
    const values = new Map();
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

/**
 *
 * @param {string} name
 * @param {string} [defaultValue]
 */
function getEnvVar(name, defaultValue) {
  const value = process.env[name];
  if (value !== undefined) {
    return value;
  } else if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Missing env variable ${name}`);
}
module.exports.getEnvVar = getEnvVar;

/**
 * @param {string} message
 */
function alertInfo(message) {
  spawnSync('notify-send', ['-u', 'normal', '-t', '5000', scriptName, message]);
}
module.exports.alertInfo = alertInfo;

/**
 * @param {string} message
 */
function alertError(message) {
  spawnSync('notify-send', [
    '-u',
    'critical',
    '-t',
    '5000',
    scriptName,
    message,
  ]);
}
module.exports.alertError = alertError;

/**
 * @param {import("child_process").SpawnSyncReturns<string>} spawnResult
 * @param {string} command
 * @param {boolean} silentExit
 */
function checkExitOnFailure(spawnResult, command, silentExit) {
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

module.exports.checkExitOnFailure = checkExitOnFailure;

/**
 * @param {object} param
 * @param {string} param.command
 * @param {string[]} [param.args]
 * @param {object} [param.options]
 * @param {string} [param.options.input]
 * @param {string} [param.options.cmd]
 * @param {boolean} [param.options.shell]
 * @param {boolean} [param.options.exitOnFailure]
 * @param {boolean} [param.options.silentExit]
 */
function run({ command, args = [], options = {} }) {
  /**@type {import('child_process').SpawnSyncOptionsWithStringEncoding} */
  const spawnOptions = {
    encoding: 'utf8',
    input: options.input,
    cwd: options.cmd,
    shell: options.shell,
  };

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

module.exports.run = run;

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
