var _live_lib_base = function () {
  try {
    //Check from init lib
    if (!global.LiveLib) {
      global.LiveLib = {
        Version: 1.1
      };
    } else return true;

    global.LiveLib.____CREATE_MODULE = function (name) {
      return global.LiveLib[name] = {
        preInit: true,
        init: false,
        postInit: false,
        loaded: false,
        stackOfActions: [],
        postInitFunc: function (handler) {
          global.LiveLib[name].postInit = true;
          stacklen = global.LiveLib[name].stackOfActions.length;
          for (let i = 0; i < stacklen; i++) {
            if (typeof global.LiveLib[name].stackOfActions[i] === "function") {
              try {
                global.LiveLib[name].stackOfActions[i]();
              } catch (err) {
                if (err) {
                  if (handler) handler(err);
                  else throw err;
                }
              }
            }
          }
          global.LiveLib[name].stackOfActions = [];
          global.LiveLib[name].loaded = true;
        },
        createFunction: function (name_func, func, handler) {
          global.LiveLib.____CREATE_LIVE_MODULE_FUNCTION(name, name_func, func, handler);
        }
      }
    };

    global.LiveLib.____LOAD_LIVE_MODULE = function (name) {
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

    global.LiveLib.____CREATE_LIVE_MODULE_FUNCTION = function (name_module, name_func, func, handler = function (err) {
      console.log(err);
    }) {
      try {
        if (global.LiveLib[name_module]) {
          global.LiveLib[name_module][name_func] = function (...args) {
            if (!global.LiveLib[name_module].postInit) {
              global.LiveLib[name_module].stackOfActions.push(global.LiveLib[name_module][name_func](...args));
              return true;
            }
            else {
              try {
                return func(...args);
              } catch (err) {
                if (handler) handler(err);
              }
              return false;
            }
          }
        }
        return true;
      } catch (err) {
        console.log(err);
      }
      return false;
    };

    let obj = global.LiveLib.____CREATE_MODULE("base");
    obj.__CORE_ERROR = function (code, err) {
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

    obj.__CHECK_LIB = function (lib, load = true, start = false, ...args) {
      try {
        if (lib instanceof Array) {
          for (let obj of lib) {
            obj.__CHECK_LIB(obj, load, start, ...args);
          }
        } else if (obj["_lib_" + lib]) return true;
        else if (load) {
          if (start) {
            obj["_lib_" + lib] = require(lib)(...args);
          } else {
            obj["_lib_" + lib] = require(lib);
          }
          return true;
        }
        return false;
      } catch (err) {
        obj.__CORE_ERROR(11, err);
      }
    };

    obj.__GET_LIB = function (lib) {
      try {
        if (!obj["_lib_" + lib]) {
          obj.__CHECK_LIB(lib);
        }
        return obj["_lib_" + lib];
      } catch (err) {
        obj.__CORE_ERROR(12, err);
      }
    };

    obj.methodsname = {
      equals: "_live_equals",
      strongEquals: "_live_strong_equals",
      biggerOrEquals: "_live_bigger_or_equals",
      lessOrEquals: "_live_less_or_equals",
      less: "_live_less",
      bigger: "_live_bigger",
    };

    obj.method = [];

    obj.method["=="] = function (a, b, c) {
      return a == b || (a && a[obj.methodsname.equals] && a[obj.methodsname.equals](b)) || (!c && (b && b[obj.methodsname.equals] && b[obj.methodsname.equals](a)));
    };
    obj.method["==="] = function (a, b, c) {
      return a === b || (a && a[obj.methodsname.strongEquals] && a[obj.methodsname.strongEquals](b)) || (!c && (b && b[obj.methodsname.strongEquals] && b[obj.methodsname.strongEquals](a)));
    };
    obj.method[">="] = function (a, b, c) {
      return a >= b || (a && a[obj.methodsname.biggerOrEquals] && a[obj.methodsname.biggerOrEquals](b)) || (!c && obj.method["<="](b, a, true));
    };
    obj.method["<="] = function (a, b, c) {
      return a <= b || (a && a[obj.methodsname.lessOrEquals] && a[obj.methodsname.lessOrEquals](b)) || (!c && obj.method[">="](b, a, true));
    };
    obj.method["<"] = function (a, b) {
      return !obj.method[">="](a, b);
    };
    obj.method[">"] = function (a, b) {
      return !obj.method["<="](a, b);
    };

    Array.prototype.indexOfSort = function (data) {
      let start = 0,
        end = this.length - 1;
      if (data) {
        while (start < end) {
          let mid = start + Math.floor((end - start) / 2);
          if (obj.method[">="](this[mid], data)) end = mid;
          else start = mid + 1;
        }
        if (obj.method["==="](this[end], data)) return end;
      }
      return -1;
    };

    obj.____locationOf = function (element, array, start, end) {
      start = start || 0;
      end = end || array.length;
      var pivot = parseInt(start + (end - start) / 2, 10);
      if (obj.method["==="](array[pivot], element)) return pivot;
      if (end - start <= 1)
        return obj.method[">"](array[pivot], element) ? pivot - 1 : pivot;
      if (obj.method["<"](array[pivot], element)) {
        return obj.____locationOf(element, array, pivot, end);
      } else {
        return obj.____locationOf(element, array, start, pivot);
      }
    };


    Array.prototype.insertSort = function (data) {
      this.splice(obj.____locationOf(data, this) + 1, 0, data);
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

    obj.object = function () {
    };
    obj.object.prototype.toString = function () {
      return "[LIVe Object]";
    };
    obj.object.prototype.inspect = function () {
      return "LiveLib => object : " + this.toString();
    };

    obj.createClass = function (c1, c2) {
      obj.__GET_LIB("util").inherits(c1, c2 ? c2 : obj.object);
    };

    obj.__getIndexCallback = function (args) {
      if (args !== undefined && args != null && args instanceof Array)
        for (let i = 0; i < args.length; i++) {
          if (args[i] instanceof Function) return i;
        }
      return -1;
    };

    obj.__getCallback = function (args) {
      let l = obj.__getIndexCallback(args);
      return l > -1 ? args[l] : undefined;
    };

    obj.__cloneObject = function (object) {
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
        for (var i = 0, len = object.length; i < len; i++) {
          copy[i] = obj.__cloneObject(object[i]);
        }
        return copy;
      }

      // Handle Object
      if (object instanceof Object) {
        copy = {};
        for (let attr in object) {
          if (object.hasOwnProperty(attr)) copy[attr] = obj.__cloneObject(object[attr]);
        }
        return copy;
      }

      throw new Error("Unable to copy obj! Its type isn't supported.");
    };

    obj.createIfNotExists = function (...args) {
      try {
        let path = obj.__GET_LIB("path");
        let name = "";
        for (let obj of args) {
          name = path.join(name, obj);
        }
        let path0 = path.resolve(name);
        let parts = path0.split(path.sep);
        let fs = obj.__GET_LIB("fs");
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
        throw err;
      }
    };

    obj.createRandomString = function (length, chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", e) {
      try {
        if (length > 0 && chars && (typeof chars === "string" || chars instanceof String) && chars.length > 0) {
          let text = "";
          for (var i = 0; i < length; i++)
            text += chars.charAt(Math.floor(Math.random() * chars.length));
          return text;
        }
      } catch (err) {
        if (e) throw err;
        else obj.getLogger().errorm("Base", "createRandomString: ", err);
      }
      return false;
    };

    obj.postInitFunc(err => {
      obj.__CORE_ERROR(310, "Error on postInitFunction`s stack");
    });

    function ___prout(...args) {
      (console._log ? console._log : console.log)(...args);
    }

    process.on("exit", code => {
      if (code !== 0) obj.__CORE_ERROR(code, "EXIT ERROR");
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
      ___prout("uncaughtException %o", args);
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

    process.on('SIGINT', (...args) => {
      ___prout(obj.Style.style("bold"), obj.Style.frontColor("red"), "\nCTRL^C");
      process.exit(0);
    });

    return obj;
  } catch (err) {
    if (console._log) {
      console.log = console._log;
      console._log = undefined;
    }
    console.log(err);
  }
};

module.exports = _live_lib_base;
