/*
Copyright © 2019 Ilya Loginov. All rights reserved.
Please email dantes2104@gmail.com if you would like permission to do something with the contents of this repository
*/
let live_lib_net = function (settings) {
  if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
  if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;


  let base = global.LiveLib.base;
  global.LiveLib.loadLiveModule("logging");
  let logger = global.LiveLib.getLogger;

  let express = base.getLib("express");
  let body_parser = base.getLib("body-parser");
  let fileupload = base.getLib("express-fileupload");
  let cookies_parser = base.getLib("cookie-parser");
  let os = base.getLib("os");
  let path = base.getLib("path");


  global.LiveLib.net = function (host = "/", port = 8080, view_engine = "pug") {
    this.app = express();
    this.router = express.Router();

    this.app.set("views", this.folder);
    this.app.set("view engine", view_engine);
    this.app.use(body_parser.urlencoded({
      extended: true
    }));
    this.app.use(cookies_parser());
    this.app.use(body_parser.json());
    this.app.use(fileupload());
    this.app.use(host, this.router);
  };

  let Server = global.LiveLib.net;
  base.createClass(Server);

  global.LiveLib.net.getLocalServerIP = function (e) {
    try {
      let ifaces = os.networkInterfaces();
      for (let ifname of Object.keys(ifaces)) {
        for (let iface of ifaces[ifname]) {
          if ("IPv4" !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            continue;
          }
          return iface.address;
        }
      }
    } catch (err) {
      if (e) throw err;
      else logger().errorm("Net", "getLocalServerIP => ", err);
    }
  };

  Server.prototype.get = function (name, callback, e) {
    try {
      if (name) {
        function __tmp(req, res, next) {
          if (req.query && req.query.crossDomainRequest) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
          }
          callback({
            name: name,
            res: res,
            req: req,
            next: next,
            args: req.query,
            params: req.params,
            cookies: req.cookies
          });
        }

        this.router.get(name, __tmp);
        let sub_name = name.substr(0, name.indexOf(":", name.lastIndexOf("/")));
        if (sub_name && sub_name.length > 0 && name != sub_name) this.router.get(sub_name, __tmp);
        return true;
      }
    } catch (err) {
      if (e) throw err;
      else logger().errorm("Net", "Server => get: ", err);
    }
    return false;
  };

  Server.prototype.post = function (name, callback, e) {
    try {
      if (name) {

        function __tmp(req, res, next) {
          if ((req.query && req.query.crossDomainRequest) || (req.body && req.body.crossDomainRequest)) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
          }
          callback({
            name: name,
            res: res,
            req: req,
            next: next,
            args: req.query,
            params: req.params,
            body: req.body,
            files: req.files,
            cookies: req.cookies
          });
        }

        this.router.post(name, __tmp);
        let sub_name = name.substr(0, name.indexOf(":", name.lastIndexOf("/")));
        if (sub_name && sub_name.length > 0 && name != sub_name) this.router.post(sub_name, __tmp);
        return true;
      }
    } catch (err) {
      if (e) throw err;
      else logger().errorm("Net", "Server => post: ", err);
    }
    return false;
  };

  Server.prototype.put = function (name, callback, e) {
    try {
      if (name) {

        function __tmp(req, res, next) {
          if ((req.query && req.query.crossDomainRequest) || (req.body && req.body.crossDomainRequest)) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
          }
          callback({
            name: name,
            res: res,
            req: req,
            next: next,
            args: req.query,
            params: req.params,
            body: req.body,
            files: req.files,
            cookies: req.cookies
          });
        }

        this.router.put(name, __tmp);
        let sub_name = name.substr(0, name.indexOf(":", name.lastIndexOf("/")));
        if (sub_name && sub_name.length > 0 && name != sub_name) this.router.put(sub_name, __tmp);
        return true;
      }
    } catch (err) {
      if (e) throw err;
      else logger().errorm("Net", "Server => put: ", err);
    }
    return false;
  };

  Server.prototype.start = function () {
    let port = process.env.PORT || this.port || 8080;
    this.server = this.app.listen(port, () => {
      global.LiveLib.getLogger().info("Server started with port : ", port);
    });
  }
};

module.exports = live_lib_net;
