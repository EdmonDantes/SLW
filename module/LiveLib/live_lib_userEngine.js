let live_lib_userEngine = function (settings) {//TODO: Edit with new version
  try {
    if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
    if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;

    let base = global.LiveLib.base;
    global.LiveLib.loadLiveModule("logging");
    let Database = global.LiveLib.loadLiveModule("database");
    let PhotoEngine = global.LiveLib.loadLiveModule("photoEngine");
    let bcrypt = base.getLib("bcrypt");


    global.LiveLib.userEngine = function (folder, host, user, password, database, port, count_pools = 20) {
      let db = this.db = new Database(host, user, password, port, database, port, count_pools);
      this.photo = new PhotoEngine(folder, host, user, password, database, port, count_pools, () => {
        this.db.createTable("users",
          {name: "id", type: "INT UNSIGNED", primary: true, autoincrement: true}, // ID
          {name: "login", type: "VARCHAR(80)", unique: true, notnull: true}, // Логин для входа в профиль
          {name: "password", type: "VARCHAR(60) BINARY", notnull: true}, // Пароль в зашифрованном виде
          {name: "passwordSalt", type: "VARCHAR(29) BINARY", notnull: true}, // Соль пароля
          {name: "firstName", type: "VARCHAR(120) BINARY", notnull: true}, // Имя
          {name: "lastName", type: "VARCHAR(120) BINARY", notnull: true}, // Фамилия
          {name: "secondName", type: "VARCHAR(120) BINARY", notnull: true, default: "''"}, // Отчество
          {name: "sex", type: "BIT", notnull: true}, // Пол
          {name: "screen_name", type: "VARCHAR(120) BINARY", notnull: true, default: "''"}, // Ссылка на профиль
          {name: "bdate", type: "VARCHAR(10) BINARY", notnull: true, default: "''"}, // День рождения
          {name: "closed", type: "BIT", notnull: true, default: "b'0'"}, // Закрытый ли аккаунт
          {name: "city", type: "VARCHAR(60) BINARY", notnull: true, default: "''"}, // Город
          {name: "country", type: "VARCHAR(80) BINARY", notnull: true, default: "''"}, // Страна
          {name: "avatar_id", type: "INT UNSIGNED", foreign: {table: "photo_engine", key: "id"}}, // Id фотографии
          {name: "mobile_phone", type: "VARCHAR(12)", notnull: true, default: "''"}, // Мобильный телефон
          {name: "home_phone", type: "VARCHAR(12)", notnull: true, default: "''"}, // Домашний телефон
          {name: "site", type: "VARCHAR(60) BINARY", notnull: true, default: "''"}, // Сайт
          {name: "status", type: "VARCHAR(255) BINARY", notnull: true, default: "''"}, // Статус на станице
          {name: "verified", type: "BIT", default: "b'0'"}, // Верифицированна ли страница
          {name: "banned", type: "BIT", default: "b'0'"}, // Забанена ли страница
          {name: "deleted", type: "BIT", default: "b'0'"}, // Удалена ли страница
          err => {
            if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
          });
        this.db.createTable("relations",
          {name: "id", type: "INT UNSIGNED", primary: true, notnull: true, autoincrement: true},
          {name: "user_id_1", type: "INT UNSIGNED", notnull: true},
          {name: "user_id_2", type: "INT UNSIGNED", notnull: true, unique: ["user_id_1"]},
          {name: "status", type: "BIT(3)", notnull: true, default: "b'01'"},
          // 000 - друзья, 001 - user_id_1 отправил запрос на дружбу, 010 - user_id_2 отправил запрос на дружбу, 011 - Нейтральные отношения,
          // 100 - user_id_1 добавил в чёрный список, 101 - used_id_2 добавил в чёрный список, 110 - оба добавили друг друга в чёрные списки, 111 - пустое состояние
          err => {
            if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
          });
        this.db.createTable("tokens",
          {name: "id", type: "INT UNSIGNED", primary: true, notnull: true, autoincrement: true},
          {name: "token", type: "VARCHAR(60) BINARY", unique: true, notnull: true}, // Токен
          {name: "user_id", type: "INT UNSIGNED", foreign: {table: "users", key: "id"}, notnull: true}, //Id пользователя
          {name: "permissions", type: "INT UNSIGNED", notnull: true}, // Права токена
          {name: "create_time", type: "BIGINT", notnull: true}, // Время создания токена
          {name: "last_using", type: "BIGINT", notnull: true}, // Время последнего использования токена
          {name: "time", type: "BIGINT"}, // Время действия токена в миллисекундах
          err => {
            if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
          });
        this.db.createTable("actions",
          {name: "id", type: "INT UNSIGNED", primary: true, notnull: true, autoincrement: true}, // Id действия
          {name: "token_id", type: "INT UNSIGNED", notnull: true, foreign: {table: "tokens", key: "id"}}, // Id токена
          {name: "type_action", type: "SMALLINT UNSIGNED", notnull: true}, // Вид действия
          {name: "time", type: "BIGINT", notnull: true}, // Время совершения действия
          {name: "success", type: "BIT"}, // Удачно ли действие завершено
          err => {
            if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
          });
      });
    };

    let users = global.LiveLib.userEngine;

    base.createClass(users);

    users.ALL_PERM = 0xffffffff;
    users.BASE = 2;

    let act = users.ACTIONS_TYPES = new Map();
    act.set("user.getById", 1);
    act.set("user.getRelations", 2);

    users.prototype.createToken = function (user_id, permissions, time, callback) {
      let token = base.createRandomString(60);
      this.db.insert("tokens", {
        token: token,
        user_id: user_id,
        permissions: permissions > -1 ? permissions : users.ALL_PERM,
        create_time: Date.now(),
        last_using: Date.now(),
        time: time > -1 ? time : null
      }, (err) => {
        if (err) {
          if (callback) callback(err);
        }
        else {
          callback(undefined, undefined, token);
        }
      });
    };

    users.prototype.registerUser = function (user, callback, e) {
      try {
        if (user && user.login && user.password && user.firstName && user.lastName) {
          let that = this;
          bcrypt.genSalt(10, (err, salt) => {
            if (err) {
              if (callback) callback(err);
            }
            else {
              bcrypt.hash(user.password, salt, (err0, hash) => {
                if (err0) {
                  if (callback) callback(err0);
                }
                else {
                  user.passwordSalt = salt;
                  user.password = hash;
                  user.sex = user.sex === "man" ? 1 : 0;
                  this.db.insert("users", user, (err1, res) => {
                    if (err1 && err1[0]) {
                      if (callback) {
                        switch (err1[0].code) {
                          case 1062:
                            callback(err1[0], "users.register.wrong.login");
                            break;
                          default:
                            callback(err1[0]);
                            break;
                        }
                      }
                    }
                    else {
                      that.createToken(res[0].insertId, -1, -1, callback);
                    }
                  });
                }
              });
            }
          });
        }
      } catch (err) {
        if (e) throw err;
        else if (callback) callback(err);
        else global.LiveLib.getLogger().errorm("User Engine", "registerUser() => ", err);
      }
    };

    users.prototype.loginUser = function (login, password, callback, remember, e) {
      try {
        if (login && password) {
          let that = this;
          this.db.select("users", {where: "login = " + login}, (err, res) => {
            if (err) {
              if (callback) callback(err, "users.serverError");
            }
            else {
              let obj = res[0];
              bcrypt.hash(password, obj.salt, (err0, res0) => {
                if (err0) {
                  if (callback) callback(err, "users.serverError");
                }
                else if (obj.password === res0) {
                  createToken(obj.id, -1, remember ? -1 : 3600000, callback);
                } else callback(undefined, "users.wrong.password");
              });
            }
          });
          return true;
        }
      } catch (err) {
        if (e) throw err;
        else if (callback) callback(err);
        else global.LiveLib.getLogger().errorm("User engine", "loginUser() => ", err);
      }
      return false;
    };

    users.prototype.createAction = function (token, type_action, permissions, handler, callback) {
      let db = this.db;
      db.select("tokens", {where: "token = '" + token + "'"}, (err, res) => {
        if (err) {
          if (handler) handler(err, "users.wrong.token");
        }
        else if (res && res.length > 0 && res[0]) {
          if (!res[0].time || ((res[0].last_using + res[0].time) > Date.now() && (res[0] & permissions) === permissions)) {
            db.select("users", {where: "id = " + res[0].user_id}, (err0, res0) => {
              if (res0 && res0.length > 0 && res0[0]) {
                if (res0[0].banned[0]) handler(err0, "users.banned");
                else if (res0[0].deleted[0]) handler(err0, "users.deleted");
                else {

                  function func(result) {
                    db.insert("actions", {
                      token_id: res[0].id,
                      type_action: type_action,
                      time: Date.now(),
                      success: result
                    }, err => {
                      if (err) if (handler) handler(err);
                    });
                  }

                  try {
                    callback(res0[0], func);
                  } catch (err0) {
                    if (handler) handler(err0, "users.wrong.action");
                    func(false);
                  }
                  db.update("tokens", {last_using: Date.now(), "$$where": "token = '" + token + "'"}, err1 => {
                    if (handler) {
                      if (err1)
                        handler(err1);
                    }
                  });
                }
              } else if (handler) handler(err0, "users.not.find");
            });
          }
        }
      });
    };

    users.prototype.getRelationsWith = function (user_id_1, token, callback) {
      let db = this.db;
      this.createAction(token, act.get("user.getRelations"), users.BASE, (err, message) => {
        callback(err, message);
      }, (user, func) => {
        db.select("relations", {where: user_id_1 < user.id ? "user_id_1 = " + user_id_1 + " AND user_id_2 = " + user.id : "user_id_1 = " + user.id + " AND user_id_2 = " + user_id_1}, (err0, res0) => {
          if (err0) {
            callback(err0, "users.not.find");
            func(false);
          }
          else {
            let res = "none";
            if (res0 && res0.length > 0 && res[0]) {
              switch (res0[0].status) {
                case 0:
                  res = "friend";
                  break;
                case 4:
                  res = user_id_1 < user.id ? "black" : "none";
                  break;
                case 5:
                  res = user.id > user_id_1 ? "none" : "black";
                  break;
                case 6:
                  res = "black";
              }
            }
            callback(undefined, undefined, res);
            func(true);
          }
        });
      });
    };

    users.prototype.getUser = function (user_id, token, callback) {
      let that = this;
      this.createAction(token, act.get("user.getById"), users.BASE, (err, message) => {
        callback(err, message);
      }, function (user, func) {
        that.db.select("users", {where: "id = " + user_id}, (err0, res0) => {
          if (err0 || !res0 || res0.length < 1 || !res0[0]) {
            callback(err0, "users.not.find");
            func(false);
          }
          else {
            if (res0[0].deleted[0]) {
              callback(undefined, "users.deleted");
              func(false);
            }
            else if (res0[0].banned[0]) {
              callback(undefined, "users.banned");
              func(false);
            } else {
              that.getRelationsWith(res0[0].id, token, (err1, message, res1) => {
                if (err1 || message) {
                  callback(err1, message);
                } else {
                  switch (res1) {
                    case "none":
                      if (res0[0].closed[0]) {
                        callback(undefined, "users.closed");
                        func(false);
                      } else {
                        callback(undefined, undefined, res0[0]);
                        func(true);
                      }
                      break;
                    case "friend":
                      callback(undefined, undefined, res0[0]);
                      func(true);
                      break;
                    case "black":
                      callback(undefined, "users.in.black");
                      func(false);
                      break;
                  }
                }
              });
            }
          }
        });
      });
    };

    return global.LiveLib.userEngine;
  } catch (err) {
    global.LiveLib.getLogger().errorm("User Engine", "[[main]] => ", err);
  }
};

module.exports = live_lib_userEngine;
