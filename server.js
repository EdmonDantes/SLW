require("./module/live_lib")("database");
LiveLib.database.createConnection("localhost", "root", "1111qazwsxqweasd");
LiveLib.database.changeDB("mysql", (err) => {
  if (err) console.log(err);
  else LiveLib.database.select("user", null, (err, res) => {
    console.log(res);
  });
});