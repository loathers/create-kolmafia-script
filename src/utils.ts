import chalk from "chalk";
import { execa } from "execa";
import fs from "node:fs/promises";

export async function isOccupied(dirname: string) {
  try {
    return (await fs.readdir(dirname)).filter((s) => !s.startsWith(".")).length !== 0;
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

export async function getGitUser(): Promise<{ name?: string; email?: string }> {
  try {
    const { stdout: name } = await execa`git config --global user.name`;
    const { stdout: email } = await execa`git config --global user.email`;
    return { name, email };
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
