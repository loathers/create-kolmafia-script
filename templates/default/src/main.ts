function main(): void {
  console.log("You have successfully built {{name}}!");
}

// This special export lets KoLmafia know where to start running your script from
module.exports.main = main;
