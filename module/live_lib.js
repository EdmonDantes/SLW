let live_lib = function (...args) {
  function __loadModule(module, ...args) {
    switch (module) {
      case "base":
        return require("./LiveLib/live_lib_base")();
      case "database":
        return require("./LiveLib/live_lib_database")(...args);
      case "permission":
        return require("./LiveLib/live_lib_permission")();
      case "preference":
        return require("./LiveLib/live_lib_preference")();
      case "net":
        return require("./LiveLib/live_lib_net")();
      case "user_engine":
        return require("./LiveLib/live_lib_user_engine")(...args);
      case "logging":
        return require("./LiveLib/live_lib_logging")(...args);
      case "arguments":
        return require("./LiveLib/live_lib_arguments")(...args);
      default:
        return false;
    }
  }

  for (let obj of args) {
    if (obj instanceof Array) {
      __loadModule(obj[0], ...obj.splice(1));
    } else __loadModule(obj);
  }
};

module.exports = live_lib;
