import { afterEach, describe, expect, it, vi } from "vitest";

import { decideInteractive, resolve } from "./prompt.js";

describe("decideInteractive", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("asks when there is a terminal and nobody said otherwise", () => {
    expect(decideInteractive({ canPrompt: true, ci: false })).toBe(true);
  });

  it("stays quiet on CI, where nobody is watching", () => {
    expect(decideInteractive({ canPrompt: true, ci: true })).toBe(false);
  });

  it("asks on CI when explicitly told to", () => {
    expect(decideInteractive({ override: true, canPrompt: true, ci: true })).toBe(true);
  });

  it("stays quiet when told to, terminal or not", () => {
    expect(decideInteractive({ override: false, canPrompt: true, ci: false })).toBe(false);
  });

  it("stays quiet with no terminal, rather than hanging on a prompt", () => {
    expect(decideInteractive({ canPrompt: false, ci: false })).toBe(false);
  });

  it("warns when it cannot honour a request to ask", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(decideInteractive({ override: true, canPrompt: false, ci: false })).toBe(false);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("says nothing when there was nothing to override", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(decideInteractive({ canPrompt: false, ci: false })).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("resolve", () => {
  it("prefers what was given on the command line over asking", async () => {
    const ask = vi.fn();

    await expect(resolve({ given: false, fallback: true, interactive: true, ask })).resolves.toBe(
      false,
    );
    expect(ask).not.toHaveBeenCalled();
  });

  it("keeps an empty string, rather than treating it as nothing", async () => {
    const ask = vi.fn();

    await expect(resolve({ given: "", fallback: "x", interactive: true, ask })).resolves.toBe("");
    expect(ask).not.toHaveBeenCalled();
  });

  it("asks when nothing was given", async () => {
    const ask = vi.fn().mockResolvedValue("answered");

    await expect(
      resolve({ given: undefined, fallback: "fallback", interactive: true, ask }),
    ).resolves.toBe("answered");
    expect(ask).toHaveBeenCalledOnce();
  });

  it("falls back without asking when there is nobody to ask", async () => {
    const ask = vi.fn();

    await expect(
      resolve({ given: undefined, fallback: "fallback", interactive: false, ask }),
    ).resolves.toBe("fallback");
    expect(ask).not.toHaveBeenCalled();
  });
});
