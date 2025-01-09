import { execa } from "execa";
import { printCommand } from "./utils.js";

export type PackageManager = "npm" | "yarn" | "pnpm";

// License for `whichPm`
// The MIT License (MIT)
// Copyright (c) 2017-2022 Zoltan Kochan <z@kochan.io>
// https://github.com/zkochan/packages/tree/main/which-pm-runs
export function whichPm(): PackageManager {
  if (!process.env.npm_config_user_agent) {
    return "npm";
  }

  const pmSpec = process.env.npm_config_user_agent.split(" ")[0];
  const separatorPos = pmSpec.lastIndexOf("/");
  const name = pmSpec.substring(0, separatorPos);

  return name as PackageManager;
}

export async function initPackage(
  rootDir: string,
  {
    pm,
  }: {
    pm: PackageManager;
  },
) {
  let command: string;
  let args: string[];

  switch (pm) {
    case "npm": {
      command = "npm";
      args = ["init", "-y"];
      process.chdir(rootDir);
      break;
    }
    case "yarn": {
      command = "yarnpkg";
      args = ["--cwd", rootDir, "init", "-y"];
      break;
    }
    case "pnpm": {
      command = "pnpm";
      args = ["init", "-y"];
      process.chdir(rootDir);
      break;
    }
  }

  printCommand(command, ...args);

  try {
    await execa(command, args, { stdio: "inherit", shell: true });
  } catch (err) {
    throw new Error(`Failed to install dependencies: ${err}`);
  }
}

export async function installDeps(rootDir: string, pm: PackageManager) {
  let command: string;
  let args: string[];

  switch (pm) {
    case "npm": {
      command = "npm";
      args = ["install"];
      process.chdir(rootDir);
      break;
    }
    case "yarn": {
      command = "yarnpkg";
      args = ["--cwd", rootDir, "install"];
      break;
    }
    case "pnpm": {
      command = "pnpm";
      args = ["install", "--dir", rootDir];
      break;
    }
  }

  printCommand(command, ...args);

  try {
    await execa(command, args, { stdio: "inherit", shell: true });
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
      process.chdir(rootDir);
      break;
    }
    case "yarn": {
      command = "yarnpkg";
      args = ["--cwd", rootDir, "add", ...deps, isDev ? "-D" : ""];
      break;
    }
    case "pnpm": {
      command = "pnpm";
      args = ["add", "--dir", rootDir, ...deps, isDev ? "-D" : ""];
      break;
    }
  }

  printCommand(command, ...args);

  try {
    await execa(command, args, { stdio: "inherit", shell: true });
  } catch (err) {
    throw new Error(`Failed to add dependencies: ${err}`);
  }
}
