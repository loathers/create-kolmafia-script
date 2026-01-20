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
  } catch {}
}

async function* walk(dir: string): AsyncGenerator<string> {
  for await (const d of await fs.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) yield* walk(entry);
    else if (d.isFile()) yield entry;
  }
}

export async function copy(args: {
  targetDir: string;
  sourceDir: string;
  view: Record<string, string | boolean | number>;
}) {
  for await (const sourceFile of walk(args.sourceDir)) {
    const relativePath = path.relative(args.sourceDir, sourceFile);
    // Don't bring over node_modules or our yarn.lock (since it won't have the right package name)
    if (relativePath.startsWith("node_modules") || relativePath === "yarn.lock") continue;
    const targetPath = format(slash(path.resolve(args.targetDir, relativePath)), args.view).replace(
      new RegExp(`${path.sep}gitignore$`, "g"),
      `${path.sep}.gitignore`,
    );
    await prepareDirectory(targetPath);

    const sourceData = await fs.readFile(sourceFile);
    const targetData = isUtf8(sourceData) ? Buffer.from(format(sourceData, args.view)) : sourceData;
    await fs.writeFile(targetPath, targetData, "utf-8");
  }
}
