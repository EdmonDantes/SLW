let live_lib_locale = function () {
  if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
  if (!global.LiveLib || global.LiveLib.Version < 1.1) return false;

  let base = global.LiveLib.base;
  global.LiveLib.____LOAD_LIVE_MODULE("logging");
  let logger = global.LiveLib.getLogger();
  let pref = global.LiveLib.____LOAD_LIVE_MODULE("preference");
  let path = base.__GET_LIB("path");

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
      tmp.loadData((err, res) => {
        if (err) {
          if (callback) callback(err);
        }
        else {
          map.set(locale, tmp);
          callback(null);
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

  locale.prototype.get = function (localestring, e) {
    try {
      let local = this.locales.get(localestring.locale);
      if (!local) {
        this.loadLocaleFromFileSync(localestring.locale, true);
        local = this.locales.get(localestring.locale);
      }
      let tmp = local.get(localestring.string, null, true);
      return tmp ? tmp : this.locales.get("en-US").get(localestring.string, "Locale Error #1!!!!", true);
    } catch (err) {
      if (e) throw err;
      else logger.errorm("Locale", "get => ", err);
    }
  };

  return locale;
};

module.exports = live_lib_locale;