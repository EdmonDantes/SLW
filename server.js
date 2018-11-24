require("./module/live_lib")("net", "photoEngine");
let server = new LiveLib.net.Server();
let photo = new LiveLib.photoEngine("./photo", "localhost", "root", "1111qazwsxqweasd", "server");
server.post("/:args", (body, res, args, req, next) => {
  photo.sendPhotoToServer(req.files.file, args.type, req.protocol + '://' + LiveLib.net.getLocalServerIP() + "/", (err, val) => {
    if (err) res.send(JSON.stringify(err));
    else res.send({photo_id: val, type: args.type});
  });
});

server.get("/:args", (res, args, req, next) => {
  if (args.photo_id && args.type) {
    photo.sendPhotoFromServer(args.photo_id, args.type, (err, val) => {
      if (err) res.send(JSON.stringify(err));
      else {
        res.header("Location", val);
        res.sendStatus(308);
      }
    });
  } else if (args.photo) {
    res.download(photo.getPhoto(args.photo), "photo");
  }
});

console.log();