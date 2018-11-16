var live_lib = function (...args) {
  function __loadModule(module, ...args) {
    switch (module) {
      case "base":
        require("./LiveLib/live_lib_base")();
        if (args.length > 0)
          global.LiveLib._live_logger.name = args[0];
        break;
      case "db":
        require("./LiveLib/live_lib_db")(...args);
        break;
      case "permission":
        require("./LiveLib/live_lib_permission")();
        break;
      case "preference":
        require("./LiveLib/live_lib_preference")();
        break;
      case "net":
        require("./LiveLib/live_lib_net")();
        break;
      case "user_engine":
        require("./LiveLib/live_lib_user_engine")();
        break;
      default:
        return false;
    }
    return true;
  }

  for (let obj of args) {
    if (obj instanceof Array) {
      __loadModule(obj[0], ...obj.splice(1));
    } else __loadModule(obj);
  }
}

module.exports = live_lib;
