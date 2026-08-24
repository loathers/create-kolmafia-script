import pargs from "pargs";

/**
 * pargs adds --help and --version itself, and generates the help text from the
 * descriptions below, so this is the only place an option needs describing.
 */
export function parseCliArgs(entrypoint: string) {
  return pargs(entrypoint, {
    allowNegative: true,
    minPositionals: 1,
    allowPositionals: 1,
    positionals: [
      { name: "directory", description: `where to put it, or "." for the current one` },
    ],
    description: {
      summary: "Create a KoLmafia script project.",
      examples: [
        { command: "create-kolmafia-script my-script", description: "ask about the rest" },
        {
          command: "create-kolmafia-script my-script --no-libram --no-interactive",
          description: "take the defaults, without libram",
        },
      ],
      sections: [
        {
          title: "Turning options off",
          body: "Prefix any switch with no-, as in --no-libram. Note that --libram=false is not accepted.",
        },
      ],
    },
    options: {
      interactive: {
        type: "boolean",
        description: "ask about anything not given on the command line",
        defaultDescription: "yes, when run in a terminal",
      },
      description: {
        type: "string",
        placeholder: "text",
        description: "what the script is for",
        defaultDescription: "My groovy new script for KoLmafia",
      },
      author: {
        type: "string",
        placeholder: "name",
        description: "author name",
        defaultDescription: "your git user.name",
      },
      email: {
        type: "string",
        placeholder: "address",
        description: "author email",
        defaultDescription: "your git user.email",
      },
      license: {
        type: "string",
        placeholder: "id",
        description: "SPDX licence id, or UNLICENSED",
        default: "MIT",
      },
      "node-pm": {
        type: "string",
        placeholder: "pm[@version]",
        description: "package manager to install with, such as yarn@4.18.0",
        defaultDescription: "whichever one you ran this with",
      },
      "setup-github": {
        type: "boolean",
        description: "include the auto-deploy workflow",
        defaultDescription: "yes",
      },
      libram: {
        type: "boolean",
        description: "install libram",
        defaultDescription: "yes",
      },
      grimoire: {
        type: "boolean",
        description: "install grimoire-kolmafia",
        defaultDescription: "no",
      },
      "skip-git": {
        type: "boolean",
        description: "don't initialise a git repository",
      },
      "skip-install": {
        type: "boolean",
        description: "don't install dependencies",
      },
    },
  });
}
