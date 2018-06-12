#!/usr/bin/env node
'use strict';

const inquirer = require('inquirer');
const execSync = require('child_process').execSync;
const { lstatSync, readdirSync } = require('fs');
const chalk = require('chalk');
const path = require('path');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source).filter(name => isDirectory(path.join(source, name)));

const pkgDir = path.resolve(process.cwd(), 'packages');
const packages = getDirectories(pkgDir);

if (packages.length === 0) {
  console.log(chalk.red('There is no package to start.'));
  process.exit();
}

const questions = [
  {
    type: 'list',
    name: 'package',
    message: 'Choose a package to start.',
    choices: packages,
  },
];

inquirer.prompt(questions).then(function(answers) {
  try {
    const startPackage = execSync(
      `cd packages/${answers.package} && yarn start`,
      { stdio: 'inherit' }
    );
    startPackage.stdout.on('data', data => {
      console.log(data);
    });

    startPackage.stderr.on('data', data => {
      console.log(data);
    });
  } catch (error) {}
});
