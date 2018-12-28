let _live_lib_base = function () {
  try {
    //Check from init lib
    if (!global.LiveLib) {
      global.LiveLib = {
        Version: 1.2
      };
    } else return true;

    global.LiveLib.loadLiveModule = function (name) {
      try {
        if (global.LiveLib[name]) return global.LiveLib[name];
        else {
          return require("./live_lib_" + name)();
        }
      } catch (err) {
        console.log(err);
      }
      return false;
    };

    let base = global.LiveLib.base = {};

    base.__CORE_ERROR = function (code, err) {
      try {
        console.log("LiveLib: Error #" + code + ": ", err);
        return true;
      } catch (err) {
        if (console._log) {
          console._log("LiveLib: Error #" + code + ": %o", err);
          return true;
        } else throw err;
      }
    };

    base.getLib = function (lib, load = true, start = false, ...args) {
      try {
        if (lib instanceof Array) {
          let res = [];
          for (let i = 0; i < lib.length; i++) {
            res[i] = base.getLib(lib[i], load, start, ...args);
          }
          return res;
        } else if (base["__lib_" + lib])
          return base["__lib_" + lib];
        else if (load) {
          return base["__lib_" + lib] = start ? require(lib)(...args) : require(lib);
        }
      } catch (err) {
        base.__CORE_ERROR(1, err);
      }
      return false;
    };

    base.methodsname = {
      equals: "_live_equals",
      strongEquals: "_live_strong_equals",
      biggerOrEquals: "_live_bigger_or_equals",
      lessOrEquals: "_live_less_or_equals",
      less: "_live_less",
      bigger: "_live_bigger",
    };

    base.method = [];

    base.method["=="] = function (a, b, c) {
      // noinspection EqualityComparisonWithCoercionJS
      return a == b || (a && a[base.methodsname.equals] && a[base.methodsname.equals](b)) || (!c && (b && b[base.methodsname.equals] && b[base.methodsname.equals](a)));
    };
    base.method["==="] = function (a, b, c) {
      return a === b || (a && a[base.methodsname.strongEquals] && a[base.methodsname.strongEquals](b)) || (!c && (b && b[base.methodsname.strongEquals] && b[base.methodsname.strongEquals](a)));
    };
    base.method[">="] = function (a, b, c) {
      return a >= b || (a && a[base.methodsname.biggerOrEquals] && a[base.methodsname.biggerOrEquals](b)) || (!c && base.method["<="](b, a, true));
    };
    base.method["<="] = function (a, b, c) {
      return a <= b || (a && a[base.methodsname.lessOrEquals] && a[base.methodsname.lessOrEquals](b)) || (!c && base.method[">="](b, a, true));
    };
    base.method["<"] = function (a, b) {
      return !base.method[">="](a, b);
    };
    base.method[">"] = function (a, b) {
      return !base.method["<="](a, b);
    };

    Array.prototype.binarySearch = function (data) {
      let start = 0,
        end = this.length - 1;
      if (data) {
        while (start < end) {
          let mid = start + Math.floor((end - start) / 2);
          if (base.method[">="](this[mid], data)) end = mid;
          else start = mid + 1;
        }
        if (base.method["==="](this[end], data)) return end;
      }
      return -1;
    };

    Array.prototype.____locationOf = function (element, array, start, end) {
      start = start || 0;
      end = end || array.length;
      let pivot = parseInt(start + (end - start) / 2, 10);
      if (base.method["==="](array[pivot], element)) return pivot;
      if (end - start <= 1)
        return base.method[">"](array[pivot], element) ? pivot - 1 : pivot;
      if (base.method["<"](array[pivot], element)) {
        return base.____locationOf(element, array, pivot, end);
      } else {
        return base.____locationOf(element, array, start, pivot);
      }
    };


    Array.prototype.insertSort = function (data) {
      this.splice(this.____locationOf(data, this) + 1, 0, data);
    };

    Array.fromSet = function (set) {
      if (!set || !(set instanceof Set)) return [];
      let tmp = new Array(set.size);
      let index = 0;
      for (let obj of set) {
        tmp[index++] = obj;
      }
      return tmp;
    };

    Array.fromMap = function (map) {
      if (!map || !(map instanceof Map)) return [];
      let tmp = new Array(map.size);
      let index = 0;
      for (let obj of map) {
        tmp[index++] = obj;
      }
      return tmp;
    };

    Map.fromArray = function (array) {
      if (!array || !(array instanceof Array)) return new Map();
      let tmp = new Map();
      for (let [key, value] of array) {
        tmp.set(key, value);
      }
      return tmp;
    };



    //Parent for all class in LiveLib

    base.object = function () {
    };
    base.object.prototype.toString = function () {
      return "[LIVe Object]";
    };
    base.object.prototype.inspect = function () {
      return "LiveLib => object : " + this.toString();
    };

    base.createClass = function (c1, c2) {
      base.getLib("util").inherits(c1, c2 ? c2 : base.object);
    };

    base.getIndexCallback = function (args) {
      if (args !== undefined && args != null && args instanceof Array)
        for (let i = 0; i < args.length; i++) {
          if (args[i] instanceof Function) return i;
        }
      return -1;
    };

    base.getCallback = function (args) {
      let l = base.getIndexCallback(args);
      return l > -1 ? args[l] : undefined;
    };

    base.clone = function (object) {
      let copy;
      if (undefined === object || null == object || "object" !== typeof object) return object;

      // Handle Date
      if (object instanceof Date) {
        copy = new Date();
        copy.setTime(object.getTime());
        return copy;
      }

      // Handle Array
      if (object instanceof Array) {
        copy = [];
        for (let i = 0, len = object.length; i < len; i++) {
          copy[i] = base.clone(object[i]);
        }
        return copy;
      }

      // Handle Object
      if (object instanceof Object) {
        copy = {};
        for (let attr in object) {
          if (object.hasOwnProperty(attr)) copy[attr] = base.clone(object[attr]);
        }
        return copy;
      }

      base.__CORE_ERROR(2, "Unable to copy obj! Its type isn't supported.");
    };

    base.createIfNotExists = function (...args) {
      try {
        let path = base.getLib("path");
        let name = "";
        for (let obj of args) {
          name = path.join(name, obj);
        }
        let path0 = path.resolve(name);
        let parts = path0.split(path.sep);
        let fs = base.getLib("fs");
        for (let i = 1; i < parts.length; i++) {
          let local_path = "";
          for (let j = 1; j <= i; j++) {
            local_path += "/" + parts[j];
          }
          if (!fs.existsSync(local_path)) {
            fs.mkdirSync(local_path);
          }
        }
      } catch (err) {
        base.__CORE_ERROR(3, err);
      }
    };

    base.createRandomString = function (length, chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", e) {
      try {
        if (length > 0 && chars && (typeof chars === "string" || chars instanceof String) && chars.length > 0) {
          let text = "";
          for (let i = 0; i < length; i++)
            text += chars.charAt(Math.floor(Math.random() * chars.length));
          return text;
        }
      } catch (err) {
        if (e) throw err;
        else base.getLogger().errorm("Base", "createRandomString: ", err);
      }
      return false;
    };

    function ___prout(...args) {
      (console._log ? console._log : console.log)(...args);
    }

    process.on("exit", code => {
      if (code !== 0) base.__CORE_ERROR(code, "EXIT ERROR");
      process.exit(0);
    });

    process.on("beforeExit", (...args) => {
      ___prout("Before Exit %o", args);
    });

    process.on("disconnect", (...args) => {
      ___prout("disconnect %o", args);
    });

    process.on("message", (...args) => {
      ___prout("message %o", args);
    });

    process.on("multipleResolves", (...args) => {
      ___prout("multipleResolves %o", args);
      process.exit(0);
    });

    process.on("rejectionHandled", (...args) => {
      ___prout("rejectionHandled %o", args);
      process.exit(0);
    });

    process.on("uncaughtException", (...args) => {
      ___prout("uncaughtException %o", args[0]);
      process.exit(0);
    });

    process.on("unhandledRejection", (...args) => {
      ___prout("unhandledRejection %o", args);
      process.exit(0);
    });

    process.on("warning", (...args) => {
      ___prout("warning %o", args);
    });

    process.on("unhandledRejection", (...args) => {
      ___prout("unhandledRejection %o", args);
      process.exit(0);
    });

    //process.stdin.resume();

    process.on("SIGTERM", (...args) => {
      ___prout("SIGTERM", args);
      process.exit(0);
    });

    process.on('SIGINT', () => {
      ___prout("\nCTRL^C");
      process.exit(0);
    });

    process.stdin.setEncoding("utf8");
    process.stdin.on('end', () => {
      global.LiveLib.getLogger().debugm("Base", "process.stdin ended");
    });

    return base;
  } catch (err) {
    global.LiveLib.base.__CORE_ERROR(4, err);
  }
};

module.exports = _live_lib_base;
