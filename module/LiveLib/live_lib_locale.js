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

  locale.LocaleString = function (string, locale) {
    this.string = string;
    this.locale = locale;
  };

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

  locale.prototype.get = function (string, callback, e) {
    try {
      let tmp0 = this;

      function result(local) {
        let tmp = local.get(string.string, null, true);
        callback(null, tmp ? tmp : tmp0.locales.get("en-US").get(string.string, string.string, true));
      }

      let local = this.locales.get(string.locale);
      if (!local) {
        this.loadLocaleFromFile(string.locale, (err, res) => {
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

  locale.prototype.getSync = function (string, e) {
    try {
      let local = this.locales.get(string.locale);
      if (!local) {
        this.loadLocaleFromFileSync(string.locale, true);
        local = this.locales.get(string.locale);
      }
      let tmp = local.get(string.string, null, true);
      return tmp ? tmp : this.locales.get("en-US").get(string.string, "Locale Error #1!!!!", true);
    } catch (err) {
      if (e) throw err;
      else logger.errorm("Locale", "get => ", err);
    }
  };

  return locale;
};

module.exports = live_lib_locale;