/*
Copyright © 2019 Ilya Loginov. All rights reserved.
Please email dantes2104@gmail.com if you would like permission to do something with the contents of this repository
*/
require("./module/live_lib")("net", "userEngine", "preference", "locale");
let server = new LiveLib.net();
let locale = new LiveLib.locale("./locales");
let pref = new LiveLib.preference("./server.pref");
pref.loadDataSync();

let url = LiveLib.base.getLib("url");
let request = LiveLib.base.getLib("request");
let path = LiveLib.base.getLib("path");
let fs = LiveLib.base.getLib("fs");

let port = pref.get("serverPort", "8080");
let ip = "http://" + LiveLib.net.getLocalServerIP() + ":" + port;
let domain = pref.get("domain", ip);
let folder = path.resolve("./html");

let users = new LiveLib.userEngine(ip, pref.get("host", "localhost"), pref.get("user"), pref.get("password"), pref.get("database"), pref.get("photo_folder"), folder, undefined, undefined, () => {
  server.start();
});

LiveLib.base.createIfNotExists(folder);

server.get("/favicon.ico", (res) => {
  fs.createReadStream(path.join(folder, "images", "page_icon.png")).pipe(res.res);
});
//----------------------------GET methods <domain>/[lang]/api/<method>--------------------------\\
let getMethods = {};
getMethods[""] = (res, callback) => {
  res.res.send({
    name: "Api",
    versionServer: 1.2,
    versionApi: 1.1,
    message: "Please use '" + domain + "/api/<method>?[args]'"
  });
};
getMethods["server/getPublicKey"] = (res, callback) => callback(undefined, users.getPublicKey());
getMethods["account:id"] = (res, callback) => users.accountGet(res.id, res.token, callback);
getMethods["account/getRelations"] = (res, callback) => users.accountStatusWith(res.id, res.token, callback);
getMethods["blacklist"] = (res, callback) => users.blacklistGet(res.token, callback);
getMethods["friends:id"] = (res, callback) => users.friendsGet(res.id, res.token, callback);
getMethods["friends/getSendRequest"] = (res, callback) => users.friendsGetSendRequest(res.token, callback);
getMethods["friends/getGetRequest"] = (res, callback) => users.friendsGetGetRequest(res.token, callback);
getMethods["photos/get"] = (res, callback) => users.photosGet(res.id, res.type, res.token, (err0, res0, ip, key, name) => {
  if (err0) callback(err0);
  else if (res0) {
    res0.pipe(res.res);
  } else request(url.resolve(ip, "/api/photos.getwithsystemkey") + "?name=" + name + "&key=" + key, (err, res, body) => {
    if (err) callback(global.LiveLib.ErrorMessage.serv(err));
    else {
      res.res.sendFile(body);
    }
  });
});
getMethods["photos/getTargetId"] = (res, callback) => users.photosGetTarget(res.id, res.target, res.token, callback);
getMethods["messages/getAllChat"] = (res, callback) => users.messagesGetAllChats(res.offset, res.limit, res.token, callback);
getMethods["messages/getPeerById"] = (res, callback) => users.messagesGetChatById(res.id, res.token, callback);
getMethods["messages/getById"] = (res, callback) => users.messagesGetById(res.id, res.token, callback);
getMethods["messages/getByPeerMessageId"] = (res, callback) => users.messagesGetByPeerMessageId(res.peer_id, res.id, res.token, callback);
//----------------------------POST methods <domain>/[lang]/api/<method>--------------------------\\
let postMethods = {};
postMethods["account/login"] = (res, callback) => users.loginUser(res.login, res.password, callback, res.remember);
postMethods["account/edit"] = (res, callback) => users.accountEdit(res, res.token, callback);
postMethods["blacklist/add"] = (res, callback) => users.blacklistAdd(res.id, res.token, callback);
postMethods["blacklist/delete"] = (res, callback) => users.blacklistDelete(res.id, res.token, callback);
postMethods["friends/add"] = (res, callback) => users.friendsAdd(res.id, res.token, callback);
postMethods["friends/delete"] = (res, callback) => users.friendsDelete(res.id, res.token, callback);
postMethods["photos/add"] = (res, callback) => users.photosAdd(res.file, res.access, res.token, callback);
postMethods["photos/delete"] = (res, callback) => users.photosDelete(res.id, res.token, callback);
postMethods["photos/setTargetId"] = (res, callback) => users.photosSetTarget(res.id, res.target, res.token, callback);
postMethods["messages/createChat"] = (res, callback) => users.messagesCreateChat(res.name, res.users_ids, res.token, callback);
postMethods["messages/addUserToChat"] = (res, callback) => users.messagesAddUserToChat(res.user_id, res.peer_id, res.admin, res.token, callback);
postMethods["messages/deleteUserFromChat"] = (res, callback) => users.messagesDeleteUserFromChat(res.user_id, res.peer_id, res.token, callback);
postMethods["messages/leaveFromChat"] = (res, callback) => users.messagesLeaveFromChat(res.id, res.token, callback);
postMethods["messages/addToChat"] = (res, callback) => users.messagesAddToChat(res.id, res.token, callback);
postMethods["messages/markAsRead"] = (res, callback) => users.messagesMarkAsRead(res.id, res.token, callback);
postMethods["messages/sendMessage"] = (res, callback) => users.messagesSendMessage(res.peer_id, res.text, res.reples, res.photos, res.token, callback);

