require("./module/live_lib")("net", "userEngine", "preference", "locale");
let server = new LiveLib.net();
let locale = new LiveLib.locale("./locales");
let pref = new LiveLib.preference("./server.pref");

let url = LiveLib.base.getLib("url");
let request = LiveLib.base.getLib("request");
let path = LiveLib.base.getLib("path");
let fs = LiveLib.base.getLib("fs");

pref.loadDataSync();

let port = pref.get("serverPort", "8080");
let ip = "http://" + LiveLib.net.getLocalServerIP() + ":" + port;
let domen = pref.get("domain", ip);
let folder = path.resolve("./html");

let users = new LiveLib.userEngine(ip, pref.get("host", "localhost"), pref.get("user"), pref.get("password"), pref.get("database"), pref.get("photos folder"), folder, undefined, undefined, () => {
  server.start();
});

LiveLib.base.createIfNotExists(folder);

let methods = {};

methods["server.getPublicKey"] = (res, callback) => callback(undefined, users.getPublicKey());
methods["account.login"] = (res, callback) => users.loginUser(res.login, res.password, callback, res.remember);
methods["account.get"] = (res, callback) => users.accountGet(res.id, res.token, callback);
methods["account.statusWith"] = (res, callback) => users.accountStatusWith(res.id, res.token, callback);
methods["account.edit"] = (res, callback) => users.accountEdit(res.input, res.token, callback);

methods["blacklist.add"] = (res, callback) => users.blacklistAdd(res.id, res.token, callback);
methods["blacklist.delete"] = (res, callback) => users.blacklistDelete(res.id, res.token, callback);
methods["blacklist.get"] = (res, callback) => users.blacklistGet(res.token, callback);

methods["friends.add"] = (res, callback) => users.friendsAdd(res.id, res.token, callback);
methods["friends.delete"] = (res, callback) => users.friendsDelete(res.id, res.token, callback);
methods["friends.get"] = (res, callback) => users.friendsGet(res.id, res.token, callback);
methods["friends.getSendRequest"] = (res, callback) => users.friendsGetSendRequest(res.token, callback);
methods["friends.getGetRequest"] = (res, callback) => users.friendsGetGetRequest(res.token, callback);

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
methods["photos.getTarget"] = (res, callback) => users.photosGetTarget(res.id, res.target, res.token, callback);

methods["docs"] = res => res.res.sendFile(path.join(folder, "html_static", "README_API.html"));
methods["demo"] = res => res.res.sendFile(path.join(folder, "html_static", "test.html"));

methods["js"] = res => res.res.sendFile(path.join(folder, "js_scripts", res.file));


function sendError(res, err, lang) {
  res.send({error: {code: err.code, message: locale.getSync(err.message, lang)}});
}

let pages = {};

pages["join"] = (res, callback) => {
  if (res.token) {
    res.res.header("Location", "/");
    res.res.sendStatus(303);
  } else
    callback(undefined, {
      "$$name": path.join(folder, "pug_templates", "registerForm"),
      title: "registerFormText",
      login: "loginText",
      password: "passwordText",
      firstName: "firstNameText",
      secondName: "secondNameText",
      placeholderLogin: "placeholderLoginText",
      placeholderPassword: "placeholderPasswordText",
      placeholderFirstName: "placeholderFirstNameText",
      placeholderSecondName: "placeholderSecondNameText",
      sendMessage: "sendMessageText",
      resetMessage: "resetMessageText",
      man: "man",
      woman: "woman",
      sexText: "sexText",
      loading: "loadingText",
      registerForm: "registerFormText"
    });
};

pages["login"] = (res, callback) => {
  if (res.token) {
    res.res.header("Location", "/");
    res.res.sendStatus(303);
  } else
    callback(undefined, {
      "$$name": path.join(folder, "pug_templates", "loginForm.pug"),
      title: "loginFormText",
      loginForm: "loginFormText",
      loading: "loadingText",
      login: "loginText",
      password: "passwordText",
      placeholderLogin: "placeholderLoginText",
      placeholderPassword: "placeholderPasswordText",
      resetMessage: "resetMessageText",
      log_in: "logInText",
      remember: "rememberText"
    });
};

pages["reset"] = (res, callback) => {
  res.res.cookie("token", "");
  res.res.header("Location", "/");
  res.res.sendStatus(303);
};

