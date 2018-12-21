Base = {
  domen: window.location.origin,
  lang: navigator.language || navigator.userLanguage,

  url: function (str, ...args) {
    let tmp0 = str.split("://");
    if (tmp0.length > 1) {
      this.protocol = tmp0[0].toLowerCase();
      this.url = tmp0[1].split("/").filter(str => str.length > 0 && str !== ".." && str != ".");
    } else {
      this.protocol = undefined;
      this.url = tmp0[0].split("/").filter(str => str.length > 0 && str !== ".." && str != ".");
    }

    this.join(...args);
  },

  sendRequest: function (url, object, headers, callback, lang, post_object) {
    let obj = "";
    if (object) {
      obj += "?"
      for (let [key, value] of Object.entries(object)) {
        obj += key + "=" + value + "&";
      }
    }
    let tmp = new Base.url(this.domen, lang ? lang : this.lang, url + (obj ? obj.substr(0, obj.length - 1) : "")).toString();
    console.log(tmp);

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
        } else callback({error: {code: xmlHttp.status, message: xmlHttp.responseText}});
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
    object.crossDomenRequest = true;
    this.sendRequest("api/" + method, object, undefined, callback, lang, post_object);
  },

  getPublicKey: function (callback) {
    this.sendRequestToServer("server.getPublicKey", null, callback);
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
      let errorObject = document.getElementById("error");
      let sendObject = {};
      let promises = [];
      for (let [key, value] of Object.entries(obj)) {
        let key0 = value.key || key;
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
        Base.sendRequest(url, undefined, {"Content-Type": "application/json"}, (err0, res0) => {
          document.getElementById("loading").hidden = true;
          document.getElementById("main").hidden = false;
          if (err0) {
            errorObject.innerText = err0.error.message;
            errorObject.hidden = false;
          }
        }, Base.lang, JSON.stringify(sendObject));
      }, (err) => {
        if (err) {
          errorObject.innerText = err.message;
          errorObject.hidden = false;
        }
      });
    };
  }
};

Base.url.prototype.getDomain = function () {
  return this.url.length > 0 ? this.url[0] : "";
};

Base.url.prototype.getPath = function () {
  return this.url.length > 1 ? this.url.slice(1).join("/") : "";
};

Base.url.prototype.join = function (...args) {
  for (let str of args) {
    let tmp = new Base.url(str);
    if (this.protocol === -1) {
      this.protocol = tmp.protocol;
      this.url = tmp.url.concat(this.url);
    } else this.url = this.url.concat(tmp.url);
  }
  return this;
};

Base.url.prototype.toString = function () {
  return (this.protocol ? this.protocol + "://" : "") + this.url.join("/");
};

let url = new Base.url(window.location.toString());
if (!url.url[1] || url.url[1].indexOf("-") < 0) window.location.replace("/" + Base.lang + "/" + url.getPath());
else Base.lang = url.url[1];