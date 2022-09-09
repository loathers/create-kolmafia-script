import chalk from "chalk";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function installLinux() {
  installToPath(path.join(os.homedir(), ".kolmafia"));
}

async function installMac() {
  installToPath(
    path.join(os.homedir(), "Library", "Application Support", "KoLmafia")
  );
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
      const target = path.join(directory, f.name);
      const source = path.join(
        absoluteInstallPath,
        path.relative(dist, target)
      );
      await fs.promises.symlink(target, source);
      count++;
    }
  }

  console.log(
    `${count} file${
      count === 1 ? " has" : "s have"
    } been symlinked inside ${chalk.italic(installPath)}.`
  );
  process.exit(0);
}

export async function install() {
  switch (process.platform) {
    case "linux":
      return await installLinux();
    case "darwin":
      return await installMac();
    default:
      const installPath = process.argv[3];
      if (installPath === undefined) {
        console.error(
          "Sorry, KoLmafia scripts cannot automatically be installed on your operating system. Run this command again with a path to your KoLmafia directory."
        );
        process.exit(1);
      }

      await installToPath(installPath);
      break;
  }
}
