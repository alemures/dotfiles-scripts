import os from 'os';
import { alertInfo, getEnvVar, run } from './utils';

const home = getEnvVar('HOME');

function parseDevice(device: string) {
  const splittedDevice = device.split(' ');
  return {
    name: splittedDevice[0],
    type: splittedDevice[1],
    size: splittedDevice[2],
    mountpoint: splittedDevice[3] || undefined,
  };
}

const lsblkResult = run({
  command: 'lsblk',
  args: ['-rpo', 'name,type,size,mountpoint'],
});

const devices = lsblkResult.stdout
  .trim()
  .split(os.EOL)
  .filter((line) => line.includes('part') || line.includes('rom'));

const deviceNames = devices.map((deviceInfo) => deviceInfo.split(' ')[0]);

const dmenuResult = run({
  command: 'dmenu',
  args: ['-i', '-l', '20', '-p', 'Mount/Umount partition:'],
  options: { input: devices.join(os.EOL), silentExit: true },
});

const parsedDevice = parseDevice(dmenuResult.stdout.trim());
if (!deviceNames.includes(parsedDevice.name))
  throw new Error('Invalid block device');

if (parsedDevice.mountpoint) {
  run({
    command: 'pkexec',
    args: ['umount', parsedDevice.name],
  });
  alertInfo(`Umounted ${parsedDevice.name}`);
} else {
  const findResult = run({
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

  const dmenuResult = run({
    command: 'dmenu',
    args: ['-i', '-p', 'Mount point:'],
    options: { input: directories, silentExit: true },
  });

  const targetDirectory = dmenuResult.stdout.trim();

  if (!directories.split(os.EOL).includes(targetDirectory)) {
    throw new Error('Invalid target directory');
  }

  run({
    command: 'pkexec',
    args: ['mount', parsedDevice.name, targetDirectory],
  });
  alertInfo(`Mounted ${parsedDevice.name} in ${targetDirectory}`);
}
