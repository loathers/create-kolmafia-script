import { globby } from "globby";
import Handlebars from "handlebars";
import slash from "slash";
import isUtf8 from "is-utf8";
import path from "node:path";
import fs from "node:fs/promises";
import { kebabCase } from "change-case";

Handlebars.registerHelper('kebab', kebabCase);

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

export async function copy(args: {
  targetDir: string;
  sourceDir: string;
  view: Record<string, string | boolean | number>;
}) {
  const sourceFiles = await globby(slash(args.sourceDir), { dot: true });

  for (const sourceFile of sourceFiles) {
    const relativePath = path.relative(args.sourceDir, sourceFile);
    const targetPath = format(
      slash(path.resolve(args.targetDir, relativePath)),
      args.view,
    ).replace(
      new RegExp(`${path.sep}gitignore$`, "g"),
      `${path.sep}.gitignore`,
    );
    await prepareDirectory(targetPath);

    const sourceData = await fs.readFile(sourceFile);
    const targetData = isUtf8(sourceData)
      ? Buffer.from(format(sourceData, args.view))
      : sourceData;
    await fs.writeFile(targetPath, targetData, "utf-8");
  }
}
