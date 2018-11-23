require("./module/live_lib")("net", "photoEngine");
let one = new LiveLib.photoEngine.PhotoEngine("./photo", "localhost", "root", "1111qazwsxqweasd", "server");
let server = new LiveLib.net.Server();
server.post("/:args", (body, res, args, req, next) => {
  one.sendPhotoToServer(req.files.file, args.type, "http://localhost/", (err, val) => {
    if (err) {
      res.send(err);
    } else {
      res.sendStatus(200);
    }
  });
});