//----------------------------PUT methods <domain>/[lang]/api/<method>--------------------------\\
let putMethods = {};
putMethods["photos/add"] = (res, callback) => users.photosAdd(res.file, res.access, res.token, callback);

//--------------------------Utils-------------\\\
getMethods["photos.getwithsystemkey"] = (res, callback) => callback(undefined, users.getPhoto(res.photo, res.key));
getMethods["docs"] = res => res.res.sendFile(path.join(folder, "html_static", "README_API.html"));
getMethods["demo"] = res => res.res.sendFile(path.join(folder, "html_static", "test.html"));
getMethods["js"] = res => res.res.sendFile(path.join(folder, "js_scripts", res.file));
getMethods["swagger"] = res => {
  res.res.header("Access-Control-Allow-Origin", "*");
  res.res.sendFile(path.join(folder, "swagger.json"));
};
postMethods["post/join"] = (res, callback) => {
  if (res.args.crossDomainRequest || res.req.get("Access-Control-Request-Method") || res.req.get("Access-Control-Request-Headers")) {
    callback(new error(404, "code404"));
  } else {
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
  }
};

postMethods["post/login"] = (res, callback) => {
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

function sendError(res, err, lang) {
  res.send({error: {code: err.code, message: locale.getSync(err.message, lang)}});
}

function __getinput(res) {
  let input = {
    token: res.cookies.token,
    res: res.res
  };

  if (res.params) {
    for (let [key, value] of Object.entries(res.params)) {
      input[key] = value;
    }
  }
  if (res.args) {
    for (let [key, value] of Object.entries(res.args)) {
      input[key] = value;
    }
  }

  if (res.files) {
    try {
      input.file = Object.entries(res.files)[0][1];
    } catch (err) {
    }
  }

  if (res.body) {
    try {
      let body = (typeof res.body === "string" || res.body instanceof String) ? JSON.parse(res.body) : res.body;
      for (let [key, value] of Object.entries(body)) {
        input[key] = value;
      }
    } catch (err) {
    }
  }
  return input;
}

function apiCallback(err0, res0, res) {
  if (err0) sendError(res.res, err0, res.args.lang && res.params.lang && res.cookies.lang);
  else if (res0) res.res.send({response: res0});
  else res.res.send({response: true});
};

function createGetMethod(name, func) {
  server.get(name, (res) => {
    func(__getinput(res), (err0, res0) => {
      apiCallback(err0, res0, res);
    });
  });
}

function createPostMethod(name, func) {
  server.post(name, (res) => {
    func(__getinput(res), (err0, res0) => {
      apiCallback(err0, res0, res);
    });
  });
}

function createPutMethod(name, func) {
  server.put(name, (res) => {
    func(__getinput(res), (err0, res0) => {
      apiCallback(err0, res0, res);
    });
  });
}

for (let [key, value] of Object.entries(getMethods)) {
  createGetMethod(path.join("/api/", key), value);
  createGetMethod(path.join("/:lang/api/", key), value);
}

for (let [key, value] of Object.entries(postMethods)) {
  createPostMethod(path.join("/api/", key), value);
  createPostMethod(path.join("/:lang/api/", key), value);
}

for (let [key, value] of Object.entries(putMethods)) {
  createPutMethod(path.join("/api/", key), value);
  createPutMethod(path.join("/:lang/api/", key), value);
}

function render(res, page, lang) {
  let name = page["$$name"];
  page["$$name"] = undefined;
  let object = {};
  for (let [key, value] of Object.entries(page)) {
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
      res0.statusText = locale.getSync("statusText", lang);
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
      res0.editForm = locale.getSync("editForm", lang);
      res0.exit = locale.getSync("exit", lang);
      res0.exitMessage = locale.getSync("exitMessage", lang);
      res.render(path.join(folder, "pug_templates", "userForm.pug"), res0);
    }
  });
}

