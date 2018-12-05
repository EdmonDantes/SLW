require("./module/live_lib")("net", "userEngine", "preference");
let server = new LiveLib.net();
let path = LiveLib.base.getLib("path");
let pref = new LiveLib.preference("./server.pref");
pref.loadDataSync();
let users = LiveLib.userEngine(pref.get("host", "localhost"), pref.get("user"), pref.get("password"), pref.get("database"), pref.get("photos folder"));
let folder = path.resolve("./html");
LiveLib.base.createIfNotExists(folder);

server.get("/:args", (err, res) => {
  if (res.cookies.token) {
    users.accountGetSelf(res.cookies.token, (err, res0) => {
      if (err) {
        if (err.code) res.res.send("Error Code: #" + err.code + "\n\nError: " + err);
        else res.res.send("Error: " + err);
      } else {
        res.res.render(path.join(folder, "userInfo"), res0);
      }
    });
  } else {
    res.res.render(path.join(folder, "registerForm"));
  }
});