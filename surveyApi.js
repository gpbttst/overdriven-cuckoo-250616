surveyMaster={
	uid: null,
	uidSet: false,
	appKey: undefined,
	callbackURL: "https://api.kykyshka.ru/v1/service/survey/",
	surveyURL: "https://survey.kykyshka.ru/",
	surveyUrlParams: {},
	platform: -1,
	lastSurvey: -1,
	hasSurveyCalled: false,
	hasSurveyResult: false,
	isSurveyShowing: false,
	loadTimeout: null,
	loadMaxTime: 10,
	version: "1.0.0",
	debugMode: false,
	innerInitCalled: false,
	preloadedLifetime: 600,
	preloadedResetTimeout: null,
	_secs: -1,
	_dt: new Date(),
	_dt0: null,
	init: function(appKey) {
		if (!this.innerInitCalled) this._innerInit();
		if (typeof appKey!="string")
		{
			console.log("survey sdk initialization failed: no app key provided");
			return;
		}
		this.appKey=appKey;
		this.platform=this.getPlatform();
		this.lastSurvey=parseInt(this.getLocal("lastSurvey","-1"));
		try {
			document.body.appendChild(this.html._surveyFrameDiv);
			this.html._surveyFrameDiv.appendChild(this.html._surveyFrame);
			console.log("initialized survey sdk");
			if (this.uidSet===false)
				console.log("warning: initialized without user id");
		} catch(e) {
			console.log("survey sdk initialization failed");
		}
	},
	setUserId: function(userid) {
		if (!this.innerInitCalled) this._innerInit();
		if (typeof userid!="undefined")
		{
			this.uid=userid;
			this.uidSet=true;
			this.setLocal("_survUid",this.uid);
		}
	},
	setDebugMode: function(debug) {
		if (typeof debug=="boolean")
			this.debugMode=debug;
	},
	toggleBanner: function(toggle)
	{		
		this.html._surveyFrameDiv.style.display=((typeof toggle=="boolean" ? !toggle : _surveyFrameDiv.style.display=="block") ? "none" : "block");
	},
	initSurveyFrame: function()
	{
		this.html._surveyFrame.src=this.surveyURL+"?"+this._serialize(Object.assign({uid:this.uid,gid:(this.debugMode ? "gamedemo" : this.appKey),platform:this.platform,lastSurvey:this.lastSurvey,version:this.version,send_from_page:1},this.surveyUrlParams));
		this.html._surveyFrame.style.display="none";
		clearTimeout(this.loadTimeout);
		var _this=this;
		this.loadTimeout=setTimeout(function(){_this.onLoadFail();},this.loadMaxTime*1000);
	},
	hasSurvey: function()
	{
		if (!this.innerInitCalled) this._innerInit();
		if (this.hasSurveyCalled===false)
		{
			if (this.html._surveyFrameDiv.style.display=="none")
			{
				this.hasSurveyCalled=true;
				this.initSurveyFrame();
			}
			else
				console.log("error: survey is already opened");
		}
		else
			console.log("error: hasSurvey function already awaits a callback");
	},
	showSurvey: function() {
		if (!this.innerInitCalled) this._innerInit();
		if (this.html._surveyFrameDiv.style.display=="none" && this.isSurveyShowing==false)
		{
			if (this.hasSurveyResult===false)
				this.initSurveyFrame();
			else
			{
				this.html._surveyFrame.contentWindow.postMessage("getTime","*");
				this.toggleBanner(true);
				this.showSurveyFrame();
				clearTimeout(this.loadTimeout);
				clearTimeout(this.preloadedResetTimeout);
				try {this.callbacks.onSurveyStart();}catch(e){console.log(e);}
			}
			this.hasSurveyCalled=false;
			this.hasSurveyResult=false;
			this.isSurveyShowing=true;
		}
		else
			console.log("error: survey is already opened");
	},
	onAnswersReady: function(data)
	{
		this._secs=-1;
		var _dt1=new Date();
		this._secs=(_dt1-this._dt0)/1000;
		data.body.user_id=this.uid;
		data.body.app_key=this.appKey;
		data.body.time_spent=Math.round(this._secs);
		this.lastSurvey=data.body.survey_key;
		this.setLocal("lastSurvey",this.lastSurvey);
		this._request(this.callbackURL+"answer","POST",{body:data.body});
	},
	onSuccess: function(data)
	{
		this.toggleBanner(false);
		this.isSurveyShowing=false;
		this.hasSurveyCalled=false;
		this.hasSurveyResult=false;
		try {this.callbacks.onSuccess(data.hasOwnProperty("nq") ? data : (data.body.nq || false));}catch(e){console.log(e);}
	},
	onFail: function(data)
	{
		this.toggleBanner(false);
		this.isSurveyShowing=false;
		if (this._secs>=0)
		{
			var _dt1=new Date();
			this._secs=(_dt1-this._dt0)/1000;
		}
		try {this.callbacks.onFail(data);}catch(e){console.log(e);}
	},
	onLoadFail: function(data)
	{
		console.log("load failed!");
		this.toggleBanner(false);
		this.isSurveyShowing=false;
		try {this.callbacks.onLoadFail();}catch(e){console.log(e);}
		this.hasSurveyCalled=false;
		this.hasSurveyResult=false;
		this.html._surveyFrame.src="";
	},
	onPageReady: function(data)
	{
		clearTimeout(this.loadTimeout);
		if (this.hasSurveyCalled)
			this.onSurveyAvailable();
		else
		{
			this.html._surveyFrame.contentWindow.postMessage("getTime","*");
			this.toggleBanner(true);
			this.showSurveyFrame();
			try {this.callbacks.onSurveyStart();}catch(e){console.log(e);}
		}
	},
	onSurveyAvailable: function(data)
	{
		if (this.hasSurveyCalled && this.hasSurveyResult==false)
		{
			this.hasSurveyResult=true;
			this.toggleBanner(false);
			this.preloadedResetTimeout=setTimeout(function(){surveyMaster.resetPreloadedSurvey();},this.preloadedLifetime*1000);
			try {this.callbacks.onSurveyAvailable();}catch(e){console.log(e);}
		}
	},
	onSurveyUnavailable: function(data)
	{
			clearTimeout(this.loadTimeout);
			this.hasSurveyResult=false;
			this.hasSurveyCalled=false;
			this.toggleBanner(false);
			this.isSurveyShowing=false;
			try {this.callbacks.onSurveyUnavailable();}catch(e){console.log(e);}
	},
	showSurveyFrame: function() {
		this._dt0=new Date();
		this._secs=0;
		this.html._surveyFrame.style.display="block";
	},
	resetPreloadedSurvey: function(){
		this.isSurveyShowing=false;
		this.hasSurveyCalled=false;
		this.hasSurveyResult=false;
		console.log("reset preloaded survey");
	},
	addCallback: function(callbackName,callback)
	{
		if (this.callbacks.hasOwnProperty(callbackName))
		{
			if (typeof callback=="function")
			{
				this.callbacks[callbackName]=callback;
				console.log("callback for "+callbackName+" successfully registered");
				return;
			}
			console.log("error: passed callback is not a function");
		}
		console.log("error: no such callback name");
	},
	callbacks: {
		onSurveyAvailable: function() {
			console.log("initialize onSurveyAvailable callback in gameMaster");
		},
		onSurveyUnavailable: function() {
			console.log("initialize onSurveyUnavailable callback in gameMaster");
		},
		onSurveyStart: function() {
			console.log("initialize onSurveyStart callback in gameMaster");
		},
		onSuccess: function(isUnqualified) {
			console.log("initialize onSuccess callback in gameMaster");
		},
		onFail: function(data) {
			console.log("initialize onFail callback in gameMaster");
		},
		onLoadFail: function() {
			console.log("initialize onLoadFail callback in gameMaster");
		}
	},
	getPlatform: function()
	{
	  if (['iPad Simulator','iPhone Simulator','iPod Simulator','iPad','iPhone','iPod'].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document))
		  return 0;
	  if (navigator.userAgent.indexOf("Android")!=-1)
		  return 1;
	  if (navigator.userAgent.indexOf("Win")!=-1)
		  return 2;
	  if (navigator.userAgent.indexOf("Mac")!=-1)
		  return 3;
	  if (navigator.userAgent.indexOf("Linux")!=-1)
		  return 3;
	  return -1;
	},
	getLocal: function(key,def)
	{
		try {
			var _key=localStorage.getItem("_surveyApi_"+key);
			return typeof _key!="string" ? def : _key;
		} catch(e){return def;}
	},
	setLocal: function(key,val)
	{
		try {
			localStorage.setItem("_surveyApi_"+key,val);
		} catch(e){console.log("local storage unavailable for write");}
	},
	_request: function(url, method, options) {
		return new Promise((resolve, reject) => {
			var xhr = new XMLHttpRequest();
			var contentTypeIsSet = false;
			options = options || {};
			xhr.open(method, url);
			for (var header in options.headers) {
				if ({}.hasOwnProperty.call(options.headers, header)) {
					header = header.toLowerCase();
					contentTypeIsSet = header === 'content-type' ? true : contentTypeIsSet;
					xhr.setRequestHeader(header, options.headers[header]);
				}
			}
			if (!contentTypeIsSet) {
				xhr.setRequestHeader('Content-type', 'application/json');
			}
			xhr.onload = function() {
				if (xhr.status >= 200 && xhr.status < 300) {
					var response;
					try {
						response = JSON.parse(xhr.response);
					} catch (e) {
						response = xhr.response;
					}
					resolve(response);
				} else {
					reject({
						status: xhr.status,
						statusText: xhr.statusText,
					});
				}
			};
			xhr.send(/*this._serialize*/JSON.stringify(options.body));
		});
	},
	_serialize: function(obj, prefix, includeUndefined) {
	  var str = [],
		p;
	  for (p in obj) {
		if (obj.hasOwnProperty(p)) {
		  var k = prefix ? prefix + "[" + p + "]" : p,
			v = obj[p];
			if (!(includeUndefined!==true && typeof obj[k]=="undefined"))
			  str.push((v !== null && typeof v === "object") ?
				this._serialize(v, k) :
				encodeURIComponent(k) + "=" + encodeURIComponent(v));
		}
	  }
	  return str.join("&");
	},
	crypt:{MD5:function(d){var r=this.M(this.V(this.Y(this.X(d),8*d.length)));return r.toLowerCase()},M:function(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)
		_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f},X:function(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)
		_[m]=0;for(m=0;m<8*d.length;m+=8)
		_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _},V:function(d){for(var _="",m=0;m<32*d.length;m+=8)
		_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _},Y:function(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=this.md5_ii(f=this.md5_ii(f=this.md5_ii(f=this.md5_ii(f=this.md5_hh(f=this.md5_hh(f=this.md5_hh(f=this.md5_hh(f=this.md5_gg(f=this.md5_gg(f=this.md5_gg(f=this.md5_gg(f=this.md5_ff(f=this.md5_ff(f=this.md5_ff(f=this.md5_ff(f,r=this.md5_ff(r,i=this.md5_ff(i,m=this.md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=this.md5_ff(r,i=this.md5_ff(i,m=this.md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=this.md5_ff(r,i=this.md5_ff(i,m=this.md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=this.md5_ff(r,i=this.md5_ff(i,m=this.md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=this.md5_gg(r,i=this.md5_gg(i,m=this.md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=this.md5_gg(r,i=this.md5_gg(i,m=this.md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=this.md5_gg(r,i=this.md5_gg(i,m=this.md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=this.md5_gg(r,i=this.md5_gg(i,m=this.md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=this.md5_hh(r,i=this.md5_hh(i,m=this.md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=this.md5_hh(r,i=this.md5_hh(i,m=this.md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=this.md5_hh(r,i=this.md5_hh(i,m=this.md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=this.md5_hh(r,i=this.md5_hh(i,m=this.md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=this.md5_ii(r,i=this.md5_ii(i,m=this.md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=this.md5_ii(r,i=this.md5_ii(i,m=this.md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=this.md5_ii(r,i=this.md5_ii(i,m=this.md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=this.md5_ii(r,i=this.md5_ii(i,m=this.md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=this.safe_add(m,h),f=this.safe_add(f,t),r=this.safe_add(r,g),i=this.safe_add(i,e)}
		return Array(m,f,r,i)},md5_cmn:function(d,_,m,f,r,i){return this.safe_add(this.bit_rol(this.safe_add(this.safe_add(_,d),this.safe_add(f,i)),r),m)},md5_ff:function(d,_,m,f,r,i,n){return this.md5_cmn(_&m|~_&f,d,_,r,i,n)},md5_gg:function(d,_,m,f,r,i,n){return this.md5_cmn(_&f|m&~f,d,_,r,i,n)},md5_hh:function(d,_,m,f,r,i,n){return this.md5_cmn(_^m^f,d,_,r,i,n)},md5_ii:function(d,_,m,f,r,i,n){return this.md5_cmn(m^(_|~f),d,_,r,i,n)},safe_add:function(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m},bit_rol:function(d,_){return d<<_|d>>>32-_}},
	_innerInit: function() {
		this.innerInitCalled=true;
		this.uid=this.crypt.MD5(this._dt.getTime());
		if (this.getLocal("_survUid","")!=="")
			this.uid=this.getLocal("_survUid","");
		else
			this.setLocal("_survUid",this.uid);

		this.html._surveyFrameDiv.id="surveyFrameDiv";
		this.html._surveyFrameDiv.style.cssText="display: none; position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 999999; background: #00000000;";

		this.html._surveyFrame.id="surveyFrame";
		this.html._surveyFrame.style.cssText="display: none; position: fixed; left: 0; top: 0; width: 100%; height: 100%; border: 0;";
		this.html._surveyFrame.scrolling="no";
		
		window.addEventListener("message",(event) => {
			try {
				if (typeof event.data==="string")
				{
					if (event.data.includes("surveyMaster"))
					{
						var _data=JSON.parse(event.data);
						if (surveyMaster.debugMode)
							console.log(_data);
						if (_data.hasOwnProperty("surveyMaster"))
						{
							if (typeof surveyMaster[_data.surveyMaster.event]!="function")
							{
								console.log("error: no such event");
								return;
							}
							surveyMaster[_data.surveyMaster.event](_data.surveyMaster.data);
						}
					}
				}
			}
			catch(e) {console.log(e);
				if (surveyMaster.debugMode)
					console.log("error: incorrect incoming data: "+event.data);
				return;
			}
		}, false);
	},
	html:{
		_surveyFrameDiv: document.createElement("div"),
		_surveyFrame: document.createElement("iframe")
	}	
};