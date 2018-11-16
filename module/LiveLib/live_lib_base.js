var _live_lib_base = function () {
  try {
    //Check from init lib
    if (!global.LiveLib) {
      global.LiveLib = {
        init: false
      };
      global.LiveLib.base = {
        Version: "1.0"
      };
    } else return false;

    global.LiveLib.__CORE_ERROR = function (code, err) {
      try {
        console.log("LiveLib: Error #" + code + ": ", err);
        return true;
      } catch (err) {
        if (console._log) {
          console._log("LiveLib: Error #" + code + ": %o", err);
          return true;
        } else throw err;
      }
    }

    global.LiveLib.__CHECK_LIB = function (lib, load = true, start = false, ...args) {
      try {
        if (lib instanceof Array) {
          for (let obj of lib) {
            global.LiveLib.__CHECK_LIB(obj, load, start, ...args);
          }
        } else if (global.LiveLib["_lib_" + lib]) return true;
        else if (load) {
          if (start) {
            global.LiveLib["_lib_" + lib] = require(lib)(...args);
          } else {
            global.LiveLib["_lib_" + lib] = require(lib);
          }
          return true;
        }
        return false;
      } catch (err) {
        global.LiveLib.__CORE_ERROR(11, err);
      }
    }

    global.LiveLib.__GET_LIB = function (lib) {
      try {
        if (!global.LiveLib["_lib_" + lib]) {
          global.LiveLib.__CHECK_LIB(lib);
        }
        return global.LiveLib["_lib_" + lib];
      } catch (err) {
        global.LiveLib.__CORE_ERROR(12, err);
      }
    }

    global.LiveLib.argsIndex = function (args) {
      try {
        let ret = [];
        for (let i = 0; i < process.argv.length; i++) {
          let index = args.indexOf(process.argv[i]);
          if (index > -1) ret.push(i);
        }
        return ret;
      } catch (err) {
        global.LiveLib.__CORE_ERROR(1, err);
      }
      return [];
    }

    global.LiveLib.haveArgs = function (args) {
      return global.LiveLib.argsIndex(args).length > 0;
    }

    global.LiveLib.getArg = function (arg, default_value) {
      try {
        let index = _live_argsIndex([arg]);
        if (index.length > 0) {
          if (index[0] < length && !process.argv[index[0] + 1].startWith("-")) return process.argv[index[0] + 1];
        }
        return default_value;
      } catch (err) {
        global.LiveLib.__CORE_ERROR(2, err);
      }
    }

    global.LiveLib.methodsname = {
      equals: "_live_equals",
      strongEquals: "_live_strong_equals",
      biggerOrEquals: "_live_bigger_or_equals",
      lessOrEquals: "_live_less_or_equals",
      less: "_live_less",
      bigger: "_live_bigger",
    }

    global.LiveLib.method = [];

    global.LiveLib.method["=="] = function (a, b, c) {
      return a == b || (a && a[global.LiveLib.methodsname.equals] && a[global.LiveLib.methodsname.equals](b)) || (!c && (b && b[global.LiveLib.methodsname.equals] && b[global.LiveLib.methodsname.equals](a)));
    }
    global.LiveLib.method["==="] = function (a, b, c) {
      return a === b || (a && a[global.LiveLib.methodsname.strongEquals] && a[global.LiveLib.methodsname.strongEquals](b)) || (!c && (b && b[global.LiveLib.methodsname.strongEquals] && b[global.LiveLib.methodsname.strongEquals](a)));
    }
    global.LiveLib.method[">="] = function (a, b, c) {
      return a >= b || (a && a[global.LiveLib.methodsname.biggerOrEquals] && a[global.LiveLib.methodsname.biggerOrEquals](b)) || (!c && global.LiveLib.method["<="](b, a, true));
    }
    global.LiveLib.method["<="] = function (a, b, c) {
      return a <= b || (a && a[global.LiveLib.methodsname.lessOrEquals] && a[global.LiveLib.methodsname.lessOrEquals](b)) || (!c && global.LiveLib.method[">="](b, a, true));
    }
    global.LiveLib.method["<"] = function (a, b) {
      return !global.LiveLib.method[">="](a, b);
    }
    global.LiveLib.method[">"] = function (a, b) {
      return !global.LiveLib.method["<="](a, b);
    }

    Array.prototype.indexOfSort = function (data) {
      let start = 0,
        end = this.length - 1;
      if (data) {
        while (start < end) {
          let mid = start + Math.floor((end - start) / 2);
          if (global.LiveLib.method[">="](this[mid], data)) end = mid;
          else start = mid + 1;
        }
        if (global.LiveLib.method["==="](this[end], data)) return end;
      }
      return -1;
    }

    global.LiveLib.__locationOf = function (element, array, start, end) {
      start = start || 0;
      end = end || array.length;
      var pivot = parseInt(start + (end - start) / 2, 10);
      if (global.LiveLib.method["==="](array[pivot], element)) return pivot;
      if (end - start <= 1)
        return global.LiveLib.method[">"](array[pivot], element) ? pivot - 1 : pivot;
      if (global.LiveLib.method["<"](array[pivot], element)) {
        return global.LiveLib.__locationOf(element, array, pivot, end);
      } else {
        return global.LiveLib.__locationOf(element, array, start, pivot);
      }
    }


    Array.prototype.insertSort = function (data) {
      this.splice(global.LiveLib.__locationOf(data, this) + 1, 0, data);
    }

    Array.fromSet = function (set) {
      if (!set) return [];
      let tmp = new Array(set.size);
      let index = 0;
      for (let obj of set) {
        tmp[index++] = obj;
      }
      return tmp;
    }

    global.LiveLib.__ESC = "\x1b[";

    //Parent for all class in LiveLib

    global.LiveLib.object = function () {
    }
    global.LiveLib.object.prototype.toString = function () {
      return "[LIVe Object]";
    }
    global.LiveLib.object.prototype.inspect = function () {
      return "LiveLib => object : " + this.toString();
    }

    global.LiveLib.createClass = function (c1, c2) {
      global.LiveLib.__GET_LIB("util").inherits(c1, c2 ? c2 : global.LiveLib.object);
    }

    //Style class

    global.LiveLib.Style = function (style, color, backcolor) {
      this.style = style;
      this.color = color;
      this.backcolor = backcolor;
    }

    global.LiveLib.createClass(global.LiveLib.Style);

    global.LiveLib.Style.prototype.get = function (e) {
      try {
        let ret = "";
        if (this.style != undefined && this.style != null) {
          if (this.style instanceof Array) {
            for (let obj of this.style) {
              ret += global.LiveLib.__ESC + obj + "m";
            }
          } else ret += global.LiveLib.__ESC + this.style + "m";
        }
        if (this.color != undefined && this.color != null) {
          if (this.color instanceof Array) {
            ret += global.LiveLib.__ESC + "38;2;" + this.color[0] + ";" + this.color[1] + ";" + this.color[2] + "m";
          } else ret += global.LiveLib.__ESC + "38;5;" + this.color + "m";
        }
        if (this.backcolor != undefined && this.backcolor != null) {
          if (this.backcolor instanceof Array) {
            ret += global.LiveLib.__ESC + "48;2;" + this.backcolor[0] + ";" + this.backcolor[1] + ";" + this.backcolor[2] + "m";
          } else ret += global.LiveLib.__ESC + "48;5;" + this.backcolor + "m";
        }
        return ret;
      } catch (err) {
        if (e) throw err;
        else {
          global.LiveLib.__CORE_ERROR(3, err);
        }
      }
      return null;
    }

    global.LiveLib.Style.style = function (style, e) {
      try {
        if (typeof style === "string" || style instanceof String) {
          let ret = 0;
          switch (style.toLowerCase()) {
            case "bold":
            case "br":
              ret = 1;
              break;
            case "faint":
            case "dim":
              ret = 2;
              break;
            case "italic":
            case "it":
              ret = 3;
              break;
            case "underline":
            case "line":
              ret = 4;
              break;
            case "blink":
              ret = 5;
              break;
            case "reverse":
              ret = 7;
              break;
            case "invisible":
            case "inv":
              ret = 8;
              break;
            case "crossline":
            case "cline":
              ret = 9;
              break;
            case "doubleline":
            case "dline":
              ret = 21;
              break;
            case "overline":
            case "oline":
              ret = 53;
              break;
          }
          return new global.LiveLib.Style(ret);
        }
        return new global.LiveLib.Style(style);
      } catch (err) {
        if (e) throw err;
        else {
          global.LiveLib.__CORE_ERROR(4, err);
        }
      }
      return null;
    }

    global.LiveLib.Style.RGBfromString = function (color) {
      let ret = [0xff, 0xff, 0xff];
      switch (color.toLowerCase()) {
        case "black":
          ret = [0, 0, 0];
          break;
        case "red":
          ret = [0x80, 0, 0];
          break;
        case "green":
          ret = [0, 0x80, 0];
          break;
        case "yellow":
          ret = [0x80, 0x80, 0];
          break;
        case "blue":
          ret = [0, 0, 0x80];
          break;
        case "magenta":
          ret = [0x80, 0, 0x80];
          break;
        case "cyan":
          ret = [0, 0x80, 0x80];
          break;
        case "while":
          ret = [0xc0, 0xc0, 0xc0];
          break;
        case "br_black":
          ret = [0x80, 0x80, 0x80];
          break;
        case "br_red":
          ret = [0xff, 0, 0];
          break;
        case "br_green":
          ret = [0, 0xff, 0];
          break;
        case "br_yellow":
          ret = [0xff, 0xff, 0];
          break;
        case "br_blue":
          ret = [0, 0, 0xff];
          break;
        case "br_magenta":
          ret = [0xff, 0, 0xff];
          break;
        case "br_cyan":
          ret = [0, 0xff, 0xff];
          break;
        case "br_while":
          ret = [0xff, 0xff, 0xff];
          break;
      }
      return ret;
    }

    global.LiveLib.Style.frontColor = function (color_or_r, g, b, e) {
      try {
        if (typeof color_or_r === "string" || color_or_r instanceof String) {
          return new global.LiveLib.Style(null, this.RGBfromString(color_or_r), null);
        } else {
          if (g !== undefined && g != null && b !== undefined && b != null) return new global.LiveLib.Style(null, [color_or_r, g, b], null);
          else return new global.LiveLib.Style(null, color_or_r, null);
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.__CORE_ERROR(5, err);
      }
      return null;
    }

    global.LiveLib.Style.backColor = function (color_or_r, g, b, e) {
      try {
        if (typeof color_or_r === "string" || color_or_r instanceof String) {
          return new global.LiveLib.Style(null, null, this.RGBfromString(color_or_r));
        } else {
          if (g !== undefined && g != null && b !== undefined && b != null) return new global.LiveLib.Style(null, null, [color_or_r, g, b]);
          else return new global.LiveLib.Style(null, null, color_or_r);
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.__CORE_ERROR(6, err);
      }
      return null;
    }

    global.LiveLib.Style.getRGBFromHex = function (color, e) {
      try {
        if (color[0] === "#") color = "0x" + color.substr(1);
        let r, g, b;
        r = color >> 8 >> 8;
        g = (color >> 8) % 0x100;
        b = color % 0x100;
        return [r, g, b];
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.__CORE_ERROR(7, err);
      }
      return false;
    }

    global.LiveLib.Style.frontColorHex = function (color, e) {
      try {
        if (typeof color === "string" || color instanceof String || typeof color === "number" || color instanceof Number) {
          let tmp = this.getRGBFromHex(color, true);
          return new global.LiveLib.Style(null, tmp, null);
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.__CORE_ERROR(8, err);
      }
      return null;
    }

    global.LiveLib.Style.backColorHex = function (color, e) {
      try {
        if (typeof color === "string" || color instanceof String || typeof color === "number" || color instanceof Number) {
          let tmp = this.getRGBFromHex(color, true);
          return new global.LiveLib.Style(null, null, tmp);
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.__CORE_ERROR(9, err);
      }
      return null;
    }

    global.LiveLib.Style.prototype[global.LiveLib.methodsname._live_bigger_or_equals] = function (obj) {
      let tmp0 = true;
      let tmp1 = true;
      let tmp2 = true;
      if (this.color instanceof Array && obj.color instanceof Array) {
        for (let i = 0; i < 3; i++) {
          if (this.color[i] < obj.color[i]) return false;
        }
      } else tmp0 = this.color >= obj.color;

      if (this.backcolor instanceof Array && obj.color instanceof Array) {
        for (let i = 0; i < 3; i++) {
          if (this.backcolor[i] < obj.backcolor[i]) return false;
        }
      } else tmp1 = this.backcolor >= obj.backcolor;

      if (this.style instanceof Array && obj.style instanceof Array) {
        if (this.style.lenght < obj.style.length) return false;
        else {
          for (let i = 0; i < obj.style.length; i++) {
            if (this.style[i] < obj.style[i]) return false;
          }
        }
      } else tmp2 = this.style >= obj.style;

      return tmp0 && tmp1 && tmp2;
    }
    global.LiveLib.Style.prototype[global.LiveLib.methodsname._live_strong_equals] = function (obj) {
      let tmp0 = true;
      let tmp1 = true;
      let tmp2 = true;
      if (this.color instanceof Array && obj.color instanceof Array) {
        for (let i = 0; i < 3; i++) {
          if (this.color[i] !== obj.color[i]) return false;
        }
      } else tmp0 = this.color === obj.color;

      if (this.backcolor instanceof Array && obj.color instanceof Array) {
        for (let i = 0; i < 3; i++) {
          if (this.backcolor[i] !== obj.backcolor[i]) return false;
        }
      } else tmp1 = this.backcolor === obj.backcolor;

      if (this.style instanceof Array && obj.style instanceof Array) {
        if (this.style.lenght !== obj.style.length) return false;
        else {
          for (let i = 0; i < obj.style.length; i++) {
            if (this.style[i] !== obj.style[i]) return false;
          }
        }
      } else tmp2 = this.style === obj.style;

      return tmp0 && tmp1 && tmp2;
    }

    global.LiveLib.Style.prototype[global.LiveLib.methodsname._live_less_or_equals] = function (obj) {
      let tmp0 = true;
      let tmp1 = true;
      let tmp2 = true;
      if (this.color instanceof Array && obj.color instanceof Array) {
        for (let i = 0; i < 3; i++) {
          if (this.color[i] > obj.color[i]) return false;
        }
      } else tmp0 = this.color <= obj.color;

      if (this.backcolor instanceof Array && obj.color instanceof Array) {
        for (let i = 0; i < 3; i++) {
          if (this.backcolor[i] > obj.backcolor[i]) return false;
        }
      } else tmp1 = this.backcolor <= obj.backcolor;

      if (this.style instanceof Array && obj.style instanceof Array) {
        if (this.style.lenght > obj.style.length) return false;
        else {
          for (let i = 0; i < obj.style.length; i++) {
            if (this.style[i] > obj.style[i]) return false;
          }
        }
      } else tmp2 = this.style <= obj.style;

      return tmp0 && tmp1 && tmp2;
    }

    global.LiveLib.Style.prototype.toString = function () {
      return JSON.stringify(this, null, 2);
    }


    //Logger class

    global.LiveLib.Logger = function (name) {
      this.name = name || "LiveLib";
      this.consoles = [console];
      this.objectFormat = {
        showHidden: false,
        depth: null,
        colors: true,
        customInspect: true,
        showProxy: false,
        maxArrayLenght: 200,
        breakLength: 80,
        compact: true,
        sorted: true
      }
      this.level = 3;
    }

    global.LiveLib.createClass(global.LiveLib.Logger);

    global.LiveLib.Logger.prototype.log = function (...args) {
      let text = "";
      let styles = [];
      let Style = global.LiveLib.Style;
      for (let obj of args) {
        if (obj !== undefined && obj != null) {
          if (obj instanceof Style) {
            let tmp = obj.get();
            if (tmp.indexOf("\x1b[0m") > -1) styles = [];
            styles.insertSort(obj);
            text += tmp;
          } else if (typeof obj === "number" || typeof obj === "string" || typeof obj === "symbol" || obj instanceof Number || obj instanceof String || obj instanceof Symbol) {
            text += obj;
          } else if (typeof obj === "boolean" || obj instanceof Boolean) {
            text += obj ? "true" : "false";
          } else if (typeof obj === "object" || obj instanceof Object) {
            if (this.objectFormat.colors) text += new Style(0).get();
            text += global.LiveLib.__GET_LIB("util").inspect(obj, this.objectFormat);
            if (this.objectFormat.colors)
              for (let tmp of styles) {
                text += tmp.get();
              }
          }
        }
      }
      text += new Style(0).get();
      for (let con of this.consoles) {
        if (con._log) con._log(text);
        else con.log(text);
      }
    }

    global.LiveLib.Logger.prototype.isTrace = function () {
      return this.level <= 1;
    };
    global.LiveLib.Logger.prototype.isDebug = function () {
      return this.level <= 2;
    };
    global.LiveLib.Logger.prototype.isInfo = function () {
      return this.level <= 3;
    };
    global.LiveLib.Logger.prototype.isWarn = function () {
      return this.level <= 4;
    };
    global.LiveLib.Logger.prototype.isError = function () {
      return this.level <= 5;
    };
    global.LiveLib.Logger.prototype.isFatal = function () {
      return this.level <= 6;
    };
    global.LiveLib.Logger.prototype.getLevel = function () {
      if (this.isTrace()) return "trace";
      if (this.isDebug()) return "debug";
      if (this.isInfo()) return "info";
      if (this.isWarn()) return "warn";
      if (this.isError()) return "error";
      if (this.isFatal()) return "fatal";
      else return "none";
    }
    global.LiveLib.Logger.prototype.setLevel = function (level, e) {
      try {
        if (typeof level === "string" || level instanceof String) {
          switch (level.toLowerCase()) {
            case "trace":
              this.level = 1;
              break;
            case "debug":
              this.level = 2;
              break;
            case "info":
              this.level = 3;
              break;
            case "warn":
              this.level = 4;
              break;
            case "error":
              this.level = 5;
              break;
            case "fatal":
              this.level = 6;
              break;
            case "none":
              this.level = 7;
              break;
          }
          return true;
        } else if (typeof level === "number" || level instanceof Number) {
          this.level = level;
          return true;
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.__CORE_ERROR(10, err);
      }
    }

    global.LiveLib.Logger.prototype.trace = function (...args) {
      if (this.isTrace() && args.length > 0)
        this.log(global.LiveLib.Style.frontColorHex(0x6495ED), "[TRACE] [", new Date().toISOString(), "] - ", this.name, ": ", ...args);
    };
    global.LiveLib.Logger.prototype.verbose = this.trace;

    global.LiveLib.Logger.prototype.debug = function (...args) {
      if (this.isDebug() && args.length > 0)
        this.log(global.LiveLib.Style.frontColor("br_cyan"), "[DEBUG] [", new Date().toISOString(), "] - ", this.name, ": ", ...args);
    };
    global.LiveLib.Logger.prototype.info = function (...args) {
      if (this.isInfo() && args.length > 0)
        this.log(global.LiveLib.Style.frontColorHex(0x20B900), "[INFO] [", new Date().toISOString(), "] - ", this.name, ": ", ...args);
    };
    global.LiveLib.Logger.prototype.warn = function (...args) {
      if (this.isWarn() && args.length > 0)
        this.log(global.LiveLib.Style.frontColorHex(0xFFC800), "[WARN] [", new Date().toISOString(), "] - ", this.name, ": ", ...args);
    };
    global.LiveLib.Logger.prototype.error = function (...args) {
      if (this.isError() && args.length > 0)
        this.log(global.LiveLib.Style.frontColorHex(0xE32636), "[ERROR] [", new Date().toISOString(), "] - ", this.name, ": ", ...args);
    };
    global.LiveLib.Logger.prototype.fatal = function (...args) {
      if (this.isFatal() && args.length > 0)
        this.log(global.LiveLib.Style.frontColor("br_magenta"), "[FATAL] [", new Date().toISOString(), "] - ", this.name, ": ", ...args);
    };


    global.LiveLib.Logger.prototype.tracem = function (module, ...args) {
      this.trace("LiveLib --> Module \"" + module + "\": ", ...args);
    };
    global.LiveLib.Logger.prototype.verbosem = this.tracem;
    global.LiveLib.Logger.prototype.debugm = function (module, ...args) {
      this.debug("LiveLib --> Module \"" + module + "\": ", ...args);
    };
    global.LiveLib.Logger.prototype.infom = function (module, ...args) {
      this.info("LiveLib --> Module \"" + module + "\": ", ...args);
    };
    global.LiveLib.Logger.prototype.warnm = function (module, ...args) {
      this.warn("LiveLib --> Module \"" + module + "\": ", ...args);
    };
    global.LiveLib.Logger.prototype.errorm = function (module, ...args) {
      this.error("LiveLib --> Module \"" + module + "\": ", ...args);
    };
    global.LiveLib.Logger.prototype.fatalm = function (module, ...args) {
      this.fatal("LiveLib --> Module \"" + module + "\": ", ...args);
    };

    global.LiveLib.Logger.prototype.toString = function () {
      return JSON.stringify(this, null, 2);
    }


    //Create logger
    global.LiveLib._live_logger = new global.LiveLib.Logger("LiveLib");

    global.LiveLib.getLogger = () => {
      return global.LiveLib._live_logger;
    }

    let __verbose = global.LiveLib.haveArgs(["-v", "-t", "--verbose", "--trace"]);
    let __debug = __verbose || global.LiveLib.haveArgs(["-d", "--debug"]);
    let __info = __debug || global.LiveLib.haveArgs(["-i", "--info"]) || !global.LiveLib.haveArgs(["-w", "-e", "--warn", "--error", "--fatal", "--none"]);
    let __warn = __info || global.LiveLib.haveArgs(["-w", "--warn"]);
    let __error = __warn || global.LiveLib.haveArgs(["-e", "--error"]);
    let __fatal = __error || global.LiveLib.haveArgs(["--fatal"]);

    global.LiveLib._live_logger.setLevel(7 - __verbose - __debug - __info - __warn - __error - __fatal);

    console._log = console.log;
    console.log = function (...args) {
      global.LiveLib._live_logger.log(...args);
    };
    console.error = function (...args) {
      global.LiveLib._live_logger.error(...args);
    }

    let _live_to_file = global.LiveLib.argsIndex(["-f", "-l", "--file", "--log"]);
    for (let obj of _live_to_file) {
      try {
        global.LiveLib._live_logger.consoles.push(new console.Console(global.LiveLib.__GET_LIB("fs").createWriteStream(process.argv[obj + 1], {
          flags: "a"
        })));
      } catch (err) {

      }
    }

    global.LiveLib.__getIndexCallback = function (args) {
      if (args !== undefined && args != null && args instanceof Array)
        for (let i = 0; i < args.length; i++) {
          if (args[i] instanceof Function) return i;
        }
      return -1;
    }

    global.LiveLib.__getCallback = function (args) {
      let l = global.LiveLib.__getIndexCallback(args);
      return l > -1 ? args[l] : undefined;
    }

    global.LiveLib.__cloneObject = function (object) {
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
          copy[i] = global.LiveLib.__cloneObject(object[i]);
        }
        return copy;
      }

      // Handle Object
      if (object instanceof Object) {
        copy = {};
        for (let attr in object) {
          if (object.hasOwnProperty(attr)) copy[attr] = global.LiveLib.__cloneObject(object[attr]);
        }
        return copy;
      }

      throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    global.LiveLib.createIfNotExists = function (...args) {
      try {
        let path = global.LiveLib.__GET_LIB("path");
        let name = "";
        for (let obj of args) {
          name = path.join(name, obj);
        }
        let path0 = path.resolve(name);
        let parts = path0.split(path.sep);
        let fs = global.LiveLib.__GET_LIB("fs");
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
    }

    global.LiveLib.createRandomString = function (length, chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", e) {
      try {
        if (length > 0 && chars && (typeof chars === "string" || chars instanceof String) && chars.length > 0) {
          let text = "";
          for (var i = 0; i < length; i++)
            text += chars.charAt(Math.floor(Math.random() * chars.length));
          return text;
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().errorm("Base", "createRandomString: ", err);
      }
      return false;
    }

    process.on("exit", code => {
      if (code !== 0) global.LiveLib.__CORE_ERROR(code, "EXIT ERROR");
      process.exit(0);
    });

    process.on("beforeExit", (...args) => {
      console._log("Before Exit %o", args);
    });

    process.on("disconnect", (...args) => {
      console._log("disconnect %o", args);
    });

    process.on("message", (...args) => {
      console._log("message %o", args);
    });

    process.on("multipleResolves", (...args) => {
      console._log("multipleResolves %o", args);
      process.exit(0);
    });

    process.on("rejectionHandled", (...args) => {
      console._log("rejectionHandled %o", args);
      process.exit(0);
    });

    process.on("uncaughtException", (...args) => {
      console._log("uncaughtException %o", args);
      process.exit(0);
    });

    process.on("unhandledRejection", (...args) => {
      console._log("unhandledRejection %o", args);
      process.exit(0);
    });

    process.on("warning", (...args) => {
      console._log("warning %o", args);
    });

    process.on("unhandledRejection", (...args) => {
      console._log("unhandledRejection %o", args);
      process.exit(0);
    });

    process.stdin.resume();

    process.on("SIGTERM", (...args) => {
      console.log("SIGTERM", args);
      process.exit(0);
    });

    process.on('SIGINT', (...args) => {
      console.log(global.LiveLib.Style.style("bold"), global.LiveLib.Style.frontColor("red"), "\nCTRL^C");
      process.exit(0);
    });

    global.LiveLib.init = true;
    global.LiveLib._live_logger.info("LiveLib: Module \"Base\" loaded");
    return global.LiveLib;
  } catch (err) {
    if (console._log) {
      console.log = console._log;
      console._log = undefined;
    }
    console.log(err);
  }
}

module.exports = _live_lib_base
