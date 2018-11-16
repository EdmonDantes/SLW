var db = async function (settings) {
  try {
    if (!global.LiveLib) require("./live_lib_base")();
    if (!global.LiveLib.db || !global.LiveLib.db.init) {
      global.LiveLib.db = {
        init: true,
        usePool: false,
        loading: true,
        loaded: false,
        postLoad: [],
        Version: "1.0",
      };
    } else return false;

    global.LiveLib.db.SQLError = function (code, message) {
      this.name = "SQLError";
      this.message = message || "Unknowns error in sql";
      this.code = code || -1;
      this.stack = (new Error()).stack;
    }

    global.LiveLib.createClass(global.LiveLib.db.SQLError, Error);

    global.LiveLib.db.SQLError.prototype.toString = function () {
      return this.name + ": #" + this.code + "\nMessage: " + this.message + "\nStack: " + this.stack;
    }

    global.LiveLib.db.__POST_LOAD = function (callback, handler) {
      try {
        if (!global.LiveLib.db.usePool) {
          global.LiveLib.db.connection.on("error", err => {
            if (err)
              if (callback) callback(err);
              else global.LiveLib.getLogger().erorrm("Database", "Connection Error: ", err);
          });
        }
        global.LiveLib.db.loaded = true;
        let length = global.LiveLib.db.postLoad.length;
        for (let i = 0; i < length; i++) {
          try {
            global.LiveLib.db.postLoad[i]();
          } catch (err) {
            if (handler) handler(err);
          }
        }
        global.LiveLib.db.postLoad = [];
        return true;
      } catch (err) {
        throw err;
      }
      return false;
    }

    global.LiveLib.db.updateConnection = function (host, user, password, port, database, pools, callback, handler, e) {
      try {
        postLoad = [];
        global.LiveLib.db.loaded = false;
        global.LiveLib.db.usePool = false;
        if (global.LiveLib.db.connection) global.LiveLib.db.connection.end();
        global.LiveLib.db.connection = global.LiveLib.__GET_LIB("mysql").createConnection({
          host: host,
          port: port,
          user: user,
          password: password
        });

        global.LiveLib.db.connection.connect(err => {
          if (err) callback(err);
        });
        if (database)
          global.LiveLib.db.connection.query("CREATE DATABASE IF NOT EXISTS " + database, err => {
            if (err)
              if (callback) callback(err);
              else global.LiveLib.getLogger().errorm("Database", err);
            else {
              try {
                debugger;
                if (pools) {
                  global.LiveLib.db.connection.end();
                  global.LiveLib.db.connection = global.LiveLib.__GET_LIB("mysql").createPool({
                    host: host,
                    port: port,
                    user: user,
                    password: password,
                    database: database,
                    connectionLimit: pools
                  });
                  global.LiveLib.db.usePool = true;
                  global.LiveLib.db.__POST_LOAD(callback, handler);
                } else {
                  global.LiveLib.db.connection.query("USE " + database, err0 => {
                    if (err0)
                      if (callback) callback(err0);
                      else global.LiveLib.getLogger().errorm("Database", err);
                    else global.LiveLib.db.__POST_LOAD(callback, handler);
                  });
                }
              } catch (err) {
                if (callback) callback(err);
                else global.LiveLib.getLogger().errorm("Database", err);
              }
            }
          });
        else if (pools) {
          global.LiveLib.db.connection = global.LiveLib.__GET_LIB("mysql").createPool({
            host: host,
            user: user,
            password: password,
            database: database,
            pools: pools
          });
          global.LiveLib.db.usePool = true;
          global.LiveLib.db.__POST_LOAD(callback, handler);
        } else global.LiveLib.db.__POST_LOAD(callback, handler);
        return true;
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().errorm("Database", err);
      }
      return false;
    }

    global.LiveLib.db.isLoad = (callback) => {
      if (global.LiveLib && global.LiveLib.db && global.LiveLib.db.loading) {
        if (global.LiveLib.db.loaded) return 1;
        else if (callback) {
          global.LiveLib.db.postLoad.push(callback);
          return -1;
        }
      }
      return 0;
    }

    global.LiveLib.db.createRequest = function (request, ...args) {
      debugger;
      try {
        if (request && global.LiveLib.db.isLoad(() => {
          global.LiveLib.db.createRequest(request, ...args);
        }) === 1) {
          let index = global.LiveLib.__getIndexCallback(args);
          let callback = index > -1 ? args[index] : undefined;
          global.LiveLib.getLogger().tracem("Database", "createRequest => request: \"", request, "\"; args: ", args);
          global.LiveLib.db.connection.query(request, args ? args.splice(0, index) : [], (err, res, filds) => {
            if (err) {
              if (callback) callback(new global.LiveLib.db.SQLError(err.errno, err.sqlMessage));
              else global.LiveLib.getLogger().errorm("Database", "createRequest => Request Error: ", err);
            } else if (callback) callback(null, res ? res : undefined, filds ? filds : undefined);
          });
          return true;
        }
      } catch (err) {
        let callback = global.LiveLib.__getCallback(args);
        if (callback) callback(err);
        else throw err;
      }
      return false;
    }

    global.LiveLib.db.changeDB = (database, callback, ...args) => {
      let handler = global.LiveLib.__getCallback(args);
      try {
        if (database && global.LiveLib.db.isLoad(() => {
          global.LiveLib.db.changeDB(database, ...args);
        }) === 1) {
          if (global.LiveLib.db.usePool) {
            let config = global.LiveLib.db.connection.config.connectionConfig;
            return updateConnection(config.host, config.user, config.password, config.port, config.pool.config.connectionLimit, config.database, handler, undefined, true);
          } else {
            return global.LiveLib.db.createRequest("USE ?", database, err => {
              if (err && callback) callback(err);
            });
          }
        }
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    }

    global.LiveLib.db.deleteDB = (database, ...args) => {
      let callback = global.LiveLib.__getCallback(args);
      try {
        if (database && !global.LiveLib.db.usePool) {
          return global.LiveLib.db.createRequest("DROP DATABASE " + database, err => {
            if (err && callback) callback(err);
          });
        }
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    }

    global.LiveLib.db.createTable = (table, ...args) => {
      let l = global.LiveLib.__getIndexCallback(args);
      let callback = l > 0 ? args[l] : undefined;
      try {
        if (!table || args.length < 1) return false;
        let req = "CREATE TABLE IF NOT EXISTS " + table + "(";
        for (let i = 0; i < l; i++) {
          let obj = args[i];
          if (obj instanceof String) {
            req += obj + ",";
          } else {
            req += obj.name + " " + obj.type;

            if (obj.autoincrement) {
              req += " AUTO_INCREMENT";
            }
            if (obj.notnull) {
              req += " NOT NULL";
            }
            if (obj.default) {
              req += " DEFAULT " + obj.default;
            }
            if (obj.unique) {
              req += " UNIQUE";
            }

            req += ","

            if (obj.primary) {
              req += "PRIMARY KEY(" + obj.name + "),";
            }

            if (obj.foreign) {
              req += "FOREIGN KEY(" + obj.name + ") REFERENCES " + obj.foreign.table + "(" + obj.foreign.key + "),";
            }
          }
        }
        req = req.substr(0, req.length - 1);
        req += ");"
        return global.LiveLib.db.createRequest(req, callback);
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    }

    global.LiveLib.db.deleteTable = (table, ...args) => {
      let l = global.LiveLib.__getIndexCallback(args);
      let callback = l > 0 ? args[l] : undefined;
      try {
        if (!table || args.length < 1) return false;
        return global.LiveLib.db.createRequest("DELETE TABLE " + table, callback);
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    }

    global.LiveLib.db.insert = (table, ...args) => {
      let l = global.LiveLib.__getIndexCallback(args);
      let callback = l > 0 ? args[l] : undefined;
      try {
        if (!table || args.length < 1) return false;
        if (l < 1) {
          if (callback) callback(new Error("LiveLib: Module: \"Databases\"::insert - Haven`t enouth arguments!"));
          return false;
        } else {
          let promises = [];
          let errors = [];
          for (let i = 0; i < l; i++) {
            if (args[i] instanceof Array && i + 1 < l && args[i + 1] instanceof Array && args[i].length > 0 && args[i + 1].length > 0) {
              let req = "INSERT INTO " + table + "(" + args[i][0];
              for (let j = 1; j < args[i].length; j++) {
                req += "," + args[i][j];
              }
              promises.push(new Promise((resolve, reject) => {
                global.LiveLib.db.createRequest(req + ") VALUES (?);", args[i + 1], err => {
                  if (err) errors[i] = err;
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
                promises.push(new Promise((resolve, reject) => {
                  global.LiveLib.db.createRequest(req.substr(0, tmp0) + ") VALUES (?)", values, err => {
                    if (err) errors[i];
                    resolve();
                  });
                }));
              } else if (callback) callback(new Error("LiveLib: Module: \"Databases\"::insert - Haven`t enouth arguments!"));
            }
          }
          Promise.all(promises).then(res => {
            if (errors.length > 0) {
              if (callback) callback(errors);
              else {
                global.LiveLib.getLogger().warnm("Database", "insert => Non catched error - ", errors);
              }
            } else if (callback) callback(null, true);
          });
          return true;
        }
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
    }

    global.LiveLib.db.select = (table, ...args) => {
      let l = global.LiveLib.__getIndexCallback(args);
      let callback = l > -1 ? args[l] : undefined;
      try {
        if (!table || args.length < 1) return false;
        let filters = args[0] ? args[0] : undefined;
        let req = "SELECT ";

        if (filters) {
          if (filters instanceof Array && filters.length > 0) {
            req += filters[0];
            for (let i = 1; i < filters.length; i++) {
              req += "," + filters[i];
            }
          } else if (filters instanceof String) {
            req += filters;
          } else req += "*";
        } else req += "*";
        req += " FROM " + table;

        let where = args[1] ? args[1] : undefined;
        if (where) {
          if (where instanceof Array && where.length > 0) {
            req += " WHERE " + where[0];
            for (let i = 1; i < where.length; i++) {
              req += "," + where[i];
            }
          } else if (where instanceof String) {
            req += " WHERE " + where;
          }
        }

        let groupBy = args[2] ? args[2] : undefined;
        if (groupBy) {
          if (groupBy instanceof Array && groupBy.length > 0) {
            req += " GROUP BY " + groupBy[0];
            for (let i = 1; i < groupBy.length; i++) {
              req += "," + groupBy[i];
            }
          } else if (groupBy instanceof String) {
            req += " GROUP BY " + groupBy;
          }
        }

        let having = args[5] && groupBy ? args[5] : undefined;
        if (having) {
          req += " HAVING " + having;
        }

        let limit = args[3] ? args[3] : undefined;
        let offset = args[4] && limit ? args[4] : "0";
        if (limit) {
          req += " LIMIT " + offset + "," + limit;
        }

        req += ";";
        return global.LiveLib.db.createRequest(req, callback);
      } catch (err) {
        if (callback) callback(err);
        return false;
      }
    }

    global.LiveLib.db.update = (table, ...args) => {
      let l = global.LiveLib.__getIndexCallback(args);
      let callback = l > -1 ? args[l] : undefined;
      try {
        if (!table) return false;
        if (l < 1) {
          if (callback) callback(new Error("LiveLib: Module: \"Databases\"::update - Haven`t enouth arguments!"));
          return false;
        } else {
          let promises = [];
          let errors = [];
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

              promises.push(new Promise((resolve, reject) => {
                global.LiveLib.db.createRequest(req + ";", err => {
                  if (err) errors[i] = err;
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

                promises.push(new Promise((resolve, reject) => {
                  global.LiveLib.db.createRequest(req + ";", err => {
                    if (err) errors[i] = err;
                    resolve();
                  });
                }));
              } else errors[i] = new Error("LiveLib: Module: \"Databases\"::insert - Haven`t enouth arguments!");
            }
          }
          Promise.all(promises).then(res => {
            if (errors.length > 0) {
              if (callback) callback(errors);
              else {
                global.LiveLib.getLogger().warnm("Database", "update => Non catched error - ", errors);
              }
            } else if (callback) callback(null, true);
          });
          return true;
        }
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
    }

    if (settings && settings.host && settings.user && settings.password) {
      global.LiveLib.db.updateConnection(settings.host, settings.user, settings.password, settings.port, settings.database, settings.count_pools, err => {
        if (err) global.LiveLib.getLogger().errorm("Databases", err);
      }, undefined, true);
    }

    global.LiveLib.getLogger().info("LiveLib: Module \"Databases\" loaded!");

    return global.LiveLib.db;
  } catch (err) {
    console.error(err);
    return false;
  }
}

module.exports = db;
