require("./module/live_lib")("userEngine", "net", "preference");

let path = LiveLib.base.getLib("path");

let pref = new LiveLib.preference("./server.pref");
pref.loadDataSync();

let port = pref.get("serverPort", "8080");
let ip = "http://" + LiveLib.net.getLocalServerIP() + ":" + port;
let folder = path.resolve("./html");

let users = new LiveLib.userEngine(ip, pref.get("host", "localhost"), pref.get("user"), pref.get("password"), pref.get("database"), pref.get("photo_folder"), folder);
let token = "ALE22ziNZIs0mZqBPIFZwnz01qxyryvFJoHCpr7kglZS7OyffsSpogUtQ5zPevUtc7dMKo0eS5rmFG0Rgd1bm9Zvz4g2xuxr84J4OFWIQV9HQUeEKXeLM0PUvZhFVyF5r0Kj9fBaJYZCDOQqInZuycZb5ao7lBcwz0Ql7YpA3z8YB8Qx6AkXMKd0NSXbIgH8sGrAve7uWDWB5ppgWxK8jlWzGCUqGMunqfEeAvjVcRpNdsaN";

//users.messagesCreateChat("Chat", [2], token, console.log);
//users.messagesGetAllChats(0, 1000, token, console.log);
//users.messagesGetChatById(1, token, console.log);
users.messagesGetById(2, token, console.log);
//users.messagesSendMessage(1, "Hello my friend", [], [], token, console.log);
//users.messagesMarkAsRead(2, token, console.log);