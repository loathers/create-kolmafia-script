#!/usr/bin/env node

import { create } from "./create.js";
import { install } from "./install.js";

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
