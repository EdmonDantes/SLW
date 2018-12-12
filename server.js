require("./module/live_lib")("net", "userEngine", "preference", "locale");
let server = new LiveLib.net();
let locale = new LiveLib.locale("./locales");
let pref = new LiveLib.preference("./server.pref");

let url = LiveLib.base.getLib("url");
let request = LiveLib.base.getLib("request");
let path = LiveLib.base.getLib("path");

pref.loadDataSync();

let port = pref.get("serverPort", "8080");
let ip = "http://" + LiveLib.net.getLocalServerIP() + ":" + port;
let domen = pref.get("domen", ip);
let folder = path.resolve("./html");

let users = new LiveLib.userEngine(ip, pref.get("host", "localhost"), pref.get("user"), pref.get("password"), pref.get("database"), pref.get("photos folder"));

LiveLib.base.createIfNotExists(folder);


let methods = {};

methods["server.getpublickey"] = (res, callback) => callback(undefined, users.getPublicKey());
methods["account.login"] = (res, callback) => users.loginUser(res.login, res.password, callback, res.remember);
methods["account.get"] = (res, callback) => users.accountGet(res.id, res.token, callback);
methods["account.statuswith"] = (res, callback) => users.accountStatusWith(res.id, res.token, callback);
methods["account.edit"] = (res, callback) => users.accountEdit(res.input, res.token, callback);
//methods["account.changepassword"] = (res, callback) => users.accountChangePassword(res.args.password, res.args.newpassword, res.args.token, callback);
methods["blacklist.add"] = (res, callback) => users.blacklistAdd(res.id, res.token, callback);
methods["blacklist.delete"] = (res, callback) => users.blacklistDelete(res.id, res.token, callback);
methods["blacklist.get"] = (res, callback) => users.blacklistGet(res.token, callback);

methods["friends.add"] = (res, callback) => users.friendsAdd(res.id, res.token, callback);
methods["friends.delete"] = (res, callback) => users.friendsDelete(res.id, res.token, callback);
methods["friends.get"] = (res, callback) => users.friendsGet(res.id, res.token, callback);
methods["friends.getsendrequest"] = (res, callback) => users.friendsGetSendRequest(res.token, callback);
methods["friends.getgetrequest"] = (res, callback) => users.friendsGetGetRequest(res.token, callback);

methods["photos.add"] = (res, callback) => users.photosAdd(res.file, res.access, res.token, callback);
methods["photos.delete"] = (res, callback) => users.photosDelete(res.id, res.token, callback);
methods["photos.getwithsystemkey"] = (res, callback) => callback(undefined, users.getPhoto(res.photo, res.key));
methods["photos.get"] = (res, callback) => users.photosGet(res.id, res.type, res.token, (err0, res0, ip, key, name) => {
  if (err0) callback(err0);
  else if (res0) {
    res0.pipe(res.res);
  } else request(url.resolve(ip, "/api/photos.getWithSystemKey") + "?name=" + name + "&key=" + key, (err, res, body) => {
    if (err) callback(global.LiveLib.ErrorMessage.serv(err));
    else {
      res.res.sendFile(body);
    }
  });
});
methods["photos.setTarget"] = (res, callback) => users.photosSetTarget(res.id, res.target, res.token, callback);
methods["photos.getTarget"] = (res, callback) => users.photosGetTarget(res.target, res.token, callback);

methods["docs"] = res => res.res.sendFile(path.join(folder, "html_static", "README_API.html"));
methods["demo"] = res => res.res.sendFile(path.join(folder, "html_static", "test.html"));

function sendError(res, err, lang) {
  res.send({code: err.code, message: locale.getSync(err.message, lang)});
}

function __func000(res) { //function for execute method
  if (res && res.params && res.params.method) {
    if (methods[res.params.method.toLowerCase()]) {
      try {
        let input = {};
        for (let [key, value] of Object.entries(res.args)) {
          input[key] = value;
        }
        if (res.files) {
          try {
            input.file = Object.entries(res.files)[0][1];
          } catch (err) {
          }
        }
        input.res = res.res;
        if (res.body) {
          try {
            let body = JSON.parse(res.body);
            for (let [key, value] of Object.entries(body)) {
              input[key] = value;
            }
          } catch (err) {
          }
        }
        methods[res.params.method.toLowerCase()](input, (err0, res0) => {
          if (err0) sendError(res.res, err0, res.args.lang || res.params.lang);
          else if (res0) {
            res.res.send({response: res0});
          } else res.res.send({response: true});
        });
      } catch (err) {
        sendError(res.res, {code: 1, message: "server.error"}, res.args.lang || res.params.lang)
      }
    } else {
      sendError(res.res, {code: 21, message: "method.not.find"}, res.args.lang || res.params.lang);
    }
  } else {
    res.res.send({
      name: "Api",
      versionServer: 1.2,
      versionApi: 1.0,
      message: "Please use '" + domen + "/api/<method>?[args]'"
    });
  }
}

server.get("/:lang/api/:method", (res) => {
  __func000(res);
});

