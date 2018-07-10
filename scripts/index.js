const inquirer = require('inquirer');
var spawn = require('cross-spawn');
const { lstatSync, readdirSync } = require('fs');
const chalk = require('chalk');
const path = require('path');

const args = process.argv.slice(2);

const scriptIndex = args.findIndex(
  x => x === 'build' || x === 'start' || x === 'test'
);
const script = scriptIndex === -1 ? args[0] : args[scriptIndex];
const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : [];

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source).filter(name => isDirectory(path.join(source, name)));

const pkgDir = path.resolve(process.cwd(), 'packages');
const pkgs = getDirectories(pkgDir);

if (pkgs.length === 0) {
  console.log(chalk.red(`There is no package to ${script}.`));
  process.exit();
}

const questions = [
  {
    type: 'list',
    name: 'package',
    message: `Choose a package to ${script}.`,
    choices: pkgs,
  },
];

switch (script) {
  case 'start':
  case 'build':
  case 'test': {
    inquirer.prompt(questions).then(function(answers) {
      const cp = spawn.sync(
        'yarn',
        nodeArgs
          .concat(script !== 'start' ? ['run', script] : script)
          .concat(args.slice(scriptIndex + 1)),
        {
          cwd: path.resolve(process.cwd(), `packages/${answers.package}`),
          stdio: 'inherit',
        }
      );
      if (cp.signal) {
        if (cp.signal === 'SIGKILL') {
          console.log(
            'The ' +
              script +
              ' failed because the process exited too early. ' +
              'This probably means the system ran out of memory or someone called ' +
              '`kill -9` on the process.'
          );
        } else if (cp.signal === 'SIGTERM') {
          console.log(
            'The ' +
              script +
              ' failed because the process exited too early. ' +
              'Someone might have called `kill` or `killall`, or the system could ' +
              'be shutting down.'
          );
        }
        process.exit();
      }
      process.exit(cp.status);
    });
    break;
  }
  default:
    console.log('Unknown script "' + script + '".');
    break;
}
