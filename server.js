require("./module/live_lib")("net", "userEngine", "preference", "locale");
let server = new LiveLib.net();
let path = LiveLib.base.getLib("path");
let pref = new LiveLib.preference("./server.pref");
pref.loadDataSync();
let users = new LiveLib.userEngine(pref.get("host", "localhost"), pref.get("user"), pref.get("password"), pref.get("database"), pref.get("photos folder"));
let folder = path.resolve("./html");
let locale = new LiveLib.locale("./locales");
let url = LiveLib.base.getLib("url");
let port = 8080;
let domen = "http://" + LiveLib.net.getLocalServerIP() + ":" + port;

LiveLib.base.createIfNotExists(folder);


let methods = {};

function sendError(res, err, lang) {
  res.send({code: err.code, message: locale.getSync(err.message, lang)});
}

server.get("/:lang/api/:method", (res) => {
  res.res.send(res.params);
});

server.get("/api/:method", (res) => {
  if (res && res.params && res.params.method) {
    if (methods[res.args.method]) {
      try {
        methods[res.args.method](res, (err0, res0) => {
          if (err0) sendError(res.res, err0, res.args.lang);
          else {
            res.res.send({response: res0});
          }
        });
      } catch (err) {
        sendError(res.res, {code: 1, message: "server.error"}, res.args.lang)
      }
    } else {
      sendError(res.res, {code: 21, message: "method.not.find"}, res.args.lang);
    }
  } else {
    res.res.send({name: "Api", version: 1.2, message: "Please use '" + domen + "/api/<method>?[args]'"});
  }
});






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

function renderMainForm(res, lang) {
  res.render(path.join(folder, "pug_templates", "mainForm.pug"), {
    log_in: locale.getSync("log_in", lang),
    join_in: locale.getSync("join_in", lang),
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
      middleName: locale.getSync("middleName", lang),
      placeholderFirstName: locale.getSync("placeholderFirstName", lang),
      placeholderMiddleName: locale.getSync("placeholderMiddleName", lang),
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
      } else
        res.res.sendStatus(200);
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