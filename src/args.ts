import { type ParseArgsOptionsConfig, parseArgs } from "node:util";

const options = {
  help: { type: "boolean", short: "h" },
  interactive: { type: "boolean" },
  description: { type: "string" },
  author: { type: "string" },
  email: { type: "string" },
  license: { type: "string" },
  "node-pm": { type: "string" },
  "setup-github": { type: "boolean" },
  "skip-git": { type: "boolean" },
  "skip-install": { type: "boolean" },
  libram: { type: "boolean" },
  grimoire: { type: "boolean" },
} as const satisfies ParseArgsOptionsConfig;

export const usage = `Usage: create-kolmafia-script <directory> [options]
       create-kolmafia-script --install

Creates a KoLmafia script project in <directory>. Pass "." to use the current
directory.

Options:
  --description <text>   What the script is for
  --author <name>        Author name
  --email <email>        Author email
  --license <id>         SPDX licence id, or UNLICENSED (default: MIT)
  --node-pm <pm[@ver]>   Package manager to install with, e.g. yarn@4.18.0
  --setup-github         Include the auto-deploy workflow (default: yes)
  --libram               Install libram (default: yes)
  --grimoire             Install grimoire-kolmafia (default: no)
  --skip-git             Don't initialise a git repository
  --skip-install         Don't install dependencies
  --no-interactive       Never ask; take the default for anything not given
  -h, --help             Show this message

Turn any option above off by prefixing it with no-, so --no-libram leaves
libram out.`;

export function parseCliArgs(argv: string[]) {
  return parseArgs({
    args: argv,
    options,
    strict: true,
    allowPositionals: true,
    allowNegative: true,
  });
}
