let live_lib_arguments = function () {
  try {
    if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
    if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;

    let obj = global.LiveLib.arguments = {};
    let base = global.LiveLib.base;

    obj.argsIndex = function (args) {
      try {
        let ret = [];
        for (let i = 0; i < process.argv.length; i++) {
          let index = args.indexOf(process.argv[i]);
          if (index > -1) ret.push(i);
        }
        return ret;
      } catch (err) {
        base.__CORE_ERROR(5, err);
      }
      return [];
    };

    obj.haveArgs = function (args) {
      return obj.argsIndex(args).length > 0;
    };

    obj.getArg = function (arg, default_value) {
      try {
        let index = obj.argsIndex([arg]);
        if (index.length > 0) {
          if (index[0] < length && !process.argv[index[0] + 1].startWith("-")) return process.argv[index[0] + 1];
        }
        return default_value;
      } catch (err) {
        base.__CORE_ERROR(6, err);
      }
    };

    return obj;
  } catch (err) {
    global.LiveLib.base.__CORE_ERROR(7, err);
    return false;
  }
};

module.exports = live_lib_arguments;