/*
Copyright © 2019 Ilya Loginov. All rights reserved.
Please email dantes2104@gmail.com if you would like permission to do something with the contents of this repository
*/

function reset(strings, strings0) {
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
}

function getValue(id) {
  let tmp = document.getElementById(id);
  if (tmp) return tmp.value;
  else return undefined;
}

function getChecked(id) {
  let tmp = document.getElementById(id);
  if (tmp) return tmp.checked;
  else return undefined;
}

function createSendFunction(url, obj) {
  return window.send = function () {
    let errorObject = document.getElementById("error");
    let sendObject = {};
    let promises = [];
    for (let [key, value] of Object.entries(obj)) {
      let key0 = value.key || key;
      if (value.get) {
        promises.push(new Promise((res, rej) => {
          value.get(document.getElementById(key), (err0, res0) => {
            if (err0) rej(err0);
            else {
              sendObject[key0] = res0;
              res();
            }
          });
        }));
      } else
        sendObject[key0] = value.checked ? getChecked(key) : getValue(key);
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
      Base.sendMethod(url, Base.lang, null, JSON.stringify(sendObject), {"Content-Type": "application/json"}, (err0) => {
        document.getElementById("loading").hidden = true;
        document.getElementById("main").hidden = false;
        if (err0) {
          errorObject.innerText = err0.error.message;
          errorObject.hidden = false;
          if (obj["$callback"]) obj["$callback"](err0);
        } else if (obj["$callback"]) obj["$callback"]();
      });
    }, (err) => {
      errorObject.innerText = err.error ? err.error.message : err.message;
      errorObject.hidden = false;
      if (obj["$callback"]) obj["$callback"](err);
    });
  };
}