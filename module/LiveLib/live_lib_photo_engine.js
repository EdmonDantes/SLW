let live_lib_photo_engine = function () {//TODO: create new module
  if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
  if (!global.LiveLib || global.LiveLib.Version < 1.1) return false;
  global.LiveLib.____LOAD_LIVE_MODULE("logger");
  let base = global.LiveLib.base;
  let path = base.__GET_LIB("path");
  let fs = base.__GET_LIB("fs");
  let obj = global.LiveLib.____CREATE_MODULE("photo_engine");

  obj.PhotoEngine = function (folder) {
    this.folder = path.resolve(folder);
    base.createIfNotExists(folder);
  };

  obj.PhotoEngine.prototype.sendPhotoToServer = function (photo_name, type_of_photo, buffer_or_file, type_of_file, callback) {
    if (photo_name && buffer_or_file && type_of_file) {
      if (buffer_or_file.mv) {
        buffer_or_file.mv(path.join(this.folder, photo_name + "." + type_of_file), () => {
          console.log("Hello");
        });
        callback(path.join(this.folder, photo_name + "." + type_of_file));
        return true;
      }
      else {
        fs.createWriteStream(path.join(this.folder, photo_name + "." + type_of_file)).write(buffer_or_file).end();
        callback(path.join(this.folder, photo_name + "." + type_of_file));
        return true;
      }
    }
    return false;
    //TODO: create function
  };

  obj.PhotoEngine.prototype.sendPhotoFromServer = function (photo_name, type_of_photo) {
    //TODO: create function
  };

  obj.PhotoEngine.prototype.setSettings = function (settings) {
    //TODO: create function
  };
};

module.exports = live_lib_photo_engine;