Base = {
  domen: "http://localhost:8080",
  publicKey: undefined,

  sendRequest: function (url, object, headers, callback, lang, post_object) {
    let postDomen = "/" + (lang ? lang + "/" : "");
    if (object) {
      for (let [key, value] of Object.entries(object)) {
        postDomen += "&" + key + "=" + value;
      }
    }
    let tmp = new URL(url, new URL(postDomen.substr(0, postDomen.length - 1), this.domen));

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4) {
        if (xmlHttp.status == 200) {
          try {
            let json = JSON.parse(xmlHttp.responseText);
            if (json.error) {
              callback(json);
            } else {
              switch (json.response.code) {
                case 303:
                  window.location.replace(json.response.direction);
                  break;
                default:
                  callback(undefined, json);
                  break;
              }

            }
          } catch (err) {
            callback({error: err});
          }
        }
      }
    };
    xmlHttp.open(post_object ? "POST" : "GET", tmp, true);
    if (headers) {
      for (let [key, value] of Object.entries(headers)) {
        xmlHttp.setRequestHeader(key, value);
      }
    }
    xmlHttp.send(post_object);
  },

  sendRequestToServer: function (method, object, callback, lang, post, post_object) {
    this.sendRequest("api/" + method + "?crossDomenRequest=true", object, undefined, callback, lang, post_object);
  },

  getPublicKey: function (callback) {
    if (this.publicKey) callback(undefined, this.publicKey);
    else this.sendRequestToServer("server.getPublicKey", null, (err, res) => {
      if (err) callback(err);
      else {
        this.publicKey = res;
        callback(undefined, res);
      }
    });
  },

  encrypt: function (text, callback) {
    this.getPublicKey((err, res) => {
      if (err) callback(err);
      else {
        let key = new document.NodeRSA(res.response, "pkcs1-public-pem");
        callback(undefined, key.encrypt(text, "base64"));
      }
    });
  },

  reset: function (strings, strings0) {
    window.reset = function () {
      for (let str of strings) {
        let obj = document.getElementById(str);
        if (obj) {
          if (obj.type === "radio") obj.checked = true;
          else obj.value = "";
        }
      }
      for (let str of strings0) {
        let obj = document.getElementById(str);
        if (obj) {
          obj.checked = false;
        }
      }
    }
  },

  getValue: function (id) {
    let tmp = document.getElementById(id);
    if (tmp) return tmp.value;
    else return undefined;
  },

  getChecked: function (id) {
    let tmp = document.getElementById(id);
    if (tmp) return tmp.cheched;
    else return undefined;
  },

  getState: function (id) {
    return this.getValue(id) || this.getChecked(id);
  },

  createSendFunction: function (url, obj) {
    return window.send = function () {
      let lang = navigator.language || navigator.userLanguage;
      let errorObject = document.getElementById("error");
      let sendObject = {};
      let promises = [];
      for (let [key, value] of Object.entries(obj)) {
        let key0 = key || value.key;
        sendObject[key0] = Base.getState(key);
        if (value.check) {
          promises.push(new Promise((res, rej) => {
            value.check(sendObject[key0], (err0, res0) => {
              if (err0) rej(err0);
              else {
                if (res0) sendObject[key0] = res0;
                res();
              }
            });
          }));
        }
      }
      Promise.all(promises).then((res) => {
        errorObject.hidden = true;
        document.getElementById("loading").hidden = false;
        document.getElementById("main").hidden = true;
        debugger;
        Base.sendRequest(url, undefined, {"Content-Type": "application/json"}, (err0, res0) => {
          document.getElementById("loading").hidden = true;
          document.getElementById("main").hidden = false;
          if (err0) {
            errorObject.innerText = err0.error.message;
            errorObject.hidden = false;
          }
        }, lang, JSON.stringify(sendObject));
      }, (err) => {
        if (err) {
          errorObject.innerText = err.message;
          errorObject.hidden = false;
        }
      });
    };
  }
};
