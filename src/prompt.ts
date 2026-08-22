import { cancel, isCI, isCancel, isTTY } from "@clack/prompts";

import { printWarning } from "./utils.js";

/**
 * Asking questions needs both somewhere to ask them and somebody to answer. A
 * prompt with no terminal behind it hangs rather than failing, so we would
 * rather take the defaults, and say so when that overrides what was asked for.
 */
export function decideInteractive({
  override,
  canPrompt,
  ci,
}: {
  override?: boolean;
  canPrompt: boolean;
  ci: boolean;
}) {
  if (override === false) return false;

  if (!canPrompt) {
    if (override) printWarning("No terminal to ask questions in; using defaults.");
    return false;
  }

  return override ?? !ci;
}

export function isInteractive(override?: boolean) {
  return decideInteractive({
    override,
    canPrompt: Boolean(process.stdin.isTTY) && isTTY(process.stdout),
    ci: isCI(),
  });
}

/**
 * Settle one answer: what was asked for on the command line wins, then the
 * question if there is anybody to answer it, and the default otherwise.
 */
export async function resolve<T>({
  given,
  fallback,
  interactive,
  ask,
}: {
  given: T | undefined;
  fallback: T;
  interactive: boolean;
  ask: () => Promise<T | symbol>;
}): Promise<T> {
  if (given !== undefined) return given;
  if (!interactive) return fallback;
  return stopIfCancelled(await ask());
}

/** Every prompt resolves to this sentinel when the user hits ctrl-c. */
export function stopIfCancelled<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Nothing was created.");
    process.exit(130);
  }
  return value;
}