function createPage(name, func) {
  server.get(name, (res) => {
    func(__getinput(res), (err0, res0) => {
      if (err0) {
        if (err0 == 9) {
          res.res.cookie("token", "");
          res.res.header("Location", "/");
          res.res.sendStatus(303);
        } else {
          renderError(res.res, err0, res.args.lang || res.params.lang || res.cookies.lang);
        }
      } else render(res.res, res0, res.args.lang || res.params.lang || res.cookies.lang);
    });
  });
}

//----------------------------GET pages <domain>/[lang]/<page>--------------------------\\
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
      repeat_password: "repeatedPasswordText",
      placeholderLogin: "placeholderLoginText",
      placeholderPassword: "placeholderPasswordText",
      sendMessage: "sendMessageText",
      resetMessage: "resetMessageText",
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
  users.resetToken(res.token, err => {
    if (err) callback(err);
    else {
      res.res.cookie("token", "");
      res.res.header("Location", "/");
      res.res.sendStatus(303);
    }
  });
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
  } else {
    res.res.header("Location", "/");
    res.res.sendStatus(303);
  }
};

pages["black"] = (res, callback) => {
  if (res.token) {
    users.blacklistGet(res.token, (err0, res0) => {
      if (err0) callback(err0);
      else callback(undefined, {
        "$$name": path.join(folder, "pug_templates", "blackForm.pug"),
        "$black": res0.toString(),
        title: "domenText",
        deleteBlackText: "deleteBlackText",
        haveNotBlack: "haveNotBlack",
        deletedBlackAction: "deletedBlackAction",
        accountText: "accountText",
        friendsText: "friendsText",
        blackListText: "blackListText",
      });
    });
  } else {
    res.res.header("Location", "/");
    res.res.sendStatus(303);
  }
};

pages["edit"] = (res, callback) => {
  if (res.token) {
    users.accountGet(-1, res.token, (err0, res0) => {
      if (err0) callback(err0);
      else {
        callback(undefined, {
          "$$name": path.join(folder, "pug_templates", "settingsForm.pug"),
          title: "domenText",
          closedText: "closedText",
          placeholderStatus: "placeholderStatus",
          sendMessage: "sendMessageText",
          resetMessage: "resetMessageText",
          loading: "loadingText",
          editForm: "editForm",
          statusText: "statusText",
          cancelMessage: "cancelMessage",
          cancel: "cancel",
          photoText: "photoText",
          "$sex": !!res0.sex,
          "$status": res0.status,
          "$firstName": res0.firstName,
          "$secondName": res0.secondName,
          "$lastName": res0.lastName,
          "$closed": !!res0.closed
        });
      }
    });
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


server.get("/swagger/:file", (res) => {
  if (res.req.params.file) {
    res.res.sendFile(path.join(folder, "swagger-ui-dist", res.req.params.file));
  } else res.res.sendFile(path.join(folder, "swagger-ui-dist", "index.html"));
});

pages[""] = (res, callback) => {
  if (res.token) {
    renderUserForm(res.res, -1, res.token, res.lang, callback);
  } else {
    renderMainForm(res.res, res.lang);
  }
};

for (let [key, value] of Object.entries(pages)) {
  createPage(path.join("/", key), value);
  createPage(path.join("/:lang/", key), value);
}


/*let methods = {};

methods["server.getPublicKey"] = (res, callback) => callback(undefined, users.getPublicKey());
methods["account.login"] = (res, callback) => users.loginUser(res.login, res.password, callback, res.remember);
methods["account.get"] = (res, callback) => users.accountGet(res.id, res.token, callback);
methods["account.statusWith"] = (res, callback) => users.accountStatusWith(res.id, res.token, callback);
methods["account.edit"] = (res, callback) => users.accountEdit(res, res.token, callback);

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

methods["swagger"] = res => {
  res.res.header("Access-Control-Allow-Origin", "*");
  res.res.sendFile(path.join(folder, "swagger.json"));
};


function sendError(res, err, lang) {
  res.send({error: {code: err.code, message: locale.getSync(err.message, lang)}});
}

let pages = {};


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
          message: "Please use '" + domain + "/api/<method>?[args]'"
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
});*/

process.stdin.on("data", (chunk) => {
  if (chunk.toLowerCase() === "locale reload\n") {
    locale.locales.clear();
    locale.loadLocaleFromFileSync("en-US", true);
    global.LiveLib.getLogger().info("Locales reloaded");
  }
});