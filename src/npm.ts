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
function whichPm(): string | undefined {
  if (!process.env.npm_config_user_agent) {
    printWarning("Could not detect package manager.");
    return undefined;
  }

  const pmSpec = process.env.npm_config_user_agent.split(" ")[0];
  const separatorPos = pmSpec.lastIndexOf("/");
  const name = pmSpec.substring(0, separatorPos);

  return name;
}

export function getPmAndVersion(
  requested?: string,
): { packageManager: string; packageManagerVersion: string } | undefined {
  const fallback: PackageManager = "yarn";
  const [name, version] = requested?.split("@") ?? [];

  const packageManager =
    name ||
    whichPm() ||
    (() => {
      printWarning(
        `Falling back to ${chalk.italic(fallback)}; ` +
          `for a different package manager, use ${chalk.italic("--node-pm")}.`,
      );
      return fallback;
    })();

  const packageManagerVersion =
    version || (isPmSupported(packageManager) ? supportedPMs[packageManager] : undefined);

  if (!packageManagerVersion) {
    console.error(
      `No default version is known for ${chalk.italic(packageManager)}, so you must give one: ` +
        `--node-pm=${packageManager}@VERSION`,
    );
    return undefined;
  }

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
    throw new Error(`Failed to install dependencies: ${err}`, { cause: err });
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
    throw new Error(`Failed to add dependencies: ${err}`, { cause: err });
  }
}
