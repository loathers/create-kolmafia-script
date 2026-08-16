import chalk from "chalk";
import { execa } from "execa";

import { printCommand, printWarning } from "./utils.js";

// Up to date as of August 2026
export const supportedPMs = {
  yarn: "4.18.0",
  pnpm: "11.22.0",
  npm: "12.0.2",
} as const;
export type PackageManager = keyof typeof supportedPMs;
export function isPmSupported(packageManager: string): packageManager is PackageManager {
  return packageManager in supportedPMs;
}

// License for `whichPm`
// The MIT License (MIT)
// Copyright (c) 2017-2022 Zoltan Kochan <z@kochan.io>
// https://github.com/zkochan/packages/tree/main/which-pm-runs
function whichPm(): PackageManager | undefined {
  if (!process.env.npm_config_user_agent) {
    printWarning("Could not detect package manager.");
    return undefined;
  }

  const pmSpec = process.env.npm_config_user_agent.split(" ")[0];
  const separatorPos = pmSpec.lastIndexOf("/");
  const name = pmSpec.substring(0, separatorPos);

  if (!isPmSupported(name)) {
    printWarning("Package manager", chalk.italic(name), "not supported.");
    return undefined;
  }

  return name;
}

export function getPmAndVersion(requested?: PackageManager): {
  packageManager: PackageManager;
  packageManagerVersion: string;
} {
  const fallback: PackageManager = "yarn";
  const supplied = requested ?? whichPm();

  const packageManager =
    supplied ??
    (() => {
      printWarning(
        `Falling back to ${chalk.italic(fallback)}; ` +
          `for a different package manager, use ${chalk.italic("--node-pm}")}.`,
      );
      return fallback;
    })();

  const packageManagerVersion = supportedPMs[packageManager];
  return { packageManager, packageManagerVersion };
}

export async function configureYarn(rootDir: string) {
  const args = ["config", "set", "nodeLinker", "node-modules"];
  printCommand("yarnpkg", ...args);
  await execa("yarnpkg", args, {
    stdio: "inherit",
    shell: true,
    cwd: rootDir,
  });
}

export async function installDeps(rootDir: string, pm: PackageManager) {
  let command: string;
  let args: string[];

  switch (pm) {
    case "npm": {
      command = "npm";
      args = ["install"];
      break;
    }
    case "yarn": {
      command = "yarnpkg";
      args = ["install"];
      break;
    }
    case "pnpm": {
      command = "pnpm";
      args = ["install"];
      break;
    }
  }

  printCommand(command, ...args);

  try {
    await execa(command, args, { stdio: "inherit", shell: true, cwd: rootDir });
  } catch (err) {
    throw new Error(`Failed to install dependencies: ${err}`);
  }
}

export async function addDeps(
  rootDir: string,
  deps: string[],
  {
    isDev = false,
    pm,
  }: {
    isDev?: boolean;
    pm: PackageManager;
  },
) {
  let command: string;
  let args: string[];

  switch (pm) {
    case "npm": {
      command = "npm";
      args = ["install", isDev ? "-D" : "-S", ...deps];
      break;
    }
    case "yarn": {
      command = "yarnpkg";
      args = ["add", ...deps, ...(isDev ? ["-D"] : [])];
      break;
    }
    case "pnpm": {
      command = "pnpm";
      args = ["add", ...deps, ...(isDev ? ["-D"] : [])];
      break;
    }
  }

  printCommand(command, ...args);

  try {
    await execa(command, args, { stdio: "inherit", shell: true, cwd: rootDir });
  } catch (err) {
    throw new Error(`Failed to add dependencies: ${err}`);
  }
}
