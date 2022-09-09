#!/usr/bin/env node

import { create } from "./create";
import { install } from "./install";

function main() {
  const firstArgument = process.argv[2];

  switch (firstArgument) {
    case "--install":
      return install();
    default:
      return create();
  }
}

main();
