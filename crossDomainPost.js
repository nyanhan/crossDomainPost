;(function(window){

	if(typeof window.QNR === "undefined"){ window.QNR = {}; }

	var location = window.location,
		hostname = location.hostname,
		doc = window.document,
		locationList = [],
		debug = location.search.indexOf("debug=cross=test") > 0,
		postMessage = !!window.postMessage && !(location.search.indexOf("debug=cross=name") > 0);

	if (postMessage) {

		if (window.addEventListener) {
			window.addEventListener("message", onmessage, false);
		} else {
			window.attachEvent("onmessage", onmessage);
		}
	}

	QNR.crossDomainPost = function(uri, data, proxy, config){
		/*
		* config:
		*   onsuccess : Function
		*   timeout : Number
		*   ontimeout : Function
		*/
		if(!uri){ return; }

		config = config || {};
		data = data || {};
		
		var timeout = config.timeout || 0,
			frameId = "crossDomainPost" + new Date().getTime(),
			finished = false;

		var ontimeout = function(){
			if(finished){ return; }

			if (config.ontimeout) {
				config.ontimeout();
			}

			handle();
		};

		var onsuccess = function(str){
			if(finished){ return; }

			if (config.onsuccess) {
				config.onsuccess(str);
			}

			handle();
		};

		var handle = function(){
			var iframe = doc.getElementById(frameId);
			iframe.parentNode.removeChild(iframe);	
			finished = true;

			delete QNR.crossDomainPost[frameId];
		};

		QNR.crossDomainPost[frameId] = onsuccess;

		var html = drawIframeStruct(uri, proxy, data, 'QNR.crossDomainPost.' + frameId, frameId),
			box = doc.createElement("div");

		box.style.display = "none";
		box.id = frameId;
		
		box.innerHTML = html;
		doc.body.appendChild(box);

		locationList.push(uri);

		if(debug){
			$("ifr" + frameId).src = $("form" + frameId).action;
		} else {
			$("form" + frameId).submit();
		}

		if (timeout) {
			setTimeout(ontimeout, timeout);
		}
	};

	function $(id){
		return doc.getElementById(id);
	}

	function onmessage(evt){

		if (!inLocationList(evt.origin)) { return; }

		var nString = evt.data,
			nObj = new Function("return " + nString)();

		var root = window,
			context = null,
			li = nObj.f.split(".");

		while(li.length){
			context = root;
			root = context[li.shift()];
		}

		if(typeof root === "function"){
			root.call(context, nObj.m);
		}
	}

	function inLocationList( origin ){
		for (var i = 0, l = locationList.length; i < l; i++) {
			if(locationList[i].indexOf(origin) >= 0){ return true; }
		}

		return false;
	}

	function protocolAndHost( host ){

		var port = location.port === "80" ? "" : location.port;

		return location.protocol + "//" + (host || location.hostname) + (port ? (":" + port) : "");
	}

	function drawIframeStruct(uri, proxy, data, globalFuncName, id){
		
		var ar = [];

		var act = plusDomain(uri, proxy, globalFuncName, id),
			ifrid = "ifr" + id, formid = "form" + id;

		ar[ar.length] = '<form id="' + formid + '" target="' + ifrid + '" action="' + act + '" method="POST">';

		for(var k in data){
			if(data.hasOwnProperty(k)){
				ar[ar.length] = '<input type="text" name="' + k + '" value="' + data[k] + '" />';
			}
		}

		ar[ar.length] = '<iframe name="' + ifrid + '" id="' + ifrid + '" src="about:blank"></iframe>';
		
		return ar.join("");
	}

	function plusDomain(uri, proxy, func, id){
		var domain = hostname,
			index = uri.indexOf("#"),
			li = [uri];
		
		var bak = index < 0 ? "#" : uri.substr(index);

		li[li.length] = bak;
		
		if (bak.replace(/#/g, "").length) {
			li[li.length] = "&";
		}

		li[li.length] = "crosspath=" + encodeURIComponent(protocolAndHost(domain) + "/" + proxy);
		li[li.length] = "&";
		li[li.length] = "crosscall=" + encodeURIComponent(func);
		
		
		// detect if document.domain is set
		
		if (doc.domain !== domain) {
		    li[li.length] = "&" + "crossdomain=" + encodeURIComponent(doc.domain);
		}

		if (postMessage) {
			li[li.length] = "&" + "postMessage=true";
		}
		
		return li.join("");
	}



})(this);
