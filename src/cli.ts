#!/usr/bin/env node

import { AfterHookOptions, create } from 'create-create-app';
import { resolve } from 'path';
import chalk from "chalk";

const templateRoot = resolve(__dirname, '..', 'templates');

function caveat({ answers }: AfterHookOptions) {
  const pm = answers.packageManager || "npm";
  return `
Your KoLmafia script has been successfully bootstrapped!
Once you've navigated to the directory you can make changes to \`main.ts\` and run \`${pm} run build\` to prepare your script for KoLmafia!
  `;
}

function main() {
  console.log(`🍸📜 Welcome to ${chalk.bold("create-kolmafia-script")}! We're going to ask a few questions to get you started`);

  create('create-kolmafia-script', {
    templateRoot,
    promptForLicense: false,
    after: ({ answers }) => console.log(`Ok you chose ${answers.architecture}.`),
    caveat,
  });
}

main();
