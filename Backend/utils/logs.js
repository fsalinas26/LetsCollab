// if you want to use this file, you have to npm install colors first
const colors = require("colors");

module.exports = {
  /**
   * @function {fatal}
   * @description logs an error message and then exist the program
   */
  fatal: (msg, code = 1) => {
    console.error(colors.bgRed("FATAL") + "::" + colors.red(msg));
    process.exit(code);
  },

  /**
   * @function {error}
   * @description logs a message of why an operation failed
   */
  error: (msg) => {
    console.error(colors.bgRed("ERROR") + "::" + colors.red(msg));
  },
  green: (msg) => {
    console.log(colors.bgGreen("** ") + "::" + colors.green(msg));
  },
  red: (msg) => {
    console.log(colors.bgRed("** ") + "::" + colors.red(msg));
  },    

  /**
   * @function {warn}
   * @description logs a message for when an operation went wrong but we were able to handle it
   */
  warn: (msg) => {
    console.warn(colors.bgYellow("WARN ") + "::" + colors.yellow(msg));
  },

  /**
   * @function {warn}
   * @description logs any successful operations
   */
  info: (msg) => {
    console.log(colors.bgBlue("INFO ") + "::" + colors.blue(msg));
  },

  /**
   * @function {debug}
   * @description logs all your random debugging
   */
  debug: (msg) => {
    console.debug(colors.bgWhite("DEBUG") + "::" + colors.white(msg));
  },
};
