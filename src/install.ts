import { text } from "@clack/prompts";
import chalk from "chalk";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { parseInstallArgs } from "./args.js";
import { stopIfCancelled } from "./prompt.js";

async function installLinux(force: boolean) {
  installToPath(path.join(os.homedir(), ".kolmafia"), force);
}

async function installMac(force: boolean) {
  installToPath(path.join(os.homedir(), "Library", "Application Support", "KoLmafia"), force);
}

const permissables = ["scripts", "data", "images", "relay", "ccs", "planting"];

export async function link(target: string, source: string, force = false) {
  try {
    await fs.promises.symlink(target, source, "junction");
    return "linked";
  } catch (err) {
    if (!(err instanceof Error && "code" in err && err.code === "EEXIST")) throw err;
  }

  // In case someone runs the install again, we should only complain if the thing in the way isn't the link we would make.
  try {
    const existing = await fs.promises.readlink(source);
    if (path.resolve(path.dirname(source), existing) === path.resolve(target)) return "exists";
    if (!force) return "other-link";
  } catch {
    if (!force) return "non-link";
  }

  // rm on a link only removes the link, not whatever it pointed at
  await fs.promises.rm(source, { recursive: true, force: true });
  await fs.promises.symlink(target, source, "junction");
  return "replaced";
}

async function installToPath(installPath: string, force: boolean) {
  const absoluteInstallPath = path.resolve(process.cwd(), installPath);

  if (!fs.existsSync(absoluteInstallPath)) {
    console.error(`Directory ${chalk.italic(installPath)} does not exist`);
    process.exit(1);
  }

  const dist = path.join(process.cwd(), "dist");

  let count = 0;
  for await (const d of await fs.promises.opendir(dist)) {
    if (!d.isDirectory() || !permissables.includes(d.name)) continue;

    const directory = path.join(dist, d.name);
    for await (const f of await fs.promises.opendir(directory)) {
      if (process.platform === "win32" && !f.isDirectory()) {
        console.warn(
          `WARNING: On Windows we can't symlink single files into KoLmafia directories like ${chalk.italic(
            d.name,
          )}. Try moving ${chalk.italic(f.name)} into a subdirectory.`,
        );
        continue;
      }
      const target = path.join(directory, f.name);
      const source = path.join(absoluteInstallPath, path.relative(dist, target));
      const result = await link(target, source, force);
      switch (result) {
        case "non-link":
          console.warn(
            `WARNING: ${chalk.italic(source)} is a real file or directory, not a link, so it was left alone. Use --force to delete it and link this project instead.`,
          );
          break;
        case "other-link":
          console.warn(
            `WARNING: ${chalk.italic(source)} links to ${chalk.italic(await fs.promises.readlink(source))}, not this project, so it was left alone. Use --force to point it here instead.`,
          );
          break;
        case "replaced":
          console.warn(`WARNING: Replaced ${chalk.italic(source)}.`);
          count++;
          break;
        case "linked":
          count++;
          break;
      }
    }
  }

  console.log(
    `${count} file${
      count === 1 ? " has" : "s have"
    } been symlinked inside ${chalk.italic(installPath)}.`,
  );
  process.exit(0);
}

export async function install(entrypoint: string) {
  const { values, positionals, errors, help } = await parseInstallArgs(entrypoint);
  if (values.help || errors.length > 0) return await help();

  const force = values.force ?? false;
  const installPath = positionals[0];

  if (installPath !== undefined) {
    return await installToPath(installPath, force);
  }

  switch (process.platform) {
    case "linux":
      return await installLinux(force);
    case "darwin":
      return await installMac(force);
    default: {
      const promptedPath = stopIfCancelled(
        await text({
          message: `The location of your KoLmafia data could not be detected.\nPlease input the directory that contains (e.g.) your ${chalk.italic(
            "scripts",
          )} folder`,
        }),
      );

      if (!promptedPath) {
        console.error("You must specify a path to your mafia directory");
        process.exit(1);
      }

      return await installToPath(promptedPath, force);
    }
  }
}
