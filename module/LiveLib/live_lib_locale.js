let live_lib_locale = function () {
  if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
  if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;

  let base = global.LiveLib.base;
  global.LiveLib.loadLiveModule("logging");
  let logger = global.LiveLib.getLogger();
  let pref = global.LiveLib.loadLiveModule("preference");
  let path = base.getLib("path");

  global.LiveLib.locale = function (folder_with_locales) {
    this.folder = path.resolve(folder_with_locales);
    base.createIfNotExists(this.folder);
    this.locales = new Map();
    this.loadLocaleFromFileSync("en-US", true);
  };

  let locale = global.LiveLib.locale;
  base.createClass(locale);

  locale.prototype.loadLocaleFromFile = function (locale, callback, e) {
    try {
      let map = this.locales;
      let tmp = new pref(path.join(this.folder, locale));
      tmp.loadData(err => {
        if (err) {
          if (callback) callback(err);
        }
        else {
          map.set(locale, tmp);
          callback(null, tmp);
        }
      }, true);
    } catch (err) {
      if (e) throw err;
      else logger.errorm("Locale", "loadLocaleFromFile => ", err);
    }
  };

  locale.prototype.loadLocaleFromFileSync = function (locale, e) {
    try {
      let map = this.locales;
      let tmp = new pref(path.join(this.folder, locale));
      tmp.loadDataSync(true);
      map.set(locale, tmp);
      return true;
    } catch (err) {
      if (e) throw err;
      else logger.errorm("Locale", "loadLocaleFromFileSync => ", err);
    }
  };

  locale.prototype.get = function (string, locale, callback, e) {
    try {
      let tmp0 = this;

      function result(local) {
        let tmp = local.get(string, null, true);
        if (tmp) callback(null, tmp);
        else if (locale !== "en-US") tmp0.get(string, "en-US", callback, true);
        else callback(null, string);
      }

      let local = this.locales.get(locale ? locale : "en-US");
      if (!local) {
        this.loadLocaleFromFile(locale, (err, res) => {
          if (err) callback(err);
          local = res;
          result(local);
        }, true);
      } else result(local);
      return true;
    } catch (err) {
      if (e) throw err;
      else if (callback) callback(err);
      else logger.errorm("Locale", "get => ", err);
    }
    return false;
  };

  locale.prototype.getSync = function (string, locale = "en-US", e) {
    try {
      if (!locale) locale = "en-US";
      let local = this.locales.get(locale);
      if (!local) {
        this.loadLocaleFromFileSync(locale, true);
        local = this.locales.get(locale);
      }
      let tmp = local.get(string, null, true);
      return tmp ? tmp : (locale !== "en-US" ? this.getSync(string, "en-US", true) : string);
    } catch (err) {
      if (e) throw err;
      else logger.errorm("Locale", "get => ", err);
    }
  };

  return locale;
};

module.exports = live_lib_locale;