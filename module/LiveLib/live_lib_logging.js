let live_lib_logging = function (name) {
  if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
  if (!global.LiveLib || global.LiveLib.Version < 1.1) return false;

  let base = global.LiveLib.base;
  let arguments = global.LiveLib.____LOAD_LIVE_MODULE("arguments");


  let obj = global.LiveLib.____CREATE_MODULE("logging");
  obj.__ESC = "\x1b[";

  //Style class

  obj.Style = function (style, color, backcolor) {
    this.style = style;
    this.color = color;
    this.backcolor = backcolor;
  };

  base.createClass(obj.Style);

  obj.Style.prototype.get = function (e) {
    try {
      let ret = "";
      if (this.style !== undefined && this.style != null) {
        if (this.style instanceof Array) {
          for (let obj of this.style) {
            ret += obj.__ESC + obj + "m";
          }
        } else ret += obj.__ESC + this.style + "m";
      }
      if (this.color !== undefined && this.color != null) {
        if (this.color instanceof Array) {
          ret += obj.__ESC + "38;2;" + this.color[0] + ";" + this.color[1] + ";" + this.color[2] + "m";
        } else ret += obj.__ESC + "38;5;" + this.color + "m";
      }
      if (this.backcolor !== undefined && this.backcolor != null) {
        if (this.backcolor instanceof Array) {
          ret += obj.__ESC + "48;2;" + this.backcolor[0] + ";" + this.backcolor[1] + ";" + this.backcolor[2] + "m";
        } else ret += obj.__ESC + "48;5;" + this.backcolor + "m";
      }
      return ret;
    } catch (err) {
      if (e) throw err;
      else {
        base.__CORE_ERROR(3, err);
      }
    }
    return null;
  };

  obj.Style.style = function (style, e) {
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
        return new obj.Style(ret);
      }
      return new obj.Style(style);
    } catch (err) {
      if (e) throw err;
      else {
        base.__CORE_ERROR(4, err);
      }
    }
    return null;
  };

  obj.Style.RGBFromString = function (color) {
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
  };

  obj.Style.frontColor = function (color_or_r, g, b, e) {
    try {
      if (typeof color_or_r === "string" || color_or_r instanceof String) {
        return new obj.Style(null, obj.Style.RGBfromString(color_or_r), null);
      } else {
        if (g !== undefined && g != null && b !== undefined && b != null) return new obj.Style(null, [color_or_r, g, b], null);
        else return new obj.Style(null, color_or_r, null);
      }
    } catch (err) {
      if (e) throw err;
      else base.__CORE_ERROR(5, err);
    }
    return null;
  };

  obj.Style.backColor = function (color_or_r, g, b, e) {
    try {
      if (typeof color_or_r === "string" || color_or_r instanceof String) {
        return new obj.Style(null, null, obj.Style.RGBfromString(color_or_r));
      } else {
        if (g !== undefined && g != null && b !== undefined && b != null) return new obj.Style(null, null, [color_or_r, g, b]);
        else return new obj.Style(null, null, color_or_r);
      }
    } catch (err) {
      if (e) throw err;
      else base.__CORE_ERROR(6, err);
    }
    return null;
  };

  obj.Style.getRGBFromHex = function (color, e) {
    try {
      if (color[0] === "#") color = "0x" + color.substr(1);
      let r, g, b;
      r = color >> 8 >> 8;
      g = (color >> 8) % 0x100;
      b = color % 0x100;
      return [r, g, b];
    } catch (err) {
      if (e) throw err;
      else base.__CORE_ERROR(7, err);
    }
    return false;
  };

  obj.Style.frontColorHex = function (color, e) {
    try {
      if (typeof color === "string" || color instanceof String || typeof color === "number" || color instanceof Number) {
        let tmp = obj.Style.getRGBFromHex(color, true);
        return new obj.Style(null, tmp, null);
      }
    } catch (err) {
      if (e) throw err;
      else base.__CORE_ERROR(8, err);
    }
    return null;
  };

  obj.Style.backColorHex = function (color, e) {
    try {
      if (typeof color === "string" || color instanceof String || typeof color === "number" || color instanceof Number) {
        let tmp = obj.Style.getRGBFromHex(color, true);
        return new obj.Style(null, null, tmp);
      }
    } catch (err) {
      if (e) throw err;
      else base.__CORE_ERROR(9, err);
    }
    return null;
  };

  obj.Style.prototype[base.methodsname._live_bigger_or_equals] = function (obj) {
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
  };

  obj.Style.prototype[base.methodsname._live_strong_equals] = function (obj) {
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
  };

  obj.Style.prototype[base.methodsname._live_less_or_equals] = function (obj) {
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
  };

  obj.Style.prototype.toString = function () {
    return JSON.stringify(this, null, 2);
  };


  //Logger class

  obj.Logger = function (name) {
    this.name = name || "LiveLib";
    this.consoles = [console];
    this.objectFormat = {
      showHidden: false,
      depth: null,
      colors: true,
      customInspect: true,
      showProxy: false,
      maxArrayLength: 200,
      breakLength: 80,
      compact: true,
      sorted: true
    };
    this.level = 3;
  };

  base.createClass(obj.Logger);

  obj.Logger.prototype.log = function (...args) {
    let text = "";
    let styles = [];
    let Style = obj.Style;
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
          text += base.__GET_LIB("util").inspect(obj, this.objectFormat);
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
  };

  obj.Logger.prototype.isTrace = function () {
    return this.level <= 1;
  };
  obj.Logger.prototype.isDebug = function () {
    return this.level <= 2;
  };
  obj.Logger.prototype.isInfo = function () {
    return this.level <= 3;
  };
  obj.Logger.prototype.isWarn = function () {
    return this.level <= 4;
  };
  obj.Logger.prototype.isError = function () {
    return this.level <= 5;
  };
  obj.Logger.prototype.isFatal = function () {
    return this.level <= 6;
  };
  obj.Logger.prototype.getLevel = function () {
    if (this.isTrace()) return "trace";
    if (this.isDebug()) return "debug";
    if (this.isInfo()) return "info";
    if (this.isWarn()) return "warn";
    if (this.isError()) return "error";
    if (this.isFatal()) return "fatal";
    else return "none";
  };

  obj.Logger.prototype.setLevel = function (level, e) {
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
      else base.__CORE_ERROR(10, err);
    }
  };

  obj.Logger.prototype.trace = function (...args) {
    if (this.isTrace() && args.length > 0)
      this.log(obj.Style.frontColorHex(0x6495ED), "[TRACE] [", new Date().toISOString(), "] - ", this.name, ": ", ...args);
  };
  obj.Logger.prototype.verbose = obj.Logger.prototype.trace;

  obj.Logger.prototype.debug = function (...args) {
    if (this.isDebug() && args.length > 0)
      this.log(obj.Style.frontColor("br_cyan"), "[DEBUG] [", new Date().toISOString(), "] - ", this.name, ": ", ...args);
  };
  obj.Logger.prototype.info = function (...args) {
    if (this.isInfo() && args.length > 0)
      this.log(obj.Style.frontColorHex(0x20B900), "[INFO] [", new Date().toISOString(), "] - ", this.name, ": ", ...args);
  };
  obj.Logger.prototype.warn = function (...args) {
    if (this.isWarn() && args.length > 0)
      this.log(obj.Style.frontColorHex(0xFFC800), "[WARN] [", new Date().toISOString(), "] - ", this.name, ": ", ...args);
  };
  obj.Logger.prototype.error = function (...args) {
    if (this.isError() && args.length > 0)
      this.log(obj.Style.frontColorHex(0xE32636), "[ERROR] [", new Date().toISOString(), "] - ", this.name, ": ", ...args);
  };
  obj.Logger.prototype.fatal = function (...args) {
    if (this.isFatal() && args.length > 0)
      this.log(obj.Style.frontColor("br_magenta"), "[FATAL] [", new Date().toISOString(), "] - ", this.name, ": ", ...args);
  };


  obj.Logger.prototype.tracem = function (module, ...args) {
    this.trace("LiveLib --> Module \"" + module + "\": ", ...args);
  };
  obj.Logger.prototype.verbosem = obj.Logger.prototype.tracem;
  obj.Logger.prototype.debugm = function (module, ...args) {
    this.debug("LiveLib --> Module \"" + module + "\": ", ...args);
  };
  obj.Logger.prototype.infom = function (module, ...args) {
    this.info("LiveLib --> Module \"" + module + "\": ", ...args);
  };
  obj.Logger.prototype.warnm = function (module, ...args) {
    this.warn("LiveLib --> Module \"" + module + "\": ", ...args);
  };
  obj.Logger.prototype.errorm = function (module, ...args) {
    this.error("LiveLib --> Module \"" + module + "\": ", ...args);
  };
  obj.Logger.prototype.fatalm = function (module, ...args) {
    this.fatal("LiveLib --> Module \"" + module + "\": ", ...args);
  };

  obj.Logger.prototype.toString = function () {
    return JSON.stringify(this, null, 2);
  };


  //Create logger
  global.LiveLib._live_logger = new obj.Logger(name || "LiveLib");

  global.LiveLib.getLogger = () => {
    return global.LiveLib._live_logger;
  };

  let __verbose = arguments.haveArgs(["-v", "-t", "--verbose", "--trace"]);
  let __debug = __verbose || arguments.haveArgs(["-d", "--debug"]);
  let __info = __debug || arguments.haveArgs(["-i", "--info"]) || !arguments.haveArgs(["-w", "-e", "--warn", "--error", "--fatal", "--none"]);
  let __warn = __info || arguments.haveArgs(["-w", "--warn"]);
  let __error = __warn || arguments.haveArgs(["-e", "--error"]);
  let __fatal = __error || arguments.haveArgs(["--fatal"]);

  global.LiveLib.getLogger().setLevel(7 - __verbose - __debug - __info - __warn - __error - __fatal);

  console._log = console.log;
  console.log = function (...args) {
    global.LiveLib.getLogger().log(...args);
  };

  console.error = function (...args) {
    global.LiveLib.getLogger().error(...args);
  };

  let _live_to_file = arguments.argsIndex(["-f", "-l", "--file", "--log"]);
  for (let obj of _live_to_file) {
    try {
      obj._live_logger.consoles.push(new console.Console(obj.__GET_LIB("fs").createWriteStream(process.argv[obj + 1], {
        flags: "a"
      })));
    } catch (err) {

    }
  }
  obj.init = true;
  obj.postInitFunc(() => {
  });
  return obj;
};

module.exports = live_lib_logging;