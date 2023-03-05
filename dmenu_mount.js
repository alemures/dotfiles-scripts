const os = require('os');
const utils = require('./utils');

const home = utils.getEnvVar('HOME');

/**
 * @param {string} device
 */
function parseDevice(device) {
  const splittedDevice = device.split(' ');
  return {
    name: splittedDevice[0],
    type: splittedDevice[1],
    size: splittedDevice[2],
    mountpoint: splittedDevice[3] || undefined,
  };
}

const lsblkResult = utils.run({
  command: 'lsblk',
  args: ['-rpo', 'name,type,size,mountpoint'],
});

const devices = lsblkResult.stdout
  .trim()
  .split(os.EOL)
  .filter((line) => line.includes('part') || line.includes('rom'));

const deviceNames = devices.map((deviceInfo) => deviceInfo.split(' ')[0]);

const dmenuResult = utils.run({
  command: 'dmenu',
  args: ['-i', '-l', '20', '-p', 'Mount/Umount partition:'],
  options: { input: devices.join(os.EOL), silentExit: true },
});

const parsedDevice = parseDevice(dmenuResult.stdout.trim());
if (!deviceNames.includes(parsedDevice.name))
  throw new Error('Invalid block device');

if (parsedDevice.mountpoint) {
  utils.run({
    command: 'pkexec',
    args: ['umount', parsedDevice.name],
  });
  utils.alertInfo(`Umounted ${parsedDevice.name}`);
} else {
  const findResult = utils.run({
    command: 'find',
    args: [
      '/mnt',
      '/media',
      home,
      '-maxdepth',
      '1',
      '-not',
      '-path',
      '*/.*',
      '-type',
      'd',
    ],
  });

  const directories = findResult.stdout.trim();

  const dmenuResult = utils.run({
    command: 'dmenu',
    args: ['-i', '-p', 'Mount point:'],
    options: { input: directories, silentExit: true },
  });

  const targetDirectory = dmenuResult.stdout.trim();

  if (!directories.split(os.EOL).includes(targetDirectory)) {
    throw new Error('Invalid target directory');
  }

  utils.run({
    command: 'pkexec',
    args: ['mount', parsedDevice.name, targetDirectory],
  });
  utils.alertInfo(`Mounted ${parsedDevice.name} in ${targetDirectory}`);
}
