let _live_lib_preference = function () {
  if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
  if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;

  let base = global.LiveLib.base;
  global.LiveLib.loadLiveModule("logging");
  let logger = global.LiveLib.getLogger();
  let path = base.getLib("path");
  let fs = base.getLib("fs");

  global.LiveLib.preference = function (name) {
    this.name = path.resolve(name);
    this.value = undefined;
  };

  let pref = global.LiveLib.preference;

  base.createClass(pref);

  pref.prototype.setValue = function (val, e) {
    try {
      let tmp = val.toString().split("\n");
      this.value = new Map();
      for (let obj of tmp) {
        if (obj.indexOf("#")) obj = obj.split("#")[0];
        if (obj.indexOf("//")) obj = obj.split("//")[0];

        let local = obj.split(":");
        let name = local[0];
        let value = local.splice(1).join(":");
        if (name && name.length > 0 && value && value.length > 0) this.value.set(name.trim().toLowerCase(), value.trim());
      }
      return true;
    } catch (err) {
      if (e) throw err;
      else logger.errorm("Preference", "setValue => ", err);
    }
    return false;
  };

  pref.prototype.loadData = function (callback, e) {
    try {
      fs.readFile(this.name, (err, res) => {
        if (callback) {
          if (err) callback(err);
          else callback(null, this.setValue(res));
        }
      });
      return true;
    } catch (err) {
      if (e) throw err;
      else logger.errorm("Preference", "loadData => ", err);
    }
  };

  pref.prototype.loadDataSync = function (e) {
    try {
      return this.setValue(fs.readFileSync(this.name), true);
    } catch (err) {
      if (e) throw err;
      else logger.errorm("Preference", "loadDataSync => ", err);
    }
  };

  pref.prototype.get = function (key, def, e) {
    try {
      if (this.value) {
        if (!def) def = false;
        let tmp = this.value.get(key);
        if (!tmp && this.new_value) {
          let tmp0 = this.new_value.get(key);
          return tmp0 ? tmp0 : def;
        } else return tmp ? tmp : def;
      }
    } catch (err) {
      if (e) throw err;
      else logger.errorm("Preference", "get => ", err);
    }
    return false;
  };

  pref.prototype.set = function (key, value, e) {
    try {
      if (this.value && key && value) {
        this.value.set(key, value);
      }
    } catch (err) {
      if (e) throw err;
      else logger.errorm("Preference", "set => ", err);
    }
    return false;
  };

  pref.prototype.toString = function (e) {
    try {
      if (this.value) {
        let ret = "";
        for (let [key, value] of this.value) {
          ret += key + ": " + value + "\n";
        }
        return ret;
      }
    } catch (err) {
      if (e) throw e;
      else logger.errorm("Preference", "toString => ", err);
    }
    return false;
  };

  pref.prototype.saveFile = function (callback, e) {
    try {
      let tmp = this.toString(true);
      if (tmp) {
        fs.writeFile(this.name, tmp, err => {
          if (callback) {
            if (err) callback(err);
            else callback(null, true);
          }
        });
        return true;
      }
    } catch (err) {
      if (e) throw err;
      else logger.errorm("Preference", "saveFile => ", err);
    }
  };

  pref.prototype.saveFileSync = function (e) {
    try {
      let tmp = this.toString(true);
      if (tmp) {
        return fs.writeFileSync(this.name, tmp);
      }
    } catch (err) {
      if (e) throw err;
      else logger.errorm("Preference", "saveFileSync => ", err);
    }
    return false;
  };

  return pref;
};

module.exports = _live_lib_preference;
