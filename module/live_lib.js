let live_lib = async function (...args) {
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
      case "userEngine":
        return require("./LiveLib/live_lib_userEngine")(...args);
      case "logging":
        return require("./LiveLib/live_lib_logging")(...args);
      case "arguments":
        return require("./LiveLib/live_lib_arguments")(...args);
      case "photoEngine":
        return require("./LiveLib/live_lib_photoEngine")(...args);
      case "locale":
        return require("./LiveLib/live_lib_locale")(...args);
      case "engine":
        return require("./LiveLib/live_lib_engine")(...args);
      default:
        return false;
    }
  }

  promises = [];
  for (let obj of args) {

    promises.push(new Promise(resolve => {
      if (obj instanceof Array) {
        __loadModule(obj[0], ...obj.splice(1));
      } else return __loadModule(obj);
      resolve();
    }));
  }

  await Promise.all(promises);
};

module.exports = live_lib;
