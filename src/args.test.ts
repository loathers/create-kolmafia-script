import { afterEach, describe, expect, it } from "vitest";

import { parseCliArgs, parseInstallArgs } from "./args.js";

const originalArgv = process.argv;

/** pargs reads process.argv itself rather than taking the arguments, and wants
 *  the path of the entrypoint so it can find our name and version. */
function parse(...args: string[]) {
  process.argv = [originalArgv[0], import.meta.filename, ...args];
  return parseCliArgs(import.meta.filename);
}

function parseInstall(...args: string[]) {
  process.argv = [originalArgv[0], import.meta.filename, "--install", ...args];
  return parseInstallArgs(import.meta.filename);
}

describe("parseCliArgs", () => {
  afterEach(() => {
    process.argv = originalArgv;
  });

  it("reads the target directory as a positional", async () => {
    await expect(parse("myscript")).resolves.toMatchObject({ positionals: ["myscript"] });
  });

  it("reads a bare switch as true", async () => {
    const { values } = await parse("myscript", "--libram");

    expect(values.libram).toBe(true);
  });

  it("reads the negated form as false", async () => {
    const { values } = await parse("myscript", "--no-libram");

    expect(values.libram).toBe(false);
  });

  it("negates a hyphenated switch", async () => {
    const { values } = await parse("myscript", "--no-setup-github");

    expect(values["setup-github"]).toBe(false);
  });

  it("leaves a switch that was never given undefined", async () => {
    const { values } = await parse("myscript");

    expect(values.libram).toBeUndefined();
  });

  it("defaults the licence without being asked", async () => {
    const { values } = await parse("myscript");

    expect(values.license).toBe("MIT");
  });

  it("reads a string option given either way", async () => {
    await expect(parse("myscript", "--description", "hi")).resolves.toMatchObject({
      values: { description: "hi" },
    });
    await expect(parse("myscript", "--description=hi")).resolves.toMatchObject({
      values: { description: "hi" },
    });
  });

  it.each(["--libram=false", "--libram=true"])(
    "complains about %o, since --no- is the way",
    async (arg) => {
      const { errors } = await parse("myscript", arg);

      expect(errors.join("\n")).toMatch(/does not take an argument/);
    },
  );

  it("complains when no directory was given", async () => {
    const { errors } = await parse();

    expect(errors).not.toHaveLength(0);
  });

  it("complains about an option it does not know", async () => {
    const { errors } = await parse("myscript", "--nonsense");

    expect(errors.join("\n")).toMatch(/nonsense/);
  });

  it("offers help and version of its own accord", async () => {
    const { values } = await parse("--help");

    expect(values.help).toBe(true);
    expect(values.version).toBe(false);
  });
});

describe("parseInstallArgs", () => {
  afterEach(() => {
    process.argv = originalArgv;
  });

  it("needs nothing but --install", async () => {
    const { values, positionals, errors } = await parseInstall();

    expect(errors).toHaveLength(0);
    expect(values.force).toBeUndefined();
    expect(positionals).toEqual([]);
  });

  it.each([
    ["before", ["--force", "../mafia"]],
    ["after", ["../mafia", "--force"]],
  ])("reads --force %s the path", async (_, args) => {
    const { values, positionals, errors } = await parseInstall(...args);

    expect(errors).toHaveLength(0);
    expect(values.force).toBe(true);
    expect(positionals).toEqual(["../mafia"]);
  });

  it("complains about more than one path", async () => {
    const { errors } = await parseInstall("../mafia", "../other");

    expect(errors).not.toHaveLength(0);
  });

  it("complains about an option it does not know", async () => {
    const { errors } = await parseInstall("--nonsense");

    expect(errors.join("\n")).toMatch(/nonsense/);
  });

  it("does not treat --install as an option of its own", async () => {
    const { errors } = await parseInstall("--no-install");

    expect(errors.join("\n")).toMatch(/unknown option.*install/i);
  });

  it("does not take create's options", async () => {
    const { errors } = await parseInstall("--libram");

    expect(errors.join("\n")).toMatch(/libram/);
  });
});
