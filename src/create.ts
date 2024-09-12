import { create as createApp } from "create-create-app";
import { resolve } from "path";
import chalk from "chalk";

const templateRoot = resolve(__dirname, "..", "templates");

function caveat() {
  return `
Your KoLmafia script has been successfully bootstrapped!
Once you've navigated to the directory you find more information in the readme!
  `;
}

export function create() {
  console.log(
    `🍸📜 Welcome to ${chalk.bold(
      "create-kolmafia-script",
    )}! We're going to ask a few questions to get you started`,
  );

  createApp("create-kolmafia-script", {
    templateRoot,
    promptForLicense: false,
    extra: {
      libram: {
        type: "confirm",
        describe: `Would you like to install ${chalk.italic(
          "libram",
        )} as a dependency?`,
        default: true,
        prompt: "if-no-arg",
      },
    },
    after: ({ answers, installNpmPackage }) => {
      if (answers.libram) {
        installNpmPackage("libram");
      }
    },
    caveat,
  });
}
