import path from "node:path";
import { describe, expect, it } from "vitest";

import { templateIgnores } from "./copy.js";

/** copy() drops a file when any of the globs match it, so ask the same question. */
function isIgnored(relativePath: string, ignored: string[]) {
  return ignored.some((glob) => path.matchesGlob(relativePath, glob));
}

describe("templateIgnores", () => {
  const forPackageManager = (packageManager: string) =>
    templateIgnores({ setupGithub: true, packageManager });

  it("gives the pnpm config to pnpm", () => {
    expect(isIgnored("pnpm-workspace.yaml", forPackageManager("pnpm"))).toBe(false);
  });

  it.each(["yarn", "npm", "bun", "PNPM"])(
    "keeps the pnpm config away from %s",
    (packageManager) => {
      expect(isIgnored("pnpm-workspace.yaml", forPackageManager(packageManager))).toBe(true);
    },
  );

  it("leaves our own artefacts behind", () => {
    const ignored = forPackageManager("pnpm");

    expect(isIgnored("node_modules/libram/index.js", ignored)).toBe(true);
    expect(isIgnored("yarn.lock", ignored)).toBe(true);
    expect(isIgnored(".npmignore", ignored)).toBe(true);
  });

  it("brings the github directory when it was asked for", () => {
    const ignored = templateIgnores({ setupGithub: true, packageManager: "yarn" });

    expect(isIgnored(".github/workflows/deploy.yml", ignored)).toBe(false);
    expect(isIgnored(".github/actions/setup/action.yml", ignored)).toBe(false);
  });

  it("leaves the github directory when it was not", () => {
    const ignored = templateIgnores({ setupGithub: false, packageManager: "yarn" });

    expect(isIgnored(".github/workflows/deploy.yml", ignored)).toBe(true);
    expect(isIgnored(".github/actions/setup/action.yml", ignored)).toBe(true);
  });

  it("brings everything a new project actually wants", () => {
    const ignored = templateIgnores({ setupGithub: true, packageManager: "pnpm" });

    for (const wanted of [
      "package.json",
      "src/main.ts",
      ".gitignore",
      ".prettierignore",
      "README.md",
      "tsconfig.json",
      "rollup.config.ts",
    ]) {
      expect(isIgnored(wanted, ignored)).toBe(false);
    }
  });
});
