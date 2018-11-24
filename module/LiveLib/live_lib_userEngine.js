let live_lib_userEngine = function (settings) {//TODO: Edit with new version
  if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
  if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;
  global.LiveLib.loadLiveModule("logging");
  let database = global.LiveLib.loadLiveModule("database");


  global.LiveLib.userEngine = function () {
  };












  if (!global.LiveLib) require("./live_lib_base")();
  if (!global.LiveLib.db || !global.LiveLib.db.init) require("./live_lib_database")(settings);
  if (!global.LiveLib.userEngine || !global.LiveLib.userEngine.init) {
    global.LiveLib.userEngine = {
      init: true,
      loaded: false,
      Version: "1.0",
    }
  }

  new Promise((resolve, reject) => {
    global.LiveLib.db.changeDB("user_engine", undefined, (err) => {
      if (err) reject(err);
      else {
        global.LiveLib.db.createTable("users",
          {name: "id", type: "UNSIGNED INT", primary: true, autoincrement: true},
          {name: "login", type: "VARCHAR(80)", unique: true, notnull: true},
          {name: "password", type: "VARCHAR(120) BINARY", notnull: true},
          {name: "password_salt", type: "VARCHAR(29) BINARY", notnull: true}, (err) => {
            if (err) reject(err);
            else {
              global.LiveLib.db.createTable("tokens",
                {name: "token", type: "VARCHAR(80) BINARY", primary: true, notnull: true},
                {name: "type_token", type: "CHAR(0)"},
                {name: "id", type: "UNSIGNED INT", foreign: {table: "users", key: "id"}},
                {name: "time", type: "UNSIGNED INT", default: "8000000"},
                {name: "last_using", type: "UNSIGNED INT", notnull: true, default: "UNIX_TIMESTAMP()"}, (err) => {
                  if (err) reject(err);
                  else resolve(true);
                });
            }
          });
      }
    });
  });

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

  global.LiveLib.userEngine.chechLogin = function (login, callback) {
    global.LiveLib.db.select("users", undefined, "login = '" + login + "'", undefined, 1, undefined, undefined, (err, res) => {
      if (err) callback(err);
      else if (res) {
        callback(null, res.length < 1);
      } else callback(new Error("Unknown error"));
    });
  }

  global.LiveLib.userEngine.registerUser = function (login, password, callback) {
    global.LiveLib.userEngine.chechLogin(login, (err, res) => {
      if (err) callback(err);
      else if (res) {
        global.LiveLib.userEngine.__createPasswordHash(password, (err0, hash, salt) => {
          if (err0) global.LiveLib.getLogger().errorm("User Engine", "registerUser - ", err0);
          else {
            global.LiveLib.db.insert("users", {login: login, password: hash, password_salt: salt}, (err1, res1) => {
              if (err1) callback(err1);
              else {
                console.log(res1);
                global.LiveLib.userEngine.createToken(res1.id, password, undefined, (err2, message, token) => {
                  if (err2) callback(err2);
                  else if (message) callback(null, message);
                  else callback(null, null, token);
                });
              }
            });
          }
        });
      } else callback(null, "message::wronglogin");
    });
  }

  global.LiveLib.userEngine.createToken = function (id, password, timeout, callback) {
    global.LiveLib.db.select(table, undefined, "id = '" + id + "'", undefined, 1, (err, res) => {
      if (err) callback(err);
      else {
        global.LiveLib.__GET_LIB("bcrypt").hash(password, res[0].password_salt, (err0, res0) => {
          if (err0) callback(err0);
          else {
            if (res0 === res[0].password) {
              let token = global.LiveLib.createRandomString(80);
              global.LiveLib.db.insert("tokens", {
                token: token,
                type_token: null,
                id: id,
                time: timeout,
                last_using: Date.now()
              }, (err1, res1) => {
                if (err1) callback(err1);
                else callback(null, res1);
              });
            } else {
              callback(null, "message::wrongpass");
            }
          }
        });
      }
    });
  }

  global.LiveLib.userEngine.getIdFromToken = function (token, callback) {
    global.LiveLib.db.select("tokens", undefined, "token = '" + token + "'", (err, res) => {

    });
  }
}

module.exports = live_lib_user_engine;
