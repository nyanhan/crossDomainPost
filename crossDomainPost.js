(function(window) {
	'use strict';
	if(typeof QNR === "undefined"){ var QNR = {}; }

	var location = window.location,
		hostname = location.hostname,
		doc = window.document,
		locationList = [],
		debug = location.search.indexOf('debug=cross=debug') > 0,
		postMessage = !!window.postMessage && !(~location.search.indexOf('debug=cross=name')),
		blankURI = 'about:blank',
		reURIOrigin = /[#\?].*/,
		reURIHash = /#.+/,
		reURISearch = /\?[^#\s]+/;

	if (postMessage) {

		if (window.addEventListener) {
			window.addEventListener('message', onmessage, false);
		} else {
			window.attachEvent('onmessage', onmessage);
		}
	}

	QNR.crossDomainPost = function(uri, data, proxy, config) {
		/*
		* config:
		*   onsuccess : Function
		*   timeout : Number
		*   ontimeout : Function
		*	blank : String
		*	type : Number 0 hash 1 advance
		*/
		if (!uri) { return; }
		config = config || {};
		data = formatQuery(data);
		var type = config.type || 0;

		if (config.blank) {
			blankURI = config.blank;

			if (blankURI.indexOf('http') !== 0) {
				blankURI = protocolAndHost() + '/' + blankURI;
			}
		}

		var timeout = config.timeout || 0,
			frameId = 'crossDomainPost' + new Date().getTime(),
			finished = false;

		var ontimeout = function() {
			if (finished) { return; }

			if (config.ontimeout) {
				config.ontimeout();
			}

			handle();
		};

		var onsuccess = function(str) {
			if (finished) { return; }

			if (config.onsuccess) {
				config.onsuccess(str);
			}

			handle();
		};

		var handle = function() {
			var iframe = $(frameId);
			iframe.parentNode.removeChild(iframe);
			finished = true;

			delete QNR.crossDomainPost[frameId];
		};

		QNR.crossDomainPost[frameId] = onsuccess;

		var html = drawIframeStruct(uri, proxy, data, 'QNR.crossDomainPost.' + frameId, frameId, type),
			box = doc.createElement('div');

		box.style.display = 'none';
		box.id = frameId;

		box.innerHTML = html;
		doc.body.appendChild(box);

		locationList.push(uri);

		if (debug) {
			$('ifr' + frameId).src = $('form' + frameId).action;
		} else {
			$('form' + frameId).submit();
		}

		if (timeout) {
			setTimeout(ontimeout, timeout);
		}
	};

	function $(id) {
		return doc.getElementById(id);
	}

	function formatQuery(obj) {
		var li = [];

		obj = obj || {};

		if (typeof obj === 'string') {
			li = obj.split('&');
		} else {
			for (var k in obj) {
				if (obj.hasOwnProperty(k)) {
					li[li.length] = k + '=' + obj[k];
				}
			}
		}

		return li;
	}

	function onmessage(evt) {

		if (!inLocationList(evt.origin)) { return; }

		var nString = evt.data,
			ar = nString.split('::'),
			nObj = {};

		nObj.d = ar[3]; nObj.m = ar[2];
		nObj.f = ar[1]; nObj.p = ar[0];

		nObj.m = new Function('return ' + nObj.m)();

		var root = window,
			context = null,
			li = nObj.f.split('.');

		while (li.length) {
			context = root;
			root = context[li.shift()];
		}

		if (typeof root === 'function') {
			root.call(context, nObj.m);
		}
	}

	function inLocationList(origin ) {
		for (var i = 0, l = locationList.length; i < l; i++) {
			if (locationList[i].indexOf(origin) >= 0) { return true; }
		}

		return false;
	}

	function protocolAndHost(host ) {

		var port = location.port === '80' ? '' : location.port;

		return location.protocol + '//' + (host || location.hostname) + (port ? (':' + port) : '');
	}

	function drawIframeStruct(uri, proxy, data, globalFuncName, id, type) {

		var ar = [], temp = [];

		var act = plusDomain(uri, proxy, globalFuncName, type),
			ifrid = 'ifr' + id, formid = 'form' + id;

		ar[ar.length] = '<form id="' + formid + '" target="' + ifrid + '" action="' + act + '" method="POST">';

		for (var i = 0, l = data.length; i < l; i++) {

			temp = data[i].split('=');

			ar[ar.length] = '<input type="text" name="' + temp[0] + '" value="' + temp[1] + '" />';
		}

		ar[ar.length] = '</form>';

		// https don't allow about:blank in ie6

		ar[ar.length] = '<iframe name="' + ifrid + '" id="' + ifrid + '" src="' + blankURI + '"></iframe>';

		return ar.join('');
	}

	function plusDomain(uri, proxy, func, type) {
		var domain = hostname,
			origin = uri.replace(reURIOrigin, ''),
			hash = uri.match(reURIHash),
			search = uri.match(reURISearch),
			li = [origin];

		hash = hash ? hash[0] : '#';
		search = search ? search[0] : '?';

		if (search.replace(/\?/g, '').length) {
			search += '&';
		}

		search += ('_=' + new Date().getTime());

		li[li.length] = search;

		if (hash.replace(/#/g, '').length) {
			hash += '&';
		}

		li[li.length] = hash;

		li[li.length] = 'crosspath=' + encodeURIComponent(protocolAndHost(domain) + '/' + proxy);
		li[li.length] = '&';
		li[li.length] = 'crosscall=' + encodeURIComponent(func);


		// detect if document.domain is set

		if (doc.domain !== domain) {
			li[li.length] = '&crossdomain=' + encodeURIComponent(doc.domain);
		}

		if (type && postMessage) {
			type = 2;
		}

		li[li.length] = '&type=' + type;

		return li.join('');
	}

})(this);
