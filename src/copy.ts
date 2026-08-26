import { kebabCase } from "change-case";
import Handlebars from "handlebars";
import { isUtf8 } from "node:buffer";
import fs from "node:fs/promises";
import path from "node:path";

const slash = (possiblyWindowsPath: string) =>
  possiblyWindowsPath.replaceAll(path.sep, path.posix.sep);

Handlebars.registerHelper("kebab", kebabCase);

function format<T>(text: Buffer | string, view: T) {
  const template = Handlebars.compile(text.toString(), { noEscape: true });
  return template(view);
}

async function prepareDirectory(filePath: string) {
  try {
    const target = path.dirname(filePath);
    await fs.mkdir(target, { recursive: true });
  } catch {
    /* Ignore errors */
  }
}

async function* walk(dir: string): AsyncGenerator<string> {
  for await (const d of await fs.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) yield* walk(entry);
    else if (d.isFile()) yield entry;
  }
}

/**
 * What not to bring over from the template: our own artefacts, plus the pieces
 * that only make sense for some of the answers. Anything package-manager
 * specific has to be named here, or it would follow everyone home.
 */
export function templateIgnores({
  setupGithub,
  packageManager,
}: {
  setupGithub: boolean;
  packageManager: string;
}) {
  const ignored = ["node_modules/**", "yarn.lock", ".npmignore"];

  if (!setupGithub) ignored.push(".github/**");
  if (packageManager !== "pnpm") ignored.push("pnpm-workspace.yaml");

  return ignored;
}

function shouldAppend(targetPath: string): boolean {
  // It's safe to append to .*ignore files; we conservatively assume it isn't for others.
  return /^\..*ignore$/.test(path.basename(targetPath));
}

export async function copy(args: {
  targetDir: string;
  sourceDir: string;
  view: Record<string, string | boolean | number>;
  ignored: string[];
}) {
  for await (const sourceFile of walk(args.sourceDir)) {
    const relativePath = path.relative(args.sourceDir, sourceFile);
    if (args.ignored.some((glob) => path.matchesGlob(relativePath, glob))) continue;
    const targetPath = format(slash(path.resolve(args.targetDir, relativePath)), args.view);
    await prepareDirectory(targetPath);

    const sourceData = await fs.readFile(sourceFile);
    const targetData = isUtf8(sourceData) ? Buffer.from(format(sourceData, args.view)) : sourceData;
    const flag = shouldAppend(targetPath) ? "a" : "wx";
    await fs.writeFile(targetPath, targetData, { encoding: "utf-8", flag });
  }
}

export const _exportedForTesting = process.env.VITEST ? { shouldAppend } : undefined;
