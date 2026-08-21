import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCiInstallCommand, getPmAndVersion, supportedPMs } from "./npm.js";

const originalUserAgent = process.env.npm_config_user_agent;

describe("getPmAndVersion", () => {
  beforeEach(() => {
    delete process.env.npm_config_user_agent;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalUserAgent === undefined) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = originalUserAgent;
    }
    vi.restoreAllMocks();
  });

  it("falls back to yarn when nothing is requested or detected", () => {
    expect(getPmAndVersion()).toEqual({
      packageManager: "yarn",
      packageManagerVersion: supportedPMs.yarn,
    });
  });

  it("detects the package manager from the npm user agent", () => {
    process.env.npm_config_user_agent = "pnpm/11.22.0 npm/? node/v24.19.0 darwin arm64";

    expect(getPmAndVersion()).toEqual({
      packageManager: "pnpm",
      packageManagerVersion: supportedPMs.pnpm,
    });
  });

  it("supplies the pinned version for a supported manager", () => {
    expect(getPmAndVersion("npm")).toEqual({
      packageManager: "npm",
      packageManagerVersion: supportedPMs.npm,
    });
  });

  it("honours an explicitly requested version", () => {
    expect(getPmAndVersion("yarn@1.22.22")).toEqual({
      packageManager: "yarn",
      packageManagerVersion: "1.22.22",
    });
  });

  it("accepts a manager it knows nothing about, given a version", () => {
    expect(getPmAndVersion("bun@1.3.14")).toEqual({
      packageManager: "bun",
      packageManagerVersion: "1.3.14",
    });
  });

  it.each(["", "yarn@"])("treats %o as unspecified rather than as an empty value", (requested) => {
    expect(getPmAndVersion(requested)).toEqual({
      packageManager: "yarn",
      packageManagerVersion: supportedPMs.yarn,
    });
  });

  it("refuses a manager it knows nothing about when no version is given", () => {
    expect(getPmAndVersion("bun")).toBeUndefined();
  });
});

describe("getCiInstallCommand", () => {
  it.each([
    ["yarn", "yarn install --immutable"],
    ["npm", "npm ci"],
    ["pnpm", "pnpm install --frozen-lockfile"],
  ])("installs from the lockfile alone with %s", (packageManager, expected) => {
    expect(getCiInstallCommand(packageManager)).toBe(expected);
  });

  it("guesses at a manager it knows nothing about", () => {
    expect(getCiInstallCommand("bun")).toBe("bun install --frozen-lockfile");
  });
});
