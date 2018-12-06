let live_lib_engine = function () {
  if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
  if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;

  let base = global.LiveLib.base;

  global.LiveLib.ErrorMessage = function (code, message, err) {
    this.code = code;
    this.message = message;
    this.err = err;
    Error.captureStackTrace(this, this.constructor);
  };

  base.createClass(global.LiveLib.ErrorMessage, Error);

  global.LiveLib.ErrorMessage.serv = function (err) {
    return new global.LiveLib.ErrorMessage(1, "server.error", err);
  };

  return global.LiveLib.ErrorMessage;
};

module.exports = live_lib_engine;