pages["friends"] = (res, callback) => {
  if (res.token) {
    users.friendsGet(-1, res.token, (err0, res0) => {
      if (err0) callback(err0);
      else {
        users.friendsGetGetRequest(res.token, (err1, res1) => {
          if (err1) callback(err1);
          else {
            users.friendsGetSendRequest(res.token, (err2, res2) => {
              if (err2) callback(err2);
              else callback(undefined, {
                "$$name": path.join(folder, "pug_templates", "friendsForm.pug"),
                "title": "domenText",
                "$friends": res0.toString(),
                "$outRequest": res2.toString(),
                "$inRequest": res1.toString(),
                addFriendText: "addFriendText",
                accountText: "accountText",
                friendsText: "friendsText",
                blackListText: "blackListText",
                inputRequestText: "inputRequestText",
                outputRequestText: "outputRequestText",
                deleteFriendText: "deleteFriendText",
                haveNotFriends: "haveNotFriends",
                haveNotIn: "haveNotIn",
                haveNotOut: "haveNotOut",
                cancel: "cancel",
              })
            });
          }
        });
      }
    });
    //res.res.send("WIP")
    // users.friendsGet(-1, res.token, (err, res) => {
    //
    // });
  } else {
    res.res.header("Location", "/");
    res.res.sendStatus(303);
  }
};

pages["user:id"] = (res) => {
  if (res.token) {
    renderUserForm(res.res, res["__params"].id ? res["__params"].id : -1, res.token, res.lang);
  } else {
    res.res.header("Location", "/");
    res.res.sendStatus(303);
  }
};

pages[""] = (res, callback) => {
  if (res.token) {
    renderUserForm(res.res, -1, res.token, res.lang, callback);
  } else {
    renderMainForm(res.res, res.lang);
  }
};


function render(res, tmp, lang) {
  let name = tmp["$$name"];
  tmp["$$name"] = undefined;
  let object = {};
  for (let [key, value] of Object.entries(tmp)) {
    if (key[0] === "$")
      object[key.substr(1)] = value;
    else
      object[key] = locale.getSync(value, lang);
  }
  res.render(name, object);
}

function renderError(res, err, lang) {
  render(res, {
    "$$name": path.join(folder, "pug_templates", "errorForm.pug"),
    "$code": err.code,
    message: err.message,
    error: "errorText"
  }, lang);
}

function renderMainForm(res, lang) {
  res.render(path.join(folder, "pug_templates", "mainForm.pug"), {
    log_in: locale.getSync("logInText", lang),
    join_in: locale.getSync("joinInText", lang),
    welcome: locale.getSync("welcomeText", lang),
  });
}

function renderUserForm(res, id, token, lang, callback) {
  users.accountGet(id, token, (err0, res0) => {
    if (err0) {
      if (callback) callback(err0);
      else renderError(res, err0, lang);
    } else {
      res0.sexText = locale.getSync("sexText", lang);
      res0.bdateText = locale.getSync("bdateText", lang);
      res0.sex = locale.getSync(res0.sex, lang);
      res0.accountText = locale.getSync("accountText", lang);
      res0.friendsText = locale.getSync("friendsText", lang);
      res0.blackText = locale.getSync("blackText", lang);
      res0.title = locale.getSync("domenText", lang);
      res0.balanceText = locale.getSync("balanceText", lang);
      res0.blackListText = locale.getSync("blackListText", lang);
      res0.addFriendText = locale.getSync("addFriendText", lang);
      res0.addBlackText = locale.getSync("addBlackText", lang);
      res0.requestSendAction = locale.getSync("requestSendAction", lang);
      res0.addedBlackAction = locale.getSync("addedBlackAction", lang);
      res0.deleteFriendText = locale.getSync("deleteFriendText", lang);
      res0.deleteBlackText = locale.getSync("deleteBlackText", lang);
      res0.deletedBlackAction = locale.getSync("deletedBlackAction", lang);
      res0.deletedFriendAction = locale.getSync("deletedFriendAction", lang);
      res.render(path.join(folder, "pug_templates", "userForm.pug"), res0);
    }
  });
}

let serversMethods = {};

pages["postjoin"] = (res, callback) => {
  if (res.token) {
    res.res.send({response: {code: 303, direction: res.lang ? "/" + res.lang + "/" : "/"}});
  } else {
    try {
      users.registerUser(res.res.req.body, (err0, res0) => {
        if (err0) {
          global.LiveLib.getLogger().debugm("Server.js", "server.post(\"/join\") => ", err0);
          sendError(res.res, err0, res.lang);
        } else {
          res.res.cookie("token", res0);
          res.res.send({response: {code: 303, direction: res.lang ? "/" + res.lang + "/" : "/"}});
        }
      });
    } catch (err) {
      global.LiveLib.getLogger().errorm("Server.js", "server.post(\"/join\") => ", err);
      callback(error.serv(err));
    }
  }
};

