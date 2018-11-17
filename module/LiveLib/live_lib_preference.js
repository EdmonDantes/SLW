var _live_lib_preference = function () {//TODO: Edit with new version
  if (!global.LiveLib) require("./live_lib_base")();
  if (!global.LiveLib.preference || !global.LiveLib.preference.init) {
    global.LiveLib.preference = {
      init: true
    };
    global.LiveLib.__CHECK_LIB("path");
    global.LiveLib.__CHECK_LIB("fs");
  } else return false;

  global.LiveLib.preference.Version = "1.0";

  global.LiveLib.preference.PreferenceFile = function (name, coding) {
    this.name = global.LiveLib.__GET_LIB("path").resolve(name);
    this.coding = coding ? coding : false;
    this.value = undefined;
  }

  global.LiveLib.preference.PreferenceFile.prototype.setValue = function (val, e) {
    try {
      let tmp = val.toString().split("\n");
      this.value = new Map();
      for (let obj of tmp) {
        if (obj.indexOf("#")) obj = obj.split("#")[0];
        if (obj.indexOf("//")) obj = obj.split("//")[0];

        let local = obj.split(":");
        if (local[0] !== undefined && local[0] !== null && local[0].length > 0 && local[1] !== undefined && local[1] !== null && local[1].length > 0) this.value.set(local[0].trim().toLowerCase(), local[1].trim());
      }
      return this.value;
    } catch (err) {
      if (e) throw err;
      else global.LiveLib.getLogger().errorm("Preference", "PreferenceFile => loadDataSync: ", err);
    }
  }

  global.LiveLib.preference.PreferenceFile.prototype.loadData = function (callback) {
    try {
      global.LiveLib.__GET_LIB("fs").readFile(this.name, (err, res) => {
        if (err) callback(err);
        else {
          callback(null, this.setValue(res));
        }
      });
      return true;
    } catch (err) {
      callback(err);
    }
    return false;
  }

  global.LiveLib.preference.PreferenceFile.prototype.loadDataSync = function (e) {
    try {
      return this.setValue(global.LiveLib.__GET_LIB("fs").readFileSync(this.name), true);
    } catch (err) {
      if (e) throw err;
      else global.LiveLib.getLogger().errorm("Preference", "PreferenceFile => loadDataSync: ", err);
    }
    return false;
  }

  global.LiveLib.preference.PreferenceFile.prototype.toString = function (e) {
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
      else global.LiveLib.getLogger().errorm("Preference", "PreferenceFile => toString: ", err);
    }
    return false;
  }

  global.LiveLib.preference.PreferenceFile.prototype.saveFile = function (callback) {
    try {
      let tmp = this.toString(true);
      if (tmp) {
        global.LiveLib.__GET_LIB("fs").writeFile(this.name, tmp, callback);
        return true;
      }
    } catch (err) {
      callback(err);
    }
    return false;
  }

  global.LiveLib.preference.PreferenceFile.prototype.saveFileSync = function (e) {
    try {
      let tmp = this.toString(true);
      if (tmp) {
        global.LiveLib.__GET_LIB("fs").writeFileSync(this.name, tmp);
        return true;
      }
    } catch (err) {
      if (e) throw err;
      else global.LiveLib.getLogger().errorm("Preference", "PreferenceFile => saveFileSync: ", err);
    }
    return false;
  }

  global.LiveLib.preference.PreferenceFile.prototype.get = function (key, def, e) {
    try {
      if (!def) def = false;
      if (this.value) {
        let tmp = this.value.get(key);
        return tmp ? tmp : def;
      }
    } catch (err) {
      if (e) throw err;
      else global.LiveLib.getLogger().errorm("Preference", "PreferenceFile => get: ", err);
    }
    return false;
  }

  global.LiveLib.preference.PreferenceFile.prototype.set = function (key, value, e) {
    try {
      if (this.value) this.value.set(key, value);
    } catch (err) {
      if (e) throw err;
      else global.LiveLib.getLogger().errorm("Preference", "PreferenceFile => set: ", err);
    }
    return false;
  }
}

module.exports = _live_lib_preference;
