import fs from "node:fs/promises";
// @ts-expect-error No types
import gitconfig from "gitconfig";
import chalk from "chalk";
import { execa } from "execa";

export async function isOccupied(dirname: string) {
  try {
    return (
      (await fs.readdir(dirname)).filter((s) => !s.startsWith(".")).length !== 0
    );
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

export async function getGitUser(): Promise<{ name?: string; email?: string }> {
  try {
    const config = await gitconfig.get({ location: "global" });
    return config.user ?? {};
  } catch (err) {
    return {};
  }
}

export async function initGit(root: string) {
  printCommand("git init");
  await execa("git init", { shell: true, cwd: root });
}

export function toContact(author: string, email?: string) {
  return `${author}${email ? ` <${email}>` : ""}`;
}

export function printCommand(...commands: string[]) {
  console.log(chalk.gray(">", ...commands));
}
