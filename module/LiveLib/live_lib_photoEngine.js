let live_lib_photoEngine = function () {//TODO: create new module
  try {
    if (!global.LiveLib || !global.LiveLib.base) require("./live_lib_base")();
    if (!global.LiveLib || global.LiveLib.Version < 1.2) return false;
    global.LiveLib.loadLiveModule("logging");
    let base = global.LiveLib.base;
    let Database = global.LiveLib.loadLiveModule("database");
    let path = base.getLib("path");
    let url = base.getLib("url");
    let gm = base.getLib("gm");

    global.LiveLib.photoEngine = function (folder, host, user, password, database, port, count_pools = 20, callback) {
      base.createIfNotExists(folder);
      this.folder = path.resolve(folder);
      this.db = new Database(host, user, password, port, database, count_pools, err => {
        global.LiveLib.getLogger().errorm("Photo Engine", "[[constructor]] - create connection to db: ", err);
      });
      this.db.createTable("photo_engine",
        {name: "id", type: "INT UNSIGNED", autoincrement: true, notnull: true, primary: true},
        {name: "type", type: "TINYINT UNSIGNED", notnull: true, default: 3},
        {name: "url", type: "BLOB"},
        (err) => {
          if (err) global.LiveLib.getLogger().errorm("Photo Engine", "[[constructor]] - createTable: ", err);
          else callback();
        });
    };

    let photoengine = global.LiveLib.photoEngine;

    base.createClass(photoengine);

    photoengine.prototype.sendPhotoToServer = function (buffer_of_file, type_of_image, url_path, callback, e) { // TODO: create url in database for file
      try {
        function write(db, photo, folder, type, url_path, callback) {
          photo.format((err, val) => {
            if (err) {
              if (callback) callback(err, "photo.error.format");
            }
            else {
              let name = base.createRandomString(65) + "." + val;
              let file_name = path.join(folder, name);
              let db_url = url.resolve(url_path, "photo=" + name);
              photo.write(file_name, err => {
                if (err) {
                  if (callback) callback(err, "photo.error.free_space");
                }
                else {
                  db.insert("photo_engine", {type: type, url: db_url}, (err, res) => {
                    if (callback) {
                      if (err) callback(err[0], "photo.error.database");
                      else callback(undefined, "photo.success", res[0].insertId);
                    }
                  });
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
              return write(this.db, photo, this.folder, type_of_image, url_path, callback);
            case "2":
            case 2: //medium photo 200x(h/w) * 200 or 200x200 px
              photo.size((err, val) => {
                if (err) {
                  if (callback) callback(err, "photo.error.size");
                }
                else {
                  let new_height = val.width / val.height * 200;
                  photo = photo.resize(200, new_height > 300 ? 300 : new_height).autoOrient();
                  write(this.db, photo, this.folder, type_of_image, url_path, callback);
                }
              });
              return true;
            case "3":
            case 3: //big photo max(1920x1080) px
              photo.size((err, val) => {
                if (err) {
                  if (callback) callback(err, "photo.error.size");
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
        else if (callback) callback(err, "photo.error.global");
        else global.LiveLib.getLogger().errorm("Photo Engine", "sendPhotoToServer => ", err);
      }
      callback("photo.wrong");
      return false;
    };

    photoengine.prototype.sendPhotoFromServer = function (id_photo, type_of_photo, callback, e) {
      try {
        this.db.select("photo_engine", {where: "id = " + id_photo + " AND type = " + type_of_photo}, (err, val) => {
          if (callback) {
            if (err) callback(err, "photo.error.database");
            else {
              if (val.length > 0) {
                callback(undefined, undefined, val[0].url.toString());
              } else {
                callback(undefined, "photo.not.find");
              }
            }
          }
        });
      } catch (err) {
        if (e) throw err;
        else if (callback) callback(err, "photo.error.global");
        else global.LiveLib.getLogger().errorm("Photo Engine", "sendPhotoFromServer => ", err);
      }
    };

    photoengine.prototype.getPhoto = function (name) {
      return path.join(this.folder, name);
    };

    return photoengine;
  } catch (err) {
    global.LiveLib.getLogger().errorm("Photo Engine", "[[main]] => ", err);
  }
};

module.exports = live_lib_photoEngine;