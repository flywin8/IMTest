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
		loginname = currentUser.getUsername();
		document.getElementById("username").innerHTML = loginname;
		//加入默认聊天室
		joinConversation(currentUser.getUsername());
	} else {
		location.href = "login.html";
	}
}

function FormatDate(date) {
	var y = date.getFullYear();
	var M = FormatNum(date.getMonth() + 1);
	var d = FormatNum(date.getDate());
	var h = FormatNum(date.getHours());
	var m = FormatNum(date.getMinutes());
	var s = FormatNum(date.getSeconds());
	var time = y + "-" + M + "-" + d + " " + h + ":" + m + ":" + s;
	return time;
}

function FormatNum(num) {
	return num < 10 ? "0" + num : num;
}

/**
 * 添加消息信息
 * @param {message} message 消息对象
 * @param {Number} num 0代表左侧，1代表右侧
 */
function addMsgInfo(message, num) {
	var txt = message.text;
	var name = message.from;
	var time = FormatDate(new Date(message.timestamp));

	var div1 = document.createElement("div");
	var div2 = document.createElement("div");
	var div3 = document.createElement("div");

	div1.appendChild(div2);
	div1.appendChild(div3);
	var img = document.createElement("img");
	var ran = parseInt(Math.random() * 10000) % 5 + 1;
	img.src = "../img/" + ran + ".jpg";
	var lrnum = num; // parseInt(Math.random() * 10000) % 2;
	var lrstr = lrnum == 0 ? "fl" : "fr";
	img.className = lrstr;
	div2.appendChild(img);
	var strong = document.createElement("strong");
	strong.innerHTML = name;
	strong.className = lrstr;
	div2.appendChild(strong);
	var span = document.createElement("span");
	span.innerHTML = time;
	span.className = lrstr;
	div2.appendChild(span);

	var p = document.createElement("p");
	p.innerHTML = txt;
	p.className = "tal";
	div3.className = lrnum == 0 ? "tal" : "tar";
	div3.appendChild(p);
	var top = document.getElementById("top");
	top.appendChild(div1);
	top.scrollTop = top.scrollHeight;
}

function queryMessages(conversation, limit) {
	conversation.queryMessages({
		limit: limit, // limit 取值范围 1~1000，默认 20
	}).then(function(message) {
		// 最新的十条消息，按时间增序排列
		for(var i = 0; i < message.length; i++) {
			addMsgInfo(message[i], message[i].from == loginname ? 1 : 0);
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
		//		countConversation(conversation);
		//查询历史消息
		queryMessages(conversation, 20);
		return conversation;
	}).then(function(user) {
		//接收消息的处理
		user.on("message", function(message, conversation) {
			var myaudio = document.getElementById("myaudio");
			myaudio.play();
			addMsgInfo(message, 0);
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
	var msg = document.getElementById("text");
	if(msg.value.trim() != "") {
		myConversation.send(new AV.TextMessage(msg.value.trim()));
		var user = document.getElementById("username").innerHTML;
		var message = {
			text: msg.value.trim(),
			from: user,
			timestamp: new Date()
		};
		addMsgInfo(message, 1);
		msg.value = "";
	}
}

function exit() {
	userObj.close().then(function() {
		location.href = "login.html";
	}).catch(console.error.bind(console));
}