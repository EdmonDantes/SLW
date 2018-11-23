require("./module/live_lib")("locale");
let locale = LiveLib.locale;
let locstring = LiveLib.locale.LocaleString;

let tmp = new locale("./locales");
let elem = new locstring("error.message", "ru-RU");
console.log(tmp.get(elem));