pages["postlogin"] = (res, callback) => {
  if (res.token) {
    res.res.send({response: {code: 303, direction: res.lang ? "/" + res.lang + "/" : "/"}});
  } else {
    try {
      users.loginUser(res.login, res.password, (err0, res0) => {
        if (err0) {
          global.LiveLib.getLogger().errorm("Server.js", "server.post(\"/join\") => ", err0);
          sendError(res.res, err0, res.lang);
        } else {
          res.res.cookie("token", res0);
          res.res.send({response: {code: 303, direction: res.lang ? "/" + res.lang + "/" : "/"}});
        }
      }, res.remember);
    } catch (err) {
      global.LiveLib.getLogger().errorm("Server.js", "server.post(\"/login\") => ", err);
      callback(error.serv(err));
    }
  }
};

function __func009(tmp, res) {
  if (tmp && tmp.length > 0) {
    if (tmp.indexOf("favicon.ico") > -1) {
      fs.createReadStream(path.join(folder, "images", "page_icon.png")).pipe(res.res);
      return;
    }

    let input = {
      token: res.cookies.token,
      res: res.res
    };
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
        let body = (typeof res.body === "string" || res.body instanceof String) ? JSON.parse(res.body) : res.body;
        for (let [key, value] of Object.entries(body)) {
          input[key] = value;
        }
      } catch (err) {
      }
    }

    if (tmp[0] === "api" || tmp[1] === "api") {
      let index = 1;
      let lang = -1;
      if (tmp[1] === "api") {
        lang++;
        index++;
      }

      if (tmp[index]) {
        if (methods[tmp[index]]) {

          input["__params"] = tmp.slice(index);
          input.lang = tmp[lang];

          methods[tmp[index]](input, (err0, res0) => {
            if (err0) sendError(res.res, err0, lang > -1 ? tmp[lang] : undefined);
            else if (res0) {
              res.res.send({response: res0});
            } else res.res.send({response: true});
          });
        } else {
          sendError(res.res, {code: 21, message: "method.not.find"}, lang > -1 ? tmp[lang] : undefined);
        }
      } else {
        res.res.send({
          name: "Api",
          versionServer: 1.2,
          versionApi: 1.0,
          message: "Please use '" + domen + "/api/<method>?[args]'"
        });
      }
    } else {
      let index = 0;
      let lang = -1;
      if (tmp.length > 1) lang = index++;

      input["__params"] = {};
      input.lang = tmp[lang];

      if (pages[tmp[index]]) {
        try {
          pages[tmp[index]](input, (err0, res0) => {
            if (err0) {
              if (err0.code == 9) {
                res.res.cookie("token", "");
                res.res.header("Location", "/");
                res.res.sendStatus(303);
              } else renderError(res.res, {code: 1, message: "server.error"}, lang > -1 ? tmp[lang] : undefined);
            } else if (res0) {
              render(res.res, res0, lang > -1 ? tmp[lang] : undefined);
            }
          });
        } catch (err) {
          global.LiveLib.getLogger().errorm("Server.js", "__func009 => ", err);
          renderError(res.res, {code: 1, message: "server.error"}, lang > -1 ? tmp[lang] : undefined);
        }
        return;
      } else
        for (let [key, value] of Object.entries(pages)) {
          let i = 0;
          while (key[i] === tmp[index][i] && i < key.length && i < tmp[index].length)
            i++;
          if (key[i] === ":") {
            input["__params"][key.substr(i + 1)] = tmp[index].substr(i);
            try {
              value(input, (err0, res0) => {
                if (err0) renderError(res.res, {code: 1, message: "server.error"}, lang > -1 ? tmp[lang] : undefined);
                else if (res0) {
                  render(res.res, res0, lang > -1 ? tmp[lang] : undefined);
                }
              });
            } catch (err) {
              global.LiveLib.getLogger().errorm("Server.js", "__func009 => ", err);
              renderError(res.res, {code: 1, message: "server.error"}, lang > -1 ? tmp[lang] : undefined);
            }
            return;
          }
        }
      renderError(res.res, {code: 404, message: "code404"}, tmp.length > 1 ? tmp[1] : tmp[0]);
    }
  } else {
    if (res.cookies && res.cookies.token) {
      renderUserForm(res.res, -1, res.cookies.token, undefined, (err) => {
        if (err.code == 9) {
          res.res.cookie("token", "");
          renderMainForm(res.res);
        } else {
          renderError(res.res, err);
        }
      });
    } else {
      renderMainForm(res.res);
    }
  }
}

server.get("/*", (res) => {
  if (!res.params[0]) res.params[0] = "";
  let tmp = res.params[0].split("/");
  __func009(tmp, res);
});

server.post("/*", (res) => {
  if (!res.params[0]) res.params[0] = "";
  let tmp = res.params[0].split("/");
  __func009(tmp, res);
});