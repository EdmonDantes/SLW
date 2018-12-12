document.Base = {
  domen: "http://80.211.26.238:8080",

  sendRequestToServer: function (method, object, callback, lang) {
    let postDomen = "/" + (lang ? lang + "/" : "") + "api/" + method + "?crossDomenRequest=true";
    if (object) {
      for (let [key, value] of Object.entries(object)) {
        postDomen += "&" + key + "=" + value;
      }
    }
    let url = new URL(postDomen.substr(0, postDomen.length - 1), this.domen);

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4) {
        if (xmlHttp.status == 200) {
          let json = JSON.parse(xmlHttp.responseText);
          if (json.error) callback(json);
          else callback(undefined, json);
        } else callback({error: {code: xmlHttp.status, message: xml.responseText}});
      }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send(null);
  },

  getPublicKey: function (callback) {
    this.sendRequestToServer("server.getPublicKey", null, callback);
  },

  encrypt: function (text, callback) {
    this.getPublicKey((err, res) => {
      if (err) callback(err);
      else {
        let key = new document.NodeRSA(res);
        callback(undefined, key.encrypt(text, "base64"));
      }
    });
  }
};
