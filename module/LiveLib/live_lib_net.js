let live_lib_net = function (settings) {//TODO: Edit with new version
  if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
  if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;


  let base = global.LiveLib.base;
  global.LiveLib.loadLiveModule("logging");

  let obj = global.LiveLib.net = {};

  obj.getQueryObject = (query) => {
    return base.getLib("querystring").parse(query, "&", "=");
  };

  obj.getArgs = (req, res) => {
    let args = ((req.params && req.params.args) ? global.LiveLib.net.getQueryObject(req.params.args.substr(req.params.args.lastIndexOf("/") + 1)) : undefined);
    if (args && args.crossDomenRequest) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    return args;
  };

  obj.getLocalServerIP = function (e) {
    try {
      let os = base.getLib("os");
      var ifaces = os.networkInterfaces();
      for (let ifname of Object.keys(ifaces)) {
        for (let iface of ifaces[ifname]) {
          if ('IPv4' !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            continue;
          }
          return iface.address;
        }
      }
    } catch (err) {
      if (e) throw err;
      else global.LiveLib.getLogger().errorm("Database", "getLocalServerIP => ", err);
    }
  };

  obj.Server = function (host = "/", port = 8080, folder = "./html", view_engine = "pug", length_file_name = 60, none_file = "none_file", length_photo_name = length_file_name, none_photo = "none_photo") {
    this.app = base.getLib("express")();
    this.router = base.getLib("express").Router();
    this.folder = folder;
    this.length_file_name = length_file_name;
    this.none_file = none_file;
    this.length_photo_name = length_photo_name;
    this.none_photo = none_photo;

    this.app.set("views", this.folder);
    this.app.set("view engine", view_engine);
    this.app.use(base.getLib("body-parser").urlencoded({
      extended: true
    }));
    this.app.use(base.getLib("body-parser").json());
    this.app.use(base.getLib("express-fileupload")());
    this.app.use(host, this.router);
    this.server = this.app.listen(process.env.PORT || port || 8080, () => {
      global.LiveLib.getLogger().info("Server started with port : ", process.env.PORT || port || 8080);
    });

    base.createIfNotExists(folder);
    base.createIfNotExists(folder, "files");
    base.createIfNotExists(folder, "images");
  };

  obj.Server.prototype.get = function (name, callback, e) {
    try {
      if (name && (typeof name === "string" || name instanceof String) && name.length > 0) {
        this.router.get(name, (req, res, next) => {
          let args = global.LiveLib.net.getArgs(req, res);
          callback(res, args, req, next);
        });
        return true;
      }
    } catch (err) {
      if (e) throw e;
      else global.LiveLib.getLogger().errorm("Net", "Server => get: ", err);
    }
    return false;
  };

  obj.Server.prototype.post = function (name, callback, e) {
    try {
      if (name && (typeof name === "string" || name instanceof String) && name.length > 0) {
        this.router.post(name, (req, res, next) => {
          let args = global.LiveLib.net.getArgs(req, res);
          callback(req.body, res, args, req, next);
        });
        return true;
      }
    } catch (err) {
      if (e) throw e;
      else global.LiveLib.getLogger().errorm("Net", "Server => post: ", err);
    }
    return false;
  };

  obj.Server.prototype.putFile = function (name, e) {
    try {
      if (name && (typeof name === "string" || name instanceof String) && name.length > 0) {
        let folder = this.folder;
        let length = this.length_file_name;
        let func = function (req, res) {
          let args = global.LiveLib.net.getArgs(req, res);
          let json = {};
          if (req.files) {
            for (let [key, value] of Object.entries(req.files)) {
              json[key] = global.LiveLib.createRandomString(length);
              let path = folder + "/files/" + json[key];
              if (json[key]) value.mv(path);
            }
            res.send(json);
          } else res.sendStatus(400);
        };

        this.router.post(name, func);
        this.router.put(name, func);
        return true;
      }
    } catch (err) {
      if (e) throw err;
      else global.LiveLib.getLogger().errorm("Net", "Server => putFile: ", err);
    }
    return false;
  };

  obj.Server.prototype.getFile = function (name, e) {
    try {
      if (name && (typeof name === "string" || name instanceof String) && name.length > 0) {
        let path = global.LiveLib.__GET_LIB("path");
        let fs = global.LiveLib.__GET_LIB("fs");
        this.router.get((name.lastIndexOf(":") > -1) ? name : path.join(name, "/:args"), (req, res, next) => {
          let args = global.LiveLib.net.getArgs(req, res);
          if (args && args.file && fs.existsSync(path.join(this.folder, "files", args.file))) res.download(path.resolve(path.join(this.folder, "files", args.file)), "getfile");
          else if (req.params.args && fs.existsSync(path.join(this.folder, "files", req.params.args))) res.download(path.resolve(path.join(this.folder, "files", req.params.args)), "getfile");
          else if (this.none_file && fs.existsSync(path.join(this.folder, "files", this.none_file))) res.download(path.resolve(path.join(this.folder, "files", this.none_file)), "getfile");
          else res.sendStatus(400);
        });
        return true;
      }
    } catch (err) {
      if (e) throw err;
      else global.LiveLib.getLogger().errorm("Net", "Server => getFile: ", err);
    }
    return false;
  };

  obj.Server.prototype.putPhoto = function (name, callback, e) {
    try {
      if (name && (typeof name === "string" || name instanceof String) && name.length > 0) {
        let folder = this.folder;
        let length = this.length_photo_name;
        let func = function (req, res, next) {
          let args = global.LiveLib.net.getArgs(req, res);
          let json = {};
          debugger;
          if (req.files) {
            for (let [key, value] of Object.entries(req.files)) {
              json[key] = global.LiveLib.createRandomString(length) + global.LiveLib.__GET_LIB("path").extname(value.name);
              let path = folder + "/images/" + json[key];
              if (json[key]) value.mv(path, (err) => {
                if (!err) {
                  callback(path);
                } else console.log(err);
              });
            }
            res.send(json);
          } else res.sendStatus(400);
        }

        this.router.post(name, func);
        this.router.put(name, func);
        return true;
      }
    } catch (err) {
      if (e) throw err;
      else global.LiveLib.getLogger().errorm("Net", "Server => putPhoto: ", err);
    }
    return false;
  };

  obj.Server.prototype.getPhoto = function (name, e) {
    try {
      if (name && (typeof name === "string" || name instanceof String) && name.length > 0) {
        let path = global.LiveLib.__GET_LIB("path");
        let fs = global.LiveLib.__GET_LIB("fs");
        this.router.get((name.lastIndexOf(":") > -1) ? name : path.join(name, "/:args"), (req, res, next) => {
          let args = global.LiveLib.net.getArgs(req, res);
          if (args && args.file && fs.existsSync(path.join(this.folder, "images", args.image))) res.download(path.resolve(path.join(this.folder, "images", args.image)), "getphoto");
          else if (req.params.args && fs.existsSync(path.join(this.folder, "images", req.params.args))) res.download(path.resolve(path.join(this.folder, "images", req.params.args)), "getphoto");
          else if (this.none_file && fs.existsSync(path.join(this.folder, "images", this.none_photo))) res.download(path.resolve(path.join(this.folder, "images", this.none_photo)), "getphoto");
          else res.sendStatus(400);
        });
        return true;
      }
    } catch (err) {
      if (e) throw err;
      else global.LiveLib.getLogger().errorm("Net", "Server => getPhoto: ", err);
    }
    return false;
  };

  global.LiveLib.net.startServer = function (host, port, folder, view_engine) {
    return new global.LiveLib.net.Server(host, port, folder);
  }

};

module.exports = live_lib_net;
