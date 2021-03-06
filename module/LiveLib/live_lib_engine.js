/*
Copyright © 2019 Ilya Loginov. All rights reserved.
Please email dantes2104@gmail.com if you would like permission to do something with the contents of this repository
*/
let live_lib_engine = function () {
  if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
  if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;

  let base = global.LiveLib.base;
  global.LiveLib.loadLiveModule("logging");

  global.LiveLib.ErrorMessage = function (code, message, err) {
    this.code = code;
    this.message = message;
    this.err = err;
    if (err) {
      global.LiveLib.getLogger().debug("Create error message for user: ", err);
    }
    Error.captureStackTrace(this, this.constructor);
  };

  base.createClass(global.LiveLib.ErrorMessage, Error);

  global.LiveLib.ErrorMessage.serv = function (err) {
    return new global.LiveLib.ErrorMessage(1, "server.error", err);
  };

  return global.LiveLib.ErrorMessage;
};

module.exports = live_lib_engine;