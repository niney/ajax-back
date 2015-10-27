/*

 jQuery Browser Plugin
 * Version 2.3
 * 2008-09-17 19:27:05
 * URL: http://jquery.thewikies.com/browser
 * Description: jQuery Browser Plugin extends browser detection capabilities and can assign browser selectors to CSS classes.
 * Author: Nate Cavanaugh, Minhchau Dang, & Jonathan Neal
 * Copyright: Copyright (c) 2008 Jonathan Neal under dual MIT/GPL license.
 * JSLint: This javascript file passes JSLint verification.
 *//*jslint
 bitwise: true,
 browser: true,
 eqeqeq: true,
 forin: true,
 nomen: true,
 plusplus: true,
 undef: true,
 white: true
 *//*global
 jQuery
 */

(function ($) {
    $.browserTest = function (a, z) {
        var u = 'unknown', x = 'X', m = function (r, h) {
            for (var i = 0; i < h.length; i = i + 1) {
                r = r.replace(h[i][0], h[i][1]);
            }

            return r;
        }, c = function (i, a, b, c) {
            var r = {
                name: m((a.exec(i) || [u, u])[1], b)
            };

            r[r.name] = true;

            r.version = (c.exec(i) || [x, x, x, x])[3];

            if (r.name.match(/safari/) && r.version > 400) {
                r.version = '2.0';
            }

            if (r.name === 'presto') {
                r.version = ($.browser.version > 9.27) ? 'futhark' : 'linear_b';
            }
            r.versionNumber = parseFloat(r.version, 10) || 0;
            r.versionX = (r.version !== x) ? (r.version + '').substr(0, 1) : x;
            r.className = r.name + r.versionX;

            return r;
        };

        a = (a.match(/Opera|Navigator|Minefield|KHTML|Chrome/) ? m(a, [
            [/(Firefox|MSIE|KHTML,\slike\sGecko|Konqueror)/, ''],
            ['Chrome Safari', 'Chrome'],
            ['KHTML', 'Konqueror'],
            ['Minefield', 'Firefox'],
            ['Navigator', 'Netscape']
        ]) : a).toLowerCase();

        $.browser = $.extend((!z) ? $.browser : {}, c(a, /(camino|chrome|firefox|netscape|konqueror|lynx|msie|opera|safari)/, [], /(camino|chrome|firefox|netscape|netscape6|opera|version|konqueror|lynx|msie|safari)(\/|\s)([a-z0-9\.\+]*?)(\;|dev|rel|\s|$)/));

        $.layout = c(a, /(gecko|konqueror|msie|opera|webkit)/, [
            ['konqueror', 'khtml'],
            ['msie', 'trident'],
            ['opera', 'presto']
        ], /(applewebkit|rv|konqueror|msie)(\:|\/|\s)([a-z0-9\.]*?)(\;|\)|\s)/);

        $.os = {
            name: (/(win|mac|linux|sunos|solaris|iphone)/.exec(navigator.platform.toLowerCase()) || [u])[0].replace('sunos', 'solaris')
        };

        if (!z) {
            $('html').addClass([$.os.name, $.browser.name, $.browser.className, $.layout.name, $.layout.className].join(' '));
        }
    };

    $.browserTest(navigator.userAgent);
})(jQuery);

/*
 * jQuery history plugin
 * 
 * The MIT License
 * 
 * Copyright (c) 2006-2009 Taku Sano (Mikage Sawatari)
 * Copyright (c) 2010 Takayuki Miwa
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function ($) {
    var locationWrapper = {
        put: function (hash, win) {
            //(win || window).location.hash = this.encoder(hash);
            (win || window).location.hash = hash;
        },
        get: function (win) {
            var hash = ((win || window).location.hash).replace(/^#/, '');
            try {
                return $.browser.mozilla ? hash : decodeURIComponent(hash);
            }
            catch (error) {
                return hash;
            }
        },
        encoder: encodeURIComponent
    };

    var iframeWrapper = {
        id: "__jQuery_history",
        init: function () {
            var html = '<iframe id="' + this.id + '" style="display:none" src="javascript:false;" />';
            $("body").prepend(html);
            return this;
        },
        _document: function () {
            return $("#" + this.id)[0].contentWindow.document;
        },
        put: function (hash) {
            var doc = this._document();
            doc.open();
            doc.close();
            locationWrapper.put(hash, doc);
        },
        get: function () {
            return locationWrapper.get(this._document());
        }
    };

    function initObjects(options) {
        options = $.extend({
            unescape: false
        }, options || {});

        locationWrapper.encoder = encoder(options.unescape);

        function encoder(unescape_) {
            if (unescape_ === true) {
                return function (hash) { return hash; };
            }
            if (typeof unescape_ == "string" &&
                (unescape_ = partialDecoder(unescape_.split("")))
                || typeof unescape_ == "function") {
                return function (hash) { return unescape_(encodeURIComponent(hash)); };
            }
            return encodeURIComponent;
        }

        function partialDecoder(chars) {
            var re = new RegExp($.map(chars, encodeURIComponent).join("|"), "ig");
            return function (enc) { return enc.replace(re, decodeURIComponent); };
        }
    }

    // public base interface
    var _ = {
        appState: undefined,
        callback: undefined,
        init: function (callback, options) { },
        check: function () { },
        load: function (hash) { },
        initParams: undefined,
        tag: undefined
    };
    $.history = _;

    var SimpleImpl = {
        init: function (callback, initParams, tag, options) {
            initObjects(options);
            _.callback = callback;
            var current_hash = locationWrapper.get();
            _.appState = current_hash;
            _.initParams = initParams;
            _.tag = [];
            _.tag[initParams] = tag;
            //_.callback(current_hash);
            setInterval(_.check, 100);
        },
        check: function () {
            var current_hash = locationWrapper.get();
            if (current_hash != _.appState) {
                _.appState = current_hash;
                if(current_hash == '' && _.initParams != undefined)
                    current_hash = _.initParams;
                _.callback(current_hash, _.tag[current_hash]);
            }
        },
        load: function (hash) {
            if (hash != _.appState) {
                locationWrapper.put(hash);
                _.appState = hash;
            }
            _.callback(hash);
        },
        push: function (hash, tag) {
            if (hash != _.appState) {
                locationWrapper.put(hash);
                _.appState = hash;
                _.tag[hash] = tag;
            }
        }
    };

    var IframeImpl = {
        init: function (callback, initParams, options) {
            initObjects(options);
            _.callback = callback;
            var current_hash = locationWrapper.get();
            _.appState = current_hash;
            _.initParams = initParams;
            iframeWrapper.init().put(current_hash);
            //_.callback(current_hash);
            setInterval(_.check, 100);
        },
        check: function () {
            var iframe_hash = iframeWrapper.get(),
                location_hash = locationWrapper.get();

            if (location_hash != iframe_hash) {
                if (location_hash == _.appState) {    // user used Back or Forward button
                    _.appState = iframe_hash;
                    locationWrapper.put(iframe_hash);
                    _.callback(iframe_hash, _.tag[iframe_hash]);
                } else {                              // user loaded new bookmark
                    _.appState = location_hash;
                    iframeWrapper.put(location_hash);
                    _.callback(location_hash, _.tag[location_hash]);
                }
            }
        },
        load: function (hash) {
            if (hash != _.appState) {
                locationWrapper.put(hash);
                iframeWrapper.put(hash);
                _.appState = hash;
            }
            _.callback(hash);
        },
        push: function (hash) {
            if (hash != _.appState) {
                locationWrapper.put(hash);
                _.appState = hash;
                _.tag[hash] = tag;
            }
        }
    };

    if ($.browser.msie && ($.browser.version < 8 || document.documentMode < 8)) {
        $.extend(_, IframeImpl);
    } else {
        $.extend(_, SimpleImpl);
    }
})(jQuery);

/*
 * jQuery 필요
 * jQuery.history plugin 필요
 *
 *
 *
 * version 0.6
 */

