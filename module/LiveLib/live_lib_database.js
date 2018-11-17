let live_lib_database = function (settings) {
  try {
    if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
    if (!global.LiveLib || global.LiveLib.Version < 1.1) return false;

    let base = global.LiveLib.base;
    global.LiveLib.____LOAD_LIVE_MODULE("logging");

    let obj = global.LiveLib.____CREATE_MODULE("database");
    obj.usePool = false;

    obj.SQLError = function (code, message) {
      this.name = "SQLError";
      this.message = message || "Unknowns error in sql";
      this.code = code || -1;
      this.stack = (new Error()).stack;
    };

    base.createClass(obj.SQLError, Error);

    obj.createConnection = function (host, user, password, port, database, pools, callback, e, handler_end, handler_connect) {
      try {
        obj.stackOfActions = [];
        obj.loaded = false;
        obj.postInit = false;
        obj.init = false;
        obj.usePool = !!pools;

        if (obj.connection) obj.connection.end(handler_end);

        obj.connection = base.__GET_LIB("mysql").createConnection({
          host: host,
          port: port,
          user: user,
          password: password
        });

        obj.connection.connect(handler_connect);

        if (database) {
          obj.connection.query("CREATE DATABASE IF NOT EXISTS `" + database + "`;", err => {
            if (err) {
              if (callback) callback(err); else global.LiveLib.getLogger().errorm("Database", "createConnection => ", err);
            }
            else {
              if (obj.usePool) {
                obj.connection.end(handler_end);
                obj.connection = base.__GET_LIB("mysql").createConnection({
                  host: host,
                  port: port,
                  user: user,
                  password: password,
                  database: database,
                  connectionLimit: pools
                });
                obj.postInit(err0 => {
                  if (callback) callback(err0); else global.LiveLib.getLogger().errorm("Database", "createConnection => ", err0);
                });
              } else {
                obj.connection.query("USE " + database, err0 => {
                  if (err0) {
                    if (callback) callback(err0); else global.LiveLib.getLogger().errorm("Database", "createConnection => ", err0);
                  }
                  else {
                    obj.postInit(err0 => {
                      if (callback) callback(err0); else global.LiveLib.getLogger().errorm("Database", "createConnection => ", err0);
                    });
                  }
                });
              }
            }
          });
        } else if (obj.usePool) {
          obj.connection.end(handler_end);
          obj.connection = base.__GET_LIB("mysql").createConnection({
            host: host,
            port: port,
            user: user,
            password: password,
            database: database,
            connectionLimit: pools
          });
        }
        obj.postInit(err0 => {
          if (callback) callback(err0); else global.LiveLib.getLogger().errorm("Database", "createConnection => ", err0);
        });
      } catch (err) {
        if (e || !callback) throw e;
        else callback(e);
      }
    };

    obj.createFunction("createRequest", function (request, ...args) {
      let index = base.__getIndexCallback(args);
      let callback = index > -1 ? args[index] : undefined;
      try {
        global.LiveLib.getLogger().tracem("Database", "createRequest => request: \"", request, "\"; args: ", args);
        obj.connection.query(request, args ? args.splice(0, index) : [], (err, res, filds) => {
          if (err) {
            if (callback) callback(new obj.SQLError(err.errno, err.sqlMessage));
            else global.LiveLib.getLogger().errorm("Database", "createRequest => Request Error: ", err);
          } else if (callback) callback(null, res, filds);
        });
        return true;
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    }, null);

    obj.createFunction("changeDB", function (database, ...args) {
      let callback = base.__getCallback(args);
      try {
        if (obj.usePool) {
          let config = obj.connection.config.connectionConfig;
          return obj.createConnection(config.host, config.user, config.password, config.port, config.pool.config.connectionLimit, config.database, callback, true);
        } else {
          obj.createRequest("CREATE DATABASE IF NOT EXISTS `" + database + "`;", err => {
            if (err) {
              if (callback) callback(err); else global.LiveLib.getLogger().errorm("Database", "changeDB => ", err);
            } else {
              obj.createRequest("USE " + database + ";", err => {
                if (err && callback) callback(err);
              })
            }
          });
          return true;
        }
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    }, null);

    obj.createFunction("deleteDB", function (database, ...args) {
      let callback = base.__getCallback(args);
      try {
        if (database && !obj.usePool) {
          return obj.createRequest("DROP DATABASE " + database, err => {
            if (err && callback) callback(err);
          });
        }
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    }, null);

    obj.createFunction("createTable", function (table, ...args) {
      let l = global.LiveLib.__getIndexCallback(args);
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

            if (tmp.autoincrement) {
              req += " AUTO_INCREMENT";
            }
            if (tmp.notnull) {
              req += " NOT NULL";
            }
            if (tmp.default) {
              req += " DEFAULT " + tmp.default;
            }
            if (tmp.unique) {
              req += " UNIQUE";
            }

            req += ",";

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
        return obj.createRequest(req, callback);
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    }, null);

    obj.createFunction("deleteTable", function (table, ...args) {
      let l = base.__getIndexCallback(args);
      let callback = l > 0 ? args[l] : undefined;
      try {
        if (!table || args.length < 1) return false;
        return obj.createRequest("DELETE TABLE " + table, callback);
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    }, null);

    obj.createFunction("insert", function (table, ...args) {
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
              promises.push(new Promise(resolve => {
                obj.createRequest(req + ") VALUES (?);", args[i + 1], err => {
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
                promises.push(new Promise(resolve => {
                  obj.createRequest(req.substr(0, tmp0) + ") VALUES (?)", values, err => {
                    if (err) errors[i] = err;
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
            } else if (callback) callback(null, true);
          });
          return true;
        }
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    }, null);

    obj.createFunction("select", function (table, setting, callback) {
      try {
        if (!table || !setting) return false;
        let req = "SELECT ";

        if (settings.filters) {
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

        if (settings.where) {
          if (settings.where instanceof Array && settings.where.length > 0) {
            req += " WHERE " + settings.where[0];
            for (let i = 1; i < settings.where.length; i++) {
              req += "," + settings.where[i];
            }
          } else if (typeof settings.where === "string" || settings.where instanceof String) {
            req += " WHERE " + settings.where;
          }
        }

        if (settings.groupBy) {
          if (settings.groupBy instanceof Array && settings.groupBy.length > 0) {
            req += " GROUP BY " + settings.groupBy[0];
            for (let i = 1; i < settings.groupBy.length; i++) {
              req += "," + settings.groupBy[i];
            }
          } else if (typeof settings.groupBy === "string" || settings.groupBy instanceof String) {
            req += " GROUP BY " + settings.groupBy;
          }
        }

        if (settings.having && settings.groupBy) {
          req += " HAVING " + settings.having;
        }

        let offset = settings.offset && settings.limit ? settings.offset : "0";
        if (settings.limit) {
          req += " LIMIT " + offset + "," + settings.limit;
        }

        req += ";";
        return obj.createRequest(req, callback);
      } catch (err) {
        if (callback) callback(err);
      }
      return false;
    }, null);

    obj.createFunction("update", function (table, ...args) {
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

              promises.push(new Promise(resolve => {
                obj.createRequest(req + ";", err => {
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

                promises.push(new Promise(resolve => {
                  obj.createRequest(req + ";", err => {
                    if (err) errors[i] = err;
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
            } else if (callback) callback(null, true);
          });
          return true;
        }
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
      return false;
    }, null);

    if (settings && settings.host && settings.user && settings.password) {
      obj.createConnection(settings.host, settings.user, settings.password, settings.port, settings.database, settings.count_pools, err => {
        if (err) global.LiveLib.getLogger().errorm("Databases", "[[main]] => ", err);
      }, true);
    }

    global.LiveLib.getLogger().info("LiveLib: Module \"Databases\" loaded!");

    return obj;
  } catch (err) {
    console.error(err);
  }
  return false;
};

module.exports = live_lib_database;
