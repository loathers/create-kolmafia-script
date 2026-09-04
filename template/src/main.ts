import { myName, print } from "kolmafia";

// Note: it is possible to call a script with multiple parameters, but usually the entire command
// line is a string with one parameter.
export function main(...args: string[]): void {
  print(`Welcome, ${myName()}!`);
  print("You have successfully built {{name}}!");
  if (args.length > 0) {
    const argsString = JSON.stringify(args);
    const argWord = args.length === 1 ? "argument" : "arguments";
    print(`You called the script with ${args.length} ${argWord}: ${argsString}`);
  }
}
