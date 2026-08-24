import { confirm, intro, log, outro, text } from "@clack/prompts";
import chalk from "chalk";
import { ExecaError } from "execa";
import fs from "node:fs/promises";
import path from "node:path";
import spdxLicenseList from "spdx-license-list/full.js";

import { parseCliArgs } from "./args.js";
import { copy } from "./copy.js";
import {
  addDeps,
  configureYarn,
  installDeps,
  getCiInstallCommand,
  getPmAndVersion,
  isPmSupported,
} from "./packageManager.js";
import { isInteractive, resolve } from "./prompt.js";
import { getGitUser, initGit, isOccupied, toContact, printWarning } from "./utils.js";

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

  /** Whether to set up GitHub-specific repository features */
  "setup-github": boolean;

  libram: boolean;

  grimoire: boolean;
}

export async function create(entrypoint: string) {
  const { values: flags, positionals, errors, help } = await parseCliArgs(entrypoint);

  // help() prints the usage and whatever pargs objected to, which covers a
  // missing directory as well, since it is declared as a required positional.
  if (flags.help || errors.length > 0) return await help();

  const target = positionals[0];
  const packageDir = target === "." ? process.cwd() : path.resolve(target);

  if (await isOccupied(packageDir)) {
    console.error(`${packageDir} is not an empty directory.`);
    process.exitCode = 1;
    return;
  }

  const name = path.basename(packageDir);

  const interactive = isInteractive(flags.interactive);

  const askText = (given: string | undefined, message: string, fallback: string) =>
    resolve({
      given,
      fallback,
      interactive,
      ask: () => text({ message, placeholder: fallback, defaultValue: fallback }),
    });

  const askConfirm = (given: boolean | undefined, message: string, fallback: boolean) =>
    resolve({
      given,
      fallback,
      interactive,
      ask: () => confirm({ message, initialValue: fallback }),
    });

  intro(`🍸📜 ${chalk.bold("create-kolmafia-script")}`);

  const pm = getPmAndVersion(flags["node-pm"]);
  if (!pm) return;
  const { packageManager, packageManagerVersion } = pm;

  const gitUser = await getGitUser();

  const description = await askText(
    flags.description,
    "Description",
    "My groovy new script for KoLmafia",
  );
  const author = await askText(flags.author, "Author name", gitUser.name ?? "Your name");
  const email = await askText(flags.email, "Author email", gitUser.email ?? "Your email");

  const answers: Answers = {
    name,
    description,
    author,
    email,
    contact: toContact(author, email),
    license: flags.license,
    "setup-github": await askConfirm(
      flags["setup-github"],
      "Include GitHub files, such as the auto-deploy workflow?",
      true,
    ),
    libram: await askConfirm(
      flags.libram,
      `Install ${chalk.italic("libram")}? (a general purpose library for KoLmafia scripting)`,
      true,
    ),
    grimoire: await askConfirm(
      flags.grimoire,
      `Install ${chalk.italic("grimoire")}? (a set of tools for writing adventuring scripts)`,
      false,
    ),
  };

  // copy files from the template folder
  log.step(`Creating a new package in ${chalk.green(packageDir)}.`);

  await copy({
    sourceDir: templateDir,
    targetDir: packageDir,
    view: {
      ...answers,
      year: new Date().getFullYear(),
      packageManager,
      packageManagerVersion,
      ciInstallCommand: getCiInstallCommand(packageManager),
    },
    ignored: [
      "node_modules/**",
      "yarn.lock",
      ".npmignore",
      ...(answers["setup-github"] ? [] : [".github/**"]),
    ],
  });

  // create license file
  try {
    await fs.writeFile(
      path.resolve(packageDir, "LICENSE"),
      spdxLicenseList[answers.license].licenseText,
    );
  } catch {
    // do not generate LICENSE
  }

  // init git if arg --skip-git is not set
  if (!flags["skip-git"]) {
    try {
      log.step("Initializing a git repository");
      await initGit(packageDir);
    } catch (err) {
      if (err instanceof ExecaError && err.exitCode === 127) return; // no git available
      throw err;
    }
  }

  if (packageManager === "yarn") {
    await configureYarn(packageDir);
  }

  if (flags["skip-install"]) {
    // No need to do anything in this case
  } else if (!isPmSupported(packageManager)) {
    printWarning(
      "Package manager",
      packageManager,
      "is not supported; you will need to install it yourself.",
    );
  } else {
    const installNpmPackage = async (
      pkg: string | string[],
      isDev: boolean = false,
    ): Promise<void> => {
      await addDeps(packageDir, Array.isArray(pkg) ? pkg : [pkg], {
        isDev,
        pm: packageManager,
      });
    };

    log.step(`Installing dependencies using ${packageManager}`);
    await installDeps(packageDir, packageManager);

    if (answers.libram) {
      log.step(`Installing ${chalk.italic("libram")} as a dependency`);
      await installNpmPackage("libram");
    }
    if (answers.grimoire) {
      log.step(`Installing ${chalk.italic("grimoire")} as a dependency`);
      await installNpmPackage("grimoire-kolmafia");
    }
  }

  outro(
    `Successfully created ${chalk.bold.cyan(packageDir)}\nOnce you've navigated to the directory you find more information in the readme!`,
  );
}
