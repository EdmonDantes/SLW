require("./module/live_lib")("user_engine");
global.LiveLib.userEngine.__createPasswordHash("password", (err, hash, salt) => {
  console._log(salt);
  console._log(hash);
});