//**************************************************************************************************************************//
var History = function() {};
History.HISTORY_JS_URL = '/js/jquery.history.js';
History.prototype = {
    initialize : function(cls, instance) {
        // init vari
        this.__readyFlag__ = false;
        this.__initParams__ = '';
        __this__ = this;
        this.include_history_js();
    },
    include_history_js : function() {

        // history
        if (typeof jQuery.history === "undefined") {
            new Ajax.Request(History.HISTORY_JS_URL, {
                onSuccess: function(trans, data) {
                    var data = trans.responseText;
                    ( window.execScript || function( data ) {
                        window[ "eval" ].call( window, data );
                    } )( data );
                    __this__.__readyFlag__ = true;
                }
            });
        } else {
            __this__.__readyFlag__ = true;
        }
    },
    getAjaxParameter : function() {
        var params = location.href.split('#');
        var paramKeyValue = '';
        var arr_params = {};
        if (params.length > 1) { // ajax params 가 있는 경우
            params = params[1];

            if (params != null) {
                params = params.split("&");

                if (params.length > 0) {
                    var k = 0;
                    for(i = 0 ; i < params.length ; i++) {
                        paramKeyValue = params[i].split('=');
                        if(paramKeyValue[1] == '') continue;
                        eval("arr_params['" + paramKeyValue[0] + "'] = '" + paramKeyValue[1] + "'"); // tmp2[0] 변수 , tmp2[1] 선언
                    }
                }
            }
        }
        return arr_params;
    },
    toParamString : function(hash) {
        if(jQuery.isPlainObject(hash)) {
            var _hash = hash;
            hash = "";
            var i = 0;
            jQuery.each(_hash, function(key, val) {
                if(val != undefined)
                    if(i == 0)
                        hash += key + "=" + val;
                    else
                        hash += "&" + key + "=" + val;
                i++;
            });
        }
        return hash;
    },
    ready : function(params, callback) {
        if(!callback) return;
        var cnt = 0;
        var t = setInterval(function(){
            if ( __this__.__readyFlag__ == true || cnt == 500) {
                clearInterval(t);
                if(!jQuery.history.callback) {
                    var ajaxParams = __this__.getAjaxParameter();
                    if(!jQuery.isEmptyObject(ajaxParams)) { // ajax params
                        jQuery.history.init(callback, params, tag);
                        params = __this__.toParamString(ajaxParams);
                    }
                    else {// init
                        params = __this__.toParamString(params);
                        jQuery.history.init(callback, params, tag);
                    }
                    callback(params);
                } else {
                    params = __this__.toParamString(params);
                    jQuery.history.push(params, tag);
                }
            }
            cnt++;
        }, 10);
    },
    push : function(params, tag, callback) {
        var cnt = 0;
        var t = setInterval(function(){
            if ( __this__.__readyFlag__ == true || cnt == 500) {
                clearInterval(t);
                if(!jQuery.history.callback) {
                    var ajaxParams = __this__.getAjaxParameter();
                    if(!jQuery.isEmptyObject(ajaxParams)) { // ajax params
                        jQuery.history.init(callback, params, tag);
                        params = __this__.toParamString(ajaxParams);
                    }
                    else {// init
                        params = __this__.toParamString(params);
                        jQuery.history.init(callback, params, tag);
                    }
                } else {
                    params = __this__.toParamString(params);
                    jQuery.history.push(params, tag);
                }
            }
            cnt++;
        }, 10);
    },
    load : function(params, callback) {
        this.ready(params, callback);
    }
};
