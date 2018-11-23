let live_lib_photoEngine = function () {//TODO: create new module
  if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
  if (!global.LiveLib || global.LiveLib.Version < 1.1) return false;
  global.LiveLib.____LOAD_LIVE_MODULE("logging");
  let base = global.LiveLib.base;
  let Database = global.LiveLib.____LOAD_LIVE_MODULE("database").Database;
  let path = base.__GET_LIB("path");
  let fs = base.__GET_LIB("fs");
  let gm = base.__GET_LIB("gm");
  let obj = global.LiveLib.____CREATE_MODULE("photoEngine");

  obj.PhotoEngine = function (folder, host, user, password, database, port, count_pools = 20) {
    base.createIfNotExists(folder);
    this.folder = path.resolve(folder);
    this.db = new Database(host, user, password, port, database, count_pools, err => {
      if (err) global.LiveLib.getLogger().errorm("Photo Engine", "[[constructor]] - create connection to db: ", err);
    });
    this.db.createTable("photo_engine", {
      name: "id",
      type: "INT UNSIGNED",
      autoincrement: true,
      notnull: true,
      primary: true
    }, {name: "type", type: "TINYINT UNSIGNED", notnull: true, default: 3}, {name: "url", type: "BLOB"}, (err) => {
      if (err) global.LiveLib.getLogger().errorm("Photo Engine", "[[constructor]] - createTable: ", err);
    });
  };

  base.createClass(obj.PhotoEngine);

  obj.PhotoEngine.prototype.sendPhotoToServer = function (buffer_of_file, type_of_image, url, callback, e) { // TODO: create url in database for file
    try {
      function write(db, photo, folder, type, url, callback) {
        photo.format((err, val) => {
          if (err) {
            if (callback) callback(err);
          }
          else {
            let name = base.createRandomString(65) + "." + val;
            let file_name = path.join(folder, name);
            let db_url = path.join(url, name);
            photo.write(file_name, err => {
              if (err) {
                if (callback) callback(err);
              }
              else {
                db.insert("photo_engine", {type: type, url: db_url}, callback);
              }
            });
          }
        });
      }

      if (buffer_of_file && type_of_image) {
        if (buffer_of_file.data) {
          buffer_of_file = buffer_of_file.data;
        }
        let photo = gm(buffer_of_file);
        switch (type_of_image) {
          case "1":
          case 1://very small round photo 50x50 px
            photo = photo.resize(50, 50).autoOrient();
            return write(this.db, photo, this.folder, type_of_image, url, callback);
          case "2":
          case 2: //medium photo 200x(h/w) * 200 or 200x200 px
            photo.size((err, val) => {
              if (err) {
                if (callback) callback(err);
              }
              else {
                let new_height = val.width / val.height * 200;
                photo = photo.resize(200, new_height > 300 ? 300 : new_height).autoOrient();
                write(this.db, photo, this.folder, type_of_image, url, callback);
              }
            });
            return true;
          case "3":
          case 3: //big photo max(1920x1080) px
            photo.size((err, val) => {
              if (err) {
                if (callback) callback(err);
              }
              else {
                let proportions = val.width / val.height;
                if (proportions >= 1) {
                  let new_width = val.width > 1920 ? 1920 : val.width;
                  photo = photo.resize(new_width, new_width * proportions);
                }
                else {
                  let new_height = val.height > 1080 ? 1080 : val.height;
                  photo = photo.resize(new_height * (1 / proportions), new_height);
                }
                photo.autoOrient();
                write(this.db, photo, this.folder, type_of_image, url, callback);
              }
            });
            return true;
        }
      }
    } catch (err) {
      if (e) throw err;
      else if (callback) callback(err);
    }
    callback(new Error("Wrong photo"));
    return false;
  };

  obj.PhotoEngine.prototype.sendPhotoFromServer = function (photo_name, type_of_photo) {
    //TODO: create function
  };

  obj.PhotoEngine.prototype.setSettings = function (settings) {
    //TODO: create function
  };

  obj.init = true;
  obj.postInitFunc(() => {
  });
  return obj;
};

module.exports = live_lib_photoEngine;