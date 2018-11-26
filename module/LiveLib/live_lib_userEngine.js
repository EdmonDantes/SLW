let live_lib_userEngine = function (settings) {//TODO: Edit with new version
  if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
  if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;

  let base = global.LiveLib.base;
  global.LiveLib.loadLiveModule("logging");
  let Database = global.LiveLib.loadLiveModule("database");
  let PhotoEngine = global.LiveLib.loadLiveModule("photoEngine");
  let bcrypt = base.getLib("bcrypt");


  global.LiveLib.userEngine = function (folder, host, user, password, database, port, count_pools = 20) {
    this.photoEng = new PhotoEngine(folder, host, user, password, database, port, count_pools);
    this.db = new Database(host, user, password, database, port, count_pools);
    this.db.createTable("users",
      {name: "id", type: "INT UNSIGNED", primary: true, autoincrement: true}, // ID
      {name: "login", type: "VARCHAR(80)", unique: true, notnull: true}, // Логин для входа в профиль
      {name: "password", type: "VARCHAR(120) BINARY", notnull: true}, // Пароль в зашифрованном виде
      {name: "passwordSalt", type: "VARCHAR(29) BINARY", notnull: true}, // Соль пароля
      {name: "email", type: "VARCHAR(120)", notnull: true},
      {name: "firstName", type: "VARCHAR(120) BINARY", notnull: true}, // Имя
      {name: "lastName", type: "VARCHAR(120) BINARY", notnull: true}, // Фамилия
      {name: "secondName", type: "VARCHAR(120) BINARY", notnull: true, default: ""}, // Отчество
      {name: "sex", type: "CHAR(0)"}, // Пол
      {name: "screen_name", type: "VARCHAR(120) BINARY", notnull: true, default: ""}, // Ссылка на профиль
      {name: "bdate", type: "VARCHAR(10) BINARY", notnull: true, default: ""}, // День рождения
      {name: "closed", type: "CHAR(0)"}, // Закрытый ли аккаунт
      {name: "city", type: "VARCHAR(60) BINARY", notnull: true, default: ""}, // Город
      {name: "country", type: "VARCHAR(80) BINARY", notnull: true, default: ""}, // Страна
      {name: "photo_id", type: "INT UNSIGNED", foreign: {table: "photo_engine", key: "id"}}, // Id фотографии
      {name: "mobile_phone", type: "VARCHAR(12)", notnull: true, default: ""}, // Мобильный телефон
      {name: "home_phone", type: "VARCHAR(12)", notnull: true, default: ""}, // Домашний телефон
      {name: "site", type: "VARCHAR(60) BINARY", notnull: true, default: ""}, // Сайт
      {name: "status", type: "VARCHAR(255) BINARY", notnull: true, default: ""}, // Статус
      {name: "verified", type: "CHAR(0)"}, // Верифицирован ли аккаунт
      err => {
        global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
      });
      this.db.createTable("not_users",
      {name: "id", type: "INT UNSIGNED", primary: true, autoincrement: true}, // ID
      {name: "word_key", type: "VARCHAR(12) BINARY", unique: true, notnull: true},
      {name: "login", type: "VARCHAR(80)", unique: true, notnull: true}, // Логин для входа в профиль
      {name: "password", type: "VARCHAR(120) BINARY", notnull: true}, // Пароль в зашифрованном виде
      {name: "passwordSalt", type: "VARCHAR(29) BINARY", notnull: true}, // Соль пароля
      {name: "email", type: "VARCHAR(120)", notnull: true},
      {name: "firstName", type: "VARCHAR(120) BINARY", notnull: true}, // Имя
      {name: "lastName", type: "VARCHAR(120) BINARY", notnull: true}, // Фамилия
      {name: "secondName", type: "VARCHAR(120) BINARY", notnull: true, default: ""}, // Отчество
      {name: "sex", type: "CHAR(0)"}, // Пол
      {name: "screen_name", type: "VARCHAR(120) BINARY", notnull: true, default: ""}, // Ссылка на профиль
      {name: "bdate", type: "VARCHAR(10) BINARY", notnull: true, default: ""}, // День рождения
      {name: "closed", type: "CHAR(0)"}, // Закрытый ли аккаунт
      {name: "city", type: "VARCHAR(60) BINARY", notnull: true, default: ""}, // Город
      {name: "country", type: "VARCHAR(80) BINARY", notnull: true, default: ""}, // Страна
      {name: "photo_id", type: "INT UNSIGNED", foreign: {table: "photo_engine", key: "id"}}, // Id фотографии
      {name: "mobile_phone", type: "VARCHAR(12)", notnull: true, default: ""}, // Мобильный телефон
      {name: "home_phone", type: "VARCHAR(12)", notnull: true, default: ""}, // Домашний телефон
      {name: "site", type: "VARCHAR(60) BINARY", notnull: true, default: ""}, // Сайт
      {name: "status", type: "VARCHAR(255) BINARY", notnull: true, default: ""}, // Статус
      {name: "verified", type: "CHAR(0)"},
	  err => {
		global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err); 
	  });
  };

  let users = global.LiveLib.userEngine;

  createClass(users);

  function getPasswordForDB(password, callback, countSalt = 10) {
    try {
      bcrypt.getSalt(countSalt, (err, salt) => {
        if (err) {
          if (callback) callback(err);
        }
        else {
          bcrypt.hash(string, salt, (err0, hash) => {
            if (err0) {
              if (callback) callback(err0);
            }
            else {
              callback(null, hash, salt);
            }
          });
        }
      });
      return true;
    } catch (err) {
      if (callback) callback(err);
      else throw err;
    }
    return false;
  }
  
  users.prototype.sendTo(email, string){
	  
  }

  users.prototype.registerUser = function (login, password, email, firstName, lastName, sex, screen_name, bdate, closed, city, country, photo_id, mobile_phone, home_phone, site, status, verified) {
    if (login && password && firstName && lastName && sex) {
		let word = base.createRandomString(12);
		this.db.insert("not_users", {
			word_key: word,
			login: login,
			password: password,
			email: email,
			firstName: firstName,
			lastName: lastName,
			sex: sex,
			screen_name: screen_name,
			bdate: bdate,
			closed: closed,
			city: city,
			country: country,
			photo_id: photo_id,
			mobile_phone: mobile_phone,
			home_phone: home_phone,
			site: site,
			status: status,
			verified: verified
		});
		this.sendTo(email, word);
    }else return false;
  };
  
  users.prototype.

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
