/*
Copyright © 2019 Ilya Loginov. All rights reserved.
Please email dantes2104@gmail.com if you would like permission to do something with the contents of this repository
*/

Base = {};
Base.domain = window.location.origin; //TODO: change to real domain (Example "vk.com")
Base.lang = navigator.language || navigator.userLanguage;
Base.sendAllErrors = false;

Base.url = function (str, ...args) {
  let tmp0 = str.split("://");
  if (tmp0.length > 1) {
    this.protocol = tmp0[0].toLowerCase();
    this.url = tmp0[1].split("/").filter(str => str.length > 0 && str !== ".." && str != ".");
  } else {
    this.protocol = undefined;
    this.url = tmp0[0].split("/").filter(str => str.length > 0 && str !== ".." && str != ".");
  }
  this.join(...args);
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

Base.sendRequest = function (url, query, headers, object_for_post, callback) {
  let query_str = "";
  if (query) {
    query_str += "?";
    for (let [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) query_str += key + "=" + value + "&";
    }
  }

  let req = new XMLHttpRequest();
  req.onreadystatechange = function () {
    if (req.readyState == 4) {
      if (req.status == 200) {
        try {
          let json = JSON.parse(req.responseText);
          if (json.error) {
            callback(json);
          } else {
            switch (json.response.code) {
              case 303:
                if (Base.sendAllErrors) {
                  callback(json.response);
                } else {
                  window.location.replace(json.response.direction);
                }
                break;
              default:
                callback(undefined, json);
                break;
            }

          }
        } catch (err) {
          callback(undefined, req.responseText);
        }
      } else callback({error: {code: req.status, message: req.responseText}});
    }
  };

  req.open(object_for_post ? "POST" : "GET", url + query_str.substr(0, query_str.length - 1), true);
  if (headers) {
    for (let [key, value] of Object.entries(headers)) {
      req.setRequestHeader(key, value);
    }
  }

  req.send(object_for_post);
};

Base.sendMethod = function (method, lang, get_params, post_params, headers, callback) {
  if (!headers) headers = {};
  if (headers.crossDomainRequest === undefined) headers.crossDomainRequest = true;
  Base.sendRequest(new Base.url(this.domain, lang ? lang : this.lang, "/api/", method).toString(), get_params, headers, post_params, callback);
};

Server = {};

Server.getPublicKey = function (callback) {
  Base.sendMethod("server/getPublicKey", null, null, null, null, callback);
};

Account = {};

Account.edit = function (account, callback, token) {
  account.token = token;
  Base.sendMethod("account/edit", null, null, JSON.stringify(account), {"Content-Type": "application/json"}, callback);
};

Account.get = function (id, callback, token) {
  Base.sendMethod("account" + id, null, null, null, null, callback);
};

Account.getRelations = function (id_with, callback, token) {
  Base.sendMethod("account/relations", null, {id: id_with, token: token}, null, null, callback);
};

Account.login = function (login, password, remember, callback) {
  Server.getPublicKey((err, res) => {
    if (err) callback(err);
    else {
      Base.sendMethod("account/login", null, null, JSON.stringify({
        login: login,
        password: new document.NodeRSA(res.response, "pkcs1-public-pem").encrypt(password, "base64"),
        remember: !!remember
      }), {"Content-Type": "application/json"}, callback);
    }
  });
};

Blacklist = {};

Blacklist.add = function (id, callback, token) {
  Base.sendMethod("blacklist/add", null, null, JSON.stringify({
    id: id,
    token: token
  }), {"Content-Type": "application/json"}, callback);
};

Blacklist.delete = function (id, callback, token) {
  Base.sendMethod("blacklist/delete", null, null, JSON.stringify({
    id: id,
    token: token
  }), {"Content-Type": "application/json"}, callback);
};

Blacklist.get = function (callback, token) {
  Base.sendMethod("blacklist", null, {token: token}, null, null, callback);
};

Friends = {};

Friends.add = function (id, callback, token) {
  Base.sendMethod("friends/add", null, null, JSON.stringify({
    id: id,
    token: token
  }), {"Content-Type": "application/json"}, callback);
};

Friends.delete = function (id, callback, token) {
  Base.sendMethod("friends/delete", null, null, JSON.stringify({
    id: id,
    token: token
  }), {"Content-Type": "application/json"}, callback);
};

Friends.get = function (id, callback, token) {
  Base.sendMethod("friends" + id, null, {token: token}, null, null, callback);
};

Friends.getSendRequest = function (callback, token) {
  Base.sendMethod("friends/getSendRequest", null, {token: token}, null, null, callback);
};

Friends.getGetRequest = function (callback, token) {
  Base.sendMethod("friends/getGetRequest", null, {token: token}, null, null, callback);
};

Messages = {};

Photos = {};

Photos.add = function (image, access, callback, token) {
  let form = new FormData();
  form.append("photo", image, image.name);
  Base.sendMethod("photos/add", null, {access: access, token: token}, form, null, callback, false);
};

Photos.delete = function (photo_id, callback, token) {
  Base.sendMethod("photos/delete", null, null, JSON.stringify({
    id: photo_id,
    token: token
  }), {"Content-Type": "application/json"}, callback);
};

Photos.get = function (photo_id, type, callback, token) {
  Base.sendMethod("photos/get", null, {id: photo_id, type: type, token: token}, null, null, callback);
};

Photos.getTargetId = function (user_id, target, callback, token) {
  Base.sendMethod("photos/getTargetId", null, {id: user_id, target: target, token: token}, null, null, callback);
};

Photos.setTargetId = function (photo_id, target, callback, token) {
  Base.sendMethod("photos/setTargetId", null, null, JSON.stringify({
    id: photo_id,
    target: target,
    token: token
  }), {"Content-Type": "application/json"}, callback);
};

let url = new Base.url(window.location.toString());
if (!url.url[1] || url.url[1].indexOf("-") < 0) window.location.replace("/" + Base.lang + "/" + url.getPath());
else Base.lang = url.url[1];