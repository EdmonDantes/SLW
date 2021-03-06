let live_lib_userEngine = function (settings) {
  try {
    if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
    if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;

    let base = global.LiveLib.base;
    global.LiveLib.loadLiveModule("logging");
    let error = global.LiveLib.loadLiveModule("engine");
    let Database = global.LiveLib.loadLiveModule("database");
    let bcrypt = base.getLib("bcrypt");
    let gm = base.getLib("gm");
    let fs = base.getLib("fs");
    let path = base.getLib("path");
    let nodeRSA = base.getLib("node-rsa");
    let emitter = base.getLib("events");
    let events = new emitter();

    const TOKEN_LENGTH = 240; // Длина токена


    global.LiveLib.userEngine = function (server_ip, host = "localhost", user = "user", password = "password", database = "database", photo_folder = "/tmp/photo", folder = "./html", port, count_pools = 20, callback) {
      let that = this;
      this.photoFolder = path.resolve(photo_folder);
      base.createIfNotExists(this.photoFolder);
      let db = this.db = new Database(host, user, password, port, database, count_pools);
      this.status = 0;
      this.addLoaded = function () {
        if (this.status > 4) {
          if (callback) callback();
        }
        else this.status++;
      };
      this.folder = path.resolve(folder);

      this.waiting_users = new Map();


      /*
       * Таблица серверов, для масштабируемости и связи между ними
       */
      db.createTable("servers",
        {name: "id", type: UTINYINT(), notnull: true, autoincrement: true, primary: true}, // ID
        {name: "ip", type: VARCHAR(28), notnull: true, unique: true}, // Ip сервера
        {name: "key", type: VARCHAR(255, true), notnull: true, unique: true}, // Ключ для доступа к командам сервера
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      db.select("servers", {where: "ip = '" + server_ip + "'"}, (err, res) => {
        if (err) {
          global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
          that.addLoaded();
        }
        else if (res.length > 0) {
          that.id = res[0].id;
          that.key = res[0].key;
          that.addLoaded();
        } else {
          that.key = base.createRandomString(255);
          db.insert("servers", {ip: server_ip, key: that.key}, (err0, res0) => {
            if (err0) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
            else if (res0) that.id = res0[0].insertId;
            that.addLoaded();
          });
        }
      });

      /*
       * Таблица пользователей
       */
      db.createTable("users",
        {name: "id", type: UINT(), primary: true, autoincrement: true}, // ID
        {name: "login", type: VARCHAR(80, false, "latin1"), unique: true, notnull: true}, // Логин для входа в профиль
        {name: "password", type: VARCHAR(60, true, "latin1"), notnull: true}, // Пароль в зашифрованном виде
        {name: "passwordSalt", type: VARCHAR(29, true, "latin1"), notnull: true}, // Соль пароля
        {name: "status", type: VARCHAR(500, true, "utf8mb4"), notnull: true, default: "''"}, // Статус на станице
        {name: "closed", type: BIT(1), notnull: true, default: "b'0'"}, // Закрытый ли аккаунт
        {name: "banned", type: BIT(1), notnull: true, default: "b'0'"}, // Забанена ли страница
        {name: "deleted", type: BIT(1), notnull: true, default: "b'0'"}, // Удалена ли страница
        {name: "is_admin", type: BIT(1), notnull: true, default: "b'0'"}, // Является ли пользователь админом
        {name: "messageNoFriends", type: BIT(1), notnull: true, default: "b'1'"}, // Могут ли пользователю писать не друзья
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      /*
       * Таблица карточек
       */
      db.createTable("types_cards",
        {name: "id", type: UTINYINT(), primary: true, autoincrement: true},
        {name: "name", type: VARCHAR(60, false, "latin1"), unique: true, notnull: true},
        {name: "balance", type: UINT(), notnull: true},
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      /*
       * Таблица существующих карточек в системе
       */
      db.createTable("cards",
        {name: "id", type: BIGINT(), autoincrement: true, primary: true},
        {
          name: "type_card_id",
          type: UTINYINT(),
          notnull: true,
          foreign: {table: "types_cards", key: "id"},
          unique: ["id"]
        },
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      /*
       * Таблица имеющихся у пользователя карточек
       */
      db.createTable("users_cards",
        {name: "user_id", type: UINT(), notnull: true, foreign: {table: "users", key: "id"}},
        {name: "card_id", type: BIGINT(), notnull: true, foreign: {table: "cards", key: "id"}, unique: ["user_id"]},
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      /*
       * Таблица токенов
       */
      db.createTable("tokens",
        {name: "id", type: UINT(), primary: true, notnull: true, autoincrement: true}, // Id токена
        {name: "token", type: VARCHAR(TOKEN_LENGTH, true, "latin1"), unique: true, notnull: true}, // Токен
        {name: "user_id", type: UINT(), foreign: {table: "users", key: "id"}, notnull: true}, //Id пользователя
        {name: "permissions", type: UINT(), notnull: true}, // Права токена
        {name: "create_time", type: UINT(), notnull: true}, // Время создания токена в секундах
        {name: "last_using", type: UINT(), notnull: true}, // Время последнего использования токена в секундках
        {name: "time", type: UINT(), notnull: true}, // Время действия токена в секундах (0 - неограниченное время действия)
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      /*
       * Таблица отношений между пользователями
       */
      db.createTable("relations",
        {name: "id", type: UINT(), primary: true, notnull: true, autoincrement: true}, // Id отношений
        {name: "user_id_1", type: UINT(), notnull: true, foreign: {table: "users", key: "id"}}, // Первый пользователь (Всегда должен быть меньше второго)
        {name: "user_id_2", type: UINT(), notnull: true, foreign: {table: "users", key: "id"}, unique: ["user_id_1"]}, //Второй пользователь (Всегда должен быть больше первого)
        {name: "status", type: BIT(3), notnull: true, default: "b'011'"}, // Модификатор отношений
        // 0 - друзья
        // 1 - user_id_1 отправил запрос на дружбу
        // 2 - user_id_2 отправил запрос на дружбу
        // 3 - Нейтральные отношения
        // 4 - user_id_1 добавил в чёрный список
        // 5 - used_id_2 добавил в чёрный список
        // 6 - оба добавили друг друга в чёрные списки
        // 7 - пустое состояние
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      db.createTable("photos",
        {name: "id", type: BIGINT(), primary: true, notnull: true, autoincrement: true}, // Id фотографии
        {name: "owner", type: UINT(), notnull: true, foreign: {table: "users", key: "id"}}, // Владелец фотографии
        {name: "server", type: UTINYINT(), notnull: true, foreign: {table: "servers", key: "id"}}, // Сервер для хранения фотографии
        {name: "access", type: BIT(2), notnull: true, default: "b'00'"}, // Модификатор доступа для фотографии
        // 0 - Доступ только для пользователя
        // 1 - Доступ только для друзей
        // 2 - Доступ только для друзей друзей
        // 3 - Доступ для всех
        {name: "deleted", type: BIT(), notnull: true, default: "b'0'"}, // Модификатор удаления
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      db.createTable("avatars",
        {name: "user_id", type: UINT(), primary: true, notnull: true, foreign: {table: "users", key: "id"}}, // Id пользователя
        {name: "photo_id", type: BIGINT(), notnull: true, foreign: {table: "photos", key: "id"}}, // Id фотографии
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      db.createTable("all_actions",
        {name: "id", type: BIGINT(), primary: true, notnull: true, autoincrement: true}, // Id действия
        {name: "token_id", type: UINT(), notnull: true, foreign: {table: "tokens", key: "id"}}, // Id токена
        {name: "user_id", type: UINT(), notnull: true, foreign: {table: "users", key: "id"}}, // Id пользоваетеля
        {name: "type_action", type: USMALLINT(), notnull: true}, // Вид действия
        {name: "time", type: UINT(), notnull: true}, // Время совершения действия
        {name: "success", type: BIT(), notnull: true, default: "b'0'"}, // Удачно ли действие завершено
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      db.createTable("users_actions",
        {name: "user_id", type: UINT(), notnull: true, foreign: {table: "users", key: "id"}},
        {name: "user_action_id", type: BIGINT(), notnull: true, unique: ["user_id"]},
        {name: "action", type: VARCHAR(500), notnull: true},
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
          else db.createRequest("CREATE TRIGGER `auto_increment_user_action_id` BEFORE INSERT ON `users_actions` FOR EACH ROW SET NEW.user_action_id = (SELECT COUNT(`user_id`) + 1 FROM `users_actions` WHERE `user_id` = NEW.user_id);", err => {
            if (err) global.LiveLib.getLogger().debugm("User Engine", "[[constructor]] => ", err);
            that.addLoaded();
          });
        });

      db.createTable("connections",
        {name: "id", type: UINT(), primary: true, notnull: true, autoincrement: true}, // Id подключения
        {name: "user_id", type: UINT(), notnull: true, foreign: {table: "users", key: "id"}}, // Id пользователя
        {name: "token_id", type: UINT(), unique: ["user_id"], notnull: true, foreign: {table: "tokens", key: "id"}}, // Id токена
        {name: "server_id", type: UTINYINT(), notnull: true, foreign: {table: "servers", key: "id"}}, // Id сервера
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      db.createTable("peers",
        {name: "id", type: BIGINT(), primary: true, notnull: true, autoincrement: true}, // Id чата
        {name: "name", type: VARCHAR(120, true, "utf8mb4"), notnull: true}, // Название чата
        {name: "photo_id", type: BIGINT(), foreign: {table: "photos", key: "id"}, default: "NULL"}, // Id фотографии (0 - нет фотографии)
        {name: "create_date", type: UINT(), notnull: true}, // Время создания чата в секундах
        {name: "isDialog", type: BIT(), notnull: true, default: "b'0'"}, // Является ли чат диалогом
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      db.createTable("messages",
        {name: "id", type: BIGINT(), notnull: true, autoincrement: true, primary: true}, // Id сообщения
        {name: "text", type: VARCHAR(1000, true, "utf8mb4"), notnull: true}, // Текст сообщения
        {name: "date", type: UINT(), notnull: true}, // Время отправки сообщения
        {name: "owner", type: UINT(), notnull: true, foreign: {table: "users", key: "id"}}, // Отправитель сообщения
        {name: "type", type: BIT(3), notnull: true, default: "b'000'"},
        /*
          0 - сообщение от пользователя
          1 - создание беседы
          2 - приглашение в беседу
          3 - выход из беседы
          4 - возвращение в беседу
          5 - закрепление сообщения
          6 - открепление сообщения
         */
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      db.createTable("users_peers",
        {name: "user_id", type: UINT(), notnull: true, foreign: {table: "users", key: "id"}}, // Id пользователя
        {name: "peer_id", type: BIGINT(), notnull: true, foreign: {table: "peers", key: "id"}, unique: ["user_id"]}, // Id диалога
        {name: "is_admin", type: BIT(1), notnull: true, default: "b'0'"}, // Является ли пользователем админом беседы
        {name: "leaved", type: BIT(1), notnull: true, default: "b'0'"}, // Вышел ли пользователь из диалога
        {name: "banned", type: BIT(1), notnull: true, default: "b'0'"}, // Был ли забанен пользователь
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      db.createTable("peers_messages",
        {name: "peer_id", type: BIGINT(), notnull: true, foreign: {table: "peers", key: "id"}}, // Id диалога
        {
          name: "message_id",
          type: BIGINT(),
          notnull: true,
          unique: ["peer_id"],
          foreign: {table: "messages", key: "id"}
        }, // Id сообщения
        {name: "message_chat_local_id", type: UINT(), notnull: true, unique: ["peer_id"]}, // Id сообщения в диалоге
        {name: "read", type: BIT(1), notnull: true, default: "b'0'"}, // Прочитано ли сообщение
        err => {
          if (err) global.LiveLib.getLogger().debugm("User Engine", "[[constructor]] => ", err);
          else db.createRequest("CREATE TRIGGER `auto_increment_messages_chat_local_id` BEFORE INSERT ON `peers_messages` FOR EACH ROW SET NEW.message_chat_local_id = (SELECT COUNT(`peer_id`) + 1 FROM `peers_messages` WHERE `peer_id` = NEW.peer_id);", err => {
            if (err) global.LiveLib.getLogger().debugm("User Engine", "[[constructor]] => ", err);
            that.addLoaded();
          });
        });

      db.createTable("users_messages",
        {name: "user_id", type: UINT(), notnull: true, foreign: {table: "users", key: "id"}}, // Id пользователя
        {
          name: "message_id",
          type: BIGINT(),
          notnull: true,
          unique: ["user_id"],
          foreign: {table: "messages", key: "id"}
        }, // Id сообщения
        {name: "message_user_local_id", type: UINT(), notnull: true}, // Id сообщения у пользователя
        {name: "type", type: BIT(1), notnull: true, default: "b'0'"}, // Тип сообщения. 1 - исходящее, 0 - входящее
        {name: "read", type: BIT(1), notnull: true, default: "b'0'"}, // 1 - прочитано, 0 - нет
        // По умолчанию добавляем входящие непрочитанные сообщения
        err => {
          if (err) global.LiveLib.getLogger().debugm("User Engine", "[[constructor]] => ", err);
          else db.createRequest("CREATE TRIGGER `auto_increment_message_user_local_id` BEFORE INSERT ON `users_messages` FOR EACH ROW SET NEW.message_user_local_id = (SELECT COUNT(`user_id`) + 1 FROM `users_messages` WHERE `user_id` = NEW.user_id);", err => {
            if (err) global.LiveLib.getLogger().debugm("User Engine", "[[constructor]] => ", err);
            that.addLoaded();
          });
        });

      db.createTable("reply_messages",
        {name: "message_id", type: BIGINT(), notnull: true, foreign: {table: "messages", key: "id"}}, // Id сообщения
        {
          name: "reply_id",
          type: BIGINT(),
          notnull: true,
          foreign: {table: "messages", key: "id"},
          unique: ["message_id"]
        }, // Id пересылаемого сообщения
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        });

      db.createTable("messages_photo",
        {name: "message_id", type: BIGINT(), notnull: true, foreign: {table: "messages", key: "id"}}, // Id сообщения
        {
          name: "photo_id",
          type: BIGINT(),
          notnull: true,
          foreign: {table: "photos", key: "id"},
          unique: ["message_id"]
        }, // Id фотографии
        err => {
          if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
          that.addLoaded();
        });

      fs.readFile("./key.key", "utf8", (err, res) => {
        if (err) global.LiveLib.getLogger().errorm("User Engine", "[[constructor]] => ", err);
        else {
          that.keyRSA = new nodeRSA(JSON.parse(res).key, "components");
          that.publicKey = that.keyRSA.exportKey("pkcs1-public-pem");
        }
        that.addLoaded();
      });


    };

    let users = global.LiveLib.userEngine;

    base.createClass(users);

    users.ALL_PERM = 0xffffffff;
    users.NOT_WRITE_ACTION = -1;
    users.NOT_PERMISSION = 0;
    users.SALT_LENGTH = 10;

    let types_actions = [
      "account.get",
      "account.statusWith",
      "account.edit",

      "blacklist.add",
      "blacklist.delete",
      "blacklist.get",

      "friends.add",
      "friends.delete",
      "friends.get",
      "friends.getRequests",
      "friends.getSendRequest",
      "friends.getGetRequest",

      "photos.add",
      "photos.delete",
      "photos.get",
      "photos.setTarget",
      "photos.getTarget",

      "messages.createChat",
      "messages.addUserToChat",
      "messages.deleteUserFromChat",
      "messages.leaveFromChat",
      "messages.addToChat",
      "messages.getAllChats",
      "messages.getChatById",
      "messages.getById",
      "messages.getByPeerMessageId",
      "messages.markAsRead",
      "messages.sendMessage",

      "actions.get",
      "actions.getUpdate",
    ];

    function getActionId(action) {
      return types_actions.indexOf(action);
    }

    let permissions = [
      "account",
      "blacklist",
      "friends",
      "photos",
      "messages",
      "actions"
    ];

    function getPermissionId(permission) {
      let ret = permissions.indexOf(permission);
      if (ret === -1 || ret === 0) return ret;
      else if (ret > 0) return Math.pow(2, ret);
    }

    users.prototype.createToken = function (user_id, permissions, time, callback) {
      let token = base.createRandomString(TOKEN_LENGTH);
      this.db.insert("tokens", {
        token: token,
        user_id: user_id,
        permissions: permissions > -1 ? permissions : users.ALL_PERM,
        create_time: Math.floor(Date.now() / 1000),
        last_using: Math.floor(Date.now() / 1000),
        time: time > 0 ? time : 0
      }, (err) => {
        if (err) {
          if (callback) callback(error.serv(err));
        } else {
          callback(undefined, token);
        }
      });
    };

    users.prototype.getPublicKey = function () {
      return this.publicKey;
    };

    users.prototype.registerUser = function (user, callback, e) {
      try {
        if (user) {
          if (user.login && user.login.length > 3) {
            if (user.password && user.password2) {
              user.password = this.keyRSA.decrypt(user.password, "utf-8");
              user.password2 = this.keyRSA.decrypt(user.password2, "utf-8");
              if (user.password.length > 3) {
                if (user.password === user.password2 && user.password.length > 3) {
                  let that = this;
                  bcrypt.genSalt(users.SALT_LENGTH, (err, salt) => {
                    if (err) {
                      if (callback) callback(error.serv(err));
                    } else {
                      bcrypt.hash(user.password, salt, (err0, hash) => {
                        if (err0) {
                          if (callback) callback(error.serv(err0));
                        } else {
                          user.passwordSalt = salt;
                          user.password = hash;
                          user.password2 = undefined;
                          this.db.insert("users", user, (err1, res) => {
                            if (err1 && err1[0]) {
                              if (callback) {
                                switch (err1[0].code) {
                                  case 1062:
                                    callback(new error(2, "users.wrong.login", err1[0]));
                                    break;
                                  default:
                                    callback(error.serv(err1[0]));
                                    break;
                                }
                              }
                            } else {
                              that.createToken(res[0].insertId, -1, -1, callback);
                            }
                          });
                        }
                      });
                    }
                  });
                } else {
                  callback(new error(32, "users.wrong.repeated.password"));
                }
              } else {
                callback(new error(3, "users.wrong.password"));
              }
            }
          } else {
            callback(new error(2, "users.wrong.login"));
          }
        } else {
          callback(new error(20, "users.wrong.data"));
        }
      } catch (err) {
        if (e) throw err;
        else if (callback) callback(error.serv(err));
        else global.LiveLib.getLogger().errorm("User Engine", "registerUser() => ", err);
      }
    };

    users.prototype.loginUser = function (login, password, callback, remember, e) {
      try {
        if (login && password) {
          password = this.keyRSA.decrypt(password, "utf-8");
          let that = this;
          this.db.select("users", {where: "login = '" + login + "'"}, (err, res) => {
            if (err) {
              if (callback) callback(error.serv(err));
            } else if (res && res.length > 0 && res[0]) {
              let obj = res[0];
              bcrypt.hash(password, obj.passwordSalt, (err0, res0) => {
                if (err0) {
                  if (callback) callback(error.serv(err0));
                } else if (obj.password === res0) {
                  that.createToken(obj.id, -1, remember ? -1 : 3600000, callback);
                } else callback(new error(30, "users.wrong.login.or.password"));
              });
            } else {
              callback(new error(30, "users.wrong.login.or.password"));
            }
          });
        } else callback(new error(20, "users.wrong.data"));
      } catch (err) {
        if (e) throw err;
        else if (callback) callback(error.serv(err));
        else global.LiveLib.getLogger().errorm("User engine", "loginUser() => ", err);
      }
      return false;
    };

    users.prototype.validToken = function (token, callback) {
      let that = this;
      that.db.select("tokens", {where: "token = '" + token + "'"}, (err, res) => {
        if (err) callback(error.serv(err));
        else if (res && res.length > 0 && res[0]) {
          if (res[0].time < 1 || ((res[0].last_using + res[0].time) > Math.floor((Date.now() / 1000)))) {
            callback(undefined, res[0]);
          } else callback(new error(4, "users.token.old"));
        } else callback(new error(9, "users.wrong.token"));
      });
    };

    users.prototype.resetToken = function (token, callback) {
      this.db.update("tokens", {time: 1, "$$where": "token = '" + token + "'"}, (err, res) => {
        if (err) callback(error.serv(err));
        else callback();
      });
    };

    users.prototype.createAction = function (token, action_str, permission_str, handler, callback, time) {
      let that = this;
      that.validToken(token, (err, res) => {
        if (err) {
          if (handler) handler(err);
        } else {
          let permission = getPermissionId(permission_str);
          if ((res.permissions & permission) === permission) {
            that.db.select("users", {where: "id = " + res.user_id}, (err0, res0) => {
              if (err0) {
                if (handler) handler(error.serv(err0));
              } else if (res0 && res0.length > 0 && res0[0]) {
                if (res0[0].banned[0]) handler(new error(6, "users.banned"));
                else if (res0[0].deleted[0]) handler(new error(7, "users.deleted"));
                else {
                  function end(result) {
                    that.db.insert("all_actions", {
                      token_id: res.id,
                      user_id: res.user_id,
                      type_action: getActionId(action_str),
                      time: time ? time : Math.floor(Date.now() / 1000),
                      success: !!result
                    }, err => {
                      if (err && handler) handler(error.serv(err));
                    });
                  }

                  try {
                    callback(res0[0], end, that);
                  } catch (err0) {
                    if (handler) handler(error.serv(err0));
                    end(false);
                  }
                  that.db.update("tokens", {
                    last_using: Math.floor(Date.now() / 1000),
                    "$$where": "token = '" + token + "'"
                  }, err1 => {
                    if (handler) {
                      if (err1)
                        handler(error.serv(err));
                    }
                  });
                }
              } else if (handler) handler(new error(8, "users.not.find"));
            });
          } else if (handler) handler(new error(5, "users.token.have.not.permissions"));
        }
      });
    };

    function __isNumber(number) {
      try {
        let _number = parseInt(number);
        return ((typeof _number == "number") || (_number instanceof Number)) && !isNaN(_number);
      } catch (err) {
        return false;
      }
    }

    function __func000(user_id_1, user_id_2, that, callback) { // get status from db
      if (__isNumber(user_id_1) && __isNumber(user_id_2)) {
        if (user_id_1 == user_id_2) {
          callback(new error(10, "users.can.not.status.self"));
        } else
          that.db.select("relations", {where: "user_id_1 = " + Math.min(user_id_1, user_id_2) + " AND user_id_2 = " + Math.max(user_id_1, user_id_2)}, (err, res) => {
            if (err) callback(error.serv(err));
            else {
              callback(undefined, res && res.length > 0 ? res[0].status[0] : undefined);
            }
          });
      } else {
        callback(new error(20, "users.wrong.data"));
      }
    }

    function __func001(user_id_1, user_id_2, that, callback) { // get string status from db
      __func000(user_id_1, user_id_2, that, (err, res) => {
        if (err) callback(err);
        else if (res !== undefined) {
          let tmp = "none";
          switch (res) {
            case 0:
              tmp = "friend";
              break;
            case 1:
              tmp = user_id_1 < user_id_2 ? "sendRequest" : "getRequest";
              break;
            case 2:
              tmp = user_id_1 < user_id_2 ? "getRequest" : "sendRequest";
              break;
            case 4:
              tmp = user_id_1 < user_id_2 ? "in_black" : "black";
              break;
            case 5:
              tmp = user_id_1 < user_id_2 ? "black" : "in_black";
              break;
            case 6:
              tmp = "all_black";
          }
          callback(undefined, tmp);
        } else callback(undefined, "null");
      });
    }

    function __func002(user_id, that, callback) { //get user`s info from db
      if (__isNumber(user_id)) {
        that.db.select("users", {where: "id = " + user_id}, (err, res) => {
          if (err) callback(error.serv(err));
          else if (res && res.length > 0 && res[0]) {
            if (res[0].deleted[0]) {
              callback(new error(7, "users.deleted"));
            } else if (res[0].banned[0]) {
              callback(new error(6, "users.banned"));
            } else {
              that.db.select("tokens", {where: ["`user_id` = '", user_id, "'"]}, (err0, res0) => {
                if (err0) callback(error.serv(err));
                else {
                  res[0].last_online = res0[0].last_using;
                  callback(undefined, res[0]);
                }
              });
            }
          } else callback(new error(8, "users.not.find"));
        });
      } else {
        callback(new error(20, "users.wrong.data"));
      }
    }

    function __func003(user_id, that, callback) { // get normalize user from db
      __func002(user_id, that, (err, res) => {
        if (err) callback(err);
        else {
          callback(undefined, {
            id: res.id,
            login: res.login,
            status: res.status,
            closed: !!res.closed[0],
            banned: !!res.banned[0],
            deleted: !!res.deleted[0],
            last_online: res.last_online,
            messageNoFriends: !!res.messageNoFriends[0]
          });
        }
      });
    }

    users.prototype.accountGet = function (user_id, token, callback) {
      this.createAction(token, "account.get", "account", callback, (user, end, that) => {
        user_id = (!user_id || user_id < 1 ? user.id : user_id);
        __func001(user.id, user_id, that, (err, res) => {
          if (err) {
            if (err.code === 10) {
              __func003(user.id, that, callback);
              end(true);
            } else {
              callback(err);
              end(false)
            }
          } else {
            switch (res) {
              default:
                __func003(user_id, that, (err0, res0) => {
                  if (err0) {
                    callback(err0);
                    end(false);
                  } else {
                    if ((res0.closed && res !== "friend") || res === "black") {
                      res0 = {
                        id: res0.id,
                        login: res0.login,
                        closed: res0.closed
                      };
                    } else res0.balance = undefined;

                    if (res !== "in_black" && res !== "all_black") res0.canAddToBlack = true;
                    else res0.canDeleteFromBlack = true;
                    if (res !== "friend" && res !== "sendRequest") res0.canAddToFriend = res !== "black";
                    else res0.canDeleteFromFriend = true;
                    if (res0.messageNoFriends) res0.canSendMessage = res === "friends";
                    else res0.canSendMessage = true;
                    res0.messageNoFriends = undefined;

                    callback(undefined, res0);
                    end(true);
                  }
                });
                break;
            }
          }
        });
      });
    };

    users.prototype.accountStatusWith = function (user_id, token, callback) {
      this.createAction(token, "account.statusWith", "account", callback, (user, end, that) => {
        __func001(user.id, user_id, that, (err, res) => {
          if (err) callback(err);
          else callback(undefined, res);
          end(!err);
        });
      });
    };

    users.prototype.accountEdit = function (input, token, callback) {
      this.createAction(token, "account.edit", "account", callback, (user, end, that) => {
        that.db.update("users",
          {
            closed: input.closed ? 1 : 0,
            status: input.status,
            messagesNoFriends: input.messageFromNotFriends ? 1 : 0,
            "$$where": "id = " + user.id
          },
          err => {
            if (err) callback(error.serv(err));
            else callback(undefined);
            end(!err);
          });
      });
    };

    users.prototype.blacklistAdd = function (user_id, token, callback) {
      this.createAction(token, "blacklist.add", "blacklist", callback, (user, end, that) => {
        __func001(user.id, user_id, that, (err, res) => {
          if (err) {
            callback(err);
            end(false);
          } else {
            if (!res || res === "null") {
              that.db.insert("relations", {
                user_id_1: Math.min(user.id, user_id),
                user_id_2: Math.max(user.id, user_id),
                status: user_id < user.id ? 5 : 4
              }, err1 => {
                if (err1)
                  callback(error.serv(err1));
                else callback(undefined);
                end(!err1);
              });
            } else if (res !== "all_black" && res === "black") {
              that.db.update("relations", {
                status: 6,
                "$$where": "user_id_1 = " + Math.min(user_id, user.id) + " AND user_id_2 = " + Math.max(user_id, user.id)
              }, err1 => {
                if (err1)
                  callback(error.serv(err1));
                else callback(undefined);
                end(!err1);
              });
            } else {
              that.db.update("relations", {
                status: user_id < user.id ? 5 : 4,
                "$$where": "user_id_1 = " + Math.min(user_id, user.id) + " AND user_id_2 = " + Math.max(user_id, user.id)
              }, err1 => {
                if (err1)
                  callback(error.serv(err1));
                else callback(undefined);
                end(!err1);
              });
            }
          }
        });
      });
    };

    users.prototype.blacklistDelete = function (user_id, token, callback) {
      this.createAction(token, "blacklist.delete", "blacklist", callback, (user, end, that) => {
        __func001(user.id, user_id, that, (err, res) => {
          if (err) {
            callback(err);
            end(false);
          } else if (res) {
            if (res === "all_black") {
              that.db.update("relations", {
                status: user_id < user.id ? 4 : 5,
                "$$where": "user_id_1 = " + Math.min(user_id, user.id) + " AND user_id_2 = " + Math.max(user_id, user.id)
              }, err0 => {
                if (err0) callback(error.serv(err0));
                else callback(undefined);
                end(!err0);
              });
            } else if (res === "in_black") {
              that.db.update("relations", {
                status: 3,
                "$$where": "user_id_1 = " + Math.min(user_id, user.id) + " AND user_id_2 = " + Math.max(user_id, user.id)
              }, err0 => {
                if (err0) callback(error.serv(err0));
                else callback(undefined);
                end(!err0);
              });
            }
          } else {
            callback(undefined);
            end(true);
          }
        });
      });
    };

    users.prototype.blacklistGet = function (token, callback) {
      this.createAction(token, "blacklist.get", "blacklist", callback, (user, end, that) => {
        that.db.select("relations", {where: "(user_id_1 = " + user.id + " AND status = 4) OR (user_id_2 = " + user.id + " AND status = 5) OR (status = 6 AND (user_id_1 = " + user.id + " OR user_id_2 = " + user.id + "))"}, (err, res) => {
          if (err) {
            callback(error.serv(err));
            end(false);
          } else {
            let ids = new Array(res.length);
            for (let i = 0; i < res.length; i++) {
              if (res[i].user_id_1 == user.id) ids[i] = res[i].user_id_2;
              else ids[i] = res[i].user_id_1;
            }
            callback(undefined, ids);
          }
        });
      });
    };

    users.prototype.friendsAdd = function (user_id, token, callback) {
      this.createAction(token, "friends.add", "friends", callback, (user, func, that) => {
        if (user_id === user.id) {
          callback(new error(13, "users.can.not.add.friends.self"));
          func(false);
        } else
          __func000(user_id, user.id, that, (err, res) => {
            if (err) {
              callback(err);
              func(false);
            } else {
              if (res) {
                if (res === (user_id < user.id ? 1 : 2)) {
                  that.db.update("relations", {
                    status: 0,
                    "$$where": "user_id_1 = " + Math.min(user_id, user.id) + " AND " + "user_id_2 = " + Math.max(user_id, user.id)
                  }, err => {
                    if (err) callback(error.serv(err));
                    else callback();
                    func(!err);
                  });
                } else if (res === 3 || res === (user.id < user_id ? 4 : 5)) {
                  that.db.update("relations", {
                    status: user_id < user.id ? 2 : 1,
                    "$$where": "user_id_1 = " + Math.min(user_id, user.id) + " AND " + "user_id_2 = " + Math.max(user_id, user.id)
                  }, err => {
                    if (err) callback(error.serv(err));
                    else callback();
                    func(!err);
                  });
                } else if (res === (user_id < user.id ? 4 : 5) || res === 6) {
                  callback(new error(11, "users.in.black"));
                }
              } else {
                that.db.insert("relations", {
                  user_id_1: Math.min(user_id, user.id),
                  user_id_2: Math.max(user_id, user.id),
                  status: user_id < user.id ? 2 : 1
                }, err => {
                  if (err) callback(error.serv(err));
                  else callback();
                  func(!err);
                });
              }
            }
          });
      });
    };

    users.prototype.friendsDelete = function (user_id, token, callback) {
      this.createAction(token, "friends.delete", "friends", callback, (user, func, that) => {
        if (user_id === user.id) {
          callback(new error(15, "users.can.not.delete.friends.self"));
          func(false);
        } else {
          __func000(user_id, user.id, that, (err, res) => {
            if (err) {
              callback(error.serv(err));
              func(false);
            } else if (res !== null && res !== undefined) {
              if (res === 0) {
                that.db.update("relations", {
                  status: user_id < user.id ? 1 : 2,
                  "$$where": "user_id_1 = " + Math.min(user_id, user.id) + " AND " + "user_id_2 = " + Math.max(user_id, user.id)
                }, err => {
                  if (err) callback(error.serv(err));
                  else callback(undefined);
                  func(!err);
                });
              } else if (res === (user_id < user.id ? 2 : 1)) {
                that.db.update("relations", {
                  status: 3,
                  "$$where": "user_id_1 = " + Math.min(user_id, user.id) + " AND " + "user_id_2 = " + Math.max(user_id, user.id)
                }, err => {
                  if (err) callback(error.serv(err));
                  else callback(undefined);
                  func(!err);
                });
              } else {
                callback(undefined);
                func(true);
              }
            } else {
              callback(undefined);
              func(true);
            }
          });
        }
      });
    };

    function __func004(user_id, that, callback) {
      that.db.select("relations", {where: "status = 0 AND (user_id_1 = " + user_id + " OR user_id_2 = " + user_id + ")"}, (err, res) => {
        if (err) {
          callback(error.serv(err));
        } else {
          let ids = new Array(res.length);
          for (let i = 0; i < res.length; i++) {
            if (res[i].user_id_1 == user_id) ids[i] = res[i].user_id_2;
            else ids[i] = res[i].user_id_1;
          }
          callback(undefined, ids);
        }
      });
    }

    users.prototype.friendsGet = function (user_id, token, callback) {
      this.createAction(token, "friends.get", "friends", callback, (user, end, that) => {
        user_id = (user_id < 0 ? user.id : user_id);
        __func001(user_id, user.id, that, (err, res) => {
          if (err) {
            if (err.code == 10) {
              __func004(user.id, that, (err0, res0) => {
                if (err0) callback(err0);
                else callback(undefined, res0);
                end(!err0);
              });
              end(true);
            } else {
              callback(err);
              end(false);
            }
          } else {
            if (res === "all_black" || res === "black") {
              callback(new error(11, "users.in.black"));
              end(false);
            } else if (res === "friend") {
              __func004(user_id, that, (err0, res0) => {
                if (err0) callback(err0);
                else callback(undefined, res0);
                end(!err0);
              });
            } else {
              __func003(user_id, that, (err, res) => {
                if (err) {
                  callback(err);
                  end(false);
                } else {
                  if (res.closed) {
                    callback(new error(12, "users.closed"));
                    end(false);
                  } else __func004(user_id, that, (err0, res0) => {
                    if (err0) callback(err0);
                    else callback(undefined, res0);
                    end(!err0);
                  });
                }
              })
            }
          }
        });
      });
    };

    /*users.prototype.firendsGetRequests = function(offset, count, out, token, callback) {

    };*/

    users.prototype.friendsGetSendRequest = function (token, callback) {
      this.createAction(token, "friends.getSendRequest", "friends", callback, (user, end, that) => {
        that.db.select("relations", {where: "(user_id_1 = " + user.id + " AND status = 1) OR (user_id_2 = " + user.id + " AND status = 2)"}, (err, res) => {
          if (err) {
            callback(error.serv(err));
            end(false);
          } else {
            let ids = new Array(res.length);
            for (let i = 0; i < res.length; i++) {
              if (res[i].user_id_1 == user.id) ids[i] = res[i].user_id_2;
              else ids[i] = res[i].user_id_1;
            }
            callback(undefined, ids);
          }
        });
      });
    };

    users.prototype.friendsGetGetRequest = function (token, callback) {
      this.createAction(token, "friends.getGetRequest", "friends", callback, (user, end, that) => {
        that.db.select("relations", {where: ["(user_id_1 = ", user.id, " AND status = 2) OR (user_id_2 = ", user.id, " AND status = 1)"]}, (err, res) => {
          if (err) {
            callback(error.serv(err));
            end(false);
          } else {
            let ids = new Array(res.length);
            for (let i = 0; i < res.length; i++) {
              if (res[i].user_id_1 == user.id) ids[i] = res[i].user_id_2;
              else ids[i] = res[i].user_id_1;
            }
            callback(undefined, ids);
          }
        });
      });
    };

    users.prototype.photosAdd = function (photo, access, token, callback) {
      this.createAction(token, "photos.add", "photos", callback, (user, end, that) => {
        if (photo.data) photo = photo.data;
        let tmp = gm(photo);
        tmp.size((err, val) => {
          if (err) {
            callback(error.serv(err));
            end(false);
          } else {
            tmp.format((err0, val0) => {
              if (err0) {
                callback(new error(16, "photo.wrong.format"));
                end(false);
              } else {
                let w = val.width;
                let h = val.height;
                let aspect = w / h;

                let photo_s = gm(photo);
                let photo_m = gm(photo);
                let photo_x = gm(photo);
                let photo_o = gm(photo);
                let photo_p = gm(photo);
                let photo_q = gm(photo);
                let photo_r = gm(photo);
                let photo_y = gm(photo);
                let photo_z = gm(photo);
                let photo_w = gm(photo);


                photo_s = w > h ? photo_s.resize(Math.min(75, w), Math.min(75, w) / aspect) : photo_s.resize(Math.min(75, h) * aspect, Math.min(75, h));
                photo_m = w > h ? photo_m.resize(Math.min(130, w), Math.min(130, w) / aspect) : photo_m.resize(Math.min(130, h) * aspect, Math.min(130, h));
                photo_x = w > h ? photo_x.resize(Math.min(604, w), Math.min(604, w) / aspect) : photo_x.resize(Math.min(604, h) * aspect, Math.min(604, h));
                photo_o = aspect <= 1.5 ? photo_o.resize(Math.min(130, w), Math.min(130, w) / aspect) : photo_o.clip(Math.min(130, w), Math.min(130, w) / 1.5, 0, 0);
                photo_p = aspect <= 1.5 ? photo_p.resize(Math.min(200, w), Math.min(200, w) / aspect) : photo_p.clip(Math.min(200, w), Math.min(200, w) / 1.5, 0, 0);
                photo_q = aspect <= 1.5 ? photo_q.resize(Math.min(320, w), Math.min(320, w) / aspect) : photo_q.clip(Math.min(320, w), Math.min(320, w) / 1.5, 0, 0);
                photo_r = aspect <= 1.5 ? photo_r.resize(Math.min(510, w), Math.min(510, w) / aspect) : photo_r.clip(Math.min(510, w), Math.min(510, w) / 1.5, 0, 0);
                photo_y = w > h ? photo_y.resize(Math.min(807, w), Math.min(807, w) / aspect) : photo_y.resize(Math.min(807, h) * aspect, Math.min(807, w));
                photo_z = photo_z.resize(Math.min(1080, w), Math.min(1024, Math.min(1080, w) / aspect));
                photo_w = photo_w.resize(Math.min(2560, w), Math.min(2048, Math.min(2560, w) / aspect));

                that.db.insert("photos", {
                  server: that.id,
                  owner: user.id,
                  access: Math.min(3, Math.max(-1, access))
                }, (err1, res1) => {
                  if (err1) {
                    callback(error.serv(err1));
                    end(false);
                  } else {
                    let id = res1[0].insertId;
                    let promises = new Array(10);
                    promises[0] = new Promise((res, rej) => {
                      photo_s.autoOrient().write(path.join(that.photoFolder, id + "_s"), (err) => {
                        if (err) rej(err);
                        else res();
                      });
                    });
                    promises[1] = new Promise((res, rej) => {
                      photo_m.autoOrient().write(path.join(that.photoFolder, id + "_m"), (err) => {
                        if (err) rej(err);
                        else res();
                      });
                    });
                    promises[2] = new Promise((res, rej) => {
                      photo_x.autoOrient().write(path.join(that.photoFolder, id + "_x"), (err) => {
                        if (err) rej(err);
                        else res();
                      });
                    });
                    promises[3] = new Promise((res, rej) => {
                      photo_o.autoOrient().write(path.join(that.photoFolder, id + "_o"), (err) => {
                        if (err) rej(err);
                        else res();
                      });
                    });
                    promises[4] = new Promise((res, rej) => {
                      photo_p.autoOrient().write(path.join(that.photoFolder, id + "_p"), (err) => {
                        if (err) rej(err);
                        else res();
                      });
                    });
                    promises[5] = new Promise((res, rej) => {
                      photo_q.autoOrient().write(path.join(that.photoFolder, id + "_q"), (err) => {
                        if (err) rej(err);
                        else res();
                      });
                    });
                    promises[6] = new Promise((res, rej) => {
                      photo_r.autoOrient().write(path.join(that.photoFolder, id + "_r"), (err) => {
                        if (err) rej(err);
                        else res();
                      });
                    });
                    promises[7] = new Promise((res, rej) => {
                      photo_y.autoOrient().write(path.join(that.photoFolder, id + "_y"), (err) => {
                        if (err) rej(err);
                        else res();
                      });
                    });
                    promises[8] = new Promise((res, rej) => {
                      photo_z.autoOrient().write(path.join(that.photoFolder, id + "_z"), (err) => {
                        if (err) rej(err);
                        else res();
                      });
                    });
                    promises[9] = new Promise((res, rej) => {
                      photo_w.autoOrient().write(path.join(that.photoFolder, id + "_w"), (err) => {
                        if (err) rej(err);
                        else res();
                      });
                    });
                    Promise.all(promises).then(res => {
                      callback(undefined, id);
                      end(true)
                    }, err => {
                      callback(err);
                      end(false)
                    });
                    //TODO: create handler for memory error with enough space and send photo next server. If it is last server in db send for first server.
                  }
                });
              }
            });
          }
        });
      });
    };

    users.prototype.photosDelete = function (photo_id, token, callback) {
      this.createAction(token, "photos.delete", "photos", callback, (user, end, that) => {
        that.db.select("photos", {where: "id = " + photo_id}, (err, res) => {
          if (err) {
            callback(error.serv(err));
            end(false);
          } else if (res && res.length > 0 && res[0]) {
            if (user.id == res.owner) {
              that.db.update("photos", {deleted: 1, "$$where": "id = " + photo_id}, (err) => {
                if (err) {
                  callback(error.serv(err));
                  end(false);
                } else {
                  callback(undefined);
                  end(true);
                }
              });
            } else {
              callback(new error(23, "users.have.not.permissions"));
              end(false);
            }
          } else {
            callback(new error(17, "photo.not.find"));
            end(false);
          }
        });
      });
    };

    function __func005(photo_id, user_id, that, callback) {
      that.db.select("photos", {where: "id = " + photo_id}, (err, res) => {
        if (err) {
          callback(error.serv);
        } else if (res && res.length > 0 && res[0]) {
          if (res[0].deleted[0]) {
            callback(new error(17, "photo.not.find"));
          } else if (res[0].owner == user_id) {
            callback(undefined, res[0]);
          } else {
            switch (res[0].access[0]) {
              case 0:
                callback(new error(23, "users.have.not.permissions"));
                break;
              case 1:
                __func001(user.id, res[0].owner, that, (err0, res0) => {
                  if (err0) {
                    callback(err0);
                  } else {
                    if (res0 === "friend") {
                      callback(undefined, res[0]);
                    } else {
                      callback(new error(23, "users.have.not.permissions"));
                    }
                  }
                });
                break;
              case 2:
                __func004(user_id, that, (err0, res0) => {
                  if (err0) {
                    callback(err0);
                  } else {
                    __func004(res[0].owner, that, (err1, res1) => {
                      if (err1) {
                        callback(err1);
                      } else {
                        for (let obj of res0) {
                          if (res1.binarySearch(obj) > -1) {
                            callback(undefined, res[0]);
                            return;
                          }
                        }
                        callback(new error(23, "users.have.not.permissions"));
                      }
                    });
                  }
                });
                break;
              case 3:
                callback(undefined, res[0]);
                break;
              default:
                callback(new error(17, "photo.not.find"));
                break;
            }
          }
        } else {
          callback(new error(17, "photo.not.find"));
        }
      });
    }

    users.prototype.getPhoto = function (photo_name, key) {
      if (key === this.key) {
        try {
          return fs.createReadStream(path.join(this.photoFolder, photo_name));
        } catch (_err) {
        }
      }
      return false;
    };

    users.prototype.photosGet = function (photo_id, type, token, callback) {
      this.createAction(token, "photos.get", "photos", callback, (user, end, that) => {
        if (typeof type != "string" && !(type instanceof String)) {
          callback(new error(24, "photo.wrong.type"));
        } else {
          type = type.toLowerCase();
          if (type !== "s" &&
            type !== "m" &&
            type !== "x" &&
            type !== "o" &&
            type !== "p" &&
            type !== "q" &&
            type !== "r" &&
            type !== "y" &&
            type !== "z" &&
            type !== "w") {
            callback(new error(24, "photo.wrong.type"));
          } else {
            if (photo_id == -1) {
              callback(undefined, fs.createReadStream(path.join(that.folder, "images", "0.jpeg"))); // "not_photo_" + type
            } else
              __func005(photo_id, user.id, that, (err, res) => {
                if (err) callback(err);
                else if (res) {
                  if (res.server == that.id) {
                    let file = path.join(that.photoFolder, res.id + "_" + type);
                    if (fs.existsSync(file)) {
                      callback(undefined, fs.createReadStream(file));
                    } else
                      callback(undefined, fs.createReadStream(path.join(that.folder, "images", "0.jpeg")));
                    end(true);
                  } else {
                    that.db.select("servers", {where: "id = " + res.server}, (err0, res0) => {
                      if (err0) {
                        callback(error.serv(err0));
                        end(false);
                      } else if (res && res.length > 0 && res[0]) {
                        callback(undefined, undefined, res0.ip, res0.key, res.id + "_" + type);
                        end(true);
                      } else {
                        callback(new error(17, "photo.not.find"));
                        end(false);
                      }
                    })
                  }
                }
              });
          }
        }
      });
    };

    users.prototype.photosSetTarget = function (photo_id, target, token, callback) {
      this.createAction(token, "photos.setTarget", "photos", callback, (user, end, that) => {
        switch (target) {
          case 1:
          case "1":
            that.db.select("photos", {where: "id = " + photo_id}, (err, res) => {
              if (err) {
                callback(error.serv(err));
                end(false);
              } else {
                if (user.id == res[0].owner) {
                  if (res[0].access[0] != 3) {
                    that.db.update("photos", {status: 3, "$$where": "id = " + photo_id}, (err0) => {
                      if (err0) {
                        callback(error.serv(err0));
                        end(false);
                      } else {
                        that.db.createRequest("INSERT INTO avatars(user_id, photo_id) VALUES(" + user.id + "," + photo_id + ") ON DUPLICATE KEY UPDATE photo_id = " + photo_id + ";", (err, res) => {
                          if (err) {
                            callback(error.serv(err));
                          } else callback(undefined);
                          end(!err);
                        });
                      }
                    });
                  } else {
                    that.db.createRequest("INSERT INTO avatars(user_id, photo_id) VALUES(" + user.id + "," + photo_id + ") ON DUPLICATE KEY UPDATE photo_id = " + photo_id + ";", (err, res) => {
                      if (err) {
                        callback(error.serv(err));
                      } else callback(undefined);
                      end(!err);
                    });
                  }
                } else {
                  callback(new error(23, "users.have.not.permissions"));
                  end(false);
                }
              }
            });
            break;
          default:
            callback(new error(25, "photo.wrong.target"));
            end(false);
            break;
        }
      });
    };

    users.prototype.photosGetTarget = function (user_id, target, token, callback) {
      this.createAction(token, "photos.getTarget", "photos", callback, (user, end, that) => {
        user_id = (user_id < 0 ? user.id : user_id);
        switch (target) {
          case 1:
          case "1":
            that.db.select("avatars", {where: "user_id = " + user_id}, (err, res) => {
              if (err) {
                callback(error.serv(err));
                end(false);
              } else if (res && res.length > 0 && res[0]) {
                callback(undefined, res[0].photo_id);
                end(true);
              } else {
                callback(undefined, -1);
                end(true);
              }
            });
            break;
          default:
            callback(new error(25, "photo.wrong.target"));
            end(false);
            break;
        }
      });
    };

    function __func006(user_id, peer_id, that, callback) { // Get object `users_peers` in database
      that.db.select("users_peers", {where: "user_id = " + user_id + " AND peer_id = " + peer_id}, (err, res) => {
        if (err) callback(error.serv(err));
        else {
          callback(undefined, res ? res[0] : res);
        }
      });
    }

    function __func007(name, photo_id, that, callback) { // Create object `peers` in database
      if (name) {
        that.db.insert("peers", {
          name: name,
          photo_id: photo_id,
          create_date: Math.floor(Date.now() / 1000)
        }, (err, res) => {
          if (err) {
            if (err.code == 1406) callback(new error(36, "string.too.long"));
            else callback(error.serv(err));
          } else
            callback(undefined, res[0].insertId);
        });
      } else callback(new error(20, "users.wrong.data"));
    }

    function __func008(text, owner, type, that, callback) { // Create object `messages` in database
      if (text && owner) {
        that.db.insert("messages", {
          text: text,
          date: Math.floor(Date.now() / 1000),
          owner: owner,
          type: type
        }, (err, res) => {
          if (err) {
            if (err.code == 1406) callback(new error(36, "string.too.long"));
            else callback(error.serv(err));
          } else callback(undefined, res[0].insertId);
        });
      } else callback(new error(20, "users.wrong.data"));
    }

    function __func009(user_id, peer_id, is_admin = false, that, callback) { // Adding peer to users peers in database
      if (user_id && peer_id) {
        that.db.insert("users_peers", {user_id: user_id, peer_id: peer_id, is_admin: !!is_admin}, (err) => {
          if (err) {
            if (err.code == 1062) callback(new error(37, "messages.user.already.have.this.peer"));
            else callback(error.serv(err));
          } else callback();
        });
      } else callback(new error(20, "users.wrong.data"));
    }

    function __func010(peer_id, message_id, that, callback) { // Send message to peers (peers_messages)
      if (peer_id && message_id) {
        that.db.insert("peers_messages", {peer_id: peer_id, message_id: message_id}, (err) => {
          if (err) callback(error.serv(err));
          else callback();
        });
      } else callback(new error(20, "users.wrong.data"));
    }

    function __func011(user_id, message_id, type = 0, that, callback) { // Send message to user (users_messages)
      if (user_id && message_id) {
        that.db.insert("users_messages", {user_id: user_id, message_id: message_id, type: type}, (err) => {
          if (err) callback(error.serv(err));
          else callback();
        });
      } else callback(new error(20, "users.wrong.data"));
    }

    function __func012(peer_id, message_id, owner, that, callback) { // Send message to all in peer
      if (peer_id && message_id && owner) {
        __func010(peer_id, message_id, that, (err) => {
          if (err) callback(err);
          else that.db.select("users_peers", {where: ["peer_id = ", peer_id, " AND `leaved` = b'0' AND `banned` = b'0'"]}, (err0, res0) => {
            if (err0) callback(error.serv(err0));
            else {
              let promises = [];
              for (let obj of res0) {
                promises.push(new Promise((res, rej) => {
                  if (obj.user_id != owner) {
                    __func011(obj.user_id, message_id, 0, that, (err) => {
                      if (err) rej(err);
                      else res();
                    });
                  } else {
                    __func011(obj.user_id, message_id, 1, that, (err) => {
                      if (err) rej(err);
                      else res();
                    });
                  }
                }));
              }
              Promise.all(promises).then(res => callback(), callback);
            }
          });
        });
      } else callback(new error(20, "users.wrong.data"));
    }

    function __func013(message_id, that, callback, reply = 0) { // Get message
      if (reply > 50) callback();
      that.db.select("messages", {where: ["`id` = '", message_id, "'"]}, (err, res) => {
        if (err) callback(error.serv(err));
        else {
          that.db.select("peers_messages", {where: ["`message_id` = '", res[0].id, "'"]}, (err0, res0) => {
            if (err0) callback(error.serv(err0));
            else {
              that.db.select("reply_messages", {where: ["`message_id` = '", res[0].id, "'"]}, (err1, res1) => {
                if (err1) callback(error.serv(err1));
                else {
                  that.db.select("messages_photo", {
                    filters: "`photo_id`",
                    where: ["`message_id` = '", res[0].id, "'"]
                  }, (err2, res2) => {
                    if (err2) callback(error.serv(err2));
                    else {
                      let photosIds = [];
                      for (let obj of res2) {
                        photosIds.push(obj.photo_id);
                      }
                      photosIds.sort((a, b) => {
                        return a - b;
                      });
                      let promises = [];
                      let reply_messages = [];
                      for (let obj of res1) {
                        promises.push(new Promise((res3, rej3) => {
                          __func013(obj.reply_id, that, (err4, res4) => {
                            if (err4) rej3(err4);
                            else {
                              if (res4) reply_messages.push(res4);
                              res3();
                            }
                          }, reply + 1);
                        }));
                      }
                      Promise.all(promises).then(res3 => {
                        reply_messages.sort((a, b) => {
                          return a.date - b.date;
                        });

                        callback(undefined, {
                          text: res[0].text,
                          date: res[0].date,
                          owner: res[0].owner,
                          type: res[0].type ? res[0].type[0] : undefined,
                          peerId: res0[0].peer_id,
                          chatMessageId: res0[0].message_chat_local_id,
                          readInChat: res0[0].read ? res0[0].read[0] : undefined,
                          replyMessages: reply_messages,
                          photosIds: photosIds
                        });
                      }, callback);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    users.prototype.messagesCreateChat = function (name, users_ids, token, callback) {
      this.createAction(token, "messages.createChat", "messages", callback, (user, end, that) => {
        let all = true;
        let promises = [];
        for (let obj of users_ids) {
          promises.push(new Promise((res, rej) => {
            __func000(user.id, obj, that, (err0, res0) => {
              if (err0) rej(err0);
              else {
                if (res0 > 0) all = false;
                res();
              }
            });
          }));
        }
        Promise.all(promises).then(res => {
          if (!all) {
            callback(new error(31, "messages.wrong.user"));
            end(all);
          }
          else {
            __func007(name, null, that, (err0, res0) => {
              if (err0) {
                callback(err0);
                end(!err0);
              }
              else {
                let promises0 = [];
                promises0.push(new Promise((res, rej) => {
                  __func009(user.id, res0, true, that, (err1) => {
                    if (err1) rej(err1);
                    else res();
                  });
                }));
                for (let obj of users_ids) {
                  promises0.push(new Promise((res, rej) => {
                    that.db.insert("users_peers", {user_id: obj, peer_id: res0, is_admin: false}, err1 => {
                      if (err1) rej(error.serv(err1));
                      else
                        res();
                    });
                  }));
                }
                Promise.all(promises0).then(res => {
                  __func008(name, user.id, 1, that, (err1, res1) => {
                    if (err1) {
                      callback(err1);
                      end(false);
                    } else
                      __func012(res0, res1, user.id, that, (err2) => {
                        if (err2) callback(err2);
                        else callback(undefined, res1);
                        end(!err2);
                      });
                  });
                }, (err) => {
                  end(!err);
                  callback(err);
                });
              }
            });
          }
        }, callback);
      });
    };

    users.prototype.messagesAddUserToChat = function (user_id, peer_id, is_admin, token, callback) {
      this.createAction(token, "messages.addUserToChar", "messages", callback, (user, end, that) => {
        __func006(user.id, peer_id, that, (err0, res0) => {
          if (err0) {
            callback(err0);
            end(false);
          } else if (!res0) {
            callback(new error(23, "users.have.not.permissions"));
            end(false);
          } else if (!res0.is_admin[0]) {
            callback(new error(33, "messages.you.not.admin"));
            end(false);
          } else {
            __func000(user.id, user_id, that, (err1, res1) => {
              if (err1) {
                callback(err1);
                end(false);
              }
              if (res1 > 0) {
                callback(new error(31, "messages.wrong.user"));
                end(false);
              } else {
                __func006(user_id, peer_id, that, (err2, res2) => {
                  if (err2) {
                    callback(err2);
                    end(false);
                  } else if (!res2) {
                    __func009(user_id, peer_id, false, that, (err3) => {
                      if (err3) {
                        callback(err3);
                        end(false);
                      } else {
                        __func008(user_id, user.id, 2, that, (err4, res4) => {
                          if (err4) {
                            callback(err4);
                            end(false);
                          } else {
                            __func012(peer_id, res4.insertId, user.id, that, callback);
                          }
                        });
                      }
                    });
                  } else if (!res2.leaved[0]) {
                    if (!res2.banned[0]) {
                      callback(new error(34, "messages.user.in.dialog"));
                      end(false);
                    } else {
                      that.db.update("users_peers", {
                        "$$where": ["user_id = ", user_id, " AND peer_id = ", peer_id],
                        banned: false
                      }, (err3) => {
                        if (err3) callback(error.serv(err3));
                        else callback(undefined);
                        end(!err3);
                      });
                    }
                  } else {
                    callback(new error(23, "users.have.not.permissions"));
                    end(false);
                  }
                });
              }
            });
          }
        });
      });
    };

    users.prototype.messagesDeleteUserFromChat = function (user_id, peer_id, token, callback) {
      this.createAction(token, "messages.deleteUserFromChat", "messages", callback, (user, end, that) => {
        if (user.id == user_id) callback(new error(10, "users.can.not.status.self"));
        else __func006(user.id, peer_id, that, (err0, res0) => {
          if (err0) {
            callback(err0);
            end(false);
          } else if (!res0) {
            callback(new error(23, "users.have.not.permissions"));
            end(false);
          } else if (!res0.is_admin[0]) {
            callback(new error(33, "messages.you.not.admin"));
            end(false);
          } else {
            __func006(user_id, peer_id, that, (err1, res1) => {
              if (err1) {
                callback(err1);
                end(false);
              } else if (!res1) {
                callback(new error(35, "messages.user.not.in.dialog"));
                end(false);
              } else {
                that.db.update("users_peers", {
                  "$$where": ["user_id = ", user_id, " AND peer_id = ", peer_id],
                  banned: true
                }, (err2) => {
                  if (err2) callback(error.serv(err2));
                  else callback(undefined);
                  end(!err2);
                });
              }
            });
          }
        })
      });
    };

    users.prototype.messagesLeaveFromChat = function (peer_id, token, callback) {
      this.createAction(token, "messages.leaveFromChat", "messages", callback, (user, end, that) => {
        that.db.update({"$$where": ["user_id = ", user.id, " AND peer_id = ", peer_id], leaved: true}, (err0) => {
          if (err0) callback(err0);
          else callback(undefined);
          end(!err0);
        });
      });
    };

    users.prototype.messagesAddToChat = function (peer_id, token, callback) {
      this.createAction(token, "messages.addToChat", "messages", callback, (user, end, that) => {
        __func006(user.id, peer_id, that, (err0, res0) => {
          if (err0) {
            callback(err0);
            end(false);
          } else if (!res0 || (res0 && res0.banned[0])) {
            callback(new error(23, "users.have.not.permissions"));
            end(false);
          } else if (!res0.leaved[0]) {
            callback(new error(34, "messages.user.in.dialog"));
            end(false);
          } else {
            that.db.update("users_peers", {
              "$$where": ["user_id = ", user.id, " AND peer_id = ", peer_id],
              leaved: false
            }, (err1) => {
              if (err1) callback(err1);
              else callback(undefined);
              end(!err1);
            });
          }
        });
      });
    };

    users.prototype.messagesGetAllChats = function (offset = 0, count = 20, token, callback) {
      this.createAction(token, "messages.getAllChats", "messages", callback, (user, end, that) => {

        //select c.peer_id, d.* from (select a.peer_id, max(b.message_id) as max_id from (select * from users_peers where user_id = 1) a left join (select * from peers_messages) b on a.peer_id = b.peer_id group by a.peer_id) c left join (select * from messages) d on c.max_id = d.id ORDER by -date asc, peer_id desc;

        that.db.createRequest("SELECT `peer_id` FROM (SELECT `peer_id`, MAX(`c`.`message_id`) AS `max_id` FROM `peers_messages` JOIN (SELECT * FROM `users_messages` WHERE `user_id` = '" + user.id + "') `c` ON `peers_messages`.`message_id` = `c`.`message_id` GROUP BY `peer_id`) `a` JOIN (SELECT * FROM `messages`) `b` ON `a`.`max_id` = `b`.`id` ORDER BY `date` DESC LIMIT " + offset + "," + count,
          (err, res) => {
            if (err) callback(error.serv(err));
            else callback(undefined, res);
            end(!err);
          });
      });
    };

    users.prototype.messagesGetChatById = function (peer_id, token, callback) {
      this.createAction(token, "messages.getChatById", "messages", callback, (user, end, that) => {
        __func006(user.id, peer_id, that, (err, res) => {
          if (err) {
            callback(err);
            end(false);
          } else if (res && res.peer_id) {
            that.db.select("peers", {where: ["id = '", res.peer_id, "'"]}, (err0, res0) => {
              if (err0) {
                callback(error.serv(err0));
                end(false);
              } else {
                that.db.createRequest("SELECT MAX(`message_chat_local_id`) AS `maxChatId`, MAX(`message_user_local_id`) AS `maxUserId`, MIN(`message_user_local_id`) AS `minUserId` FROM (SELECT * FROM `peers_messages` WHERE `peer_id` = '" + res.peer_id + "') `a` JOIN (SELECT * FROM `users_messages` WHERE `user_id` = '" + user.id + "') `b` USING(`message_id`);", (err1, res1) => {
                  if (err1) {
                    callback(error.serv(err1));
                    end(false);
                  } else {
                    that.db.select("users_peers", {where: ["`peer_id` ='", res.peer_id, "'"]}, (err2, res2) => {
                      if (err2) {
                        callback(error.serv(err2));
                        end(false);
                      } else {
                        let shortInformation = false;
                        let isAdmin = false;
                        let members = [];
                        let banned = [];
                        for (let obj of res2) {
                          if (obj.user_id == user.id) {
                            if (obj.leaved[0] || obj.banned[0]) shortInformation = true;
                            if (obj.is_admin[0]) isAdmin = true;
                          } else if (!obj.leaved[0] && !obj.banned[0]) members.push(obj.user_id);
                          else if (obj.banned[0]) banned.push(obj.user_id);
                        }
                        let obj = {
                          id: res.peer_id,
                          name: res0[0].name,
                          photoId: res0[0].photo_id,
                          createDate: res0[0].create_date,
                          firstUserMessageId: res1[0].minUserId,
                          lastUserMessageId: res1[0].maxUserId,
                          haveAdmin: isAdmin,
                        };

                        if (!shortInformation) {
                          obj.lastChatMessageId = res1[0].maxChatId;
                          obj.membersIds = members;
                          if (isAdmin) {
                            obj.bannedIds = banned;
                          }
                        }

                        callback(undefined, obj);
                      }
                    });
                  }
                });
              }
            });
          } else {
            callback(new error(23, "users.have.not.permissions"));
            end(false);
          }
        });
      });
    };

    users.prototype.messagesGetById = function (users_message_id, token, callback) {
      this.createAction(token, "messages.getById", "messages", callback, (user, end, that) => {
        that.db.select("users_messages", {where: ["`user_id` = '", user.id, "' AND `message_user_local_id` = '", users_message_id, "'"]}, (err, res) => {
          if (err) {
            callback(error.serv(err));
            end(false);
          } else {
            __func013(res[0].message_id, that, (err0, res0) => {
              if (err0)
                callback(err0);
              else {
                res0.readInChat = !!res0.readInChat;
                res0.userMessageId = users_message_id;
                res0.incoming = !res[0].type[0];
                res0.read = res[0].read && res[0].type[0] != 1 ? !!res[0].read[0] : undefined;
                callback(undefined, res0);
              }
              end(!err0);
            });
          }
        });
      });
    };

    users.prototype.messagesGetByPeerMessageId = function (peer_id, peer_message_id, token, callback) {
      this.createAction(token, "messages.getByPeerMessageId", "messages", callback, (user, end, that) => {
        that.db.select("peers_messages", {where: ["`peer_id` = '", peer_id, "' AND `message_chat_local_id` = '", peer_message_id, "'"]}, (err, res) => {
          if (err) {
            callback(error.serv(err));
            end(false);
          } else {
            __func013(res[0].message_id, that, (err0, res0) => {
              if (err0) {
                callback(err0);
                end(false);
              } else {
                that.db.select("users_messages", {where: ["`user_id` = '", user.id, "' AND `message_id` = '", res[0].message_id, "'"]}, (err1, res1) => {
                  if (err1) callback(error.serv(err1));
                  else {
                    res0.userMessageId = res1[0].message_user_local_id;
                    res0.read = res1[0].read ? res1[0].read[0] : undefined;
                    callback(undefined, res0);
                  }
                  end(!err1);
                });
              }
            });
          }
        });
      });
    };

    users.prototype.messagesSendMessage = function (peer_id, text, reply_ids, photo_ids, token, callback) {
      this.createAction(token, "messages.sendMessage", "messages", callback, (user, end, that) => {
        __func008(text, user.id, 0, that, (err, res) => {
          if (err) {
            callback(err);
            end(false);
          } else {
            let promises = [];
            for (let obj of reply_ids) {
              promises.push(new Promise((res0, rej0) => {
                that.db.select("users_messages", {where: ["`user_id` = '", user.id, "' AND `message_user_local_id` = '", obj, "'"]}, (err1, res1) => {
                  if (err1 || !res1 || (res1 && res1.length < 1)) rej0(error.serv(err1));
                  else {
                    that.db.insert("reply_messages", {message_id: res, reply_id: res1[0].message_id}, (err2, res2) => {
                      if (err2) rej0(error.serv(err2));
                      else res0();
                    });
                  }
                });
              }));
            }
            for (let obj of photo_ids) {
              promises.push(new Promise((res0, rej0) => {
                that.db.insert("messages_photo", {message_id: res, photo_id: obj}, (err1) => {
                  if (err1) rej0(error.serv(err1));
                  else res0();
                });
              }));
            }

            Promise.all(promises).then(res0 => {
              __func012(peer_id, res, user.id, that, (err1, res1) => {
                if (err1) callback(err1);
                else callback();
                end(!err1);
              }, err0 => {
                callback(err0);
                end(false);
              });
            });
          }
        });
      });
    };

    users.prototype.messagesMarkAsRead = function (users_message_id, token, callback) {
      this.createAction(token, "messages.markAsRead", "messages", callback, (user, end, that) => {
        that.db.select("users_messages", {where: ["`message_user_local_id` = '", users_message_id, "' AND `user_id` = '", user.id, "'"]}, (err0, res0) => {
          if (err0) {
            callback(error.serv(err0));
            end(false);
          } else if (res0[0].type[0] != 1) {
            that.db.update("users_messages", {
              read: 1,
              "$$where": ["`message_id` = '", res0[0].message_id, "' AND (`user_id` = '", user.id, "' OR `type` = '1')"]
            }, (err1) => {
              if (err1) {
                callback(error.serv(err1));
                end(false);
              } else {
                that.db.update("peers_messages", {
                  read: 1,
                  "$$where": ["`message_id` = '", res0[0].message_id, "'"]
                }, (err2) => {
                  if (err2) callback(error.serv(err2));
                  else callback();
                  end(!err2);
                });
              }
            });
          } else callback();
        });
      });
    };

    function __func014(string) {

    }

    users.prototype.getUserActions = function (start_action_id, token, callback) {
      let that = this;
      this.validToken(token, (err, res) => {
        if (err) callback(err);
        else {
          that.db.select("users_actions", {where: ["`user_id` = '", res.user_id, "' AND `user_action_id` > '", start_action_id, "'"]}, (err0, res0) => {
            if (err0 || res0 === undefined || res0 === null) callback(err0 ? error.serv(err0) : {});
            else if (res0.length > 0) {
              callback(res0);
            }
          });
        }
      });
    };

    return global.LiveLib.userEngine;
  } catch (err) {
    global.LiveLib.getLogger().errorm("User Engine", "[[main]] => ", err);
  }
};

module.exports = live_lib_userEngine;
