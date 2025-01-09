import yargsInteractive from "yargs-interactive";
import path from "node:path";
import fs from "node:fs/promises";
import chalk from "chalk";
import spdxLicenseList from "spdx-license-list/full.js";

import { addDeps, installDeps, whichPm } from "./npm.js";

import { getGitUser, initGit, isOccupied, toContact } from "./utils.js";
import { copy } from "./copy.js";

const templateDir = path.resolve(import.meta.dirname, "..", "template");

export interface Answers {
  /** Package name
   *
   * e.g. `create-greet`
   */
  name: string;

  /** Package description */
  description: string;

  /** Package author (e.g. "John Doe") */
  author: string;

  /** Package author email (e.g. "john@example.com") */
  email: string;

  /** Package author contact (e.g. "John Doe <john@example.com>") */
  contact: string;

  /** Package license (e.g. "MIT") */
  license: string;

  libram: boolean;
}

export async function create() {
  console.log(
    `🍸📜 Welcome to ${chalk.bold(
      "create-kolmafia-script",
    )}! We're going to ask a few questions to get you started`,
  );

  const firstArg = process.argv[2];
  if (firstArg === undefined) {
    console.error(`You must provide a directory for your script`);
    return;
  }

  const useCurrentDirectory = firstArg === ".";

  const name = useCurrentDirectory ? path.basename(process.cwd()) : firstArg;
  const packageDir = useCurrentDirectory
    ? process.cwd()
    : path.resolve(firstArg);

  if (await isOccupied(packageDir)) {
    console.error(`${packageDir} is not an empty directory.`);
    return;
  }

  const availableLicenses = [...Object.keys(spdxLicenseList), "UNLICENSED"];

  const gitUser = await getGitUser();

  const yargsOption = {
    interactive: { default: true },
    description: {
      type: "input",
      describe: "Description",
      default: "My groovy new script for KoLmafia",
      prompt: "if-no-arg",
    },
    author: {
      type: "input",
      describe: "Author name",
      default: gitUser.name ?? "Your name",
      prompt: "if-no-arg",
    },
    email: {
      type: "input",
      describe: "Author email",
      default: gitUser.email ?? "Your email",
      prompt: "if-no-arg",
    },
    license: {
      type: "list",
      describe: "License",
      choices: availableLicenses,
      default: "MIT",
      prompt: "never",
    },
    "node-pm": {
      type: "list",
      describe:
        "Package manager to use for installing packages from npm. Only tested with yarn",
      choices: ["npm", "yarn", "pnpm"],
      default: undefined, // We'll try to guess pm later
      prompt: "never",
    },
    "skip-git": {
      type: "confirm",
      describe: "Skip initializing git repository",
      prompt: "never",
    },
    "skip-install": {
      type: "confirm",
      describe: "Skip installing package dependencies",
      prompt: "never",
    },
    libram: {
      type: "confirm",
      describe: `Would you like to install ${chalk.italic(
        "libram",
      )} as a dependency?`,
      default: true,
      prompt: "if-no-arg",
    },
  };

  const args = (await yargsInteractive()
    .usage("$0 <name> [args]")
    .interactive(yargsOption as any)) as Record<keyof typeof yargsOption, any>;

  const packageManager = args["node-pm"] ?? whichPm();

  const ignoredProps = ["name", "interactive", "node-pm", "nodePm"];
  const filteredArgs = Object.fromEntries(
    Object.entries(args).filter(
      (arg) => arg[0].match(/^[^$_]/) && !ignoredProps.includes(arg[0]),
    ),
  ) as Answers;

  const year = new Date().getFullYear();
  const contact = toContact(args["author"], args["email"]);

  // construct answers
  const answers = {
    ...filteredArgs,
    name,
    contact,
  };

  // copy files from the template folder
  console.log(`\nCreating a new package in ${chalk.green(packageDir)}.`);

  await copy({
    sourceDir: templateDir,
    targetDir: packageDir,
    view: {
      ...answers,
      year,
      packageManager,
    },
  });

  // create license file
  try {
    await fs.writeFile(
      path.resolve(packageDir, "LICENSE"),
      spdxLicenseList[answers.license].licenseText,
    );
  } catch (e) {
    // do not generate LICENSE
  }

  // init git if option skipGitInit or arg --skip-git are not set
  if (!args["skip-git"]) {
    try {
      console.log("\nInitializing a git repository");
      await initGit(packageDir);
    } catch (err: any) {
      if (err?.exitCode == 127) return; // no git available
      throw err;
    }
  }

  const installNpmPackage = async (
    pkg: string | string[],
    isDev: boolean = false,
  ): Promise<void> => {
    await addDeps(packageDir, Array.isArray(pkg) ? pkg : [pkg], {
      isDev,
      pm: packageManager,
    });
  };

  // run Node.js related tasks only if `package.json` does exist in the package root
  // and skipNpmInstall is not falsy
  const installDepsOnCreation = !args["skip-install"];

  if (installDepsOnCreation) {
    console.log(`\nInstalling dependencies using ${packageManager}`);
    await installDeps(packageDir, packageManager);
  }

  if (answers.libram) {
    installNpmPackage("libram");
  }

  console.log(`\nSuccessfully created ${chalk.bold.cyan(packageDir)}`);

  console.log(`
    Your KoLmafia script has been successfully bootstrapped!
    Once you've navigated to the directory you find more information in the readme!
  `);
}
