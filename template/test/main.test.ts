import { myName, print } from "kolmafia";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { main } from "../src/main.js";

vi.mock("kolmafia", () => ({
  myName: vi.fn(),
  print: vi.fn(),
}));

describe("main", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(myName).mockReturnValue("{{author}}");
  });

  it("greets the player by name", () => {
    main();
    expect(vi.mocked(print)).toHaveBeenNthCalledWith(1, "Welcome, {{author}}!");
  });
  it("prints a string containing the project name", () => {
    main();
    expect(vi.mocked(print)).toHaveBeenCalledTimes(2);
    const lastCall = vi.mocked(print).mock.lastCall;
    expect(lastCall?.[0]).toContain("{{name}}");
  });
  it("prints arguments if given", () => {
    main("--param value");
    expect(vi.mocked(print)).toHaveBeenCalledTimes(3);
    expect(vi.mocked(print)).toHaveBeenLastCalledWith(
      'You called the script with 1 argument: ["--param value"]',
    );
  });
  it("handles multiple arguments", () => {
    // In KoLmafia itself, this is done with `{{kebab name}} (arg1, arg2)`
    // It might not be worth handling this in your script
    main("arg1", "arg2");
    expect(vi.mocked(print)).toHaveBeenCalledTimes(3);
    expect(vi.mocked(print)).toHaveBeenLastCalledWith(
      'You called the script with 2 arguments: ["arg1","arg2"]',
    );
  });
});