server.get("/api/:method", (res) => {
  __func000(res);
});

server.post("/api/:method", (res) => {
  __func000(res);
});

server.post("/:lang/api/:method", (res) => {
  __func000(res);
});





function checkError(err, res) {
  if (err) {
    if (err.code === 4 || err.code === 9) {
      res.res.cookie("token", "");
      res.res.header("Location", "/");
      res.res.sendStatus(303);
    } else if (err.message) {
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

function renderMainForm(res, lang) {
  res.render(path.join(folder, "pug_templates", "mainForm.pug"), {
    log_in: locale.getSync("log_in", lang),
    join_in: locale.getSync("join_in", lang),
    welcome: locale.getSync("welcome", lang),
  });
}

function renderRegisterForm(res, lang, error_message) {
  res.render(path.join(folder, "registerForm.pug"),
    {
      login: locale.getSync("login", lang),
      placeholderLogin: locale.getSync("placeholderLogin", lang),
      password: locale.getSync("password", lang),
      placeholderPassword: locale.getSync("placeholderPassword", lang),
      firstName: locale.getSync("firstName", lang),
      secondName: locale.getSync("middleName", lang),
      placeholderFirstName: locale.getSync("placeholderFirstName", lang),
      placeholderSecondName: locale.getSync("placeholderMiddleName", lang),
      sendMessage: locale.getSync("sendMessage", lang),
      resetMessage: locale.getSync("resetMessage", lang),
      man: locale.getSync("man", lang),
      woman: locale.getSync("woman", lang),
      sex: locale.getSync("sex", lang),
      have_error: !!error_message,
      error_message: error_message
    });
}

function renderUserForm(res, token, user) {
  res.render(path.join(folder, "userForm.pug"), user);
}

function renderLoginFrom(res, lang, error_message) {
  res.render(path.join(folder, "pug_templates", "loginForm.pug"),
    {
      login: locale.getSync("login", lang),
      placeholderLogin: locale.getSync("placeholderLogin", lang),
      password: locale.getSync("password", lang),
      placeholderPassword: locale.getSync("placeholderPassword", lang),
      resetMessage: locale.getSync("resetMessage", lang),
      log_in: locale.getSync("log_in", lang),
      remember: locale.getSync("remember", lang),
      have_error: !!error_message,
      error_message: error_message
    });
}


server.get("/", (res) => {
  if (res.cookies.token) {
    users.accountGetSelf(res.cookies.token, (err0, res0) => {
      if (!checkError(err0, res)) {
        renderUserForm(res.res, res.cookies.token, res0);
      }
    });
  } else {
    renderMainForm(res.res, res.args.lang);
  }
});

server.get("/login", (res) => {
  if (res.cookies.token) {
    res.res.header("Location", domen);
    res.res.sendStatus(303);
  } else {
    renderLoginFrom(res.res, res.args.lang);
  }
});

server.post("/login", (res) => {
  if (res.cookies.token) {
    res.res.header("Location", domen);
    res.res.sendStatus(303);
  } else {
    users.loginUser(res.body.login, res.body.password, (err, res0) => {
      if (err) {
        renderLoginFrom(res.res, res.args.lang, locale.getSync(err.message, res.args.lang));
      } else {
        res.res.cookie("token", res0);
        res.res.header("Location", domen);
        res.res.sendStatus(303);
      }
    });
  }
});

server.get("/reset", (res) => {
  res.res.cookie("token", "");
  res.res.header("Location", domen);
  res.res.sendStatus(200);
});

server.get("/join", (res) => {
  if (res.cookies.token) {
    res.res.header("Location", domen);
    res.res.sendStatus(303);
  } else {
    renderRegisterForm(res.res, res.args.lang);
  }
});

server.post("/join", (res) => {
  if (res.cookies.token) {
    res.res.header("Location", domen);
    res.res.sendStatus(303);
  } else {
    users.registerUser(res.body, (err, res0) => {
      if (err) {
        renderRegisterForm(res.res, res.args.lang, "Wrong users data");
      } else {
        res.res.cookie("token", res0);
        res.res.header("Location", domen);
        res.res.sendStatus(303);
      }
    });
  }
});

server.get("/user:id", (res) => {
  if (res.cookies.token && res.params && res.params.id) {
    users.accountGet(res.params.id, res.cookies.token, (err0, res0) => {
      if (!checkError(err0, res)) {
        res.res.render(path.join(folder, "userForm.pug"), res0);
      }
    });
  } else {
    res.res.render(path.join(folder, "errorForm.pug"), {
      code: 20,
      message: locale.getSync("request.have.not.token", res.args.lang)
    });
  }
});

server.get("/method/:args", (res) => {
  if (res.args && methods.get(res.args)) {
    methods.get(res.args)(res.query, (err0, res0) => {
      if (err0) {
        res.res.send({error: {code: err0.code, message: locale.getSync(err0.message, res.query.lang)}});
      } else {
        res.res.send({response: res0});
      }
    });
  } else {
    res.res.send({error: {code: 21, message: locale.getSync("method.is.not.have", res.query.lang)}});
  }
});