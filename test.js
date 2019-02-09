require("./module/live_lib")("userEngine", "net", "preference");

let path = LiveLib.base.getLib("path");

let pref = new LiveLib.preference("./server.pref");
pref.loadDataSync();

let port = pref.get("serverPort", "8080");
let ip = "http://" + LiveLib.net.getLocalServerIP() + ":" + port;
let folder = path.resolve("./html");

let users = new LiveLib.userEngine(ip, pref.get("host", "localhost"), pref.get("user"), pref.get("password"), pref.get("database"), pref.get("photo_folder"), folder);
let token = "k2KWcw1S2z3zPEplF4J0SmMq5uL02FK1tTjRI6L9YqQqTSCRx7DX5TOp7Tj18HWh2XzCfIYiBGLOTV4N2AUpXDHDslOKQOvPoGureziKqncH9IMq4FvVy8s6n53PLchH7hdWg2tZO1SfLhlAaCzYX3HN2ieFgXpuskmdyE4KR5XkWiDU6WhDRfx6djHrjM2hECh6T5aAW2xoYIkH1hRGqbTlCVO8F0ks9Z1QHEBL79hsyuvy";

users.accountGet(-1, token, console.log);
//users.messagesCreateChat("Chat", [2], token, console.log);
//users.messagesGetAllChats(0, 1000, token, console.log);
//users.messagesGetChatById(1, token, console.log);
//users.messagesGetById(2, token, console.log);
//users.messagesSendMessage(1, "Hello my friend", [], [], token, console.log);
//users.messagesMarkAsRead(2, token, console.log);