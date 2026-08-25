import path from "node:path";
import { describe, expect, it } from "vitest";

import { templateIgnores, _exportedForTesting } from "./copy.js";

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

// This is a type guard to let us destructure _exportedForTesting
// If it fails, there's something wrong with the tests, not the code
expect.assert(_exportedForTesting, "copy.ts did not export testing functions");
const { shouldAppend } = _exportedForTesting;

describe("shouldAppend", () => {
  it("appends to .prettierignore", () => {
    expect(shouldAppend(path.join("target-project", ".prettierignore"))).toBe(true);
  });
  it("appends to a subdirectory's .gitignore", () => {
    expect(shouldAppend(path.join("target-project", "subdirectory", ".gitignore"))).toBe(true);
  });
  it("does not append to non-dot files ending in ignore", () => {
    expect(
      shouldAppend(path.join("target-project", ".github", "actions", "random-file-to-ignore")),
    ).toBe(false);
  });
  it("does not take the current directory to mean dotfile", () => {
    expect(shouldAppend(path.join(".", ".github", "actions", "random-file-to-ignore"))).toBe(false);
  });
  it("accepts / as a path separator", () => {
    // This should work even on Windows.
    expect(shouldAppend("./.github/actions/random-file-to-ignore")).toBe(false);
  });
  it("does not append to other files", () => {
    expect(shouldAppend(path.join("target-project", ".github", "workflows", "deploy.yml"))).toBe(
      false,
    );
  });
});
