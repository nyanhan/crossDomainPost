Overview
--------

因为某些安全问题， ajax 原生的 POST 方法不支持跨域请求， 然而工作中有时我们不得不
要 在保持页面不变的情况下 POST 数据回服务器， 真是一件讨厌的事情。 为了解决这个讨厌
的东西， 做了这个简单的组件。


How it works
--------

  在需要提交数据时， 做以下步骤操作：

    1. 在页面上创建隐藏的iframe， 在iframe中建一个form， 用来提交数据。
    2. iframe中的页面接到数据后，执行一段脚本。 在这里不同浏览器有些区别
       a. 如果支持 postMessage 即 postMessage 到 父窗口， 父窗口接到消息后，执行回调。
       b. 不支持 postMessage 就把返回内容写到 window.name, 然后重定向到与父窗口同域页面，读出 window.name， 执行回调。

How to use
--------
    
    1. 将proxy.htm 放到和主页面同域的项目中做代理页面。
    2. 接收数据的页面， 将返回结果以iframe1.htm 中的格式输出, returnMessage变量就是返回的结果， 支持标准的 json 数据结构。
    3. 在主页面调用 QNR.crossDomainPost(postURI, dataObj /* { like: "this"} */, proxyPath, configObj);
        a. postURI  http://yourdomain/path/ .
        b. dataObj  { like: "this"} . 支持 "like=this&self=that" 形式
        c. proxyPath 直接加在主域名后面的path 部分， 不是大家习惯的路径规则, 并且不能用 hash。 如： http://yourdomain/ + proxyPath;
        d. configObj { onsuccess: fn, ontimeout: fn, timeout: 0, blank: "" } 不喜欢可以不设置。
        e. 新增 blank 参数， 在 https 页面中 iframe src="about:blank;" 在某些浏览器中会有安全警告， 所以需要增加一个空白页面。
        f. 为兼容老接口 增加 type 参数 0 通过hash形式传值， 1 通过上面的模式传值。
  
Advantage
--------

    1. 基本上更多的是在数据量上的考虑， window.name 可以存储2m， 比用hash 用起来踏实一些。
    2. 现在浏览器都支持 postMessage， 只有老的浏览器使用 window.name， 这就降低了，window.name 这样歪招被封了的危险。


Tips
--------
  
    1. 程序自动检测并处理主页面的 document.domain， 所以即便主页面写了 document.domain 也不需要手工再在代理页面中指定。
    2. 如果想强制所有浏览器都使用 window.name 方式， 以方便调试， 只要增加查询参数 debug=cross=name。
    3. 没有考虑非http/https协议的支持。
    4. frame1.htm 默认会清掉缓存， proxy.htm 如需请缓存在 proxy 参数中手工加。
