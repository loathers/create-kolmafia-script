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

// Install exactly what the lockfile says, failing rather than updating it.
const ciInstallCommands = {
  yarn: "yarn install --immutable",
  pnpm: "pnpm install --frozen-lockfile",
  npm: "npm ci",
} as const satisfies Record<PackageManager, string>;

export function getCiInstallCommand(packageManager: string) {
  return isPmSupported(packageManager)
    ? ciInstallCommands[packageManager]
    : `${packageManager} install --frozen-lockfile`;
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

async function runPmCommand(rootDir: string, action: string, pm: PackageManager, args: string[]) {
  const command = pm === "yarn" ? "yarnpkg" : pm;
  printCommand(command, ...args);

  try {
    await execa(command, args, { stdio: "inherit", cwd: rootDir });
  } catch (err) {
    throw new Error(`Failed to ${action}: ${err}`, { cause: err });
  }
}

export async function configureYarn(rootDir: string) {
  const args = ["config", "set", "nodeLinker", "node-modules"];
  await runPmCommand(rootDir, "configure package manager", "yarn", args);
}

export async function installDeps(rootDir: string, pm: PackageManager) {
  const args: string[] = ["install"];
  await runPmCommand(rootDir, "install dependencies", pm, args);
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
  const args: string[] = ["add", ...deps, ...(isDev ? ["-D"] : [])];
  await runPmCommand(rootDir, "add dependencies", pm, args);
}
