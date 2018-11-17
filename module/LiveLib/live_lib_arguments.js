let live_lib_arguments = function () {
  try {
    if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
    if (!global.LiveLib || global.LiveLib.Version < 1.1) return false;

    let obj = global.LiveLib.____CREATE_MODULE("arguments");

    obj.argsIndex = function (args) {
      try {
        let ret = [];
        for (let i = 0; i < process.argv.length; i++) {
          let index = args.indexOf(process.argv[i]);
          if (index > -1) ret.push(i);
        }
        return ret;
      } catch (err) {
        global.LiveLib.base.__CORE_ERROR(1, err);
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
        global.LiveLib.base.__CORE_ERROR(2, err);
      }
    };

    obj.init = true;
    obj.postInitFunc(() => {
    });

    return obj;
  } catch (err) {
    global.LiveLib.base.__CORE_ERROR(43, err);
    return false;
  }
};

module.exports = live_lib_arguments;