let live_lib_database = function (settings) {
  try {
    if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
    if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;

    let base = global.LiveLib.base;
    global.LiveLib.loadLiveModule("logging");


    global.LiveLib.database = function (host, user, password, port, database, pools, callback, e, handler_end, handler_connect) {
      this.connect = false;
      this.connection = null;
      this.stackOfActions = [];
      this.usePool = false;
      if (host && user && password) {
        this.connectTo(host, user, password, port, database, pools, callback, e, handler_end, handler_connect);
      }
    };

    let db = global.LiveLib.database;

    base.createClass(db);

    db.SQLError = function (code, message) {
      this.name = "SQLError";
      this.message = message || "Unknowns error in sql";
      this.code = code || -1;
      Error.captureStackTrace(this, this.constructor);
      //this.stack = (new Error()).stack;
    };

    base.createClass(db.SQLError, Error);

    db.prototype.postInitFunc = function (handler, callback) {
      this.connect = true;
      let errors = false;
      let stack_length = this.stackOfActions.length;
      for (let i = 0; i < stack_length; i++) {
        if (typeof this.stackOfActions[i] === "function") {
          try {
            this.stackOfActions[i]();
          } catch (err) {
            if (err) {
              errors = true;
              if (handler) handler(err);
              else throw err;
            }
          }
        }
      }
      this.stackOfActions = [];
      this.connect = true;
      if (!errors && callback) callback();
    };

    db.prototype.connectTo = function (host, user, password, port, database, pools, callback, e, handler_end = err => {
      if (err) global.LiveLib.getLogger().errorm("Database", "[[construstor]] => ", err)
    }, handler_connect = err => {
      if (err) global.LiveLib.getLogger().errorm("Database", "[[construstor]] => ", err)
    }) {
      try {
        this.stackOfActions = [];
        this.connect = false;
        this.usePool = !!pools;

        if (this.connection) this.connection.end(handler_end);
        let con_obj = {
          host: host,
          port: port,
          user: user,
          password: password
        };
        this.connection = base.getLib("mysql").createConnection(con_obj);

        this.connection.connect(handler_connect);

        if (database) {
          this.connection.query("CREATE DATABASE IF NOT EXISTS `" + database + "`;", err => {
            if (err) {
              if (callback) callback(err); else global.LiveLib.getLogger().errorm("Database", "Database => createConnection - ", err);
            }
            else {
              if (this.usePool) {
                this.connection.end(handler_end);
                this.connection = base.getLib("mysql").createConnection({
                  host: host,
                  port: port,
                  user: user,
                  password: password,
                  database: database,
                  connectionLimit: pools
                });
                this.postInitFunc(err0 => {
                  if (callback) callback(err0); else global.LiveLib.getLogger().errorm("Database", "Database => createConnection - ", err0);
                });
              } else {
                this.connection.query("USE " + database, err0 => {
                  if (err0) {
                    if (callback) callback(err0); else global.LiveLib.getLogger().errorm("Database", "Database => createConnection -", err0);
                  }
                  else {
                    this.postInitFunc(err0 => {
                      if (callback) callback(err0); else global.LiveLib.getLogger().errorm("Database", "Database => createConnection - ", err0);
                    });
                  }
                });
              }
            }
          });
        } else {
          this.postInitFunc(err0 => {
            if (callback) callback(err0); else global.LiveLib.getLogger().errorm("Database", "Database => createConnection - ", err0);
          });
        }
      } catch (err) {
        if (e || !callback) throw err;
        else callback(err);
      }
    };

    db.prototype.isLoad = function () {
      return this.connect && this.connection;
    };

    db.prototype.createRequest = function (request, ...args) {
      if (!this.isLoad()) {
        let db = this;
        this.stackOfActions.push(function () {
          db.createRequest(request, ...args)
        });
        return true;
      }
      else {
        let index = base.getIndexCallback(args);
        let callback = index > -1 ? args[index] : undefined;
        try {
          global.LiveLib.getLogger().tracem("Database", "createRequest => request: \"", request, "\"; args: ", args);
          this.connection.query(request, args ? args.splice(0, index) : [], (err, res, filds) => {
            if (err) {
              if (callback) callback(new db.SQLError(err.errno, err.sqlMessage));
              else global.LiveLib.getLogger().errorm("Database", "createRequest => Request Error: ", err);
            } else if (callback) callback(null, res, filds);
          });
          return true;
        } catch (err) {
          if (callback) callback(err);
          else throw err;
        }
        return false;
      }
    };

    db.prototype.changeDB = function (database, ...args) {
      let callback = base.getCallback(args);
      try {
        if (this.usePool) {
          let config = this.connection.config.connectionConfig;
          return this.connectTo(config.host, config.user, config.password, config.port, config.pool.config.connectionLimit, config.database, callback, true);
        } else {
          this.createRequest("CREATE DATABASE IF NOT EXISTS `" + database + "`;", err => {
            if (err) {
              if (callback) callback(err); else global.LiveLib.getLogger().errorm("Database", "changeDB => ", err);
            } else {
              this.createRequest("USE `" + database + "`;", err => {
                if (callback) {
                  if (err) callback(err);
                  else callback(null);
                }
              });
            }
          });
          return true;
        }
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    };

    db.prototype.deleteDB = function (database, ...args) {
      let callback = base.getCallback(args);
      try {
        if (database && !this.usePool) {
          return this.createRequest("DROP DATABASE " + database, err => {
            if (err && callback) callback(err);
          });
        }
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    };

    db.prototype.createTable = function (table, ...args) {
      let l = base.getIndexCallback(args);
      let callback = l > 0 ? args[l] : undefined;
      try {
        if (!table || args.length < 1) return false;
        let req = "CREATE TABLE IF NOT EXISTS `" + table + "`(";
        for (let i = 0; i < l; i++) {
          let tmp = args[i];
          if (tmp instanceof String) {
            req += tmp + ",";
          } else {
            req += tmp.name + " " + tmp.type;

            if (tmp.autoincrement)
              req += " AUTO_INCREMENT";

            if (tmp.notnull)
              req += " NOT NULL";

            if (tmp.default)
              req += " DEFAULT " + tmp.default;

            if (tmp.unique && !tmp.unique.length)
              req += " UNIQUE";

            req += ",";

            if (tmp.unique && tmp.unique.length > 0) {
              let tmp0 = "";
              for (let obj of tmp.unique) {
                tmp0 += obj + ",";
              }
              tmp0 += tmp.name;
              req += "UNIQUE (" + tmp0 + "),";
            }

            if (tmp.primary) {
              req += "PRIMARY KEY(" + tmp.name + "),";
            }

            if (tmp.foreign) {
              req += "FOREIGN KEY(" + tmp.name + ") REFERENCES " + tmp.foreign.table + "(" + tmp.foreign.key + "),";
            }
          }
        }
        req = req.substr(0, req.length - 1);
        req += ");";
        return this.createRequest(req, callback);
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    };

    db.prototype.deleteTable = function (table, ...args) {
      let l = base.getIndexCallback(args);
      let callback = l > 0 ? args[l] : undefined;
      try {
        if (!table || args.length < 1) return false;
        return this.createRequest("DELETE TABLE " + table, callback);
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    };

    db.prototype.insert = function (table, ...args) {
      let l = base.getIndexCallback(args);
      let callback = l > 0 ? args[l] : undefined;
      try {
        if (!table || args.length < 1) return false;
        if (l < 1) {
          if (callback) callback(new Error("LiveLib: Module: \"Databases\"::insert - Haven`t enouth arguments!"));
          return false;
        } else {
          let promises = [];
          let errors = [];
          let returns = [];
          for (let i = 0; i < l; i++) {
            if (args[i] instanceof Array && i + 1 < l && args[i + 1] instanceof Array && args[i].length > 0 && args[i + 1].length > 0) {
              let req = "INSERT INTO " + table + "(" + args[i][0];
              for (let j = 1; j < args[i].length; j++) {
                req += "," + args[i][j];
              }
              promises.push(new Promise(resolve => {
                this.createRequest(req + ") VALUES (?);", args[i + 1], (err, res) => {
                  if (err) errors[i] = err;
                  else returns[i] = res;
                  resolve();
                });
              }));
              i++;
            } else if (args[i]) {
              let req = "INSERT INTO " + table + "(";
              let values = [];
              for (let [key, value] of Object.entries(args[i])) {
                if (value !== undefined && value != null) {
                  req += key + ",";
                  values.push(value);
                }
              }
              let tmp0 = req.lastIndexOf(",");
              if (tmp0 > 0) {
                promises.push(new Promise(resolve => {
                  this.createRequest(req.substr(0, tmp0) + ") VALUES (?)", values, (err, res) => {
                    if (err) errors[i] = err;
                    else returns[i] = res;
                    resolve();
                  });
                }));
              } else if (callback) callback(new Error("LiveLib: Module: \"Databases\"::insert - Haven`t enouth arguments!"));
            }
          }
          Promise.all(promises).then(() => {
            if (errors.length > 0) {
              if (callback) callback(errors);
              else {
                global.LiveLib.getLogger().warnm("Database", "insert => Non catched error - ", errors);
              }
            } else if (callback) callback(null, returns);
          });
          return true;
        }
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    };

    db.prototype.select = function (table, settings, callback) {
      try {
        if (!table) return false;
        let req = "SELECT ";

        if (settings && settings.filters) {
          if (settings.filters instanceof Array && settings.filters.length > 0) {
            req += settings.filters[0];
            for (let i = 1; i < settings.filters.length; i++) {
              req += "," + settings.filters[i];
            }
          } else if (typeof settings.filters === "string" || settings.filters instanceof String) {
            req += settings.filters;
          } else req += "*";
        } else req += "*";
        req += " FROM " + table;

        if (settings && settings.where) {
          if (settings.where instanceof Array && settings.where.length > 0) {
            req += " WHERE " + settings.where[0];
            for (let i = 1; i < settings.where.length; i++) {
              req += "," + settings.where[i];
            }
          } else if (typeof settings.where === "string" || settings.where instanceof String) {
            req += " WHERE " + settings.where;
          }
        }

        if (settings && settings.groupBy) {
          if (settings.groupBy instanceof Array && settings.groupBy.length > 0) {
            req += " GROUP BY " + settings.groupBy[0];
            for (let i = 1; i < settings.groupBy.length; i++) {
              req += "," + settings.groupBy[i];
            }
          } else if (typeof settings.groupBy === "string" || settings.groupBy instanceof String) {
            req += " GROUP BY " + settings.groupBy;
          }
        }

        if (settings && settings.having && settings.groupBy) {
          req += " HAVING " + settings.having;
        }

        let offset = settings && settings.offset && settings.limit ? settings.offset : "0";
        if (settings && settings.limit) {
          req += " LIMIT " + offset + "," + settings.limit;
        }

        req += ";";
        return this.createRequest(req, callback);
      } catch (err) {
        if (callback) callback(err);
      }
      return false;
    };

    db.prototype.update = function (table, ...args) {
      let l = base.getIndexCallback(args);
      let callback = l > -1 ? args[l] : undefined;
      try {
        if (!table) return false;
        if (l < 1) {
          if (callback) callback(new Error("LiveLib: Module: \"Databases\"::update - Haven`t enouth arguments!"));
          return false;
        } else {
          let promises = [];
          let errors = [];
          let returns = [];
          for (let i = 0; i < l; i++) {
            if (args[i] instanceof Array && i + 1 < l && args[i + 1] instanceof Array && args[i].length > 0 && args[i + 1].length > 0) {
              let req = "UPDATE " + table + " SET ";
              let where = [];

              for (let j = 0; j < args[i] && j < args[i + 1]; j++) {
                if (args[i][j].toUpperCase() === "$$WHERE") where.push(args[i + 1][j]);
                else {
                  req += args[i][j] + " = \"" + args[i + 1][j] + "\",";
                }
              }

              req = req.substr(0, req.length - 1);
              if (where.length > 0) {
                req += " WHERE " + where[0];
                for (let j = 1; j < where.length; j++) {
                  req += "," + where[j];
                }
              }

              promises.push(new Promise(resolve => {
                this.createRequest(req + ";", (err, res) => {
                  if (err) errors[i] = err;
                  else returns[i] = res;
                  resolve();
                });
              }));

              i++;
            } else if (args[i] instanceof Object) {
              let req = "UPDATE " + table + " SET ";
              let where = [];

              for (let [key, value] of Object.entries(args[i])) {
                if (key.toUpperCase() === "$$WHERE") where.push(value);
                else if (value !== undefined && value != null) {
                  req += key + " = \"" + value + "\", ";
                }
              }
              let tmp0 = req.lastIndexOf(",");
              if (tmp0 > -1) {
                req = req.substr(0, tmp0);
                if (where.length > 0) {
                  req += " WHERE " + where[0];
                  for (let j = 1; j < where.length; j++) {
                    req += "," + where[j];
                  }
                }

                promises.push(new Promise(resolve => {
                  this.createRequest(req + ";", (err, res) => {
                    if (err) errors[i] = err;
                    else returns[i] = res;
                    resolve();
                  });
                }));
              } else errors[i] = new Error("LiveLib: Module: \"Databases\"::insert - Haven`t enouth arguments!");
            }
          }
          Promise.all(promises).then(() => {
            if (errors.length > 0) {
              if (callback) callback(errors);
              else {
                global.LiveLib.getLogger().warnm("Database", "update => Non catched error - ", errors);
              }
            } else if (callback) callback(null, returns);
          });
          return true;
        }
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    };

    global.LiveLib.getLogger().info("LiveLib: Module \"Databases\" loaded!");

    return db;
  } catch (err) {
    console.log(err);
  }
  return false;
};

module.exports = live_lib_database;
