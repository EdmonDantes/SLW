var live_lib_user_engine = function (settings) {
  if (!global.LiveLib) require("./live_lib_base")();
  if (!global.LiveLib.db || !global.LiveLib.db.init) require("./live_lib_db")(settings);
  if (!global.LiveLib.userEngine || !global.LiveLib.userEngine.init) {
    global.LiveLib.userEngine = {
      init: true,
      Version: "1.0",
    }
  }

  global.LiveLib.getQueryMap = (query) => {
    let params = query.split("&");
    let map = new Map();
    for (let i = 0; i < params.length; i++) {
      map.set(params[i].split("=")[0], params[i].split("=")[1]);
    }
    return map;
  }

  global.LiveLib.userEngine.UserError = function (code, message) {
    this.name = "UserError";
    this.message = message;
    this.code = code || 1;
    this.stack = (new Error()).stack;
  }

  global.LiveLib.createClass(global.LiveLib.userEngine.UserError, Error);

  global.LiveLib.userEngine.__createPasswordHash = function (string, callback) {
    try {
      global.LiveLib.__GET_LIB("bcrypt").genSalt(5, (err, salt) => {
        if (err) callback(err);
        else {
          global.LiveLib.__GET_LIB("bcrypt").hash(string, salt, (err0, hash) => {
            if (err) callback(err0);
            else callback(null, hash, salt);
          });
        }
      });
    } catch (err) {
      callback(err);
    }
  }

  global.LiveLib.userEngine.registerUser = function (login, password) {
    global.LiveLib.userEngine.__createPasswordHash(password, (err, hash, salt) => {
      if (err) global.LiveLib.getLogger().errorm("User Engine",)
    });
  }

  global.LiveLib.userEngine.createToken = function (id, password) {

  }
}

module.exports = live_lib_user_engine;
