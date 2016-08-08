var loginname = "";

var realtime;
var myConversation;
var userObj;

window.onload = function() {
	var currentUser = AV.User.current();
	if(currentUser) {
		var Realtime = AV.Realtime;
		realtime = new Realtime({
			appId: APP_ID,
			region: 'cn', // 美国节点为 "us"
		});
		document.getElementById("username").innerHTML = currentUser.getUsername();
		//加入默认聊天室
		joinConversation(currentUser.getUsername());
	} else {
		location.href = "login.html";
	}
}

function FormatDate(date) {
	var h = date.getHours();
	var m = date.getMinutes();
	var s = date.getSeconds();
	h = h < 10 ? "0" + h : h;
	m = m < 10 ? "0" + m : m;
	s = s < 10 ? "0" + s : s;
	return h + ":" + m + ":" + s;
}

function queryMessages(conversation, limit) {
	conversation.queryMessages({
		limit: limit, // limit 取值范围 1~1000，默认 20
	}).then(function(message) {
		// 最新的十条消息，按时间增序排列
		for(var i = 0; i < message.length; i++) {
			var msg = document.getElementById("msginfo");
			var time = FormatDate(new Date(message[i].timestamp));
			msg.innerHTML += time + '[' + message[i].from + ']: ' + message[i].text + "<br/>";
		}
	}).catch(console.error.bind(console));
}

function countConversation(conversation) {
	conversation.count().then(function(count) {
		document.getElementById("count").innerHTML = count;
	}).catch(console.error.bind(console));
}

function joinConversation(username) {
	realtime.createIMClient(username).then(function(user) {
		//保存user对象
		userObj = user;
		return user.getConversation(CONVERSATION_ID);
	}).then(function(conversation) {
		return conversation.join();
	}).then(function(conversation) {
		//保存conversation对象
		myConversation = conversation;
		//查询在线人数
		countConversation(conversation);
		//查询历史消息
		queryMessages(conversation, 20);
		return conversation;
	}).then(function(user) {
		//接收消息的处理
		user.on("message", function(message, conversation) {
			var msg = document.getElementById("msginfo");
			var time = FormatDate(new Date(message.timestamp));
			msg.innerHTML += time + '[' + message.from + ']: ' + message.text + "<br/>";
		});

	}).catch(console.error.bind(console));
}

//			function Create() {
//				realtime.createIMClient(loginname).then(function(loginname) {
//					loginname.createConversation({
//						name: '聊天广场',
//						transient: true,
//					}).then(function(conversation) {
//						alert('创建聊天室成功。id: ' + conversation.id);
//					}).catch(console.error.bind(console));
//				}).then(function(message) {
//					console.log('聊天广场', '创建成功！');
//				}).catch(console.error);
//
//			}

function send() {
	var msg = document.getElementById("message");
	if(msg.value.trim() != "") {
		myConversation.send(new AV.TextMessage(msg.value.trim()));
		var info = document.getElementById("msginfo");
		var user = document.getElementById("username").innerHTML;
		var time = FormatDate(new Date());
		info.innerHTML += time + '[' + user + ']: ' + msg.value + "<br/>";
		msg.value = "";
	}
}

function exit() {
	userObj.close().then(function() {
		location.href = "login.html";
	}).catch(console.error.bind(console));
}