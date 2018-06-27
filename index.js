#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const findUp = require('find-up');

const concurrentlyPath = path.join(__dirname, 'node_modules', '.bin', 'concurrently');
const bgColors = [ 'bgGreen', 'bgYellow', 'bgBlue', 'bgMagenta', 'bgCyan' ];

let startfile = findUp.sync('.start');
if (!startfile) {
  console.error('No .start file found');
  process.exit(1);
}
process.chdir(path.dirname(startfile));
let services = readFileSync(startfile, 'utf8')
                // [ 'foo: bar', '# some comment', 'fizz: quux' ]
                .split('\n')
                // [ 'foo: bar', 'fizz: quux' ]
                .filter((line) => line.trim() !== '' && !line.trim().startsWith('#'))
                // [ [ 'foo', 'bar' ], [ 'fizz', 'quux' ] ]
                .map((line) => {
                  return line.split(':').map((str) => str.trim())
                })
                // { foo: 'bar', fizz: 'quux' }
                .reduce((services, [ serviceName, command ]) => {
                  services[serviceName] = command;
                  return services;
                }, {});
let serviceNames = process.argv.slice(2);
if (serviceNames.length === 0) {
  serviceNames = Object.keys(services);
}

let names = serviceNames.join(',');
let colors = serviceNames.map((_, i) => `black.bold.${ bgColors[i % bgColors.length] }`);
let subcommands = serviceNames.map((name) => `'${ services[name] }'`).join(' ');

let command = `${ concurrentlyPath } --names ${ names } --prefix-colors ${ colors } ${ subcommands }`;

execSync(command, { cwd: path.dirname(startfile), stdio: 'inherit' });