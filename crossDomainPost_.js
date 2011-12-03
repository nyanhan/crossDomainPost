;(function(window){

	if(typeof window.QNR === "undefined"){ window.QNR = {}; }

	var hostname = window.location.hostname,
		document = window.document;

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
			id = "crossDomainPost" + new Date().getTime(),
			finished = false;

		var ontimeout = function(){
			if(finished){ return; }

			if (config.ontimeout) {
				config.ontimeout(uri, data, proxy, id);
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
			var iframe = document.getElementById(id);
			iframe.parentNode.removeChild(iframe);	
			finished = true;

			window[id] = null;
		};

		window[id] = onsuccess;

		var html = drawIframeStruct(uri, proxy, data, id, id),
			box = document.createElement("div");

		box.style.display = "none";
		box.id = id;
		
		box.innerHTML = html;
		document.body.appendChild(box);

		var iform = document.getElementById("form" + id);
		iform.submit();

		if (timeout) {
			setTimeout(ontimeout, timeout);
		}
	};

	function drawIframeStruct(uri, proxy, data, globalFuncName, id){
		
		var ar = [];

		var act = plusDomain(uri, proxy, globalFuncName, id),
			ifrid = "ifr" + id, formid = "form" + id;

		ar.push('<form id="' + formid + '" target="' + ifrid + '" action="' + act + '" method="POST">');

		for(var k in data){
			if(data.hasOwnProperty(k)){
				ar.push('<input type="text" name="' + k + '" value="' + data[k] + '" />');
			}
		}

		ar.push('<input id="hostname" name="" value="' + hostname + '" />');
		ar.push('<input id="proxypath" name="" value="' + proxy + '" />');
		ar.push('<input id="crosscall" name="" value="' + globalFuncName + '" />');
		ar.push('<input id="frameid" name="frameid" value="' + id + '" /></form>');

		ar.push('<iframe name="' + ifrid + '" id="' + ifrid + '" src="about:blank"></iframe>');
		
		return ar.join("");
	}

	function plusDomain(uri, proxy, func, id){
		var domain = hostname,
			index = uri.indexOf("#"),
			li = [uri];
		
		var bak = index < 0 ? "#" : uri.substr(index);

		li[li.length] = bak;
		
		if (bak.replace(/#/g, "").length) {
			li.push("&");
		}

		li[li.length] = "crosspath=" + encodeURIComponent('http://'+ domain + "/" + proxy);
		li[li.length] = "&";
		li[li.length] = "crosscall=" + encodeURIComponent(func);
		li[li.length] = "&";
		li[li.length] = "frameid=" + id;
		
		return li.join("");
	}

})(this);
