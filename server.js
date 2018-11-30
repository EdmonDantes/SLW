// require("./module/live_lib")("net", "photoEngine");
// let server = new LiveLib.net.Server();
// let photo = new LiveLib.photoEngine("./photo", "localhost", "root", "1111qazwsxqweasd", "server");
// server.post("/:args", (body, res, args, req, next) => {
//   photo.sendPhotoToServer(req.files.file, args.type, req.protocol + '://' + LiveLib.net.getLocalServerIP() + "/", (err, val) => {
//     if (err) res.send(JSON.stringify(err));
//     else res.send({photo_id: val, type: args.type});
//   });
// });
//
// server.get("/:args", (res, args, req, next) => {
//   if (args.photo_id && args.type) {
//     photo.sendPhotoFromServer(args.photo_id, args.type, (err, val) => {
//       if (err) res.send(JSON.stringify(err));
//       else {
//         res.header("Location", val);
//         res.sendStatus(308);
//       }
//     });
//   } else if (args.photo) {
//     res.download(photo.getPhoto(args.photo), "photo");
//   }
// });

require("./module/live_lib")("userEngine");

let users = new LiveLib.userEngine("./users", "localhost", "root", "1111qazwsxqweasd", "testApi");
users.getUser(1, "gUaK8VekHQY5tajaSip4EZ2G20haSLK5abNN7unQ0S8NqSckl79vtgOceuKB", console.log);
// users.registerUser({login: "test2", password: "1234", firstName: "fisrt", lastName: "last", sex: "man"}, (err, message, res) => {
//   console.log(message, res);
//   users.createToken(1, -1, -1, (err, message, res) => {
//     console.log(err, message, res);
//   });
// });