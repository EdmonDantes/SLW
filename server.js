require("./module/live_lib")("net", "userEngine", "preference", "locale");
let server = new LiveLib.net();
let path = LiveLib.base.getLib("path");
let pref = new LiveLib.preference("./server.pref");
pref.loadDataSync();
let users = new LiveLib.userEngine(pref.get("host", "localhost"), pref.get("user"), pref.get("password"), pref.get("database"), pref.get("photos folder"));
let folder = path.resolve("./html");
let locale = new LiveLib.locale("./locales");
let url = LiveLib.base.getLib("url");
let domen = "http://localhost:8080";

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

function renderRegisterForm(res, error_message) {
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

  res.render(path.join(folder, "userForm.pug"), us);
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
    res.res.render(path.join(folder, "registerForm"));
  }
});

server.get("/join", (res) => {
  if (res.cookies.token) {
    res.res.header("Location", domen);
    res.res.sendStatus(303);
  } else {
    let lang = res.args.lang;
    renderRegisterForm(res.res);
  }
});

server.post("/join", (res) => {
  if (res.cookies.token) {
    res.res.header("Location", domen);
    res.res.sendStatus(303);
  } else {
    users.registerUser(res.body, (err, res0) => {
      if (err) {
        let lang = res.args.lang;
        renderRegisterForm(res.res, "Wrong users data");
      } else {
        res.res.cookie("token", res0);
        res.res.header("Location", domen);
        res.res.sendStatus(303);
      }
    });
  }
});

server.get("/user:id", (err, res) => {
  if (res.cookies.token && Object.keys(res.args)[0]) {
    users.accountGet(Object.keys(res.args)[0], res.cookies.token, (err0, res0) => {
      if (!checkError(err0, res)) {
        res.res.render(path.join(folder, "userForm.pug"), res0);
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

server.get("/method/:args", (err, res) => {
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