/*
Copyright © 2019 Ilya Loginov. All rights reserved.
Please email dantes2104@gmail.com if you would like permission to do something with the contents of this repository
*/
const NodeRSA = require('node-rsa');
const req = require("request");

req("http://localhost:8080/api/server.getPublicKey", {}, (err, res, body) => {
  let key = new NodeRSA(JSON.parse(body).response);
  let pass = "password";// password
  let password = key.encrypt(pass, "base64");
  req("http://localhost:8080/join", {
      method: "POST", json:
        {login: "login", password: password, firstName: "Name", secondName: "SecondN", sex: "man"} // user
    },
    (err, res, body) => {
      console.log(body);
    });
});
