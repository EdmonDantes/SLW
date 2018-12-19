let getValue = Base.getValue;

window.createSend = function (errors) {
  window.send = function () {
    let lang = navigator.language || navigator.userLanguage;
    let login = getValue("login");
    let password = getValue("password");
    let fName = getValue("fName");
    let sName = getValue("sName");
    let man = document.getElementById("man").checked ? "man" : 0;
    let error = document.getElementById("error");
    if (login.length < 4 || login.length > 80) {
      error.innerText = errors.login;
      error.hidden = false;
    } else if (password.length < 4 || password.length > 80) {
      error.innerText = errors.password;
      error.hidden = false;
    } else if (fName.length < 3 || fName.length > 80) {
      error.innerText = errors.firstName;
      error.hidden = false;
    } else if (sName.length < 3 || sName.length > 80) {
      error.innerText = errors.secondName;
      error.hidden = false;
    } else {
      error.hidden = true;
      document.getElementById("load").hidden = false;
      document.getElementById("registration").hidden = true;
      Base.encrypt(password, function (err, res) {
        if (!err) {
          Base.sendRequest("/join", undefined, {"Content-Type": "application/json"}, function (err0, res0) {
            if (err0) {
              document.getElementById("load").hidden = true;
              document.getElementById("registration").hidden = false;
              //window.location.replace("/");
            }
            if (err0 && err0.error) {
              let tmp = document.getElementById("error");
              tmp.hidden = false;
              switch (err0.error.code) {
                case 2:
                  tmp.innerText = errors.login;
                  break;
                case 3:
                  tmp.innerText = errors.password;
                  break;
              }
            }
          }, lang, JSON.stringify({
            login: login,
            password: res,
            firstName: fName,
            secondName: sName,
            sex: man
          }));
        }
      });
    }

  }
};