const http = require("http");
const https = require("https");
const fs = require("fs");
const request = require("request");
var downloadFile = (url, cb) => {
  if (!url) cb("Haven`t url");
  let req = http;
  if (url.indexOf("https") > -1) req = https;
  let fileName = "/tmp/" + Date.now() + "image";
  let stream = fs.createWriteStream(fileName);
  stream.on("finish", () => {
    cb(null, fileName);
  });
  stream.on("error", err => cb(err));
  req.get(url, (res) => {
    res.pipe(stream);
  }).on("error", err => cb(err));
}

function uploadFile(filePath, cb) {
  var req = request.post("http://rucaptcha.com/in.php", (err, res, body) => {
    if (err) cb(err);
    else if (res && res.statusCode === 200 && body.indexOf("ERROR") < 0) {
      cb(null, res.body.split("|")[1]);
    } else cb(body);
  });
  var form = req.form();
  form.append("key", "fae0ed2a9b9ec69df6a179fc08d3a540");
  form.append("file", fs.createReadStream(filePath));
}

function getAnswer(captchaId, cb) {
  request.get("http://rucaptcha.com/res.php?key=fae0ed2a9b9ec69df6a179fc08d3a540&action=get&id=" + captchaId, (err, res) => {
    if (err) cb(err);
    else if (res.body === "CAPCHA_NOT_READY")
      setTimeout(() => {
        getAnswer(captchaId, cb)
      }, 2000);
    else if (res.body.indexOf("ERROR") < 0) cb(null, res.body.split("|")[1]);
    else cb(res.body);
  })
}

var solve = (url, cb) => {
  downloadFile(url, (err, fileName) => {
    if (err) cb(err);
    else uploadFile(fileName, (err, res) => {
      if (err) cb(err);
      else getAnswer(res, (err, res) => {
        if (err) cb(err);
        else cb(null, res);
      });
    });
  });
}

module.exports.solve = solve;
