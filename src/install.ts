import chalk from "chalk";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yargsInteractive from "yargs-interactive";

async function installLinux() {
  installToPath(path.join(os.homedir(), ".kolmafia"));
}

async function installMac() {
  installToPath(path.join(os.homedir(), "Library", "Application Support", "KoLmafia"));
}

const permissables = ["scripts", "data", "images", "relay", "ccs", "planting"];

async function installToPath(installPath: string) {
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
      await fs.promises.symlink(target, source, "junction");
      count++;
    }
  }

  console.log(
    `${count} file${
      count === 1 ? " has" : "s have"
    } been symlinked inside ${chalk.italic(installPath)}.`,
  );
  process.exit(0);
}

export async function install() {
  if (process.argv[3] !== undefined) {
    return await installToPath(process.argv[3]);
  }

  switch (process.platform) {
    case "linux":
      return await installLinux();
    case "darwin":
      return await installMac();
    default:
      yargsInteractive()
        .usage("")
        .interactive({
          interactive: { default: true },
          install: {
            type: "input",
            describe: `The location of your KoLmafia data could not be detected.\nPlease input the directory that contains (e.g.) your ${chalk.italic(
              "scripts",
            )} folder`,
            prompt: "if-no-arg",
          },
        })
        .then(async ({ installPath }) => {
          if (installPath === undefined) {
            console.error("You must specify a path to your mafia directory");
            process.exit(1);
          }
          await installToPath(installPath);
        });
      break;
  }
}
