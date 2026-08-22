import { describe, expect, it } from "vitest";

import { parseCliArgs } from "./args.js";

describe("parseCliArgs", () => {
  it("reads the target directory as a positional", () => {
    expect(parseCliArgs(["myscript"]).positionals).toEqual(["myscript"]);
  });

  it("reads a bare boolean flag as true", () => {
    expect(parseCliArgs(["myscript", "--libram"]).values.libram).toBe(true);
  });

  it("reads the negated form as false", () => {
    expect(parseCliArgs(["myscript", "--no-libram"]).values.libram).toBe(false);
  });

  it("negates a hyphenated flag", () => {
    expect(parseCliArgs(["myscript", "--no-setup-github"]).values["setup-github"]).toBe(false);
  });

  it("leaves an option that was never given undefined", () => {
    expect(parseCliArgs(["myscript"]).values.libram).toBeUndefined();
  });

  it.each(["--libram=false", "--libram=true"])("refuses %o, since --no- is the way", (arg) => {
    expect(() => parseCliArgs(["myscript", arg])).toThrow(/does not take an argument/);
  });

  it("reads a string option given either way", () => {
    expect(parseCliArgs(["myscript", "--description", "hi"]).values.description).toBe("hi");
    expect(parseCliArgs(["myscript", "--description=hi"]).values.description).toBe("hi");
  });

  it("accepts the short form of help", () => {
    expect(parseCliArgs(["-h"]).values.help).toBe(true);
  });

  it("throws on an option it does not know", () => {
    expect(() => parseCliArgs(["myscript", "--nonsense"])).toThrow();
  });
});
