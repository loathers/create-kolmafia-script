import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { link } from "./install.js";

describe("link", () => {
  let root: string;
  let target: string;
  let source: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "install-test-"));
    target = path.join(root, "dist", "scripts", "pompeii");
    source = path.join(root, "mafia", "scripts", "pompeii");
    await fs.mkdir(target, { recursive: true });
    await fs.mkdir(path.dirname(source), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("links a fresh install", async () => {
    expect(await link(target, source)).toBe("linked");
    expect(path.resolve(path.dirname(source), await fs.readlink(source))).toBe(target);
  });

  it("is happy to run again", async () => {
    await link(target, source);

    expect(await link(target, source)).toBe("exists");
  });

  it("leaves a real file or directory in the way alone", async () => {
    await fs.mkdir(source);

    expect(await link(target, source)).toBe("non-link");
    expect((await fs.lstat(source)).isDirectory()).toBe(true);
  });

  it("leaves a link to somewhere else alone", async () => {
    const elsewhere = path.join(root, "elsewhere");
    await fs.mkdir(elsewhere);
    await fs.symlink(elsewhere, source, "junction");

    expect(await link(target, source)).toBe("other-link");
    expect(await fs.readlink(source)).toBe(elsewhere);
  });

  describe("with force", () => {
    it("replaces a real file or directory in the way", async () => {
      await fs.mkdir(source);
      await fs.writeFile(path.join(source, "old.js"), "");

      expect(await link(target, source, true)).toBe("replaced");
      expect(path.resolve(path.dirname(source), await fs.readlink(source))).toBe(target);
    });

    it("replaces a link to somewhere else without touching where it pointed", async () => {
      const elsewhere = path.join(root, "elsewhere");
      await fs.mkdir(elsewhere);
      await fs.writeFile(path.join(elsewhere, "keep.js"), "");
      await fs.symlink(elsewhere, source, "junction");

      expect(await link(target, source, true)).toBe("replaced");
      expect(path.resolve(path.dirname(source), await fs.readlink(source))).toBe(target);
      expect(await fs.readdir(elsewhere)).toEqual(["keep.js"]);
    });

    it("still leaves our own link alone", async () => {
      await link(target, source);

      expect(await link(target, source, true)).toBe("exists");
    });
  });
});
