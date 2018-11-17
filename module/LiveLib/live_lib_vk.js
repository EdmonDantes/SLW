var live_lib_vk = function (db_settings) { //TODO: Edit with new version
  if (!global.LiveLib) require("./live_lib_base")();

  if (!global.LiveLib.net || !global.LiveLib.net.init) require("./live_lib_net")();

  if (!global.LiveLib.db || !global.LiveLib.db.init) require("./live_lib_database")(db_settings);

  if (!global.LiveLib.vk || !global.LiveLib.vk.init) {
    global.LiveLib.vk = {init: true};
  } else return true;
  
  global.LiveLib.vk.Version = "1.0";

  LiveLib.vk.version_vk_api = "5.87";
  global.LiveLib.db.createTable("vk_api_users", {
    name: "id",
    type: "UNSIGNED INT",
    autoincrement: true,
    notnull: true,
    primary: true
  }, {name: "vk_id", type: "UNSIGNED INT", unique: true}, {
    name: "token",
    type: "TINYTEXT",
    default: "NULL"
  }, {name: "groups", type: "TINYTEXT", default: "user"});
  const captcha = require("./captcha_lib");
  const server = global.LiveLib.net.Server(undefined, 80);

}

module.exports = live_lib_vk;
