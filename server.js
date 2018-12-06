require("./module/live_lib")("net", "userEngine", "preference", "locale");
let server = new LiveLib.net();
let path = LiveLib.base.getLib("path");
let pref = new LiveLib.preference("./server.pref");
pref.loadDataSync();
let users = new LiveLib.userEngine(pref.get("host", "localhost"), pref.get("user"), pref.get("password"), pref.get("database"), pref.get("photos folder"));
let folder = path.resolve("./html");
let locale = new LiveLib.locale("./locales");

LiveLib.base.createIfNotExists(folder);

function checkError(err, res) {
  if (err) {
    if (err.message) {
      locale.get(err.message, res.args.lang, (err1, res1) => {
        if (res1) {
          err.message = res1;
          res.res.render(path.join(folder, "errorForm.pug"), err);
        }
      });
    } else {
      res.res.render(path.join(folder, "errorForm.pug"), err);
    }
  }
  return !!err;
}

server.get("/id:id", (err, res) => {
  if (res.cookies.token && Object.keys(res.args)[0]) {
    users.accountGet(Object.keys(res.args)[0], res.cookies.token, (err0, res0) => {
      if (!checkError(err0, res)) {
        res.res.render(path.join(folder, "userInfo.pug"), res0);
      }
      res.res.sendStatus(200);
    });
  } else {
    res.res.render(path.join(folder, "errorForm.pug"), {
      code: 20,
      message: locale.getSync("request.have.not.token", res.args.lang)
    });
  }
});


server.get("/:args", (err, res) => {
  if (res.cookies.token) {
    users.accountGetSelf(res.cookies.token, (err, res0) => {
      if (message) {
        if (message === "users.wrong.token") {
          res.res.cookie("token", "");
        }
        locale.get(message, res.args.locale, (err1, res1) => {
          if (res1) res.res.send(res1);
        });
      }
      else if (err) {
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