/**
 *  The base global object
 *  @class W
 */
(function(){

	var global = Function('return this')();
	/* create W object to Window object */
	global.W = {};

	W.id = 0; //generated id by object creation. whenever object be created, number be increased .
	W.TEMPLET = {};
	var modules = {};
	var classGenerators = {};
	var classes = {};
	var op = Object.prototype;
	var toString = op.toString;

	W.deviceId = "";
	W.isMobile = false;
	W.isWebView = false;
	W.isAndroid = false;
	W.isIOS = false;
	W.isDesktop = true;
	W.isOIPF = false;
	W.isPureBrowser = false;
	W.isEdge = false;

	try {
		/**
		* Android 7
		* Chrome browser
		* "Mozilla/5.0 (Linux; Android 7.0; SM-T580 Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
		* Webview
		* "Mozilla/5.0 (Linux; Android 7.0; SM-T580 Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/69.0.3497.100 Safari/537.36"
		**/

		W.isIOS = /(iPhone|iPod|iPad).*AppleWebKit/i.test(navigator.userAgent);
		if (W.isIOS) {
			W.isWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);

			W.deviceId = "IOS"
		}
		W.isAndroid = /(Android).*AppleWebKit/i.test(navigator.userAgent);
		if (W.isAndroid) {
			W.isWebView = /(Android).*wv(?=.*AppleWebKit)/i.test(navigator.userAgent);

			W.deviceId = "Android"
		}
		W.isSTB = (/SETTOP/i.test(navigator.userAgent));
		// (/acbr/i.test(navigator.userAgent)); 이건 webx박스
		W.isRDK = (/WPE/i.test(navigator.userAgent));
		if (W.isRDK)
			W.isSTB = true;

		if (!W.isSTB) {
			if ((/MIBOX/i.test(navigator.userAgent)) || 
				(/SHIELD/i.test(navigator.userAgent)) || //NVidia Shield
				(/DP600/i.test(navigator.userAgent)) ) //Lowasis STB
				W.isSTB = true;

			if (W.isSTB)
				W.deviceId += " MI";
		}

		if (W.isSTB)
			W.deviceId += " STB";

		W.isEdge = (/Edge/i.test(navigator.userAgent));
	} catch(e){}

	try{

		if (!W.isSTB && (W.isIOS || W.isAndroid)) {
			W.isMobile = true;
			W.isDesktop = false;
		} else {
			if (W.isSTB)
				W.isDesktop = false;
		}

		if ((/BCM7XXX_TEST_SETTOP/i.test(navigator.userAgent)) ||
			(/hgs1000s/i.test(navigator.userAgent))) {
			W.isMobile = false;
			W.isSTB = true;
			W.KEY.MENU = 8;
			W.KEY.FAST_FWD = 228;
			W.KEY.FAST_BWD = 227;
			W.KEY.PLAY = 179;
			W.KEY.STOP = 178;
			W.isAndroid = true;
			W.isDesktop = false;
		}

	} catch(e){}

	try {
		if (oipfObjectFactory) {
			W.deviceId = "STB";
			W.isDesktop = false;
			W.isSTB = true;

			if ((/acbr/i.test(navigator.userAgent))) {
				W.deviceId += " WebX";
				W.KEY.EXIT = 601;
			}

			W.KEY.BACK = 117;
			W.KEY.VOLUME_UP = 447;
			W.KEY.VOLUME_DOWN = 448;
			W.KEY.MENU = 602;
			W.isOIPF = true;

			var oapp = oipfObjectFactory.createApplicationManagerObject().getOwnerApplication();
			oapp.onKeyDown = _keyHandler.keyDown;
			oapp.onKeyUp = _keyHandler.keyUp;
			var keyset = oapp.privateData.keyset;
			keyset.setValue(keyset.maximumValue, keys);
			oapp.activateInput(true, 0, 0);

			W.KEY.BACK = 117;
			W.KEY.VOLUME_UP = 447;
			W.KEY.VOLUME_DOWN = 448;
			W.KEY.MENU = 602;
		}
	} catch (err) {

	}

	if (W.isDesktop || W.isRDK || W.deviceId.indexOf("WebX") > -1)
		W.isPureBrowser = true;

	/**
	 * Define a object using AMD(using requireJS)
	 * @method defineModule
	 * @param {String} name module name, if none, source file path is name
	 * @param {Array} deps dependency
	 * @param {function} callback callback function
	 */
	W.defineModule = function(name, deps, callback) {
		if (typeof(name) === 'string')
			W.log.info("defineModule " + name);
		define(name, deps, callback);
	};

	Object.defineProperty(W, "cpuSpeedTest", {
		writable:false, configurable:false,
		value: function() {
			//아래 factor 와 myprocessor의 경우 알고 있는 device가 있다면 그에 맞춰서 테스트한 결과를 대입해준다.
			//현재 코드의 경우 2000MIPS STB을 약 400MHz로 가정하고 보통 2.3초 내에 150000000번 루프가 실행되는 것을 기준으로 하였다
			var factor = 1.8;
			var myprocessor = 0.4;
			var _speedconstant = 1.15600e-8 / factor; //if speed=(c*a)/t, then constant=(s*t)/a and time=(a*c)/s
			var d = new Date();
			var amount = 150000000;
			var estprocessor = myprocessor;//1.7; //average processor speed, in GHZ
			console.log("JSBenchmark by Aaron Becker, running loop " + amount + " times.     Estimated time (for " + estprocessor + "ghz processor) is " + (Math.round(((_speedconstant * amount) / estprocessor) * 100) / 100) + "s");
			for (var i = amount; i > 0; i--) {
			}
			var newd = new Date();
			var accnewd = Number(String(newd.getSeconds()) + "."
				+ (String(newd.getMilliseconds()) < 100 ? "0" + String(newd.getMilliseconds()) : String(newd.getMilliseconds())));
			var accd = Number(String(d.getSeconds()) + "."
				+ (String(d.getMilliseconds()) < 100 ? "0" + String(d.getMilliseconds()) : String(d.getMilliseconds())));
			var di = accnewd - accd;
			//console.log(accnewd,accd,di);
			if (d.getMinutes() != newd.getMinutes()) {
				di = (60 * (newd.getMinutes() - d.getMinutes())) + di
			}
			var spd = ((_speedconstant * amount) / di);
			console.log("Time: " + Math.round(di * 1000) / 1000 + "s, estimated speed: " + Math.round(spd * 1000) / 1000 + "GHZ");

			return Math.round(spd * 1000) / 1000;
		}
	});

	W.KEY_DELAY_MS = 0;
	/*
	W.CPU_SPEED = W.cpuSpeedTest();

	if (W.CPU_SPEED > 7)
		W.KEY_DELAY_MS = 50;
	else if (W.CPU_SPEED > 2)
		W.KEY_DELAY_MS = 60;
	else if (W.CPU_SPEED > 1.5)
		W.KEY_DELAY_MS = 70;
	else if (W.CPU_SPEED > 1)
		W.KEY_DELAY_MS = 80;
	else if (W.CPU_SPEED > 0.5)
		W.KEY_DELAY_MS = 100;
	else
		W.KEY_DELAY_MS = 120;
	*/

	Object.defineProperty(W, "define", {
		writable:false, configurable:false,
		value: function(name) {
			var dependency, generator;
			/* argument validation */
			if(arguments.length > 3) {
				throw "Wrong number of arguments, 2 or 3 is acceptable!";
			}
			for(var i = 1; i < arguments.length; i ++) {
				if(typeof(arguments[i]) === 'string') {
					dependency = [arguments[i]];
				}
				if(typeof(arguments[i]) === 'object' &&
					arguments[i] instanceof Array) {
					dependency = arguments[i];
				}
				if(typeof(arguments[i]) === 'function') {
					generator = arguments[i];
					break;
				}
			}
			/* ensures array type of dependency */
			if(dependency === undefined) {
				dependency = [];
			}

			/* makes record data with dependency */
			var tuple = [dependency, generator];
			classGenerators[name] = tuple;

			Object.defineProperty(W, name, {
				configurable: false,
				get: function() {
					return W.getClass(name);
				},
				set: function(value) {
					throw new Error("set property is not allowed!");
				}
			});
		}
	});

	Object.defineProperty(W, "clone", {
		writable:false, configurable:false,
		value: function(obj) {
			//W.log.info("clone : start " + Date.now());
			var clone, property, value;
			if (!obj || typeof obj !== 'object') {
				return obj;
			}
			if (Object.prototype.toString.call(obj) !== '[object Array]') {
				clone = {};
				clone.__proto__ = obj.__proto__;
				//W.log.inspect(obj);
				for (property in obj) {
					if (obj.hasOwnProperty(property)) {
						//W.log.info("W.clone key " + property);
						value = obj[property];
						//W.log.info("W.clone value " + (obj[property]));
						if (value && typeof value === 'object' && value.toString().indexOf("HTML") == -1) {
							//W.log.info("W.clone self call ");
							clone[property] = W.clone(value);
						} else {
							clone[property] = obj[property];
						}
					}
				}
			} else {
				clone = obj.slice(0);
				for (var index in clone) {
					clone[index] = W.clone(obj[index]);
				}
			}
			//W.log.info("clone : end " + Date.now());
			return clone;
		}
	})

	Object.defineProperty(W, "getClass", {
		writable:false, configurable:false,
		value: function(name) {
			var loadClass = function(name) {
				var tuple = classGenerators[name];
				if(tuple === undefined) {
					throw "Class("+name+") does not exist!";
				}

				var dependencies = tuple[0];
				var generator = tuple[1];
				var cl = [];
				for(var i = 0; i < dependencies.length; i++) {
					var dep = dependencies[i];
					if(classes[dep] === undefined) {
						W.getClass(dep);
					}
					cl.push(classes[dep]);
				}

				classes[name] = generator.apply(this, cl);
			}

			if(classes[name] === undefined) {
				loadClass(name);
			}
			return classes[name];
		}
	});

	/**
	 * create a new component from Templet
	 * @method createTemplet
	 * @param {String} name templet name
	 */
	Object.defineProperty(W, "createTemplet", {
		writable:false, configurable:false,
		value: function(name) {
			if (W.TEMPLET.hasOwnProperty("templet/"+name)) {
				var obj = W.clone(W.TEMPLET["templet/"+name]);
				if (obj.comp) {
					obj.comp = obj.comp.cloneNode();
				}
				obj.pid = W.id++;


				if (obj && obj.templet)
					obj.templet = undefined;

				/**
				 *  children components
				 */
				if (obj.children) {
					for (var i in obj.children.key) {
						obj.children.obj[i] = W.cloneComponent(obj.children.obj[i]);
						obj.comp.appendChild(obj.children.obj[i].comp);
					}
				}

				return obj;
			} else {
				throw "TEMPLET(templet/"+name+") does not exist!";
			}
		}
	});

	/**
	 * return module
	 * @method getModule
	 * @param {String} name module name
	 */
	Object.defineProperty(W, "getModule", {
		writable:false, configurable:false,
		value: function(name) {
			if (modules.hasOwnProperty(name)) {
				return modules[name];
			} else {
				throw "MODULE("+name+") does not exist!";
			}
		}
	});
	Object.defineProperty(W, "setModule", {
		writable:false, configurable:false,
		value: function(name, module) {
			if (name, module)
				modules[name] = module;
		}
	});

	/**
	 * create a new Component by Clone
	 * @method cloneComponent
	 * @param {Component} comp
	 */
	Object.defineProperty(W, "cloneComponent", {
		writable:false, configurable:false,
		value: function(_comp) {
			var obj;
			obj = W.clone(_comp);
			obj.pid = W.id++;
			if (_comp.comp) {
				obj.comp = _comp.comp.cloneNode();
			}
			if (_comp.comp.textContent &&
				_comp.comp.textContent == _comp.comp.firstChild.textContent)
				obj.comp.textContent = _comp.comp.textContent;

			if (obj.children.length > 0) {
				for (var i in obj.children.key) {
					obj.children.obj[i] = W.cloneComponent(obj.children.obj[i]);
					obj.comp.appendChild(obj.children.obj[i].comp);
				}
			}
			return obj;
		}
	});

	Object.defineProperty(W, "createKeyEvent", {
		writable:false, configurable:false,
		value: function(code) {
			var keyboardEvent = document.createEvent("KeyboardEvent");
			keyboardEvent.returnValue = false;

			Object.defineProperty(keyboardEvent, 'keyCode', {
				get : function() {
					return this.keyCodeVal;
				}
			});

			Object.defineProperty(keyboardEvent, 'which', {
				get : function() {
					return this.keyCodeVal;
				}
			});

			var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";

			keyboardEvent[initMethod](
				"keydown", // event type : keydown, keyup, keypress
				true, // bubbles
				true, // cancelable
				window, // viewArg: should be window
				false, // ctrlKeyArg
				false, // altKeyArg
				false, // shiftKeyArg
				false, // metaKeyArg
				code, // keyCodeArg : unsigned long the virtual key code, else 0
				0 // charCodeArgs : unsigned long the Unicode character associated with the depressed key, else 0
			);
			keyboardEvent.keyCodeVal = code;
			return keyboardEvent;
		}
	});

	Object.defineProperty(W, "createCustomEvent", {
		writable:false, configurable:false,
		value: function(eventName, bubbles, cancelable, detail) {
			var evt;
			try {
				evt = new CustomEvent(eventName, {
					detail : detail,
					bubbles : bubbles,
					cancelable : cancelable
				});
			} catch (err) {
				evt = document.createEvent("CustomEvent");

				evt.initCustomEvent(eventName, bubbles, cancelable, detail);
			}

			return evt;
		}
	});
	/**
	 * define Key Code
	 * @class W.KEY
	 */
	Object.defineProperty(W, 'KEY', {
		writable:false, configurable:false,
		value: {
			ALL : -1,
			/**
			 * @property BACK_SPACE
			 * @type NUMBER
			 * @static
			 */
			BACK_SPACE : 8,
			/**
			 * @property ENTER
			 * @type NUMBER
			 * @static
			 */
			ENTER : 13,
			/**
			 * @property PAGE_UP
			 * @type NUMBER
			 * @static
			 */
			PAGE_UP : 33,
			/**
			 * @property PAGE_DOWN
			 * @type NUMBER
			 * @static
			 */
			PAGE_DOWN : 34,
			/**
			 * @property HOME
			 * @type NUMBER
			 * @static
			 */
			//HOME : 36,
			HOME : 72,
			/**
			 * @property LEFT
			 * @type NUMBER
			 * @static
			 */
			LEFT : 37,
			/**
			 * @property UP
			 * @type NUMBER
			 * @static
			 */
			UP : 38,
			/**
			 * @property RIGHT
			 * @type NUMBER
			 * @static
			 */
			RIGHT : 39,
			/**
			 * @property DOWN
			 * @type NUMBER
			 * @static
			 */
			DOWN : 40,
			/**
			 * @property NUM_0
			 * @type NUMBER
			 * @static
			 */
			NUM_0 : 48,
			/**
			 * @property NUM_1
			 * @type NUMBER
			 * @static
			 */
			NUM_1 : 49,
			/**
			 * @property NUM_2
			 * @type NUMBER
			 * @static
			 */
			NUM_2 : 50,
			/**
			 * @property NUM_3
			 * @type NUMBER
			 * @static
			 */
			NUM_3 : 51,
			/**
			 * @property NUM_4
			 * @type NUMBER
			 * @static
			 */
			NUM_4 : 52,
			/**
			 * @property NUM_5
			 * @type NUMBER
			 * @static
			 */
			NUM_5 : 53,
			/**
			 * @property NUM_6
			 * @type NUMBER
			 * @static
			 */
			NUM_6 : 54,
			/**
			 * @property NUM_7
			 * @type NUMBER
			 * @static
			 */
			NUM_7 : 55,
			/**
			 * @property NUM_8
			 * @type NUMBER
			 * @static
			 */
			NUM_8 : 56,
			/**
			 * @property NUM_9
			 * @type NUMBER
			 * @static
			 */
			NUM_9 : 57,
			/**
			 * @property STAR
			 * @type NUMBER
			 * @static
			 */
			STAR : 122,
			/**
			 * @property DELETE
			 * @type NUMBER
			 * @static
			 */
			DELETE : 127,
			/**
			 * @property COLOR_KEY_R
			 * @type NUMBER
			 * @static
			 */
			COLOR_KEY_R : 403,
			/**
			 * @property COLOR_KEY_G
			 * @type NUMBER
			 * @static
			 */
			COLOR_KEY_G : 404,
			/**
			 * @property COLOR_KEY_Y
			 * @type NUMBER
			 * @static
			 */
			COLOR_KEY_Y : 405,
			/**
			 * @property COLOR_KEY_B
			 * @type NUMBER
			 * @static
			 */
			COLOR_KEY_B : 406,
			/**
			 * @property POWER
			 * @type NUMBER
			 * @static
			 */
			POWER : 409,
			/**
			 * @property STOP
			 * @type NUMBER
			 * @static
			 */
			STOP : 413,
			/**
			 * @property PLAY
			 * @type NUMBER
			 * @static
			 */
			PLAY : 415,
			/**
			 * @property FAST_FWD
			 * @type NUMBER
			 * @static
			 */
			FAST_FWD : 417,
			/**
			 * @property FAST_BWD
			 * @type NUMBER
			 * @static
			 */
			FAST_BWD : 412,
			/**
			 * @property CHANNEL_UP
			 * @type NUMBER
			 * @static
			 */
			CHANNEL_UP : 427,
			/**
			 * @property CHANNEL_DOWN
			 * @type NUMBER
			 * @static
			 */
			CHANNEL_DOWN : 428,
			/**
			 * @property VOLUME_UP
			 * @type NUMBER
			 * @static
			 */
//            VOLUME_UP : 447,
			VOLUME_UP : 81,
			/**
			 * @property VOLUME_DOWN
			 * @type NUMBER
			 * @static
			 */
//            VOLUME_DOWN : 448,
			VOLUME_DOWN : 65,
			/**
			 * @property MUTE_TOGGLE
			 * @type NUMBER
			 * @static
			 */
			MUTE_TOGGLE : 449,
			/**
			 * @property EXIT
			 * @type NUMBER
			 * @static
			 */
			//  OCAP
			EXIT : 601,
			/**
			 * @property MENU
			 * @type NUMBER
			 * @static
			 */
            MENU : 602,
			/**
			 * @property LAST
			 * @type NUMBER
			 * @static
			 */
			LAST :  607,
			/**
			 * @property BACK
			 * @type NUMBER
			 * @static
			 */
			BACK :  461,
			/**
			 * @property FORWARD
			 * @type NUMBER
			 * @static
			 */
			FORWARD :  609,
			KEY_DELETE : 46, //등록할때 쓰는 키
			KEY_DEL : 127, //키받을때 비교하는키,
			KEY_ESC : 27,
			KEY_INFO : 73,
			KEY_OPTION : 404,
			VK_A: 65,
			VK_B: 66,
			VK_C: 67,
			VK_D: 68,
			VK_E: 69,
			VK_F: 70,
			VK_G: 71,
			VK_H: 72,
			VK_I: 73,
			VK_J: 74,
			VK_K: 75,
			VK_L: 76,
			VK_M: 77,
			VK_N: 78,
			VK_O: 79,
			VK_P: 80,
			VK_Q: 81,
			VK_R: 82,
			VK_S: 83,
			VK_T: 84,
			VK_U: 85,
			VK_V: 86,
			VK_W: 87,
			VK_X: 88,
			VK_Y: 89,
			VK_Z: 90,

			VK_ASTERISK: 122,
			VK_NUMBER_SIGN : 123,

			//custom
			CUSTOM_KEY_RANGE: 900,
			ENTER_LONG_PRESS: 999,
			GESTURE_RIGHT: 998,
			GESTURE_LEFT: 997,
			GESTURE_UP: 996,
			GESTURE_DOWN: 995,
			POINTER_RIGHT:994,
			POINTER_LEFT:993,
			POINTER_UP:992,
			POINTER_DOWN:991,
			POINTER_CLICK:990,
			POINTER_PRESSED:989,
		}
	});

	Object.defineProperty(W, "setRCPath", {
		writable:false, configurable:false,
		value: function(path) {
			Object.defineProperty(W, "RC_PATH",  {
				writable:false, configurable:false,
				value: path
			});
		}
	});

	Object.defineProperty(W, "startApp", {
		writable:false, configurable:false,
		value: function(scene) {

			W.body = document.getElementsByTagName("body")[0];
			W.frag = document.createDocumentFragment();
			W.root = new W.Div({});

			var touchGesture = function(evt) {
				W.log.info("touchGesture");
				if (evt.gestureInfo) {
					if (evt.gestureInfo.direction == "DOWN") {
						document.dispatchEvent(W.createKeyEvent(W.KEY.GESTURE_DOWN));
					} else if (evt.gestureInfo.direction == "LEFT") {
						document.dispatchEvent(W.createKeyEvent(W.KEY.GESTURE_LEFT));
					} else if (evt.gestureInfo.direction == "RIGHT") {
						document.dispatchEvent(W.createKeyEvent(W.KEY.GESTURE_RIGHT));
					} else if (evt.gestureInfo.direction == "UP") {
						document.dispatchEvent(W.createKeyEvent(W.KEY.GESTURE_UP));
					}
				}
			};
			var timerPointerPressed;
			var pointerAction = function(evt) {
				if (evt.type == W.IComponent.EVENT_TYPE_POINTER_PRESSED ||
					evt.type == W.IComponent.EVENT_TYPE_TOUCH_START) {
					//W.log.info("pointerAction pressed");
					//document.dispatchEvent(W.createKeyEvent(W.KEY.POINTER_PRESSED));
				} else if (evt.type == W.IComponent.EVENT_TYPE_POINTER_CLICKED ||
					evt.type == W.IComponent.EVENT_TYPE_TOUCH_END) {

					//W.log.info("pointerAction clicked");
					//if (timerPointerPressed)
					//	clearTimeout(timerPointerPressed);

					window.requestAnimationFrame(function () {
						document.dispatchEvent(W.createKeyEvent(W.KEY.POINTER_CLICK));
					});
				}
			};
			W.root.onGesture = touchGesture;
			W.root.onPointerPressed = pointerAction;
			W.root.onPointerClicked = pointerAction;
			W.root.onTouchEnd = pointerAction;
			W.root.onTouchStart = pointerAction;

			W.body.appendChild(W.root.comp);

			if ( !window.requestAnimationFrame ) {
				window.requestAnimationFrame = ( function() {

					return window.webkitRequestAnimationFrame ||
						window.mozRequestAnimationFrame ||
						window.oRequestAnimationFrame ||
						window.msRequestAnimationFrame ||
						function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
							window.setTimeout( callback, 1000 / 60 );
						};

				} )();
			};

			try {
				document.createEvent("MouseEvent");
				W.hasPointer = true;
			} catch(e){}

			var _sceneManager = W.getClass("SceneManager");
			var _keyHandler = W.getClass("KeyHandler");

			var _touchHandler = W.getClass("TouchHandler");
			document.addEventListener("keydown", _keyHandler.keyDown);
			document.addEventListener("keyup", _keyHandler.keyUp);

			if (W.isMobile == true) {
				document.addEventListener("touchend", _touchHandler.touchEnd);
				document.addEventListener("touchcancel", _touchHandler.touchCancel);
				document.addEventListener("touchstart", _touchHandler.touchStart);
				document.addEventListener("touchmove", _touchHandler.touchMove);
			} else {
				document.addEventListener("mousedown", _keyHandler.pointerPressed);
				document.addEventListener("mouseup", _keyHandler.pointerClicked);
				document.addEventListener("mouseover", _keyHandler.pointerIn);
				document.addEventListener("mouseout", _keyHandler.pointerOut);
			}

			document.addEventListener("drop", _keyHandler.onDrop);
			document.addEventListener("dragover", _keyHandler.onDragover);
			document.addEventListener("dragstart", _keyHandler.onDragstart);

			if (W.isDesktop) {
				W.deviceId = "Laptop";
				W.KEY.BACK = 8;
				W.KEY.EXIT = 27;
			}

			W.deviceId += " "+parseInt(Math.random()* 10000);

			if (W.isRDK) {
				W.KEY_DELAY_MS = 0;
				W.KEY.EXIT = 800;
				W.KEY.KEY_ESC = 800;
				W.KEY.BACK = 27;
				W.KEY.MENU = 77;
			}

			_sceneManager.init();
			_sceneManager.startScene(scene);

			//Prevent system back key on Android mobile
			if (W.isMobile) {
				window.history.pushState({}, '');
				window.addEventListener('popstate', function() {
					console.log("System back button was clicked");
					document.dispatchEvent(W.createKeyEvent(W.KEY.BACK));
					window.history.pushState({}, '');
				});
			}
		}
	});

	function isArray(it) {
		return toString.call(it) === '[object Array]';
	}
	function tryCall(self, method /*,... */) {
		try {
			if (typeof(method)==='string')
				return self[method].apply(self, Array.prototype.slice.call(
					arguments, 2));
			else if (typeof(method)==='function')
				return method.apply(self, Array.prototype.slice.call(
					arguments, 2));
		} catch(e) {
			W.log.info('stack:' + e.stack);
		}
	}
})();

/**
 * Log class
 *
 * @class W.log
 * @static
 * @for W
 */
(function() {
	var ERROR = 0;
	var WARN = 1;
	var INFO = 2;
	var DEBUG = 3;
	var TRACE = 4;
	var funcs = ["error", "warn", "log", "log", "log"];
	var marks = ["!", "?", "#", " ", " "];

	var bufferLength = 3000;
	var buffer = "";

	var print = function (lvl) {
		return function (o) {
			if (this.level < lvl) return;
			var f = funcs[lvl] || "error";
			var prefix = marks[lvl] + " " + this.name+": ";
			console[f](prefix+o);
			if (W.debugWindow) {
				if (buffer.length < bufferLength)
					buffer = prefix+o+"\n" + buffer;
				else {
					buffer = buffer.substring(0, bufferLength);
					buffer = prefix+o+"\n" + buffer;
				}

				W.debugWindow.setText(buffer);
			}
			if (typeof(o) !== "object") return;
			if (o.name) {
				console[f](prefix+"    name: "+o.name);
			}
			if (o.message) {
				console[f](prefix+"    message: "+o.message);
			}
			if (o.stack) {
				console[f](prefix+"    stack: "+o.stack);
			}
		};
	}

	var inspect = function(o) {
		console.log(o);
		if (W.debugWindow) {
			var str;
			if (o != undefined)
				str = o.toString();

			if (buffer.length < bufferLength)
				buffer = str+"\n" + buffer;
			else {
				buffer = buffer.substring(0, bufferLength);
				buffer = str+"\n" + buffer;
			}

			W.debugWindow.setText(buffer);
		}
//        var msg = "";
//        if (o instanceof Array ) {
//        	console.log(o);
//        } else {
//        	for (var k in o) {
//	            if (o.hasOwnProperty(k)) {
//	                msg+= k+" = "+o[k]+"\n";
//	            }
//	        }
//	        console.log(msg);
//        }
	}

	var logRoot = {
		/**
		 * Log level constant.
		 *
		 * @property ERROR
		 * @type Number
		 * @default 0
		 * @for W.log.info
		 */
		ERROR: ERROR,
		/**
		 * Log level constant.
		 *
		 * @property WARN
		 * @type Number
		 * @default 1
		 * @for W.log.info
		 */
		WARN: WARN,
		/**
		 * Log level constant.
		 *
		 * @property INFO
		 * @type Number
		 * @default 2
		 * @for W.log.info
		 */
		INFO: INFO,
		/**
		 * Log level constant.
		 *
		 * @property DEBUG
		 * @type Number
		 * @default 3
		 * @for W.log.info
		 */
		DEBUG: DEBUG,
		/**
		 * Log level constant.
		 *
		 * @property TRACE
		 * @type Number
		 * @default 4
		 * @for W.log.info
		 */
		TRACE: TRACE,
		/**
		 * This Log object's verbosity level. INFO by default.
		 *
		 * @property level
		 * @type Number
		 * @default INFO
		 * @for W.log.info
		 */
		level: DEBUG,
		name: "",
		/**
		 * Creates another log object inherited from this.
		 *
		 * @method spawn
		 * @param {String} mod Module name.
		 * @param {log level constant} lvl Value for specifying log level.
		 * @return {Log} Returns a new Log object.
		 * @for W.log.info
		 */
		spawn: function (mod, lvl) {
			var log = Object.create(this);
			log.name = this.name + mod;
			if (lvl) {
				log.level = lvl;
			}
			return log;
		},
		/**
		 * Prints log as ERROR log level.
		 *
		 * @method error
		 * @param {String} o If not object type, return silently.
		 * @for W.log.info
		 */
		error: print(ERROR),
		/**
		 * Prints log as WARN log level.
		 *
		 * @method warn
		 * @param {String} o If not object type, return silently.
		 * @for W.log.info
		 */
		warn: print(WARN),
		/**
		 * Prints log as INFO log level.
		 *
		 * @method info
		 * @param {String} o If not object type, return silently.
		 * @for W.log.info
		 */
		info: print(INFO),
		/**
		 * Prints log as DEBUG log level.
		 *
		 * @method debug
		 * @param {String} o If not object type, return silently.
		 * @for W.log.info
		 */
		debug: print(DEBUG),
		/**
		 * Prints log as TRACE log level.
		 *
		 * @method trace
		 * @param {String} o If not object type, return silently.
		 * @for W.log.info
		 */
		trace: print(TRACE),
		/**
		 * Returns details on the given object.
		 *
		 * @method inspect
		 * @param {Object} o Object to be inspected.
		 * @for W.log.info
		 */
		inspect: inspect
	};
	Object.defineProperty(W, "log", {
		writable:false, configurable:false,
		value:logRoot.spawn("webtv")});
})();
/*
 *  A class for utility functions.
 *
 *  @class W.Util
 */
/* global W */
(function() {
	"use strict";
	W.define("Util", function() {
		var WUtil = {};
		/**
		 *  Returns `true` if `n` is finite numeric value.
		 *  @method isNumeric
		 *  @param {?} n an object or primitive.
		 *  @return {boolean} `true` if `n` is a finite `number`, `string` or
		 *  `String` that represents a finite number or a finite `Number`
		 *  object.
		 *  @static
		 *  @private
		 */
		WUtil.isNumeric = function(n) {
			if (typeof n === "object" && n instanceof String)
				n = n.valueOf();
			if (typeof n === "string")
				return !isNaN(parseFloat(n)) && isFinite(n);

			if (typeof n === "object" && n instanceof Number)
				n = n.valueOf();
			else if (typeof n !== "number")
				return false;

			return !isNaN(n) && isFinite(n);
		};

		var STACK_SUPPORTED = (new Error()).stack !== undefined;
		var decorate = STACK_SUPPORTED ? function(msg) {
			return (new Error(msg)).stack;
		} : function(msg) {
			return "Error : " + msg;
		};

		/**
		 *  Logs error message `msg` and return `true` if `expr` is `true`.
		 *
		 *      if (WUtil.error(isNaN(value), "not a number"))
		 *          return;
		 *
		 *  Multiple `expr` and `msg` pair can passed.
		 *
		 *      if (WUtil.error(isNaN(value), "not a number",
		 *              !isFinite(value), "infinite value"))
		 *          return;
		 *
		 *  If single argument is passed, the function assumes the argument
		 *  is `msg` and `expr` is `true`.
		 *
		 *      WUtil.error("shall not reach here.")
		 *
		 *  @method error
		 *  @param {boolean} expr* a boolean expression.
		 *  @param {string} msg* error message.
		 *  @static
		 *  @private
		 */
		WUtil.error = function (/* expr, msg, expr, msg... */) {
			if (arguments.length===1) {
				W.log.error(decorate(arguments[0]));
				return true;
			}
			for (var i=0; i<arguments.length; i+=2) {
				if (arguments[i]) {
					W.log.error(decorate(arguments[i+1]));
					return true;
				}
			}
			return false;
		};

		WUtil.warn = function (msg) {
			W.log.warn(decorate(msg));
		};

		WUtil.setStyle = function(obj, propertyObject){
			for (var property in propertyObject){
				if (obj)
					obj.comp.style[property] = propertyObject[property];
			}
		};

		/**
		 *  @method isFloat16
		 *  @param {?} obj An array-like object.
		 *  @static
		 *  @private
		 */
		WUtil.isFloat16 = function(obj) {
			var i=0, length=obj.length;
			if (length!==16)
				return false;
			for (i=0; i<length; ++i)
				if (!WUtil.isNumeric(obj[i]))
					return false;
			return true;
		};

		WUtil.tryCall = function(self, method /*, ... */ ) {
			try {
				if (typeof(method)==='string')
					return self[method].apply(self, Array.prototype.slice.call(
						arguments, 2));
				else if (typeof(method)==='function')
					return method.apply(self, Array.prototype.slice.call(
						arguments, 2));
			} catch(e) {
				W.log.error('stack:' + e.stack);
			}
		};

		return WUtil;
	});
}());
/**
 * Base class for extendable classes.
 * this function is based on wind framework.
 *
 * @class W.Class
 * @constructor
 */
W.define("Class", function() {
	"use strict";
	var initializing = false;
	var WClass = function(){};

	function extend(prop) {
		var superClass = this.prototype;
		initializing = true;
		var prototype = new this();
		initializing = false;
		var superImpl = function(name) {
			var superProp = superClass[name];
			return typeof(superProp)==='function' ?
				superProp.apply(this,
					Array.prototype.slice.call(arguments, 1)) :
				superProp;
		};

		for (var name in prop) {
			if (typeof(prop[name])==='function') {
				prototype[name] = (function(name) {
					return function() {
						var tmp = this._super;
						this._super = superImpl;
						//W.log.info("prop[name]" + prop[name]);
						var ret = prop[name].apply(this, arguments);
						this._super = tmp;
						return ret;
					}
				})(name);
			} else {
				prototype[name] = prop[name];
			}
		}

		function Class() {
			if ( !initializing && this.init ) {
				//this.pid = W.id++;
				this.init.apply(this, arguments);
			}
		}

		Class.prototype = prototype;
		Class.prototype.constructor = Class;
		Object.defineProperty(Class, "extend", {
			enumerable:false, writable:false, configurable:false, value:extend
		});
		return Class;
	}

	function tryCall(self, method /*,... */) {
		try {
			if (typeof(method)==='string')
				return self[method].apply(self, Array.prototype.slice.call(
					arguments, 2));
			else if (typeof(method)==='function')
				return method.apply(self, Array.prototype.slice.call(
					arguments, 2));
		} catch(e) {
			W.log.info('stack:' + e.stack);
		}
	}

	/**
	 * Returns extended class from this class.
	 *
	 * @example
	 *      //Simple extention.
	 *
	 *      var Extended = WClass.extend({
     *              init: function() {},
     *              test: function(value) { W.log.info("test" + value); }
     *          });
	 *
	 *      //Simple construction.
	 *
	 *      var Extended = WClass.extend({
     *              init: function(test) { W.log.info(test); },
     *          });
	 *      new Extended("test string");
	 *
	 *      //Calling with _super.
	 *
	 *      var Extended2 = Extended.extend({
     *              init: function() { this._super("init"); },
     *              test: function(value) {
     *                  W.log.info("test2" + value);
     *                  this._super("test", value);
     *              }
     *          });
	 * @method extend
	 * @param {Object} desc The property description.
	 * Note that `init` property is used for initialization.
	 * @static
	 */
	Object.defineProperty(WClass, 'extend', {
		enumerable:false, writable:false, configurable: false, value:extend });

	Object.defineProperty(WClass, 'tryCall', {
		enumerable:false, writable:false, configurable: false, value:tryCall });

	return WClass;
});

/*
 *  represents an animatable float array property of length 16.
 *  @class W.Float16Property
 *  @constructor
 *  @private
 */
/* global W */
W.define("Float16Property", function() {
	"use strict";
	var WUtil = W.getClass("Util");
	var WClass = W.getClass("Class");
	return WClass.extend({
		__type: "F",
		__size: 16,
		init: function(id) {
			this.__id = id;
		},
		__normalizeConf: function(value) {
			if (value.length===2 && WUtil.isFloat16(value[0]) &&
				WUtil.isFloat16(value[1]))
				return [value[0], value[1]];
			else if (value.length===1 && WUtil.isFloat16(value[0]))
				return [null, value[0]];
			else if (WUtil.isFloat16(value))
				return [null, value];
			else if (typeof(value) == "string")
				return [null, value];
			WUtil.error("Wrong conf value: " + value);
			return null;
		},
		__normalizeParam: function(args) {
			if (args.length===2 && WUtil.isFloat16(args[0]) &&
				WUtil.isFloat16(args[1]))
				return [args[0], args[1]];
			else if (args.length===1 && WUtil.isFloat16(args[0]))
				return [null, args[0]];
			WUtil.error("Wrong arg from:" + args[0] + " to:" + args[1]);
			return null;
		}
	});
});
/*
 *  Represents an animatable float property.
 *
 *  @class W.FloatProperty
 *  @constructor
 *  @private
 */
/* global W */
W.define("FloatProperty", function() {
	"use strict";
	var WUtil = W.getClass("Util");
	var WClass = W.getClass("Class");
	return WClass.extend({
		__type: "F",
		__size: 1,
		init: function(id) {
			this.__id = id;
		},
		__normalizeConf: function(value) {
			if (value.length===2 && WUtil.isNumeric(value[0]) &&
				WUtil.isNumeric(value[1]))
				return [[value[0]], [value[1]]];
			else if (value.length===1 && WUtil.isNumeric(value[0]))
				return [null, [value[0]]];
			else if (WUtil.isNumeric(value))
				return [null, [value]];
			else if (typeof(value) == "string")
				return [null, value];
			WUtil.error("Wrong conf value: " + value);
			return null;
		},
		__normalizeParam: function(args) {
			if (args.length===2 && WUtil.isNumeric(args[0]) &&
				WUtil.isNumeric(args[1]))
				return [args[0], args[1]];
			else if (args.length===1 && WUtil.isNumeric(args[0]))
				return [null, args[0]];
			WUtil.error("Wrong arg from:" + args[0] + " to:" + args[1]);
			return null;
		}
	});
});

W.define('Hash', function() {

	var WClass = W.getClass("Class");
	return WClass.extend({

		init : function() {
			this.length = 0;
			this.key = [];
			this.obj = [];
		},

		type : "hash",

		put : function( _key, _obj ) {
			try {
				var ret = this.get(_key);
				if (ret) {
					for (var i = 0 ; i < this.length; i++ ) {
						if ( _key == this.key[i]) {
							this.obj[i] = _obj;
							//W.log.info("W.Hash Exist same id object " + _key);
							return;
						}
					}
					return;
				}
				this.key.push( _key);
				this.obj.push( _obj );
				this.length++;
			} catch( e ) {
				W.log.error( e );
			}
		},

		elementAt : function( i ) {
			var ret = null;
			try {
				i = parseInt( i, 10 );
				if ( i >= 0 && i < this.length ) {
					ret = this.obj[i];
				}
			} catch( e ) {
				W.log.error( e );
			}
			return ret;
		},

		indexOf : function(obj) {
			try {
				for (var i = 0 ; i < this.length; i++ ) {
					if (obj == this.obj[i]) {
						return i;
					}
				}
			} catch( e ) {
				W.log.error( e );
			}
			return -1;
		},

		has : function(obj) {
			try {
				for (var i = 0 ; i < this.length; i++ ) {
					if (obj == this.obj[i]) {
						return true;
					}
				}
			} catch( e ) {
				W.log.error( e );
			}
			return false;
		},

		get : function( _key ) {
			var ret = null;
			try {
				for (var i = 0 ; i < this.length; i++ ) {
					if (_key == this.key[i])
						ret = this.obj[i];
				}
			} catch( e ) {
				W.log.error( e );
			}
			return ret;
		},

		insertAt : function( i , _key, _obj) {
			try {
				i = parseInt( i, 10 );
				if( i == this.length ) {
					this.put( _key , _obj);
					return;
				}
				this.key.splice( i, 0, _key );
				this.obj.splice( i, 0, _obj );
				this.length++;
			} catch( e ) {
				W.log.error( e );
			}
		},

		remove : function( _key ) {
			var ret = null;
			try {
				for (var i = 0 ; i < this.length; i++ ) {
					if ( _key == this.key[i]) {
						ret = this.obj[i];
						this.key.splice( i, 1 );
						this.obj.splice( i, 1 );
						this.length--;
					}
				}
			} catch( e ) {
				W.log.error( e );
			}
			return ret;
		},

		clear : function() {
			try {
				this.key = [];
				this.obj = [];
				this.length = 0;
			} catch( e ) {
				W.log.error( e );
			}
		},

		size : function() {
			return this.length;
		},


		set : function( i, _key, _obj ) {
			var ret = null;
			try {
				i = parseInt( i, 10 );
				if ( i >= 0 && i < this.length ) {
					this.key[i] = _key;
					this.obj[i] = _obj;
				}
			} catch( e ) {
				W.log.error( e );
			}
			return ret;
		}
	});
});

W.define('AppContext', 'Class', function(WClass) {

	var appData = {};
	var tmpData = {};

	/**
	 * Singleton Class
	 * @example
	 * W.AppContext.setAppData(key, value);
	 * W.AppContext.getAppData(key);
	 * @class W.AppContext
	 */
	var _appContext = WClass.extend({

		/**
		 * @method setTmpData
		 * @param {String} key key of data
		 * @param {Object} value value of data
		 */
		setTmpData : function(key, value) {
			tmpData[key] = value;
		},

		/**
		 * After called getTmpData, key and value will be deleted.
		 * @method getTmpData
		 * @param {String} key key of data
		 * @return {Object}
		 */
		getTmpData : function(key) {
			if (tmpData.hasOwnProperty(key)) {
				var res = tmpData[key];
				delete tmpData[key];
				return res;
			}
		},

		/**
		 * @method setAppData
		 * @param {String} key key of data
		 * @param {Object} value value of data
		 */
		setAppData : function(key, value) {
			appData[key] = value;
		},

		/**
		 * Even called getAppData, key and value will be keeped.
		 * @method getAppData
		 * @param {String} key key of data
		 * @return {Object}
		 */
		getAppData : function(key) {
			if (appData.hasOwnProperty(key)) {
				return appData[key];
			}
		},

		/**
		 * @method removeAppData
		 * @param {String} key key of data
		 */
		removeAppData : function(key) {
			if (appData.hasOwnProperty(key)) {
				delete appData[key];
			}
		}
	});
	var WAppContext = new _appContext();
	return WAppContext;
});

W.define("ICurve", "Class", function(WClass){

	var _iCurve = WClass.extend({
		BASE_LINEAR : 0,
		BASE_SINE : 1,
		BASE_QUAD : 2,
		BASE_CUBIC : 3,
		BASE_QUART : 4,
		BASE_QUINT : 5,
		BASE_EXPO : 6,
		BASE_CIRCLE : 7,
		BASE_ELASTIC : 8,
		BASE_BACK : 9,
		BASE_BOUNCE : 10,
		BASE_END : 11,
		EASE_IN : 0,
		EASE_OUT : 1,
		EASE_IN_OUT : 2,
		EASE_OUT_IN : 3,
		EASE_END : 4,
		SYSTEM_CURVE_ID_START : 0,
		SYSTEM_CURVE_ID_END : 44
	});
	var ICurve = new _iCurve();
	return ICurve;
});
W.define("Curve", function() {
	"use strict";

	var WClass = W.getClass("Class");
	var error = W.getClass("Util").error;
	var ICurve = W.getClass("ICurve");

	var bases = {
		"linear"    : ICurve.BASE_LINEAR,
		"sine"      : ICurve.BASE_SINE,
		"quad"      : ICurve.BASE_QUAD,
		"cubic"     : ICurve.BASE_CUBIC,
		"quart"     : ICurve.BASE_QUART,
		"quint"     : ICurve.BASE_QUINT,
		"expo"      : ICurve.BASE_EXPO,
		"circle"    : ICurve.BASE_CIRCLE,
		"elastic"   : ICurve.BASE_ELASTIC,
		"back"      : ICurve.BASE_BACK,
		"bounce"    : ICurve.BASE_BOUNCE
	};

	var easings = {
		""              : ICurve.EASE_OUT,
		">"             : ICurve.EASE_OUT,
		"<"             : ICurve.EASE_IN,
		"><"            : ICurve.EASE_OUT_IN,
		"<>"            : ICurve.EASE_IN_OUT,
		"-ease-in"      : ICurve.EASE_IN,
		"-ease-out"     : ICurve.EASE_OUT,
		"-ease-in-out"  : ICurve.EASE_IN_OUT,
		"-ease-out-in"  : ICurve.EASE_OUT_IN
	};

	var PREDEFINED_START = 0;
	var PREDEFINED_END = 44;

	function makeID(name) {
		var result = name.match(
			/^([a-z]+)(<>|><|<|>|-ease-in-out|-ease-out-in|-ease-in|-ease-out|)$/);
		if (error(!result, "Bad curve:"+name))
			return -1;
		var base = result[1];
		if (base==="linear")
			return ICurve.BASE_LINEAR;
		var easing = result[2];
		//console.log("result : " + JSON.stringify(result));
		//console.log("WCurve makeID : "+(bases[base]*ICurve.EASE_END + easings[easing]))
		return bases[base]*ICurve.EASE_END+ easings[easing];
	}

	var nextID = 0;

	var curveList = {};
	curveList[ICurve.BASE_LINEAR] = {};
	curveList[ICurve.BASE_LINEAR][ICurve.EASE_IN] = "linear";
	curveList[ICurve.BASE_LINEAR][ICurve.EASE_OUT] = "linear";
	curveList[ICurve.BASE_LINEAR][ICurve.EASE_IN_OUT] = "linear";
	curveList[ICurve.BASE_LINEAR][ICurve.EASE_OUT_IN] = "linear";
	curveList[ICurve.BASE_SINE] = {};
	curveList[ICurve.BASE_SINE][ICurve.EASE_IN] = "cubic-bezier(0.47, 0, 0.745, 0.715)";
	curveList[ICurve.BASE_SINE][ICurve.EASE_OUT] = "cubic-bezier(0.39, 0.575, 0.565, 1)";
	curveList[ICurve.BASE_SINE][ICurve.EASE_IN_OUT] = "cubic-bezier(0.445, 0.05, 0.55, 0.95)";
	curveList[ICurve.BASE_SINE][ICurve.EASE_OUT_IN] = "cubic-bezier(0.055, 0.370, 0.895, 0.695)";
	curveList[ICurve.BASE_QUAD] = {};
	curveList[ICurve.BASE_QUAD][ICurve.EASE_IN] = "cubic-bezier(0.550, 0.085, 0.680, 0.530)";
	curveList[ICurve.BASE_QUAD][ICurve.EASE_OUT] = "cubic-bezier(0.250, 0.460, 0.450, 0.940)";
	curveList[ICurve.BASE_QUAD][ICurve.EASE_IN_OUT] = "cubic-bezier(0.455, 0.030, 0.515, 0.955)";
	curveList[ICurve.BASE_QUAD][ICurve.EASE_OUT_IN] = "cubic-bezier(0.025, 0.360, 0.965, 0.625)";
	curveList[ICurve.BASE_CUBIC] = {};
	curveList[ICurve.BASE_CUBIC][ICurve.EASE_IN] = "cubic-bezier(0.550, 0.055, 0.675, 0.190)";
	curveList[ICurve.BASE_CUBIC][ICurve.EASE_OUT] = "cubic-bezier(0.215, 0.610, 0.355, 1.000)";
	curveList[ICurve.BASE_CUBIC][ICurve.EASE_IN_OUT] = "cubic-bezier(0.645, 0.045, 0.355, 1.000)";
	curveList[ICurve.BASE_CUBIC][ICurve.EASE_OUT_IN] = "cubic-bezier(0.045, 0.470, 1.000, 0.510)";
	curveList[ICurve.BASE_QUART] = {};
	curveList[ICurve.BASE_QUART][ICurve.EASE_IN] = "cubic-bezier(0.895, 0.030, 0.685, 0.220)";
	curveList[ICurve.BASE_QUART][ICurve.EASE_OUT] = "cubic-bezier(0.165, 0.840, 0.440, 1.000)";
	curveList[ICurve.BASE_QUART][ICurve.EASE_IN_OUT] = "cubic-bezier(0.770, 0.000, 0.175, 1.000)";
	curveList[ICurve.BASE_QUART][ICurve.EASE_OUT_IN] = "cubic-bezier(0.000, 0.760, 1.000, 0.135)";
	curveList[ICurve.BASE_QUINT] = {};
	curveList[ICurve.BASE_QUINT][ICurve.EASE_IN] = "cubic-bezier(0.755, 0.050, 0.855, 0.060)";
	curveList[ICurve.BASE_QUINT][ICurve.EASE_OUT] = "cubic-bezier(0.230, 1.000, 0.320, 1.000)";
	curveList[ICurve.BASE_QUINT][ICurve.EASE_IN_OUT] = "cubic-bezier(0.860, 0.000, 0.070, 1.000)";
	curveList[ICurve.BASE_QUINT][ICurve.EASE_OUT_IN] = "cubic-bezier(0.000, 0.855, 1.000, 0.100)";
	curveList[ICurve.BASE_EXPO] = {};
	curveList[ICurve.BASE_EXPO][ICurve.EASE_IN] = "cubic-bezier(0.950, 0.050, 0.795, 0.035)";
	curveList[ICurve.BASE_EXPO][ICurve.EASE_OUT] = "cubic-bezier(0.190, 1.000, 0.220, 1.000)";
	curveList[ICurve.BASE_EXPO][ICurve.EASE_IN_OUT] = "cubic-bezier(1.000, 0.000, 0.000, 1.000)";
	curveList[ICurve.BASE_EXPO][ICurve.EASE_OUT_IN] = "cubic-bezier(0.000, 0.985, 1.000, 0.010)";
	curveList[ICurve.BASE_CIRCLE] = {};
	curveList[ICurve.BASE_CIRCLE][ICurve.EASE_IN] = "cubic-bezier(0.600, 0.040, 0.980, 0.335)";
	curveList[ICurve.BASE_CIRCLE][ICurve.EASE_OUT] = "cubic-bezier(0.075, 0.820, 0.165, 1.000)";
	curveList[ICurve.BASE_CIRCLE][ICurve.EASE_IN_OUT] = "cubic-bezier(0.785, 0.135, 0.150, 0.860)";
	curveList[ICurve.BASE_CIRCLE][ICurve.EASE_OUT_IN] = "cubic-bezier(0.145, 0.755, 0.870, 0.120)";
	curveList[ICurve.BASE_ELASTIC] = {};
	curveList[ICurve.BASE_ELASTIC][ICurve.EASE_IN] = "linear";
	curveList[ICurve.BASE_ELASTIC][ICurve.EASE_OUT] = "linear";
	curveList[ICurve.BASE_ELASTIC][ICurve.EASE_IN_OUT] = "linear";
	curveList[ICurve.BASE_ELASTIC][ICurve.EASE_OUT_IN] = "linear";
	curveList[ICurve.BASE_BACK] = {};
	curveList[ICurve.BASE_BACK][ICurve.EASE_IN] = "cubic-bezier(0.600, -0.280, 0.735, 0.045)";
	curveList[ICurve.BASE_BACK][ICurve.EASE_OUT] = "cubic-bezier(0.175, 0.885, 0.320, 1.275)";
	curveList[ICurve.BASE_BACK][ICurve.EASE_IN_OUT] = "cubic-bezier(0.680, -0.550, 0.265, 1.550)";
	curveList[ICurve.BASE_BACK][ICurve.EASE_OUT_IN] = "cubic-bezier(0.320, 1.650, 0.700, -0.600)";
	curveList[ICurve.BASE_BOUNCE] = {};
	curveList[ICurve.BASE_BOUNCE][ICurve.EASE_IN] = "linear";
	curveList[ICurve.BASE_BOUNCE][ICurve.EASE_OUT] = "linear";
	curveList[ICurve.BASE_BOUNCE][ICurve.EASE_IN_OUT] = "linear";
	curveList[ICurve.BASE_BOUNCE][ICurve.EASE_OUT_IN] = "linear";

	/*
	 *  Represents a curve for an animation.
	 *  @class W.Curve
	 *  @constructor
	 *  @param {number|WMap} An arg ID number or WMap instance.
	 *  @private
	 */
	var WCurve = WClass.extend({

		init: function(arg) {
			if (typeof arg === "number" && PREDEFINED_START<= arg &&
				arg < PREDEFINED_END)
				this.__id = arg;
			else
				this.__id = nextID++;
		}
	});

	/**
	 *  @method __from
	 *  @param {W.Curve|string} arg A WCurve instance or curve name string.
	 *  @return arg if arg is a WCurve instance.
	 *          matching WCurve if arg is curve name string.
	 *          expo curve otherwise.
	 *  @static
	 *  @private
	 */
	WCurve.__from = function(arg) {
		if (arg instanceof WCurve)
			return arg;
		var id = makeID(arg);
		return id>=0 ? new WCurve(id) : null;
	};
	return WCurve;
});

W.define("IAnimation", "Class", function(WClass){

	var _iAnimation = WClass.extend({
		REASON_ENDED : 0,
		REASON_STOPPED : 1,
		INFINITY : 2147483647
	});

	var IAnimation = new _iAnimation();
	return IAnimation;
});

/* global W */
W.define("Animation", function() {
	"use strict";
	var WClass = W.getClass("Class");
	var WUtil = W.getClass("Util");
	var error = WUtil.error;
	var IAnimation = W.getClass("IAnimation");
	var IComponent = W.getClass("IComponent");

	var nextID = 0;

	/**
	 *
	 * @class W.Animation
	 * @constructor
	 */
	var WAnimation = WClass.extend({

		init: function() {
			this.__id = nextID++;
			this.__running = false;
		},
		__start: function(spec, conf) {
			//  TODO: check argument
			var repeat = 1,
				startPos = 0,
				name = "",
				onTerm;
			if (conf) {
				if (conf.repeat!==undefined)
					repeat = conf.repeat;
				if (conf.startPos!==undefined)
					startPos = conf.startPos;
				if (conf.name!==undefined)
					name = conf.name;
				if (conf.onTerm!==undefined) {
					onTerm = {
						onTermination : function(id, reason) {
							conf.onTerm();
						}
					};
				}
			}
			if (repeat>=IAnimation.INFINITY)
				repeat = IAnimation.INFINITY;
			this._start(spec, repeat, startPos, name, onTerm);
			this.__running = true;
		},
		/**
		 *  Stops this animation.
		 *  @method stop
		 */
		stop: function() {
			if (error(this.__running===false, "not running"))
				return;
			this._stop();

			this.__running=false;
		},
		/**
		 *  @method end
		 *  @private
		 */
		end: function() {
			if (error(this.__running===false, "not running"))
				return;
			this._end();

			this.__running=false;
		},

		_start : function(aSpec, repeat, startPos, name, onTerm) {

			//W.log.info("Animation _start");
			var totalDuration = 0;

			if (repeat == "Infinity") {
				//this.__spec = {};
				//this.__spec.__group = [];
				var duration  = 0;
				for (var i=0; i<aSpec.__group.length; i++)  {
					duration += aSpec.__group[i].duration;
					//this.__spec.__group[i] = W.__web.clone(aSpec.__group[i]);
				}

				this.__spec = {};
				if (duration) {
					var _this = this;
					this.__spec.infinityTimer =
						setInterval( function() {
							_this._startAnimation(aSpec);
						}, duration);
					this.__spec.onTerm = onTerm;

					//W.log.info("program start inifinity ");
					//W.log.inspect(onTerm);
				}

				return;
			}

			if (this.paused) {
//    			for (var i =0; i<stack.length; i++) {
				//
//    			}
				this.paused = false;
				return;
			}

			totalDuration = this._startAnimation(aSpec);

			//console.log("Program start END ");
			//}, 1);
			//TODO In case of repeat inifinity, run onTerm
			//W.log.info("start onTerm " + repeat);
			//W.log.inspect(onTerm);
			if (onTerm && repeat != "Infinity") {
				setTimeout( function(term) {
					//console.log("id : " + this.__id);
					//console.log("totalDuration : " + totalDuration);
					//console.log("option : " + option);
					//console.log("name : " + name);
					term.onTermination();
				}, totalDuration, onTerm);
			}

		},

		_stop : function() {
			//W.log.info("Animation stop : ");
			//W.log.inspect(program);


			if (this.__spec.infinityTimer) {
				clearInterval(this.__spec.infinityTimer);
				if (this.__spec.onTerm && this.__spec.onTerm.onTermination) {
					this.__spec.onTerm.onTermination();
					W.log.info("Animation Stop onTerm ")
				}
			}
			//W.log.info("Animation stop end");
			//this.paused = true;
		},

		_end : function() {

			this.stop();

			console.log("Animation end");
		},

		_startAnimation : function(aSpec) {
			var _this = this;
			var domStack;
			var totalDuration = 0;

			//W.log.info("aSpec.__group ");
			//W.log.inspect(aSpec.__group);

			// stack.dom.style.webkitTransform reset
			var groupLen = aSpec.__group.length;
			for(var a=0; a<groupLen; a++) {
				var ps = aSpec.__group[a];
				var stackLen = ps.stack.length;
				for (var i =0; i<stackLen; i++) {
					var idsLen = ps.stack[i].ids.length;
					for (var j=0; j<idsLen; j++) {
						domStack = ps.stack[i].stacks[j];
						var domLen = domStack.length;
						for (var k=0; k<domLen; k++) {
							domStack[k].dom.style.webkitTransform = "";
							domStack[k].dom.style.webkitTranstion = "";
						}
					}
				}
			}


			for(var a=0; a<groupLen; a++) {
				var ps = aSpec.__group[a];

				var animationEffect = [];

				var stackLen = ps.stack.length;
				for (var i =0; i<stackLen; i++) {
					animationEffect[i] = [];
					var idsLen = ps.stack[i].ids.length;
					for (var j=0; j<idsLen; j++) {
						domStack = ps.stack[i].stacks[j];

						////////////////////////////////////////////////////////////////////////////////////////////////////
						var aniCallback = function(stack, idx, delay) {
							var hasFrom = false;
							var transformFrom = "";
							//stack[0].dom.style.webkitTransitionDelay = "0ms";
							animationEffect[idx].push({
								link : stack[0].dom,
								property : "style",
								style: "webkitTransitionDelay",
								value : delay+"ms"
							});

							var fromLen = stack.length;
							for (var k=0; k<fromLen; k++) {
								if (stack[k].from != null) {
									hasFrom = true;
									//W.log.info("has From");
									if (stack[k].id == IComponent.PROPERTY_ROTATION_DEGREE) {
										transformFrom += "rotate("+(-parseInt(stack[k].from[0])) +"deg)";
									}else if (stack[k].id == IComponent.PROPERTY_SCALE) {
										transformFrom += "scale("+stack[k].from[0] +")";
									}else if (stack[k].id == IComponent.PROPERTY_SCALE_X) {
										transformFrom += "scaleX("+stack[k].from[0] +")";
									}else if (stack[k].id == IComponent.PROPERTY_SCALE_Y) {
										transformFrom += "scaleY("+stack[k].from[0] +")";
									}else if (stack[k].id == IComponent.PROPERTY_PERSPECTIVE) {
										transformFrom += "perspective("+stack[k].from[0]+"px) ";
									}else if (stack[k].id == IComponent.PROPERTY_TRANSLATE_Z) {
										transformFrom += "translateZ("+ stack[k].from[0]+"px)";
									}else {
										_this._setAnimationStyle(stack[k], stack[k].id, stack[k].from, true, undefined, animationEffect[idx]);
									}
								}
							}
							if (transformFrom)
								_this._setAnimationStyle(stack[0],
									IComponent.PROPERTY_ROTATION_DEGREE,  "", true, transformFrom, animationEffect[idx]);

							if (hasFrom) {
								stack[0].dom.style.webkitTransitionDuration = "0ms";
								var temp = stack[0].dom.clientHeight; //forced repaint
							}

							if (!stack[0].duration || stack[0].duration == 0) {
								//stack[0].dom.style.webkitTransitionDuration = "0ms";
								animationEffect[idx].push({
									link : stack[0].dom,
									property : "style",
									style: "webkitTransitionDuration",
									value: "0ms"
								});
							} else {
								//stack[0].dom.style.webkitTransitionDuration = stack[0].duration+"ms";
								animationEffect[idx].push({
									link : stack[0].dom,
									property : "style",
									style: "webkitTransitionDuration",
									value: stack[0].duration+"ms"
								});
							}

							var has3DTransform = false;
							var transformTo = "";
							var toLen = stack.length;
							for (var k=0; k<toLen; k++) {
								if (stack[k].id == IComponent.PROPERTY_ROTATION_DEGREE) {
									transformTo += "rotate("+(-parseInt(stack[k].to[0])) +"deg)";
								}else if (stack[k].id == IComponent.PROPERTY_SCALE) {
									transformTo += "scale("+stack[k].to[0] +")";
								}else if (stack[k].id == IComponent.PROPERTY_SCALE_X) {
									transformTo += "scaleX("+stack[k].to[0] +")";
								}else if (stack[k].id == IComponent.PROPERTY_SCALE_Y) {
									transformTo += "scaleY("+stack[k].to[0] +")";
								}else if (stack[k].id == IComponent.PROPERTY_PERSPECTIVE) {
									transformTo += "perspective("+stack[k].to[0]+"px) ";
									has3DTransform = true;
								}else if (stack[k].id == IComponent.PROPERTY_TRANSLATE_Z) {
									transformTo += "translateZ("+ stack[k].to[0]+"px)";
									has3DTransform = true;
								}else {
									_this._setAnimationStyle(stack[k], stack[k].id, stack[k].to, false, undefined, animationEffect[idx]);
								}
							}
							if (transformTo) {
								_this._setAnimationStyle(stack[0],
									IComponent.PROPERTY_ROTATION_DEGREE,  "", false, transformTo, animationEffect[idx]);

								if (has3DTransform) {
									//stack[0].dom.style.webkitTransformStyle = "preserve-3d";
									//stack[0].dom.parentElement.style.webkitTransformStyle = "preserve-3d";
									animationEffect[idx].push({
										link : stack[0].dom,
										property : "style",
										style: "webkitTransformStyle",
										value: "preserve-3d"
									});
									animationEffect[idx].push({
										link : stack[0].dom.parentElement,
										property : "style",
										style: "webkitTransformStyle",
										value: "preserve-3d"
									});
								}
							}

							//console.log("end")
						};

						aniCallback(domStack, i, domStack[0].delay);
						////////////////////////////////////////////////////////////////////////////////////////////////////
						totalDuration = domStack[0].delay + domStack[0].duration;
					}

					//console.log(animationEffect[i]);
					var effectLen = animationEffect[i].length;
					for (var idx=0; idx<effectLen; idx++) {
						animationEffect[i][idx].link[animationEffect[i][idx].
							property][animationEffect[i][idx].style] = animationEffect[i][idx].value;
					}
				}
			}
			return totalDuration;
		},

		_setAnimationStyle : function(stack, id, value, isFrom, transform, animationEffect) {
			switch(id) {
				case IComponent.PROPERTY_X :
					var left;
					if (isFrom && stack.dom.style.left == value[0]+"px")
						left = (value[0]+1) + "px";
					else
						left = value[0] + "px";

					//stack.dom.style.left = left;
					animationEffect.push({
						link : stack.dom,
						property : "style",
						style: "left",
						value : left
					});

					break;
				case IComponent.PROPERTY_Y :
					var top;
					if (isFrom && stack.dom.style.top == value[0]+"px")
						top = (value[0]+1) + "px";
					else
						top = value[0] + "px";

					//stack.dom.style.top = top;
					animationEffect.push({
						link : stack.dom,
						property : "style",
						style: "top",
						value : top
					});
					break;
				case IComponent.PROPERTY_SCALE_X :
				case IComponent.PROPERTY_SCALE_Y :
				case IComponent.PROPERTY_PERSPECTIVE :
				case IComponent.PROPERTY_SKEW_X :
				case IComponent.PROPERTY_TRANSLATE_X :
				case IComponent.PROPERTY_TRANSLATE_Y :
				case IComponent.PROPERTY_TRANSLATE_Z :
				case IComponent.PROPERTY_ROTATION_DEGREE :
				case IComponent.PROPERTY_TRANSITION:
					//stack.dom.style.webkitTransform = transform;
					animationEffect.push({
						link : stack.dom,
						property : "style",
						style: "webkitTransform",
						value : transform
					});
					break;
				case IComponent.PROPERTY_OPACITY:
					var opacity;
					if (isFrom && stack.dom.style.opacity == "" && value[0] == 1) {
						opacity = 0.99;
					} else if (isFrom && stack.dom.style.opacity == ""+value[0] && value[0] == 0) {
						opacity = 0.01;
					} else if (isFrom && stack.dom.style.opacity == ""+value[0] && value[0] == 1) {
						opacity = 0.99;
					} else if (isFrom && stack.dom.style.opacity == ""+value[0]){
						opacity = Number(value[0]+0.01);
					} else {
						opacity = value[0];
						//stack.dom.style.opacity = value[0];
					}

					//stack.dom.style.opacity = opacity;
					animationEffect.push({
						link : stack.dom,
						property : "style",
						style: "opacity",
						value : opacity
					});
					break;
				case IComponent.PROPERTY_WIDTH :
					var width;
					if (isFrom && stack.dom.style.width == value[0]+"px") {
						width = (value[0]+1)+"px";
					} else {
						width = value[0]+"px";
					}
					//stack.dom.style.width = width;
					animationEffect.push({
						link : stack.dom,
						property : "style",
						style: "width",
						value : width
					});
					if (!isFrom)
						stack.dom.desc["width"] = width;
					break;
				case IComponent.PROPERTY_HEIGHT :
					var height;
					if (isFrom && stack.dom.style.height == value[0]+"px") {
						height = (value[0]+1)+"px";
					} else {
						height = value[0]+"px";
					}
					//stack.dom.style.height = height;
					animationEffect.push({
						link : stack.dom,
						property : "style",
						style: "height",
						value : height
					});
					break;
				case IComponent.PROPERTY_COLOR :
					stack.dom.style.backgroundColor = value;
					animationEffect.push({
						link : stack.dom,
						property : "style",
						style: "backgroundColor",
						value : value
					});
					break;
			}
		},
		paused : false
	});
	return WAnimation;
});
W.define("AnimationSpec", function() {
	"use strict";

	var WClass = W.getClass("Class");
	var WComponent = W.getClass("Component");
	var WAnimation = W.getClass("Animation");
	var WUtil = W.getClass("Util");
	var WCurve = W.getClass("Curve");
	var error = WUtil.error;

	var nextID = 0;

	/**
	 *  Represents a AnimationSpec
	 *
	 *  @class W.AnimationSpec
	 */
	var WAnimationSpec = WClass.extend({

		init: function() {

			//W.log.info("AnimationSpec init");

			this.__id = nextID++;
			this.__state = "NO_GROUP";
			this.__curve = WCurve.__from("expo>");
			this.__rcurve = this.__curve;

			this.__group = [];
		},
		__isDisposed: function() {
			return this.__state==="DISPOSED";
		},
		__hasGroup: function() {
			return this.__state==="HAS_GROUP";
		},
		/**
		 *  Disposes resources and puts the object in the pool if the pool is not full.
		 *
		 *  @method dispose
		 */
		dispose: function() {
			if (this.__isDisposed())
				return;
			this.__group = [];
			this.__state = "DISPOSED";
		},
		/**
		 *  Removes all the groups and resets curve, time span and default actor
		 *  settings.
		 *
		 *  @method reset
		 */
		reset: function() {
			if (this.__isDisposed())
				return;
			this.__group = [];
			this.__state = "NO_GROUP";
			return this;
		},

		/**
		 *  Sets curve of `W.Animation` object.
		 *
		 *  @method setCurve
		 *  @param {String} curve Curve with variously combined properties.
		 *
		 *  **Curve string expression is 'curve name' + 'easing'.**
		 *  <pre>
		 *  curve = Curves && Easings
		 *  Curves = "linear" | "sine" | "quad" | "cubin" | "quint" | "expo" |
		 *  "circle" | "elastic" | "back" | "bounce"
		 *  Easings = "&lt;" | "-ease-in" | "&gt;" | "-ease-out" | "&gt;&lt;" |
		 *  "-ease-in-out" | "&lt;&gt;" | "-ease-out-in"
		 *  </pre>
		 *
		 *  **Easings meaning**
		 *
		 *  * Easing in : beginning of high acceleration. "&lt;" | "-ease-in"
		 *  * Easing out : ending of high acceleration. "&gt;" | "-ease-out"
		 *  * Easing in/out : "&gt;&lt;" | "-ease-in-out"
		 *  * Easing out/in : "&lt;&gt;" | "-ease-out-in"
		 *  @example
		 *       ps.setCurve("sine<");
		 *
		 *       ps.makeGroup(3000)
		 *         .setCurve("expo<>")
		 *         .animate(image, {
         *             x : [0, 100]
         *         })
		 *         .setCurve("bounce>")
		 *         .animate(image, {
         *             y : [0, 100]
         *         });
		 */
		setCurve: function(curve) {
			var c = WCurve.__from(curve);
			if (this.__isDisposed())
				return this;
			this.__curve = c.__prop;
			return this;
		},

		/**
		 *  Creates and adds a group in the spec. The following animate calls
		 *  until another makeGroup call or reset call add property animation
		 *  in the group.
		 *
		 *  @method makeGroup
		 *  @param  {Number} duration Duration of group in milliseconds.
		 *  @return {W.AnimationSpec}
		 */
		makeGroup: function(duration) {
			if (error(this.__isDisposed(), "disposed",
					!WUtil.isNumeric(duration)||duration<0,
					"bad duration "+duration))
				return this;

			var start = 0;
			var dur = 0;
			for (var i=0; i<this.__group.length; i++) {
				start += this.__group[i].duration;
			}
			dur  = start + duration;
			//W.log.info("AnimationSpec makeGroup dur " + dur);
			var obj = {};
			obj.timeSpan = {"start":start, "duration":dur};
			obj.stack = [];
			obj.duration = dur;
			obj.start = start;
			obj.prevStart = -1;
			obj.prevDuration = 0;

			this.__group.push(obj);

			this.__duration = duration;
			this.__state = "HAS_GROUP";
			this.__start = 0;
			this.__end = duration;
			return this;
		},

		/*
		 __setRemoteTimeSpan: function(start, end) {
		 if (this.__rstart===start && this.__rend===end)
		 return;
		 this.__rstart = start;
		 this.__rend = end;

		 this.__group[this.__group.length-1].timeSpan = {};
		 this.__group[this.__group.length-1].timeSpan.start = this.__group[this.__group.length-1].start + start;
		 this.__group[this.__group.length-1].timeSpan.duration = (end-start);
		 },
		 */
		/**
		 *  Sets time span for property animations.
		 *
		 *  @method setTimeSpan
		 *  @param {Number} start Offset from the start of group in milliseconds.
		 *  The value shall be 0 or positive.
		 *  @param {Number} end Offset from the start of group in milliseconds.
		 *  @return {AnimationSpec}
		 */
		setTimeSpan: function(start, end) {
			if (error(!this.__hasGroup(),"bad state "+this.__state,
					!WUtil.isNumeric(start), "bad start "+start,
					!start<0, "bad start "+start,
					!WUtil.isNumeric(end), "bad end "+end,
					!end<0, "bad end "+end))
				return this;
			this.__start = Math.max(start, 0);
			this.__end = Math.min(end, this.__duration);

			this.__group[this.__group.length-1].timeSpan = {};
			this.__group[this.__group.length-1].timeSpan.start = this.__group[this.__group.length-1].start + start;
			this.__group[this.__group.length-1].timeSpan.duration = (end-start);

			return this;
		},
		/**
		 *  Adds animation in the spec.
		 *
		 *      spec.animate(actor, {
         *          x : 10,
         *          y : [20, 40],
         *          curve : 'expo>'
         *      })
		 *  @method animate
		 *  @param {W.Component} [comp] Component for this animation. If
		 *          specified, target actor is 'actor' otherwise, the target
		 *          actor is the default actor of this program spec.
		 *  @param {Object} config Animation configuration.
		 *      @param {&lt;value type of property&gt; | Array} config.<actorProperty> Property of target actor.
		 *
		 *  @chainable
		 */
		animate: function(/* [va], conf */) {
			if (error(!this.__hasGroup(), "animate:bad state "+this.__state))
				return this;
			var comp,
				conf, c, s, e, name, prop, range;
			if (arguments[0] instanceof WComponent) {
				comp = arguments[0];
				conf = arguments[1];
			}
			var items = [];
			for (name in conf) {

				if (!conf.hasOwnProperty(name))
					continue;
				prop = comp.__getProperty(name);
				if (error(!prop,
						"Unknow property "+name+" of comp "+comp + " for animation"))
					continue;
				range = prop.__normalizeConf(conf[name]);

				if (error(!range, "Wrong value "+conf[name]+
						" for property "+ name+" of actor "+comp + " for animation"))
					continue;
				items.push({ prop:prop, range:range });
			}
			//W.log.("items");
			//W.log.inspect(items);
			var length = items.length;
			if (length===0)
				return this;
			for (var i=0; i<length; ++i) {
				prop = items[i].prop;
				range = items[i].range;
				this._addEffect(comp, prop.__id, range[0], range[1]);
			}
			return this;
		},
		//  TODO: make options flag.
		/**
		 *  Launches this program spec.
		 *
		 *  @method start
		 *  @param {Object} config Configuration for program start.
		 *      @param {number} config.repeat Number of repetition.
		 *      @param {number} config.startPos Starting animation time in
		 *      milli-sceonds.
		 *      @param {string} config.name Animation debug name.
		 *      @param {function(string reason)} config.onTerm Termination
		 *      callback.
		 *
		 *  - **Reason Codes:**
		 *      * **end** All animation ended.
		 *      * **stop** The animation is stopped in the middle of execution.
		 *
		 *  @return {W.Program} A newly started program.
		 */
		start: function(conf) {
			//W.log.info("AnimationSpec start");
			if (error(this.__isDisposed(), "disposed"))
				return undefined;
			var ani = new WAnimation();
			ani.ps = this.__ps;
			ani.__start( this, conf);
			return ani;
		},

		_addEffect : function(comp, __id, from, to) {

			var ps = this.__group[this.__group.length-1];

			if (comp.comp) {
				var el = comp.comp;
				if(this.__curve) el.style.webkitTransitionTimingFunction = this.__curve;
				else el.style.webkitTransitionTimingFunction = "ease-out";

				if (ps.prevStart == ps.timeSpan.start && ps.prevDuration == ps.timeSpan.duration) {
					var index = ps.stack[ps.prevIndex].ids.indexOf(comp.pid);
					if ( index != -1) {
						ps.stack[ps.prevIndex].stacks[index].push({dom:el, id:__id,
							from : from, to:to, delay:ps.timeSpan.start, duration:ps.timeSpan.duration});
					} else {
						ps.stack[ps.prevIndex].ids.push(comp.pid);

						ps.stack[ps.prevIndex].stacks[ps.stack[ps.prevIndex].ids.length-1] =
							[{dom:el, id:__id, from : from, to:to,
								delay:ps.timeSpan.start, duration:ps.timeSpan.duration}];
					}
				} else {
					ps.stack[ps.stack.length] = { ids: [comp.pid],
						stacks : [[{dom:el, id:__id,
							from : from, to:to, delay:ps.timeSpan.start,
							duration:ps.timeSpan.duration}]] };
					ps.prevIndex = ps.stack.length -1;
				}

				ps.prevStart = ps.timeSpan.start;
				ps.prevDuration = ps.timeSpan.duration;
			}
		}
	});
	return WAnimationSpec;
});

W.define("SimpleAnimationEffect", function() {
	"use strict";

	var WClass = W.getClass("Class");
	var WUtil = W.getClass("Util");
	var error = WUtil.error;

	var nextID = 0;

	/**
	 *  Represents a SimpleAnimationEffect
	 *
	 *  @class W.SimpleAnimationEffect
	 */
	var AnimationEffect = WClass.extend({

		init: function() {
			//W.log.info("AnimationEffect init");
			this.__state = "NO_GROUP";

			this.__group = [];
			this.__id = nextID++;
		},
		__isDisposed: function() {
			return this.__state==="DISPOSED";
		},
		__hasGroup: function() {
			return this.__state==="HAS_GROUP";
		},
		/**
		 *  Disposes resources and puts the object in the pool if the pool is not full.
		 *
		 *  @method dispose
		 */
		dispose: function() {
			if (this.__isDisposed())
				return;
		},
		/**
		 *  Removes all the groups and resets curve, time span and default actor
		 *  settings.
		 *
		 *  @method reset
		 */
		reset: function() {
			if (this.__isDisposed())
				return;
			this.__group = [];
			this.__state = "NO_GROUP";
			return this;
		},

		makeGroup: function(duration) {
			if (error(this.__isDisposed(), "disposed",
					!WUtil.isNumeric(duration)||duration<0,
					"bad duration "+duration))
				return this;

			var start = 0;
			var dur = 0;
			for (var i=0; i<this.__group.length; i++) {
				start += this.__group[i].duration;
			}
			dur  = start + duration;
			//W.log.info("AnimationSpec makeGroup dur " + dur);
			var obj = { timeSpan:[]};
			obj.timeSpan.push({"start":start, "duration":dur, stacks:[]});
			obj.duration = dur;
			obj.start = start;
			obj.prevStart = -1;
			obj.prevDuration = 0;

			this.__group.push(obj);

			this.__duration = duration;
			this.__state = "HAS_GROUP";
			this.__start = 0;
			this.__end = duration;
			return this;
		},

		animate: function(effects) {
			var timeSpan = this.__group[this.__group.length-1].
				timeSpan[this.__group[this.__group.length-1].timeSpan.length -1];
			timeSpan.stacks = effects;
		},

		/**
		 *  Sets time span for property animations.
		 *
		 *  @method setTimeSpan
		 *  @param {Number} start Offset from the start of group in milliseconds.
		 *  The value shall be 0 or positive.
		 *  @param {Number} end Offset from the start of group in milliseconds.
		 *  @return {AnimationEffect}
		 */
		setTimeSpan: function(start, end) {

			var timeSpan = { start: this.__group[this.__group.length-1].start + start,
							duration: (end-start)};

			this.__group[this.__group.length-1].timeSpan.push(timeSpan);

			return this;
		},

		start: function(desc) {

			var _group = this.__group.slice(0, this.__group.length);
			(function(group) {
				var startAnimation = function (group, desc) {

					var groupLen = group.length;
					for (var i = 0; i < groupLen; i++) {

						var timeSpan = group[i].timeSpan;

						var spanLen = timeSpan.length;
						for (var j = 0; j < spanLen; j++) {

							var _callback = function () {

								var animationEffect = arguments[0];
								var duration = arguments[1];
								var isFinal = arguments[2];

								var effectLen = animationEffect.length;
								for (var k = 0; k < effectLen; k++) {

									var _comp = animationEffect[k].comp;

									if (_comp instanceof Array) {
										var compLen = _comp.length;
										for (var l = 0; l < compLen; l++) {
											if (_comp[l].comp.style[animationEffect[k].style] != animationEffect[k].value) {
												_comp[l].comp.style["webkitTransitionDuration"] = duration + "ms";
												_comp[l].comp.style[animationEffect[k].style] = animationEffect[k].value;
											}
										}
									} else {
										if (_comp.comp.style[animationEffect[k].style] != animationEffect[k].value) {
											_comp.comp.style["webkitTransitionDuration"] = duration + "ms";
											_comp.comp.style[animationEffect[k].style] = animationEffect[k].value;
										}
									}
								}

								if (isFinal && desc && desc.onTerm) {
									setTimeout(function () {
										desc.onTerm();
									}, duration);
								}
							};

							var isFinal = (i == groupLen - 1) && (j == spanLen - 1);
							if (timeSpan[j].start > 0) {
								setTimeout(_callback, timeSpan[j].start,
									timeSpan[j].stacks, timeSpan[j].duration, isFinal);
							} else
								_callback(timeSpan[j].stacks, timeSpan[j].duration, isFinal);

						}
					}
				};
				window.requestAnimationFrame(function () {
					startAnimation(group, desc);
				});
			})(_group);
		},

	});
	return AnimationEffect;
});

W.define("TouchHandler", function(){
	"use strict";
	var WClass = W.getClass('Class');
	var IComponent = W.getClass("IComponent");

	var touchStarted = false;
	var touchMoved = false;
	var touchGestureFired = false;
	var touchEndFired = false;

	var touchStartedInfo = {
		target: undefined,
		startX: 0,
		startY: 0
	};

	var gestureInfo = {
		direction:"NONE",
		movedX:0, movedY:0
	};

	var timerPointerPressed;

	var _touchHandler = WClass.extend({

		touchCancel: function(event) {
			//W.log.info("touchCancel");
			//W.log.inspect(event);

			var _comp = event.target._wobj;

			if (_comp.onTouchCancel) {
				_comp.onTouchCancel(event);
			} else if (_comp && _comp.onPointer)
				_comp.onPointer(event)

			if (!event.cancelBubble){
				W.bubblePointEvent(IComponent.EVENT_TOUCH_CANCEL, event);
			}
		},

		touchEnd: function(event) {
			//W.log.info("touchEnd");
			//W.log.inspect(event);

			var _comp = event.target._wobj;

			if (timerPointerPressed)
				clearTimeout(timerPointerPressed);

			if (touchEndFired == false && touchGestureFired == false) {

				event.touchStartedInfo = touchStartedInfo;

				var sX = event.touchStartedInfo.startX;
				var sY = event.touchStartedInfo.startY;
				var fX = event.changedTouches[0].clientX;
				var fY = event.changedTouches[0].clientY;

				if (Math.abs(fY - sY) < 10 && Math.abs(fX - sX) < 10) {

					event.touchEndedInfo = {type:"end touch",
						startX:sX,startY:sY,endX:fX,endY:fY};

					touchEndFired = true;

					if (_comp && _comp.onTouchEnd) {
						_comp.onTouchEnd(event);
					} else if (_comp && _comp.onPointer)
						_comp.onPointer(event)

					if (!event.cancelBubble) {
						W.bubblePointEvent(IComponent.EVENT_TOUCH_END, event);
					}
					return;
				}


				event.touchEndedInfo = {type:"end gesture",
					startX:sX,startY:sY,endX:fX,endY:fY};

				if (Math.abs(fY - sY) >= Math.abs(fX - sX)) {
					//UP or DOWN
					if (fY > sY) {
						//UP --> DOWN
						gestureInfo.direction = "DOWN";
					} else
						gestureInfo.direction = "UP";
				} else {
					//RIGHT or LEFT
					if (fX > sX) {
						//LEFT --> RIGHT
						gestureInfo.direction = "RIGHT";
					} else
						gestureInfo.direction = "LEFT"
				}
				gestureInfo.movedX = Math.abs(fX - sX);
				gestureInfo.movedY = Math.abs(fY - sY);

				event.gestureInfo = gestureInfo;
				touchGestureFired = true;

				if (_comp && _comp.onGesture)
					_comp.onGesture(event);

				if (!event.cancelBubble){
					W.bubblePointEvent(IComponent.EVENT_GESTURE, event);
				}
				return;

			}

			//if (touchEndFired || touchGestureFired)
			//	return;

			// event.touchEndedInfo = ["end"];
			//
			// if (_comp.onTouchEnd) {
			// 	_comp.onTouchEnd(event);
			// }
			// if (!event.cancelBubble){
			// 	W.bubblePointEvent(IComponent.EVENT_TOUCH_END, event);
			// }


		},

		touchMove: function(event) {
			// W.log.info("touchMove");
			// W.log.inspect(event);
			var _comp = event.target._wobj;

			if (timerPointerPressed)
				clearTimeout(timerPointerPressed);

			if (_comp && _comp.onTouchMove) {
				_comp.onTouchMove(event);

				if (!event.cancelBubble) {
					W.bubblePointEvent(IComponent.EVENT_TOUCH_MOVE, event);
				}

				return;
			}

			if (touchStarted == false)
				return;

			touchMoved = true;
			touchStarted = false;

			//touchend event may not be fired on some devices.
			// For these cases, this logic is needed
			event.touchStartedInfo = touchStartedInfo;

			var sX = event.touchStartedInfo.startX;
			var sY = event.touchStartedInfo.startY;
			var fX = event.changedTouches[0].clientX;
			var fY = event.changedTouches[0].clientY;

			if (Math.abs(fY - sY) < 10 && Math.abs(fX - sX) < 10) {

				event.touchEndedInfo = {type:"end touch",
					startX:sX,startY:sY,endX:fX,endY:fY};
				touchEndFired = true;

				if (_comp && _comp.onTouchEnd) {
					_comp.onTouchEnd(event);
				} else if (_comp && _comp.onPointer)
					_comp.onPointer(event)

				if (!event.cancelBubble) {
					W.bubblePointEvent(IComponent.EVENT_TOUCH_END, event);
				}
				return;
			}


			if (Math.abs(fY - sY) >= Math.abs(fX - sX)) {
				//UP or DOWN
				if (fY > sY) {
					//UP --> DOWN
					gestureInfo.direction = "DOWN";
				} else
					gestureInfo.direction = "UP";
			} else {
				//RIGHT or LEFT
				if (fX > sX) {
					//LEFT --> RIGHT
					gestureInfo.direction = "RIGHT";
				} else
					gestureInfo.direction = "LEFT"
			}

			gestureInfo.movedX = Math.abs(fX - sX);
			gestureInfo.movedY = Math.abs(fY - sY);

			event.touchEndedInfo = {type:"move gesture",
				startX:sX,startY:sY,endX:fX,endY:fY};
			event.gestureInfo = gestureInfo;
			touchGestureFired = true;

			if (_comp &&  _comp.onGesture) {
				_comp.onGesture(event);
			} else if (_comp && _comp.onPointer)
				_comp.onPointer(event)

			if (!event.cancelBubble) {
				W.bubblePointEvent(IComponent.EVENT_GESTURE, event);
			}
			return;

			//event.touchEndedInfo = ["move", W.isWebView];

			// if (_comp && _comp.onTouchMove) {
			// 	_comp.onTouchMove(event);
			// }
			//
			// if (!event.cancelBubble){
			// 	W.bubblePointEvent(IComponent.EVENT_TOUCH_MOVE, event);
			// }
		},

		touchStart: function(event) {
			//W.log.info("touchStart");
			//W.log.inspect(event);

			touchGestureFired = false;
			touchEndFired = false;
			touchMoved = false;
			touchStarted = true;

			touchStartedInfo.target = event.target;
			touchStartedInfo.startX = event.touches[0].clientX;
			touchStartedInfo.startY = event.touches[0].clientY;

			var _comp = event.target._wobj;

			timerPointerPressed = setTimeout(function() {
				//1초 동안 clicked 가 발생하지 않으면 long press를 발생시킨다
				document.dispatchEvent(W.createKeyEvent(W.KEY.ENTER_LONG_PRESS));
			}, 1000);

			if (_comp && _comp.onTouchStart) {
				_comp.onTouchStart(event);
			} else if (_comp && _comp.onPointer)
				_comp.onPointer(event)

			if (!event.cancelBubble){
				W.bubblePointEvent(IComponent.EVENT_TOUCH_START, event);
			}
		}
	});

	var WTouchHandler = new _touchHandler();
	return WTouchHandler;
});

W.define("KeyHandler", function() {
	"use strict";

	var WClass = W.getClass('Class');
	var _sceneManager = W.getClass("SceneManager");
	var _popupManager = W.getClass("PopupManager");
	var IComponent = W.getClass("IComponent");

	//var _sceneStack;
	var lastInputTime = Date.now();
	var _exclusiveKeys = []; //{comp:comp, keys:[]}
	var okKeydownTime = 0;
	var firstOkKeydownTime = 0;
	var occuredOKLongPressed = false;
	var timerPointerPressed;

	var keyPressed = function(evt) {

		lastInputTime = Date.now();

		var preventDefault = false;
		var keyConsumed = false;

		if (_exclusiveKeys.length > 0 && evt.keyCode < W.KEY.CUSTOM_KEY_RANGE) {
			for (var i=_exclusiveKeys.length-1; i > -1; i--) {
				if (_exclusiveKeys[i].keys.indexOf(W.KEY.ALL) > -1 ||
					_exclusiveKeys[i].keys.indexOf(evt.keyCode) > -1) {
					keyConsumed = _exclusiveKeys[i].comp.onKeyPressed(evt);
					break;
				}
			}
		}

		if (W.isSTB == false &&
			(evt.keyCode < W.KEY.CUSTOM_KEY_RANGE &&
			(evt.keyCode != W.KEY.HOME && evt.keyCode != W.KEY.BACK)) )
			return;

		var _popupStack = _popupManager.getPopupStack();

		for (var i=(_popupStack.length -1); i>-1; i--) {
			var curPopup = _popupStack[i];

			if (!keyConsumed && curPopup && curPopup._state === "start" && curPopup.hasKey(evt)) {
				if (curPopup.onKeyPressed) {
					keyConsumed = curPopup.onKeyPressed(evt);
				} else {
					keyConsumed = curPopup.onKeyPressed(evt);
				}

				W.log.info("popup key consumed " + keyConsumed);
			}
		}

		var _sceneStack = _sceneManager.getSceneStack();
		var lastIndex = _sceneStack.length - 1;
		if (!keyConsumed && lastIndex > -1 && _sceneStack) {
			var curScene = _sceneStack[lastIndex];

			if (curScene._state === "start" && curScene.hasKey(evt)) {
				if (curScene._focusedObj && curScene._focusedObj.onKeyPressed) {
					keyConsumed = curScene._focusedObj.onKeyPressed(evt);
				} else {
					keyConsumed = curScene.onKeyPressed(evt);
				}
			}

			if (keyConsumed != true) {
				var stackLen = _sceneStack.length;
				for (var i = stackLen - 2; i >= 0; i--) {
					curScene = _sceneStack[i];

					if (!keyConsumed &&
						curScene._state === "start" && curScene.hasKey(evt)) {
						if (curScene._focusedObj && curScene._focusedObj.onKeyPressed) {
							keyConsumed = curScene._focusedObj.onKeyPressed(evt);
						} else {
							keyConsumed = curScene.onKeyPressed(evt);
						}
						// if (keyConsumed == undefined || keyConsumed == true)
						// 	keyConsumed = true;
						// else
						// 	keyConsumed = false;
					}
				}
			}
		}

		if (keyConsumed)
			preventDefault = true;

		if (preventDefault) {
			evt.preventDefault();
			evt.stopPropagation();
		} else {
			W.log.info("keyDown preventDefault false [keyCode:" + evt.keyCode + "]");
		}
	};

	/**
	 * KeyEvent and Point Event handling
	 * Singleton class
	 * @class W.KeyHandler
	 */
	var _keyHandler = WClass.extend({

		getExclusiveKey : function() {
			return	_exclusiveKeys;
		},

		addExclusiveKey : function(comp, keys) {
			_exclusiveKeys.push({comp:comp, keys:keys});
		},
		removeExclusiveKey : function(comp, keys) {
			for (var i=0; i<_exclusiveKeys.length; i++) {
				if (_exclusiveKeys[i].comp == comp) {
					_exclusiveKeys.splice(i, 1);
				}
			}
		},
		/**
		 * @method keyDown
		 * @param {Event} evt
		 */
		keyDown : function(evt) {
			//W.log.inspect(evt);
			//W.log.info("KeyHandler keyDown "+evt.keyCode);

			if (evt.keyCode != W.KEY.ENTER) {
				occuredOKLongPressed = false;
				if (W.KEY_DELAY_MS == 0) {
					keyPressed(evt);
				} else {
					var now = Date.now();
					if ((now - lastInputTime) > W.KEY_DELAY_MS) {
						keyPressed(evt);
					}
				}
			} else if (occuredOKLongPressed == false){
				/**
				 * ENTER 키에 대해서만 Long Press 를 처리할 수 있도록 함
				 *
				 * 1. 이를 위해서 ENTER 키는 일반처리에 대해서도 keyup 이벤트에 반응 하도록 변경
				 * 2. Long Press의 경우 keyup 이벤트 없이 keydown만 연속발생하므로 이 연속키 발생하는 시간을 측정한다
				 * 3. 이 시간이 1000ms이상인경우 Long Press로 간주한다
				 * 4. Long Press를 발생 시킨 후 다시 발생하는 동일키의 keydown은 무시된다
                 */

				/**
				 * firstOkKeydownTime 이 0이면 최초 Enter키가 눌린것이다
				 * firstOkKeydownTime 는 keyup 이벤트 발생 시 다시 0으로 셋팅된다
				 */
				if (firstOkKeydownTime == 0)
					firstOkKeydownTime = Date.now();

				okKeydownTime = Date.now();

				/**
				 * okKeydownTime 이 firstOkKeydownTime 크다면 keyup없이 keydown이 발생하는 경우이다
				 */
				if (okKeydownTime - firstOkKeydownTime > 1000) {
					occuredOKLongPressed = true;
					W.log.info("KeyDown: Occurring Enter Key LongPress");
					keyPressed(W.createKeyEvent(W.KEY.ENTER_LONG_PRESS));
				}
			}
		},

		keyUp : function(evt) {
			//W.log.info("KeyHandler keyUp "+evt.keyCode);
			firstOkKeydownTime = 0;
			if (evt.keyCode == W.KEY.ENTER && occuredOKLongPressed == false) {
				keyPressed(evt);
			}
			occuredOKLongPressed = false;
		},

		pointerPressed : function(evt) {
			//W.log.info("pointerPressed");
			//W.log.inspect(evt);
			var _comp = evt.target._wobj;

			timerPointerPressed = setTimeout(function() {
				//1초 동안 touchend 혹은 clicked 가 발생하지 않으면 long press를 발생시킨다
				document.dispatchEvent(W.createKeyEvent(W.KEY.ENTER_LONG_PRESS));
			}, 1000);

			if (_comp && _comp.onPointerPressed) {
				_comp.onPointerPressed(evt);
			}
			if (!evt.cancelBubble){
				W.bubblePointEvent(IComponent.EVENT_POINT_BUTTON_PRESSED, evt);
			}
		},

		pointerClicked : function(evt) {
			//W.log.info("pointerClicked");
			//W.log.inspect(evt.target);
			var _comp = evt.target._wobj;

			if (timerPointerPressed)
				clearTimeout(timerPointerPressed);

			if (_comp && _comp.onPointerClicked) {
				_comp.onPointerClicked(evt);
			} else if (_comp && _comp.onPointer)
				_comp.onPointer(evt)

			if (!evt.cancelBubble){
				W.bubblePointEvent(IComponent.EVENT_POINT_BUTTON_CLICKED, evt);
			}
		},

		pointerDblClicked : function(evt) {
			var _comp = evt.target._wobj;

			if (_comp && _comp.onPointerDblClicked) {
				_comp.onPointerDblClicked(evt);
			} else if (_comp && _comp.onPointer)
				_comp.onPointer(evt)

			if (!evt.cancelBubble){
				W.bubblePointEvent(IComponent.EVENT_POINT_BUTTON_DBLCLICK, evt);
			}
		},

		pointerMove : function(evt) {
			//W.log.inspect(evt);

			var _comp = evt.target._wobj;

			if (_comp && _comp.onPointerMove) {
				_comp.onPointerMove(evt);
			} else if (_comp && _comp.onPointer)
				_comp.onPointer(evt)

			if (!evt.cancelBubble){
				W.bubblePointEvent(IComponent.EVENT_POINT_MOVE, evt);
			}
		},

		pointerIn : function(evt) {
			//W.log.info("pointerIn ");
			//W.log.inspect(evt.target);
			var _comp = evt.target._wobj;
			//W.log.inspect(evt);

			if (_comp && _comp.onPointerIn) {
				_comp.onPointerIn(evt);
			} else if (_comp && _comp.onPointer)
				_comp.onPointer(evt)

			if (!evt.cancelBubble){
				W.bubblePointEvent(IComponent.EVENT_POINT_IN, evt);
			}
		},

		pointerOut : function(evt) {
			//W.log.info("pointerIn ");
			//W.log.inspect(evt.target);

			var _comp = evt.target._wobj;

			if (_comp && _comp.onPointerOut) {
				_comp.onPointerOut(evt);
			} else if (_comp && _comp.onPointer)
				_comp.onPointer(evt)

			if (!evt.cancelBubble){
				W.bubblePointEvent(IComponent.EVENT_POINT_OUT, evt);
			}
		},

		onDragover : function(evt) {
			//W.log.info("onDragOver");

			var _comp = evt.target._wobj;

			if (_comp && _comp.onDragover) {
				_comp.onDragover(evt);
			}

			if (!evt.cancelBubble){
				W.bubblePointEvent(IComponent.EVENT_DRAG_OVER, evt);
			}
		},
		onDragstart : function(evt) {
			//W.log.info("onDragStart");
			var _comp = evt.target._wobj;

			if (_comp && _comp.onDragstart) {
				_comp.onDragstart(evt);
			}

			if (!evt.cancelBubble){
				W.bubblePointEvent(IComponent.EVENT_DRAG_START, evt);
			}
		},
		onDrop: function(evt) {
			//W.log.info("onDrop");
			var _comp = evt.target._wobj;

			if (_comp && _comp.onDrop) {
				_comp.onDrop(evt);
			}

			if (!evt.cancelBubble){
				W.bubblePointEvent(IComponent.EVENT_DROP, evt);
			}
		}


	});

	var WKeyHandler = new _keyHandler();
	return WKeyHandler;

});

W.bubblePointEvent = function(type, evt, src) {
	//W.log.info("bubblePointEvent " + type);
	var target;
	if (src) {
		target = src.parentElement;
	} else
		target = evt.target.parentElement;

	//W.log.inspect(target);

	if (target && target._wobj) {

		var _comp = target._wobj;

		switch(type) {
			case W.IComponent.EVENT_POINT_BUTTON_PRESSED:
				if (_comp.onPointerPressed)
					_comp.onPointerPressed(evt, target);
				break;
			case W.IComponent.EVENT_POINT_BUTTON_CLICKED:
				if ( _comp.onPointerClicked)
					_comp.onPointerClicked(evt, target);
				break;
			case W.IComponent.EVENT_POINT_BUTTON_DBLCLICK:
				if (_comp.onPointerDblClicked)
					_comp.onPointerDblClicked(evt, target);
				break;
			case W.IComponent.EVENT_POINT_MOVE:
				if (_comp.onPointMove)
					_comp.onPointMove(evt, target);
				break;
			case W.IComponent.EVENT_POINT_IN:
				if (_comp.onPointIn)
					_comp.onPointIn(evt, target);
				break;
			case W.IComponent.EVENT_POINT_OUT:
				if (_comp.onPointOut)
					_comp.onPointOut(evt, target);
				break;
			case W.IComponent.EVENT_TOUCH_START:
				if (_comp.onTouchStart)
					_comp.onTouchStart(evt, target);
				break;
			case W.IComponent.EVENT_TOUCH_END:
				if (_comp.onTouchEnd)
					_comp.onTouchEnd(evt, target);
				break;
			case W.IComponent.EVENT_TOUCH_MOVE:
				if (_comp.onTouchMove)
					_comp.onTouchMove(evt, target);
				break;
			case W.IComponent.EVENT_GESTURE:
				if (_comp.onGesture)
					_comp.onGesture(evt, target);
				break;
			case W.IComponent.EVENT_TOUCH_CANCEL:
				if (_comp.onTouchCancel)
					_comp.onTouchCancel(evt, target);
				break;
			case W.IComponent.EVENT_DRAG_START:
				if (_comp.onDragstart)
					_comp.onDragstart(evt, target);
				break;
			case W.IComponent.EVENT_DRAG_OVER:
				if (_comp.onDragover)
					_comp.onDragover(evt, target);
				break;
			case W.IComponent.EVENT_DROP:
				if (_comp.onDrop)
					_comp.onDrop(evt, target);
				break;
		}

		if (evt.cancelBubble != true)
			W.bubblePointEvent(type, evt, target);
	}
};


W.define('SceneManager', function() {
	'use strict';

	var WClass = W.getClass('Class');

	/**
	 * object of Scene Modules
	 */
	var sceneModules = {};
	var sceneStack = [];

	var _loadScene = function(name, sStack, desc) {
		var _name = name.replace("_","/");
		require([_name], function(Module) {
			W.log.info("_loadScene " + _name);
			W.log.info(desc);

			var _module = new Module(desc);
			_module.name = _name;
			sStack.push(_module);
			sceneModules[_name] = _module;

			if (desc && desc.onload)
				WClass.tryCall(sStack[sStack.length-1], desc.onload, desc.param);

		});
	};

	var _stopScene = function(scene) {
		W.log.info("_stopScene ")
		if (scene) {
			scene._onStop();
		}
	};

	var _destroyScene = function(scene) {
		//W.log.info("_destroyScene ")
		if (scene) {
			scene._onDestroy();
		}
	};

	/**
	 * manage scenes
	 * @class W.SceneManager
	 * @constructor
	 */
	var _sceneManager = WClass.extend({

		OPTION_KEEP : "0",
		OPTION_NEW : "1",

		BACK_STATE_KEEPSHOW : "0",
		BACK_STATE_KEEPHIDE : "1",
		BACK_STATE_DESTROY : "2",
		BACK_STATE_DESTROYALL : "3",

		init: function() {
		},
		_getSceneModule : function() {
			return sceneModules;
		},
		getSceneStack : function() {
			return sceneStack;
		},
		getCurrentScene : function() {
			return sceneStack[sceneStack.length-1];
		},
		/**
		 * start scene
		 * @method startScene
		 * @param {object} desc scene description
		 * 	@param {String} desc.sceneName scene name
		 * 	@param {Number} desc.option  if OPTION_KEEP, loaded module will be used.
		 * 			if OPTION_NEW, New one will be created.
		 * 	@param {Number} desc.backState
		 * 			default backState is BACK_STATE_KEEPHIDE
		 *
		 */
		startScene: function(desc) {
			//W.log.info("startScene " + desc.sceneName);
			//if(desc.sceneName.indexOf("/")!=-1)
			//	desc.sceneName = desc.sceneName.replace("/","_");

			if (desc.backState && desc.backState == this.BACK_STATE_KEEPSHOW) {
				//do not anything
			} else if (desc.backState && desc.backState == this.BACK_STATE_DESTROY) {
				//prev scene will be destroyed
				if (sceneStack.length > 1) {
					_stopScene(sceneStack[sceneStack.length-1]);
					_destroyScene(sceneStack[sceneStack.length-1]);
					sceneStack.pop();
				}
			} else if (desc.backState && desc.backState == this.BACK_STATE_DESTROYALL) {
				//all prev scenes will be destroyed
				for (var i=sceneStack.length-1; i >=1; i--) {
					_stopScene(sceneStack[i]);
					_destroyScene(sceneStack[i]);
					sceneStack.pop();
				}

			} else {
				//All prev scenes will be hidden
				for (var i=sceneStack.length-1; i >=1; i--) {
					_stopScene(sceneStack[i]);
				}
			}

			if (desc.option && desc.option == this.OPTION_NEW) {
				W.log.info("SCENE OPTION NEW")
				desc.onload = "_onStart";
				_loadScene(desc.sceneName, sceneStack, desc);

			} else {
				//W.log.inspect(sceneModules);
				//W.log.info(desc.sceneName);
				var scene = sceneModules[desc.sceneName];
				//W.log.inspect(scene);
				if (scene) {
					W.log.info("SCENE ONSTART")
					scene._onStart(desc.param);
					if (sceneStack.indexOf(scene) == -1)
						sceneStack.push(scene);
					else {
						//move to the surface
						var idx = sceneStack.indexOf(scene);
						var obj = sceneStack.splice(idx, 1);
						sceneStack.splice(sceneStack.length, 0 , obj[0]);
					}
				} else {
					W.log.info("SCENE FIRST LOADING.. ONSTART")
					desc.onload = "_onStart";
					_loadScene(desc.sceneName, sceneStack, desc);
				}
			}
		},
		/**
		 * stop scene
		 * @method stopScene
		 * @param {object} desc scene description
		 * 	@param {String} desc.sceneName scene name for stop
		 *
		 * named scene will be stopped. this scene will be kept in scene stack.
		 */
		stopScene: function(desc) {
			for (var i=sceneStack.length-1; i>=0; i--) {
				if (sceneStack[i].name === desc.sceneName) {
					_stopScene(sceneStack[i]);
					break;
				}
			}
		},
		/**
		 * destroy scene
		 * @method destroyScene
		 * @param {object} desc scene description
		 * 	@param {String} desc.sceneName scene name for destroy
		 *
		 * named scene will be destroyed. this scene will be deleted in scene stack.
		 */
		destroyScene: function(desc) {
			for (var i=sceneStack.length-1; i>=0; i--) {
				W.log.info(sceneStack[i].name);
				if (sceneStack[i].name === desc.sceneName) {
					_stopScene(sceneStack[i]);
					_destroyScene(sceneStack[i]);
					sceneStack.splice(i,1);
					break;
				}
			}
		},

		/**
		 * history back by depth
		 * @method historyBack
		 * @param {Number} depth stack count for history back
		 *
		 * if zero or null. apply one
		 */
		historyBack: function(depth) {
			var count = 0;
			if (!depth)
				count = 1;
			else
				count = depth;

			for (var i=sceneStack.length-1; i>=0 && count>0 ; i--, count--) {
				_stopScene(sceneStack[i]);
				_destroyScene(sceneStack[i]);
				sceneStack.pop();
			}

			if (sceneStack.length > 0 && sceneStack[sceneStack.length-1]) {
				sceneStack[sceneStack.length-1]._onStart({back:true});
			}
		}

	});

	var WSceneManager = new _sceneManager();

	return WSceneManager;
});

W.define('PopupManager', function() {
	'use strict';

	var WClass = W.getClass('Class');

	var popupStack = [];

	var _loadPopup = function(name, sStack, desc, comp) {
		var _name = name.replace("_","/");
		require([_name], function(Module) {
			W.log.info("_loadPopup " + _name);

			var _module = new Module(desc);
			_module.__name = _name;
			_module.__comp =  comp;

			sStack.push(_module);

			if (desc && desc.onload)
				WClass.tryCall(sStack[sStack.length-1], desc.onload, desc);

			if (comp && comp.onPopupOpened)
				comp.onPopupOpened(_module, desc);
		});
	};


	var _stopPopup = function(popup, desc) {
		if (popup) {
			popup._onStop();
			if (popup.__comp && popup.__comp.onPopupClosed && desc) {
				desc.popupName = popup.__name;
				popup.__comp.onPopupClosed(popup, desc);
			}
			popup = undefined;
		}
	};

	/**
	 * manage popup
	 * @class W.PopupManager
	 * @constructor
	 */
	var _popupManager = WClass.extend({

		TYPE_BLOCK : "0",
		TYPE_UNBLOCK : "1",

		ACTION_OK : "1",
		ACTION_CANCEL : "0",
		ACTION_CLOSE : "2",
		ACTION_FAIL : "3",

		init: function() {
		},

		getPopupStack : function() {
			return popupStack;
		},
		/**
		 * request popup to open
		 * @method openPopup
		 * @param {Component} comp parent component
		 * @param {Object} desc popup description
		 */
		openPopup : function(comp, desc) {
			// if (!(comp instanceof W.Component)) {
			// 	throw new Error("Error! Popup must run on component");
			// }

			desc.onload = "_onStart";
			_loadPopup(desc.popupName, popupStack, desc, comp);
		},
		/**
		 * request popup to close
		 * @method closePopup
		 * @param {Popup} popup based popup
		 * @param {Object} desc popup description
		 */
		closePopup : function(popup, desc) {
			for (var i=popupStack.length-1; i>=0; i--) {
				W.log.info("closePopup " + popupStack[i].__name);
				if (popupStack[i] === popup) {
					popupStack.splice(i,1);
					_stopPopup(popup, desc);
					break;
				}
			}
		},
		/**
		 * request all popup to close
		 * @method closePopup
		 * @param {Object} desc popup description
		 */
		closePopupAll : function(desc) {
			for (var i=popupStack.length-1; i>=0; i--) {
				W.log.info("closePopup " + popupStack[i].__name);
				var popup = popupStack.splice(i,1)[0];
				_stopPopup(popup, desc);
			}
		}
	});

	var WPopupManager = new _popupManager();

	return WPopupManager;
});

W.define('Loading', function() {
	'use strict';

	var WClass = W.getClass('Class');

	var loadingTimer;
	var loadingDelay;
	var lockTimer;
	var _this;

	/**
	 * manage popup
	 * @class W.PopupManager
	 * @constructor
	 */
	var _loading = WClass.extend({
		TYPE_NORMAL : 0,
		TYPE_IMAGE : 1,
		KEY_LOCK : false,
		JUST_KEY_LOCK : false,
		isLoading : false,
		init: function() {
			W.log.info("loading init");
			_this = this;
			_this.loading = new W.Div({id:"loading", display : "none"});
			_this.loading.add(new W.Div({id:"loading_img"}));
			//_this.loading.add(new W.Image({id:"loading_text", src:"img/loading_text.png"}));
			W.root.add(_this.loading);
			_this.loadingImage = new W.Div({id:"loading_type_image", display : "none"});
			//_this.loadingImage.add(new W.Image({id:"loading_type_image_banner", src:"img/loading_image.png"}));
			//_this.loadingImage.add(new W.Div({id:"loading_type_image_img"}));
			//_this.loadingImage.add(new W.Image({id:"loading_type_image_text", src:"img/loading_text.png"}));
			W.root.add(_this.loadingImage);
		},
		start: function(type, duration, delay, callback) {
			W.log.info("loading start duration : " + duration);
			delay = delay != undefined && delay != null ? delay : 1000;
			type = type ? type : 0;
			_this.KEY_LOCK = true;
			_this.isLoading = true;
			if(callback) _this.callback = callback;
			if(loadingDelay) clearTimeout(loadingDelay);
			if(loadingTimer) clearTimeout(loadingTimer);
			if(type == this.TYPE_NORMAL) {
				loadingDelay = setTimeout(function(){
					_this.loading.setStyle({display:"block"});
				}, delay);
			} else {
				loadingDelay = setTimeout(function(){
					_this.loadingImage.setStyle({display:"block"});
				}, delay);
			}
			loadingTimer = setTimeout(_this.timeout, duration ? duration : 30000);
		},
		stop: function() {
			W.log.info("loading stop");
			_this.loading.setStyle({display:"none"});
			_this.loadingImage.setStyle({display:"none"});
			_this.KEY_LOCK = false;
			_this.isLoading = false;
			if(_this.callback) _this.callback();
			if(loadingDelay) clearTimeout(loadingDelay);
			if(loadingTimer) clearTimeout(loadingTimer);
		},
		justLock : function(duration, callback) {
			W.log.info("loading justlock");
			_this.JUST_KEY_LOCK = true;
			if(lockTimer) clearTimeout(lockTimer);
			lockTimer = setTimeout(_this.justLockStop, duration ? duration : 30000);
		},
		justLockStop: function() {
			W.log.info("loading justlock stop");
			_this.JUST_KEY_LOCK = false;
			if(lockTimer) clearTimeout(lockTimer);
		},
		timeout : function(){
			W.log.info("loading timeout");
			if(!_this.callback) W.PopupManager.openErrorPopup(this);
			_this.stop();
		}
	});

	var WLoading = new _loading();

	return WLoading;
});

W.define("IComponent", "Class", function(WClass){

	var WFloatProperty = W.getClass("FloatProperty");

	var _iComponent = W.Class.extend({
		EVENT_POINT_BUTTON_PRESSED : 0,
		EVENT_POINT_BUTTON_CLICKED : 1,
		EVENT_POINT_BUTTON_DBLCLICK : 2,
		//EVENT_POINT_SCROLL_UP :  3,
		EVENT_POINT_SCROLL_DOWN : 4,
		EVENT_POINT_SCROLL_LEFT : 5,
		EVENT_POINT_SCROLL_RIGHT : 6,
		EVENT_POINT_IN : 7,
		EVENT_POINT_OUT : 8,
		EVENT_POINT_MOVE : 9,
		EVENT_TOUCH_CANCEL : 10,
		EVENT_TOUCH_END: 11,
		EVENT_TOUCH_MOVE: 12,
		EVENT_TOUCH_START: 13,
		EVENT_GESTURE: 14,
		EVENT_DROP: 15,
		EVENT_DRAG_START: 16,
		EVENT_DRAG_OVER: 17,

		PROPERTY_X : 0,
		PROPERTY_Y : 1,
		PROPERTY_Z : 2,
		PROPERTY_SCALE : 3,
		PROPERTY_SCALE_X : 4,
		PROPERTY_SCALE_Y : 5,
		PROPERTY_PERSPECTIVE : 6,
		PROPERTY_TRANSLATE_Z : 7,
		PROPERTY_ROTATION_DEGREE : 8,
		PROPERTY_OPACITY : 9,
		PROPERTY_WIDTH : 10,
		PROPERTY_HEIGHT :11,
		PROPERTY_SKEW_X : 12,
		PROPERTY_TRANSLATE_X : 13,
		PROPERTY_TRANSLATE_Y : 14,
		PROPERTY_TRANSITION : 15,
		PROPERTY_COLOR : 16,

		EVENT_TYPE_POINTER_IN : "mouseover",
		EVENT_TYPE_POINTER_OUT : "mouseout",
		EVENT_TYPE_POINTER_PRESSED : "mousedown",
		EVENT_TYPE_POINTER_CLICKED : "mouseup",
		EVENT_TYPE_POINTER_MOVE : "mousemove",
		EVENT_TYPE_TOUCH_END : "touchend",
		EVENT_TYPE_TOUCH_START : "touchstart",
		EVENT_TYPE_TOUCH_MOVE : "touchmove",
		EVENT_TYPE_DROP : "drop",
		EVENT_TYPE_DRAG_START : "dragstart",
		EVENT_TYPE_DRAG_OVER : "dragover"
	});


	var IComponent = new _iComponent();

	IComponent.properties = {
		x : new WFloatProperty(IComponent.PROPERTY_X),
		y : new WFloatProperty(IComponent.PROPERTY_Y),
		z : new WFloatProperty(IComponent.PROPERTY_Z),
		scale : new WFloatProperty(IComponent.PROPERTY_SCALE),
		scaleX : new WFloatProperty(IComponent.PROPERTY_SCALE_X),
		scaleY : new WFloatProperty(IComponent.PROPERTY_SCALE_Y),
		perspective : new WFloatProperty(IComponent.PROPERTY_PERSPECTIVE),
		translateX : new WFloatProperty(IComponent.PROPERTY_TRANSLATE_X),
		translateY : new WFloatProperty(IComponent.PROPERTY_TRANSLATE_Y),
		skewX : new WFloatProperty(IComponent.PROPERTY_SKEW_X),
		translateZ : new WFloatProperty(IComponent.PROPERTY_TRANSLATE_Z),
		rotationDegree : new WFloatProperty(IComponent.PROPERTY_ROTATION_DEGREE),
		opacity : new WFloatProperty(IComponent.PROPERTY_OPACITY),
		width: new WFloatProperty(IComponent.PROPERTY_WIDTH),
		height: new WFloatProperty(IComponent.PROPERTY_HEIGHT),
		transition: new WFloatProperty(IComponent.PROPERTY_TRANSITION),
		color : new WFloatProperty(IComponent.PROPERTY_COLOR)
	};

	IComponent.transStyle = {
		position : "position",
		float : "float",
		x : "left",
		y : "top",
		right: "right",
		bottom: "bottom",
		width:"width",
		height:"height",
		opacity:"opacity",
		fontSize : "font-size",
		font : "font-family",
		color: "background-color",
		textColor : "color",
		visible : "visibility",
		transform : "-webkit-transform",
		transitionTimingFunction : "-webkit-transition-timing-function",
		marginLeft : "margin-left",
		marginTop : "margin-top",
		marginRight : "margin-right",
		marginBottom : "margin-bottom",
		paddingLeft : "padding-left",
		paddingTop : "padding-top",
		paddingRight : "padding-right",
		paddingBottom : "padding-bottom",
		textAlign : "text-align",
		vAlign : "vertical-align",
		bgSrc : "background-image",
		fontWeight : "font-weight",
		lineHeight : "line-height",
		zIndex : "z-index",
		border : "border",
		borderStyle : "border-style",
		borderColor	: "border-color",
		overflow : "overflow",
		whiteSpace : "white-space",
		textOverflow : "text-overflow",
		pointer : "pointer-events",
		transition: "transition",
		cursor: "cursor",
		minWidth: "min-width"

	};
	IComponent.normalStyles = {
		"position" : 1,
		"float" : 1,
		"opacity" : 1,
		"font-family" : 1,
		"background-color" : 1,
		"color" : 1,
		"visibility" : 1,
		"-webkit-transform" : 1,
		"-webkit-transition-timing-function" : 1,
		"text-align" : 1,
		"font-weight" : 1,
		"vertical-align" : 1,
		"overflow" : 1,
		"overflow-x" : 1,
		"overflow-y" : 1,
		"line-height" : 1,
		"pointer-events" : 1,
		"transition" : 1
	};
	IComponent.numericStyles = {
		"left" : 1,
		"top" : 1,
		"right" : 1,
		"botom" : 1,
		"width": 1,
		"height": 1,
		"font-size" : 1,
		"margin-left" : 1,
		"margin-top" : 1,
		"margin-right" : 1,
		"margin-bottom" : 1,
		"border" : 1
	};
	IComponent.urlStyles = {
		"background-image": 1
	};
	IComponent.transAttr = {
		"id" : "id",
		"className" : "className",
		"src":"src",
		"text": "textContent",
		"attr":"attr",
		"type": "type",
		"value":"value",
		"name" : "name",
		"autoplay":"autoplay",
		"loop": "loop",
		"wwidth": "width",
		"hheight": "height",
		"lang":"lang",
		"onscroll":"onscroll",
		"scrollTop":"scrollTop",
		"scrollLeft":"scrollLeft",
		"draggable" : "draggable",
		"title": "title",
		"onclick": "onclick"
	};
	return IComponent;

});

W.define('Component', 'Class', function(WClass) {

	var IComponent = new W.getClass("IComponent");

	/**
	 * Function will get element by id starting from specified node.
	 */
	function _getElementById( dNode, id ) {
		var dResult = null;
		if ( dNode.getAttribute('id') == id )
			return dNode;
		for ( var i in dNode.childNodes ) {
			if ( dNode.childNodes[i].nodeType == 1 ) {
				dResult = _getElementById( dNode.childNodes[i], id );
				if ( dResult != null )
					break;
			}
		}
		return dResult;
	};

	function _getElementById_xPath(path){
		return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	};

	var _transStyleName = function(_style) {
		var _newStyleObj = {};
		var _newAttrObj = {};
		var _key;
		for (var key in _style) {
			_key = IComponent.transStyle[key];
			if (_key) {
				if (_key in IComponent.normalStyles)
					_newStyleObj[_key]  = _style[key];
				else if (_key in IComponent.numericStyles)
					if (  typeof(_style[key])=="string")
						_newStyleObj[_key]  = _style[key];
					else
						_newStyleObj[_key]  = (_style[key]===""? "": _style[key] + "px");
				else if (_key in IComponent.urlStyles)
					_newStyleObj[_key]  = "url('"+_style[key] + "')";
				else
					_newStyleObj[_key]  = _style[key];


			} else {
				_key = IComponent.transAttr[key];
				if (_key) {
					if (_key == "src" && _style[key].indexOf("http") == -1)
						_newAttrObj[_key] = (W.RC_PATH?W.RC_PATH:"") + _style[key];
					else
						_newAttrObj[_key] = _style[key];
				} else
					_newStyleObj[key]  = _style[key];
			}
		}
		return [_newStyleObj, _newAttrObj];
	};

	var _createElement = function(type, id, desc) {
		//W.log.info("_createElement "+ type);
		var e = document.createElement(type);
		if (id) {
			e.setAttribute("id", id);
		}
		if (desc) {
			e.desc = desc;

			var newStyle = _transStyleName(desc);

			for (var i in newStyle[0]) {
				e.style[i] = newStyle[0][i];

				// if (i == "overflowX") {
				// 	W.log.info("_createElement overflowX " + newStyle[0][i]);
				// 	W.log.inspect(e);
				// }
			}
			for (var i in newStyle[1]) {
				if (i == "attr")
					e.setAttribute(newStyle[1][i].name, newStyle[1][i].value);
				else if (i == "onclick")
					e.onclick = newStyle[1][i];
				else
					e[i] = newStyle[1][i];
			}
		}
		return e;
	};

	var _getNumberFromPX = function(input) {
		try {
			if (input == undefined || input == null)
				return 0;

			if (typeof(input) == "string" &&  input.indexOf("px") > -1)
				return Number(input.substr(0,input.indexOf("px")));
			else
				return input;
		} catch (err) {
			return 0;
		}
	};

	var _create = function(_type, _id, _desc) {
		//W.log.info("Component _create");
		return _createElement(_type, _id, _desc);
	};

	/**
	 * Represents a UI component
	 * @class W.Component
	 */
	var WComponent = W.Class.extend({

		/**
		 * id of element
		 * @attribute id
		 * @type NUMBER
		 */

		/**
		 * children of component
		 * @attribute children
		 * @type Object
		 */

		init : function(_type, _id, _desc) {
			//W.log.info("Component init");
			this.id = _id;
			//this.desc = _desc;
			this.visible = "";
			this.display = "";
			this.comp = _create(_type, _id, _desc);
			this.comp._wobj = this;
			//W.log.inspect(this);
			//this.pid = W.id++;
			Object.defineProperty(this, "pid", {
				enumerable:false, writable:true, configurable:false, value:W.id++
			});
			this.children = new W.Hash();

			this.storedClassName = _desc.className;
			this.storedStyle = _desc;
			delete this.storedStyle.id;
			delete this.storedStyle.className;
			delete this.storedStyle.text;
		},

		getClass: function() {
			return WClass;
		},

		get: function(_style) {
			return this.getStyle(_style);
		},

		/**
		 * This method returns css style value of the component element
		 * @method getStyle
		 * @param {String} _style The parameter to return css value with the parameter.
		 *
		 *  **See also:**
		 *  {{#crossLink "W.Component/setStyle:method"}}{{/crossLink}},
		 */
		getStyle: function(_style){

			if (IComponent.transStyle[_style])
				return this.comp.style[IComponent.transStyle[_style]];
			else if (IComponent.transAttr[_style])
				return this.comp[IComponent.transAttr[_style]];
			else
				return this.comp[_style];
		},

		/**
		 * This method returns property value off the component element.
		 * @method getPropety
		 * @param {String} _propertyName The paramter to return property value
		 */
		getProperty : function(_propertyName) {
			return this.comp[_propertyName];
		},

		set: function(desc, duration) {
			this.setStyle(desc, duration);
		},

		/**
		 * This method apply css style to the component element
		 * @method setStyle
		 * @param {Object} _style The parameter being style to the component elements.
		 * @param {Integer} duration duration for animation effect
		 *
		 * **See also:**
		 *  {{#crossLink "W.Component/getStyle:method"}}{{/crossLink}},
		 */
		setStyle: function(_style, duration) {
			if (duration == undefined) {
				this.comp.style.webkitTransitionDelay = "";
				this.comp.style.webkitTransitionDuration = "";
			} else {
				this.comp.style.webkitTransitionDelay = "";
				this.comp.style.webkitTransitionDuration = duration+"ms";
			}
			var newStyle = _transStyleName(_style);

			for (var i in newStyle[0]) {
				this.comp.style[i] = newStyle[0][i];
			}
			for (var i in newStyle[1]) {
				if (i == "id")
					this.id = newStyle[1][i];

				if (i == "attr")
					this.comp.setAttribute(newStyle[1][i].name, newStyle[1][i].value);
				else
					this.comp[i] = newStyle[1][i];
			}
		},

		/**
		 * This method apply css style to same class name owned component elements in the scene.
		 * @method setStyleByClass
		 * @param {String} className name of attribute class
		 * @param {Object} _style The parameter being style to the component elements.
		 *
		 * **See also:**
		 *  {{#crossLink "W.Component/getStyle:method"}}{{/crossLink}},
		 */
		setStyleByClass : function(className, _desc) {
			if ("id" in _desc)
				throw new Error("setStyleByClass : ID can not be changed !!!");

			var els = this.comp.getElementsByClassName(className);
			//W.log.inspect(els)
			//W.log.info("element count : " + els.length);
			var newStyle = _transStyleName(_desc);

			for( var i=0; i<els.length ; i++) {
				for (var key in newStyle[0]) {
					els[i].style[key] = newStyle[0][key];
				}
				for (var key in newStyle[1]) {
					if (i == "attr")
						els[i].setAttribute(newStyle[1][i].name, newStyle[1][i].value);
					else
						els[i][key] = newStyle[1][key];
				}
			}
		},
		setProperty: function(desc) {
			for (var key in desc)
				this[key] = desc[key];
		},
		getElementById : function(id){
			return _getElementById(this.comp,id);
		},
		/**
		 * Add Component to Component(Parent)
		 * @method add
		 * @param {Component} _comp Component to be added
		 * @param {Object} desc description to be added to style
		 * @param {Integer} order index for ordering
		 *
		 */
		add : function(_comp, desc, order) {

			if (order == undefined)
				order = this.children.length;
			//W.log.info("Component add");
			if (desc) {
				//console.log("add desc ",desc);
				_comp.setStyle(desc);
			}

			if (_comp.templet)
				_comp.templet = undefined;
			if (_comp.id) {
				//20180601, 동일한 ID의 children을 add 할때 관리되지 않는 문제가 생김
				if (!this.children.get(_comp.id))
					this.children.insertAt(order, _comp.id,  _comp);
				else
					this.children.put(_comp.id,  _comp);
				//throw new Error("Same child id exist !!! ");
			} else
				this.children.insertAt(order, _comp.pid, _comp);

			//this.comp.appendChild(_comp.comp);
			this.comp.insertBefore( _comp.comp, this.comp.children[order]);

			//_comp.comp.desc = W.clone(_comp.comp.desc);
			//W.log.inspect(_comp);
			//W.log.inspect(_comp.comp.desc);
			//W.log.inspect(this);
			//W.log.inspect(this.children);
			//W.log.info("this.children "+this.children);
		},
		remove : function(_comp) {
			if (_comp.id)
				this.children.remove(_comp.id);
			else
				this.children.remove(_comp.pid);

			if (_comp.comp && _comp.comp.parentNode)
				_comp.comp.parentNode.removeChild(_comp.comp);
//			_comp.comp.remove();
		},
		getChildren : function() {
			return this.children;
		},
		requestFocus : function(scene) {
			scene.setFocusObject(this);
			this._onFocusGained();
		},
		releaseFocus : function(scene) {
			scene.setFocusObject(null);
			this._onFocusLosted();
		},
		focus : function() {
			this.comp.focus();
		},
		blur : function() {
			this.comp.blur();
		},
		destroy : function() {
			//TODO
			if (this.comp) {
				if (this.comp.remove)
					this.comp.remove();
				else {
					if (this.comp.parentNode)
						this.comp.parentNode.removeChild(this.comp);
				}
			}
			this.comp = undefined;

			for (var key in this)
				delete this[key];
		},
		_onKeyPressed: function(evt) {
			return this.onKeyPressed(evt);
		},
//        onKeyPressed: function(evt) {
//            return false;
//        },
		__getProperty : function(name) {
			return IComponent.properties[name];
		},
		/**
		 * setting style for focused component or unfocused component
		 * @method setFocusedStyle
		 * @param {Object} _desc style description
		 *
		 * Ex)
		 * comp.setFocusedStyle({on:{textColor:"yellow", x:48, width:110, transform:"scale(1.2)"}}); // Animation OK
		 * comp.setFocusedStyle({on:{textColor:"yellow", x:48, width:110, transform:"scale(1.2)"}, // Animation OK
         * 						 off: {textColor:"black", x:18, width:110, transform:"scale(1)"},}});
		 * comp.setFocusedStyle({on:"foc_className",off:"unfoc_className"}); // NO Animation
		 * comp.setFocusedStyle("foc_className");  // NO Animation
		 *
		 */
		setFocusedStyle : function(_desc) {
			this.focusedStyle = {};
			this.unFocusedStyle = {};

			if(typeof(_desc)=="object" || typeof(_desc.on)=="object"){
				if(_desc.on){
					this.focusedStyle = _desc.on;
				}
				if(_desc.off){
					this.unFocusedStyle = _desc.off;
				}else{
					var _tempKeys = Object.keys(this.focusedStyle);
					this.unFocusedStyle = this.storedStyle;

					for(var i=0; i<_tempKeys.length; i++){
						if(!this.unFocusedStyle[_tempKeys[i]]){
							this.unFocusedStyle[_tempKeys[i]] = "";
						}
					}
				}
			}else{
				if(typeof(_desc)=="object"){
					this.focusedStyle = _desc.on;

					if(_desc.off){
						if(typeof(_desc.off)=="string")
							this.unFocusedStyle = _desc.off;
						else
							throw new Error("Not equal type [On/Off]");
					}else{
						this.unFocusedStyle = this.storedClassName;
					}
				}else{
					this.focusedStyle = _desc;
					this.unFocusedStyle = this.storedClassName;
					return;
				}
			}
		},

		_onFocusGained : function(duration) {
			if(this.focusedStyle){
				if(typeof(this.focusedStyle)== "object"){
					this.setStyle(this.focusedStyle, duration);
				}else{
					this.comp.className = this.focusedStyle;
				}
			}

			this.onFocusGained();

			for (var key in this.children.key) {
				this.children.obj[key]._onFocusGained(duration);
			}
		},
		/**
		 * called when a component get focus
		 * @method onFocusGained
		 *
		 */
		onFocusGained : function() {
		},
		_onFocusLosted : function(duration) {
			if(this.unFocusedStyle){
				if(typeof(this.unFocusedStyle)== "object"){
					this.setStyle(this.unFocusedStyle, duration);
				}else{
					this.comp.className = this.unFocusedStyle;
				}
			}

			this.onFocusLosted();

			for (var key in this.children.key) {
				this.children.obj[key]._onFocusLosted(duration);
			}
		},
		/**
		 * called when a component lost focus
		 * @method onFocusLosted
		 *
		 */
		onFocusLosted : function() {
		},
		/**
		 * called when popup opened on component
		 * @method onPopupOpened
		 *
		 */
		onPopupOpened : function(popup, desc) {
		},
		/**
		 * called when popup closed on component
		 * @method onPopupClosed
		 *
		 */
		onPopupClosed : function(popup, desc) {
		}
	});

	return WComponent;
});

W.define('Div', function() {
	'use strict';

	var WComponent = W.getClass('Component');

	/**
	 * Represents a UI Div
	 * @class W.Div
	 */
	var WDiv = WComponent.extend({

		init: function(desc) {
			//W.log.info("Div init");
			this._super("init", "div", desc.id, desc);
		}

	});
	return WDiv;
});

W.define('Image', function() {
	'use strict';

	var WComponent = W.getClass('Component');

	/**
	 * Represents a UI Image
	 * @class W.Image
	 */
	var WImage = WComponent.extend({

		init: function(desc) {
			//W.log.info("WImage init");
			this._super("init", "img", desc.id, desc);
		}

	});
	return WImage;
});

W.define('Span', function() {
	'use strict';

	var WComponent = W.getClass('Component');

	/**
	 * Represents a UI Span
	 * @class W.Span
	 */
	var WSpan = WComponent.extend({

		init: function(desc) {
			//W.log.info("WSpan init");
			this._super("init", "span", desc.id, desc);
		}

	});
	return WSpan;
});

W.define('Input', function() {
	'use strict';

	var WComponent = W.getClass('Component');

	/**
	 * Represents a UI Input
	 * @class W.Input
	 */
	var WInput = WComponent.extend({

		init: function(desc) {
			//W.log.info("WInput init");
			desc.pointer = "all";
			this._super("init", "input", desc.id, desc);
		}

	});
	return WInput;
});

W.define('Canvas', function() {
	'use strict';

	var WComponent = W.getClass('Component');

	/**
	 * Represents a UI Image
	 * @class W.Image
	 */
	var WCanvas = WComponent.extend({

		init: function(desc) {
			//W.log.info("WImage init");
			this._super("init", "canvas", desc.id, desc);
		}

	});
	return WCanvas;
});

W.define("TextBox", function() {
	"use strict";

	var WComponent = W.getClass("Component");

	/**
	 * Represents a UI TextBox <br>
	 *
	 * @example
	 * new W.TextBox({id:"textbox", line:"5", fontSize:18, lineHeight:1.5 });
	 * @class W.TextBox
	 * @constructor
	 */
	var WTextBox = WComponent.extend({

		init: function(desc) {
			W.log.info("WTextBox init");

			if (!("line" in desc))
				throw new Error("Error!!! Need line(line number)(not supported css file)");
			if (!("fontSize" in desc))
				throw new Error("Error!!! Need fontSize(not supported css file)");
			if (!("lineHeight" in desc))
				throw new Error("Error!!! Need lineHeight(not supported css file)");
			if (("text" in desc))
				throw new Error("Error!!! You can set Text to component after creation");

			this.line = desc.line;
			this.fontSize = desc.fontSize;
			this.lineHeight = desc.lineHeight;

			if (typeof(this.lineHeight) == "string") {
				var pctIdx = this.lineHeight.indexOf("%");
				if ( pctIdx != -1)
					this.lineHeight = parseInt(this.lineHeight.substr(0, pctIdx))/100;
			}
			this.pageHeight = parseInt(parseInt(this.fontSize)*this.lineHeight*parseInt(this.line));
			W.log.info("TextBox pageHeight " + this.pageHeight);

			desc.overflow = "hidden";
			this._super("init", "div", desc.id, desc);

			delete desc["height"];
            desc.color = "";
			desc.id = "";
			desc.x = "0";
			desc.y = "0";
			desc.width = "100%";
			desc.overflow = "";
			desc.visibility = "inherit";
			desc.position = "absolute";
			desc["white-space"] = "pre-wrap";
			desc["-webkit-line-clamp"] = desc.line;
			desc["-webkit-box-orient"] = "vertical";
			desc["display"] = "-webkit-box";
			var _textbox = new W.Span(desc);
			this.add(_textbox);
		},
		setStyle: function(_style, duration) {
			if ("text" in _style)
				throw new Error("SetStyle of TextBox can not has text value");

			this._super("setStyle", _style, duration);
		},
		setText : function(value) {
			if(value==null || value==undefined){
				W.log.error("Not found the value of method.");
				return;
			}
			this.totalPage = 0;
			this.pageNo = 0;
			this.children.elementAt(0).setStyle({"text":value});
			this.getTotalPage();
		},
		addText : function(value) {
			var newVal = value +"\n"+ this.getText();
			this.setText(newVal);
		},
		/**
		 * returns total page of TextBox
		 * @method getTotalPage
		 *
		 */
		getTotalPage : function() {
			if (this.totalPage)
				return this.totalPage;
			var _height = this.children.elementAt(0).comp.offsetHeight;
			var _boxHeight = this.comp.offsetHeight;

			return this.totalPage = Math.ceil(_height / _boxHeight);
		},
		setPage : function() {
			if (this.pageNo +1 > this.totalPage )
				throw new Error("Exceed total Page ");

			this.children.elementAt(0).setStyle({"y": -this.pageNo*this.pageHeight});
		},
		/**
		 * scroll page up of textbox
		 * @method pageUp
		 *
		 */
		pageUp :function() {
			W.log.info("TextBox pageUp ");
			if (this.pageNo > 0) {
				this.setPage(--this.pageNo);
			}
		},
		/**
		 * scroll page up of textbox
		 * @method pageDown
		 *
		 */
		pageDown : function() {
			W.log.info("TextBox pageDown ");
			if (this.pageNo < this.totalPage-1) {
				this.setPage(++this.pageNo);
			}
		}
	});

	return WTextBox;
});

W.define('Scene', function() {
	'use strict';

	var _sceneManager = W.getClass("SceneManager");
	var _keyHandler = W.getClass("KeyHandler");
	var WComponent = W.getClass('Component');

	/**
	 * Represents a UI scene.
	 *
	 * @class W.Scene
	 */
	var WScene = WComponent.extend({

		_keys: [],
		_state: "",
		_focusedObj:null,
		init: function(desc) {
			W.log.info("Scene init");
			W.log.info(desc);
			var sceneName = desc.sceneName.replace("/","_");
			this._super("init", "div", sceneName, desc);
			this._onCreate(desc);
		},

		_onCreate: function(desc) {
			this.onCreate(desc);
			this._state = "create";
			W.root.add(this);
		},
		/**
		 * called on creation
		 * @method onCreate
		 * @param {W.Scene} scene Scene Component
		 */
		onCreate: function(desc) {
		},
		/**
		 *
		 */
		_onDestroy: function() {
			//W.log.info("_onDestroy Scene");
			this.onDestroy();
			this._state = "destroyed";
			W.root.remove(this);
			//this.comp.remove();
		},
		onDestroy: function() {
		},
		_onStart: function(param) {
			//W.log.info("_onStart Scene");

			if (!this.comp.parentNode)
				W.root.add(this);

			this.onStart(param);
			this._state = "start";
			this.setStyle({display:""});
		},
		/**
		 *  Called on scene start.
		 *  @method onStart
		 *  @param {object} param When scene be called, parameter can be sent.
		 */
		onStart: function(param) {
			//W.log.info("onStart Scene");
		},
		_onStop: function() {
			W.log.info("_onStop Scene");
			this.onStop();
			this._state = "stop";
			this.setStyle({display:"none"});
		},
		/**
		 *  Called on scene stop.
		 *  @method onStop
		 */
		onStop: function() {
			//W.log.info("onStop Scene");
		},

		_onKeyPressed: function(evt) {
			return this.onKeyPressed(evt);
		},
		/**
		 * Called on key pressed
		 * @method onKeyPressed
		 * @param {Event} evt KeyEvent
		 */
		onKeyPressed: function(evt) {
			return false;
		},
		/**
		 *
		 */
		_onKeyReleased: function(evt) {
			onKeyReleased(evt);
		},
		onKeyReleased: function(evt) {
		},
		/**
		 * key setting for key event
		 * @method setKeys
		 * @param {Array} keys array of key(defined on W.KEY)
		 */
		setKeys: function(keys) {
			this._keys = keys;
			if (!(this._keys instanceof Array))
				throw new Error("setKeys must have an array as a parameter");
		},
		/**
		 * exclusive key setting for key event
		 * @method setExclusiveKeys
		 * @param {Array} keys array of key(defined on W.KEY)
		 */
		setExclusiveKeys: function(keys) {
			_keyHandler.addExclusiveKey(this, keys);
		},
		/**
		 * key adding for key event
		 * @method addKeys
		 * @param {Array} keys array of key(defined on W.KEY)
		 */
		addKeys: function(keys) {
			this._keys = this._keys.concat(keys);
		},

		hasKey: function(evt) {
			if (this._keys.indexOf(-1) > -1 || this._keys.indexOf(evt.keyCode) > -1)
				return true;
			else
				return false;
		},
		setFocusObject: function(comp) {
			this._focusedObj = comp;
		}
	});
	return WScene;
});

W.define("IPopup", "Class", function(WClass){

	var _iPopup = W.Class.extend({
		TYPE_CONFIRM : 0,
		TYPE_INFO : 1
	});
	var IPopup = new _iPopup();
	return IPopup;
});

W.define('Popup', function() {
	'use strict';

	var _popupManager = W.getClass("PopupManager");
	var _keyHandler = W.getClass("KeyHandler");
	var WComponent = W.getClass('Component');

	/**
	 * Represents a UI popup.
	 *
	 * @class W.Popup
	 */
	var WPopup = WComponent.extend({

		_keys: [],
		_state: "",

		init: function(desc) {
			W.log.info("Popup init");
			//W.log.info(desc);
			var popupName = desc.popupName.replace("/","_");
			this._super("init", "div", popupName, desc);
			this._onCreate(desc);
		},
		_onCreate: function(desc) {
			this.setStyle({width:"100%", height:"100%"});
			this.onCreate(desc);
			this._state = "create";
			W.root.add(this);
			//W.root.appendChild(this.comp);
		},
		/**
		 * called on creation
		 * @method onCreate
		 * @param {W.Popup} popup Popup Component
		 */
		onCreate: function(desc) {
		},
		_onStart: function(param) {
			W.log.info("_onStart Popup");

			if (!this.comp.parentNode)
				W.root.add(this);

			this.onStart(param);
			this._state = "start";
			this.setStyle({display:""});
		},
		/**
		 *  Called on popup start.
		 *  @method onStart
		 *  @param {object} param When popup be called, parameter can be sent.
		 */
		onStart: function(param) {
			W.log.info("onStart Popup");
		},
		_onStop: function() {
			W.log.info("_onStop Popup");
			this.onStop();
			this._state = "stop";

			this.comp.parentNode.removeChild(this.comp);
//        	this.comp.remove();
		},
		/**
		 *  Called on popup stop.
		 *  @method onStop
		 */
		onStop: function() {
			//W.log.info("onStop Popup");
		},

		_onKeyPressed: function(evt) {
			return this.onKeyPressed(evt);
		},
		/**
		 * Called on key pressed
		 * @method onKeyPressed
		 * @param {Event} evt KeyEvent
		 */
		onKeyPressed: function(evt) {
		},
		/**
		 *
		 */
		_onKeyReleased: function(evt) {
			onKeyReleased(evt);
		},
		onKeyReleased: function(evt) {
		},

		/**
		 * key setting for key event
		 * @method setKeys
		 * @param {Array} keys array of key(defined on W.KEY)
		 */
		setKeys: function(keys) {
			this._keys = keys;
			if (!(this._keys instanceof Array))
				throw new Error("setKeys must have an array as a parameter");
		},
		setExclusiveKeys: function(keys) {
			_keyHandler.addExclusiveKey(this, keys);
		},
		/**
		 * key adding for key event
		 * @method addKeys
		 * @param {Array} keys array of key(defined on W.KEY)
		 */
		addKeys: function(keys) {
			this._keys = this._keys.concat(keys);
		},

		hasKey: function(evt) {

			if (this._keys.indexOf(-1) > -1 || this._keys.indexOf(evt.keyCode) > -1)
				return true;
			else
				return false;
		}
	});
	return WPopup;
});

W.define("XHRManager", function() {
	'use strict';
	var WClass = W.getClass('Class');
	W.log.info("XHRManager load ");

	/**
	 * Represents XHRManager
	 *
	 * This class handles a basic XMLHttpRequest with the standard method.
	 * And especially, this provides the way to avoid CORS problem in iOS platform.
	 * A client can use a normal way to avoid the problem regardless of platforms.
	 * In order to verify your code correct, just develop in chrome browser.
	 *
	 * In order to use this class, a client MUST follow a certain specific rule.
	 * For details,
	 *
	 * @class W.XHRManager
	 * @constructor
	 */
	var _xhrManager = WClass.extend({

		/**
		 * request XMLHttpRequest
		 * @param {object} desc
		 * 			{
		 * 				url: requestUrl,
		 * 				type: method(GET,POST,PUT...),
		 * 				requestHeader: { propertyName:propertyValue,
		 * 								...
		 * 								},
		 * 				data: parameter or form_data,
		 *				mimeType: mimeType
		 *
		 * 			}
		 * @param {boolean} noBridge whether this request is for iOS bridge
		 * @returns {Promise}
		 */
		send : function(desc, noBridge) {

			if (W.isIOS && !noBridge) {
				return new Promise(function (resolve, reject) {
					var promise = W.NativeBridge.relayXHR(desc);
					promise.then(
						function(responseText) {
							responseText = Base64.decode(responseText);
							resolve(responseText);
						}
					)["catch"] (
						function(statusText) {
							statusText = Base64.decode(statusText);
							reject(statusText);
						}
					)
				});
			}

			return new Promise(function (resolve, reject) {

				W.log.info("###### XHRManager ###################");
				W.log.info(" url " + desc.url);
				W.log.info(" type " + desc.type);
				if (typeof(desc.data) == "object") {
					W.log.info(" data (object)");
					W.log.info(JSON.stringify(desc.data));
				} else
					W.log.info(" data " + desc.data);
				W.log.info(" mimeType " + desc.mimeType);

				if (desc.type && desc.type.toUpperCase() == "GET" && desc.data) {
					desc.url = desc.url + "?" + desc.data;
					desc.data = undefined;
				}

				var xhr = new XMLHttpRequest();
				xhr.open(desc.type, desc.url, true);

				for (var property in desc.requestHeader) {
					W.log.info(" requestHeader " + property + ", " + desc.requestHeader[property]);
					xhr.setRequestHeader(property, desc.requestHeader[property]);
				}
				W.log.info("###### XHRManager ###################");
				if (desc.mimeType)
					xhr.overrideMimeType(desc.mimeType);

				xhr.onreadystatechange = function () {
					if (xhr.readyState == 4) {
						if (xhr.status == 200 || xhr.status == 201) {
							resolve(xhr.responseText);
						} else {
							W.log.info("###############  XHRManager Error   ###################");
							W.log.info("xhr.response : " + xhr.response);
							W.log.info("XHRManager status " + xhr.status);

							W.log.info(xhr);
							reject(xhr);

						}
					} else {
						//log.info("XHRManager readyState " + xhr.readyState);
					}
				};

				if (desc.data)
					xhr.send(desc.data);
				else
					xhr.send();

			});
		},

		/**
		 * this is only for web browser
		 * @param desc
		 * @returns {*|Y}
         */
		getResponseURL : function(desc) {

			return new Promise(function (resolve, reject) {

				W.log.info("###### XHRManager ###################");
				W.log.info(" url " + desc.url);
				W.log.info(" type " + desc.type);
				if (typeof(desc.data) == "object") {
					W.log.info(" data (object)");
					W.log.info(JSON.stringify(desc.data));
				} else
					W.log.info(" data " + desc.data);
				W.log.info(" mimeType " + desc.mimeType);

				if (desc.type && desc.type.toUpperCase() == "GET" && desc.data) {
					desc.url = desc.url + "?" + desc.data;
					desc.data = undefined;
				}

				var xhr = new XMLHttpRequest();
				xhr.open(desc.type, desc.url, true);

				for (var property in desc.requestHeader) {
					W.log.info(" requestHeader " + property + ", " + desc.requestHeader[property]);
					xhr.setRequestHeader(property, desc.requestHeader[property]);
				}
				W.log.info("###### XHRManager ###################");
				if (desc.mimeType)
					xhr.overrideMimeType(desc.mimeType);

				xhr.onreadystatechange = function () {
					if (xhr.readyState == 4) {
						if (xhr.status == 200 || xhr.status == 201) {
							//W.log.info("responseUrl " + xhr.responseURL);
							resolve(xhr.responseURL);
						} else {
							W.log.info("###############  XHRManager Error   ###################");
							W.log.info("xhr.response : " + xhr.response);
							W.log.info("XHRManager status " + xhr.status);

							W.log.info(xhr);
							reject(xhr);

						}
					} else {
						//log.info("XHRManager readyState " + xhr.readyState);
					}
				};

				if (desc.data)
					xhr.send(desc.data);
				else
					xhr.send();

			});
		},

		/**
		 * This function is not supported yet. Don't use this.
		 *
		 * @param desc
		 */
		sendAjax: function(desc){
			W.log.info("###### sendAjax ###################");
			W.log.info(" url " + desc.url);
			W.log.info(" type " + desc.type);
			W.log.info(" async " + desc.async);
			W.log.info(" dataType " + desc.dataType);
			if (typeof(desc.data) =="object") {
				W.log.info(" data (object)"); W.log.info(JSON.stringify(desc.data));
			} else
				W.log.info(" data " + desc.data);
			W.log.info(" timeout " + desc.timeout);
			W.log.info(" mimeType " + desc.mimeType);
			W.log.info(" returnObj " + desc.returnObj);
			W.log.info("###### XHRManager ###################");

			var wmsUrl =desc.url;
			var dType =desc.dataType;
			var method = desc.type;
			var headers = desc.requestHeader;
			var params = desc.params;
			var timeout = desc.timeout;
			var async = desc.async;
			var successCallback = desc.successCallback;
			var errorCallback = desc.errorCallback;

			if (method.toLowerCase() === "get") {
				wmsUrl = wmsUrl + "?" + params;
				params = undefined;
			}
			var ajaxRequest = null;
			ajaxRequest = $.ajax({
				url : wmsUrl,
				dataType : dType,
				headers : headers,
				data : params,
				async : async,
				type : method,
				timeout : timeout,
				success : function(result, status, xhr) {
					W.log.info("XHRManager, ############################################################");
					W.log.info("XHRManager, ## success request url : " + wmsUrl);
					W.log.info("XHRManager, ## success method : " + method);
					W.log.info("XHRManager, ## success status : " + xhr.status);
					W.log.info("XHRManager, ############################################################");
					if (successCallback) {
						successCallback(true, result);
					}
					if (xhr.destroy) {
						xhr.destroy();
					}
				},
				error : function(xhr, status, error) {
					W.log.info("XHRManager, ############################################################");
					W.log.info("XHRManager, ## request url : " + wmsUrl);
					W.log.info("XHRManager, ## request method : " + method);
					W.log.info("XHRManager, ## request dataType : " + dType);
					W.log.info("XHRManager, ## request async : " + async);
					W.log.info("XHRManager, ## request timeout : " + timeout);
					W.log.info("XHRManager, ## error status : " + xhr.status);
					W.log.info("XHRManager, ## error status : " + xhr.statusText);
					W.log.info("XHRManager, ############################################################");
					errorCallback(false, xhr);
				}
			});
		}
	});

	var WXHRManager = new _xhrManager();
	return WXHRManager;
});

W.define("ShakaHandler", function() {

	var setupAssetMetadata = function(asset, player) {
		var config = /** @type {shakaExtern.PlayerConfiguration} */(
		{ drm: {}, manifest: { dash: {} } });

		// Add config from this asset.
		if (asset.licenseServers)
			config.drm.servers = asset.licenseServers;
		if (asset.drmCallback)
			config.manifest.dash.customScheme = asset.drmCallback;
		if (asset.clearKeys)
			config.drm.clearKeys = asset.clearKeys;
		player.configure(config);

		// Configure network filters.
		var networkingEngine = player.getNetworkingEngine();
		networkingEngine.clearAllRequestFilters();
		networkingEngine.clearAllResponseFilters();

		if (asset.licenseRequestHeaders) {
			var filter = ShakaDemoUtils.addLicenseRequestHeaders_.bind(
				null, asset.licenseRequestHeaders);
			networkingEngine.registerRequestFilter(filter);
		}

		if (asset.requestFilter)
			networkingEngine.registerRequestFilter(asset.requestFilter);
		if (asset.responseFilter)
			networkingEngine.registerResponseFilter(asset.responseFilter);
		if (asset.extraConfig)
			player.configure(/** @type {shakaExtern.PlayerConfiguration} */(
				asset.extraConfig));
	};


	/**
	 * @param {!Object.<string, string>} headers
	 * @param {shaka.net.NetworkingEngine.RequestType} requestType
	 * @param {shakaExtern.Request} request
	 * @private
	 */
	var addLicenseRequestHeaders_ =
		function(headers, requestType, request) {
			if (requestType != shaka.net.NetworkingEngine.RequestType.LICENSE) return;

			// Add these to the existing headers.  Do not clobber them!
			// For PlayReady, there will already be headers in the request.
			for (var k in headers) {
				request.headers[k] = headers[k];
			}
		};


	/**
	 * Return true if the content is Transport Stream.
	 * Used to decide if caption button is shown all the time in the demo,
	 * and whether to show 'Default Text' as a Text Track option.
	 *
	 * @param {shaka.Player} player
	 * @return {boolean}
	 */
	var isTsContent = function(player) {
		var activeTracks = player.getVariantTracks().filter(function(track) {
			return track.active == true;
		});
		var activeTrack = activeTracks[0];
		if (activeTrack) {
			return activeTrack.mimeType == 'video/mp2t';
		}
		return false;
	};

	var preparePlayer_ = function(assetUri, licenseUri, certificateURL) {
		W.log.info("ShakaHandler preparePlayer " + assetUri);
		W.log.info("ShakaHandler preparePlayer " + licenseUri);

		var assetInfo;

		var player = W.ShakaHandler.player_;

		//var videoRobustness =
		//	document.getElementById('drmSettingsVideoRobustness').value;
		//var audioRobustness =
		//	document.getElementById('drmSettingsAudioRobustness').value;

		var commonDrmSystems =
			//['com.widevine.alpha']//, 'com.microsoft.playready', 'com.adobe.primetime'];
			['com.widevine.alpha', 'com.microsoft.playready', 'com.adobe.primetime'];

		var config = /** @type {shakaExtern.PlayerConfiguration} */(
			{ abr: {}, streaming: {}, manifest: { dash: {} } });
		config.drm = /** @type {shakaExtern.DrmConfiguration} */({
			advanced: {}});
		commonDrmSystems.forEach(function(system) {
			config.drm.advanced[system] =
				/** @type {shakaExtern.AdvancedDrmConfiguration} */({});
		});
		config.manifest.dash.clockSyncUri =
			'//shaka-player-demo.appspot.com/time.txt';

		if (assetUri) {
			// Use the custom fields.
			var licenseServerUri = licenseUri;
			var licenseServers = {};
			if (licenseServerUri) {
				commonDrmSystems.forEach(function(system) {
					licenseServers[system] = licenseServerUri;
				});
			}

			assetInfo = /** @type {shakaAssets.AssetInfo} */ ({
				manifestUri: assetUri,
				// Use the custom license server for all key systems.
				// This simplifies configuration for the user.
				// They will simply fill in a Widevine license server on Chrome, etc.
				licenseServers: licenseServers,
				// Use custom certificate for all key systems as well
				certificateUri: certificateURL
			});
		}

		player.resetConfiguration();

		// Add configuration from this asset.
		setupAssetMetadata(assetInfo, player);
		W.ShakaHandler.castProxy_.setAppData({'asset': assetInfo});

		// Add drm configuration from the UI.
		//if (videoRobustness) {
		//	commonDrmSystems.forEach(function(system) {
		//		config.drm.advanced[system].videoRobustness = videoRobustness;
		//	});
		//}
		//if (audioRobustness) {
		//	commonDrmSystems.forEach(function(system) {
		//		config.drm.advanced[system].audioRobustness = audioRobustness;
		//	});
		//}

		// Add other configuration from the UI.
		//config.preferredAudioLanguage =
		//	document.getElementById('preferredAudioLanguage').value;
		//config.preferredTextLanguage =
		//	document.getElementById('preferredTextLanguage').value;
		//config.abr.enabled =
		//	document.getElementById('enableAdaptation').checked;
		//config.streaming.jumpLargeGaps =
		//	document.getElementById('jumpLargeGaps').checked;

		player.configure(config);

		// TODO: document demo app debugging features
		//if (window.debugConfig) {
		//	player.configure(window.debugConfig);
		//}

		console.log(assetInfo);
		return assetInfo;
	};

	var _shakaHandler = W.Class.extend({
		/**
		 * The registered ID of the v2.3 Chromecast receiver demo.
		 * @const {string}
		 * @private
		 */
		CC_APP_ID_ : 'A15A181D',

		init: function() {
			W.log.info("shaka.polyfill.installAll()")
			shaka.polyfill.installAll();
		},
		initShaka: function() {

			try {

				shaka.Player.probeSupport().then(function (support) {

					W.log.info("Shaka initiated");

					W.ShakaHandler.support_ = support;

					var localVideo = document.getElementsByTagName("video")[0];
					var localPlayer = new shaka.Player(localVideo);

					W.ShakaHandler.castProxy_ = new shaka.cast.CastProxy(
						localVideo, localPlayer, W.ShakaHandler.CC_APP_ID_);
					W.ShakaHandler.video_ = W.ShakaHandler.castProxy_.getVideo();
					W.ShakaHandler.player_ = W.ShakaHandler.castProxy_.getPlayer();


					W.ShakaHandler.player_.addEventListener('error', W.ShakaHandler.onErrorEvent_);
					W.ShakaHandler.localVideo_ = localVideo;
					W.ShakaHandler.localPlayer_ = localPlayer;

					//this.setupConfiguration_();
				}).catch(function (error) {
				 	// Some part of the setup of the demo app threw an error.
				 	// Notify the user of this.
				 	W.ShakaHandler.onErrorEvent_(/** @type {!shaka.util.Error} */ (error));
				 });
			} catch (err) {
				W.log.error(err);
				W.log.info("initShaka error ");
				if (err.message.indexOf("navigator.requestMediaKeySystemAccess") > -1) {
					var event = W.createCustomEvent("error", true, false,
						{message:"Assertion failed: Must have basic EME support. EME supports only localhost or https request."});
					video.dispatchEvent(event);
				}
			}
		},

		setupConfiguration : function() {
			if (this.support_.drm['com.widevine.alpha']) {
				var widevineSuggestions = ['SW_SECURE_CRYPTO', 'SW_SECURE_DECODE',
					'HW_SECURE_CRYPTO', 'HW_SECURE_DECODE', 'HW_SECURE_ALL'];
			}
		},

		onErrorEvent_ : function(evt) {
			W.log.info("ShakaHandler onErrorEvent");
			W.log.inspect(evt);

			if (evt.message && evt.message.indexOf("Shaka Error PLAYER.LOAD_INTERRUPTED") == -1) {
				if (W.ShakaHandler.player_) {
					W.ShakaHandler.player_.unload();
					W.ShakaHandler.player_.destroy();
				}
				var event = W.createCustomEvent("error", true, false, evt);

				video.dispatchEvent(event);
			}
			//evt.preventDefault();
			//evt.stopPropagation();
		},

		load : function(assetUri, licenseUri) {
			var asset = preparePlayer_(assetUri, licenseUri);
			var player = W.ShakaHandler.player_;

			var configureCertificate = Promise.resolve();

			if (asset.certificateUri) {
				configureCertificate = shakaDemo.requestCertificate_(asset.certificateUri)
					.then(W.ShakaHandler.configureCertificate_);
			}

			var _this = this;
			configureCertificate.then(function() {
				// Load the manifest.
				return player.load(asset.manifestUri);
			}).then(function() {
				// Update control state in case autoplay is disabled.
				//this.controls_.loadComplete();

				//this.hashShouldChange_();

				// Set a different poster for audio-only assets.
				//if (player.isAudioOnly()) {
				//	this.localVideo_.poster = this.audioOnlyPoster_;
				//}

				// Disallow casting of offline content.
				(asset.extraText || []).forEach(function(extraText) {
					player.addTextTrack(extraText.uri, extraText.language, extraText.kind,
						extraText.mime, extraText.codecs);
				});

				// Check if browser supports Media Session first.
				if ('mediaSession' in navigator) {
					// Set media session title.
					//navigator.mediaSession.metadata = new MediaMetadata({title: asset.name});
				}
			}, function(reason) {
				var error = /** @type {!shaka.util.Error} */(reason);
				if (error.code == shaka.util.Error.Code.LOAD_INTERRUPTED) {
					// Don't use shaka.log, which is not present in compiled builds.
					console.debug('load() interrupted');
				} else {
					W.ShakaHandler.onErrorEvent_(error);
				}
			});

			// While the manifest is being loaded in parallel, go ahead and ask the video
			// to play.  This can help with autoplay on Android, since Android requires
			// user interaction to play a video and this function is called from a click
			// event.  This seems to work only because Shaka Player has already created a
			// MediaSource object and set video.src.
			W.ShakaHandler.video_.play();
		}
	});

	var shakaHandler;
	try {
		if (shaka == undefined)
		shakaHandler = new _shakaHandler();
	} catch (err) {};
		return shakaHandler;

});
W.ShakaHandler;
W.define("MediaPlayer", function(){

	var video;
	var isLooping = false; //for Android, iOS

	if (W.isPureBrowser || W.isOIPF) {
		video = document.createElement("video");
		video.id = "video";
		video.style.left = "0px";
		video.style.top = "0px";
		video.style.width = "100%";
		video.style.height = "100%";
		video.style.zIndex = "-2";
		document.body.appendChild(video);
	}

	//For OIPF Channel tunning
	var videoBroadcastObj;
	if (W.isOIPF) {
		//videoBroadcastObj = oipfObjectFactory.createVideoBroadcastObject();
		videoBroadcastObj = document.createElement("object");
		videoBroadcastObj.type = "video/broadcast";
		videoBroadcastObj.id = "videoBroadcastObj";

		videoBroadcastObj.style.position = "absolute";
		videoBroadcastObj.style.top = "0px";
		videoBroadcastObj.style.left = "0px";
		videoBroadcastObj.style.width = "100%";
		videoBroadcastObj.style.height = "100%";
		videoBroadcastObj.style.visibility = "hidden";
		videoBroadcastObj.style.zIndex = "-1";

		var param = document.createElement("param");
		param.setAttribute("name", "zindex");
		param.setAttribute("value", "0");
		videoBroadcastObj.appendChild(param);
		var param2 = document.createElement("param");
		param2.setAttribute("name", "audio");
		param2.setAttribute("value", "true");
		videoBroadcastObj.appendChild(param2);
		document.body.appendChild(videoBroadcastObj);
	}

	var play = function(param) {
		// var param = {
		// 	url: url,
		// 	position : ""+position,
		// 	fullScreen : ""+fullScreen,
		// 	x : ""+x,
		// 	y : ""+y,
		// 	width : ""+width,
		// 	height : ""+height,
		// 	loop : loop,
		// 	drmScheme : drmScheme,
		// 	drmLicenseUrl : drmLicenseUrl,
		// 	extension : extension
		// };
		var returnObj = {
			code: 0,
			message: "",
			data: param
		};
		return new Promise(function (resolve, reject) {
			if (video == undefined) {
				returnObj.code = 404;
				returnObj.message = "Video Element is Null";
				reject(returnObj);
			}

			if (param.fullScreen == "true" || param.fullScreen == true) {
				video.style.left = "0px";
				video.style.top = "0px";
				if (W.isRDK) {
					video.style.width = "1920px";
					video.style.height = "1080px";
				} else {
					video.style.width = "100%";
					video.style.height = "100%";
				}
			} else {
				video.style.left = param.x+"px";
				video.style.top = param.y+"px";
				video.style.width = param.width+"px";
				video.style.height = param.height+"px";
			}

			//video.loop = param.loop;
			video.playbackRate = 1;
			video.autoPlay = false;
			//video.src = param.url;

			//  var timeoutThread = setTimeout(function() {
			// 	returnObj.code = 408;
			// 	returnObj.message = "Request Timeout";
			// 	reject(returnObj);
			// }, 10000);

			video.onerror = function(e) {
				returnObj.code = video.networkState;
				if (video.networkState == video.NETWORK_EMPTY)
					returnObj.message = "NETWORK_EMPTY";
				else if(video.networkState == video.NETWORK_IDLE)
					returnObj.message = "NETWORK_IDLE";
				else if(video.networkState == video.NETWORK_ERR)
					returnObj.message = "NETWORK_ERR";
				else if(video.networkState == video.NETWORK_LOADING)
					returnObj.message = "NETWORK_LOADING";
				else if(video.networkState == video.NETWORK_NO_SOURCE)
					returnObj.message = "NETWORK_NO_SOURCE";

				returnObj.data = e;
				reject(returnObj);
			}

			//Oipf, RDK box
			if (W.isOIPF || W.isRDK || (!param.drmScheme && param.url.indexOf(".m3u8") == -1)) {

				var _playRequest = function() {
					video.onloadedmetadata = function () {
						if (param.position) {
							video.currentTime = param.position; //sec
						}

						video.play();
						returnObj.code = 200;
						returnObj.message = "Success";
						//clearTimeout(timeoutThread);
						resolve(returnObj);
					};

					video.src = param.url;
				}

				if (param.url.indexOf(".m3u8") > 0) {
					var promise = W.XHRManager.getResponseURL({url: param.url, type: "GET"});

					promise.then(
						function (responseUrl) {
							W.log.info("check if it is redirected");
							if (responseUrl && param.url != responseUrl) {
								W.log.info(" responseUrl: " + responseUrl);
								param.url = responseUrl;
							}

							_playRequest();
						}
					);
				} else
					_playRequest();

			} else {

				if (param.url.indexOf(".mpd") > -1) {
					var _playRequest = function() {
						if (W.ShakaHandler.player_ == undefined) {
							W.ShakaHandler.initShaka();
							setTimeout(function () {
								W.ShakaHandler.load(param.url, param.drmLicenseUrl);
								if (param.position) {
									setTimeout(function () {
										video.currentTime = param.position; //sec
										video.play();
									}, 2000);
								} else
									video.play();

								returnObj.code = 200;
								returnObj.message = "Success";
								resolve(returnObj);
							}, 1000);
						} else {
							setTimeout(function () {
								W.ShakaHandler.load(param.url, param.drmLicenseUrl);
								if (param.position) {
									setTimeout(function () {
										video.currentTime = param.position; //sec
										video.play();
									}, 2000);
								} else
									video.play();

								returnObj.code = 200;
								returnObj.message = "Success";
								resolve(returnObj);
							}, 1000);
						}
					}

					var promise = W.XHRManager.getResponseURL({url: param.url, type: "GET"});

					promise.then(
						function (responseUrl) {
							W.log.info("check if it is redirected");
							if (responseUrl && param.url != responseUrl) {
								W.log.info(" responseUrl: " + responseUrl);
								param.url = responseUrl;
							}

							_playRequest();
						}
					);

				} else {
					W.log.info("HLS Playback!!!");

					var _playRequest = function() {
						window.shakaplayer = new shaka.Player(video);
						// Try to load a manifest.
						// This is an asynchronous process.
						window.shakaplayer.removeEventListener('error', W.ShakaHandler.onErrorEvent_);
						window.shakaplayer.addEventListener('error', W.ShakaHandler.onErrorEvent_);
						window.shakaplayer.load(param.url, 0).then(function () {
							// This runs if the asynchronous load is successful.
							W.log.info('The video has now been loaded!');
							video.play();
							returnObj.code = 200;
							returnObj.message = "Success";
							resolve(returnObj);
						}).catch(function (reason) {
							W.log.info("HLS Playback error!!!");
							W.ShakaHandler.onErrorEvent_(reason);
						});
					}
					//check if it is redirected uri
					if (param.url.indexOf(".m3u8") > 0) {
						var promise = W.XHRManager.getResponseURL({url: param.url, type: "GET"});

						promise.then(
							function (responseUrl) {
								W.log.info("check if it is redirected");
								if (responseUrl && param.url != responseUrl) {
									W.log.info(" responseUrl: " + responseUrl);
									param.url = responseUrl;
								}

								_playRequest();
							});
					} else {
						_playRequest();
					}

				}
			}
		});
	};

	var stop = function() {
		var returnObj = {
			code: 200,
			message: "Success",
			data: undefined
		};
		return new Promise(function(resolve, reject) {
			if (window.shakaplayer == undefined && W.ShakaHandler.player_ == undefined)
				video.src = null;

			if (window.shakaplayer) {
				window.shakaplayer.unload();
				window.shakaplayer = undefined;
			}
			if (W.ShakaHandler.player_) {
				W.ShakaHandler.player_.unload();
				W.ShakaHandler.player_.destroy();
				W.ShakaHandler.player_ = undefined;
			}
			resolve(returnObj);
		});
	};

	/**
	 * Represents MediaPlayer
	 *
	 * @class W.MediaPlayer
	 * @constructor
	 */
	var _mediaPlayer = W.Class.extend({

		//TO DO
		/**
		 * video resize만 할 수 있는 API
		 * playVideo 에 loop 파라미터 추가 width, height 에 100% 추가
		 * video player hide/show
		 * stop 했는데 마지막 프레임 남아 있음
		 */

		/**
		 * request playback
		 * @method playVideo
		 * @param {object} 	url: playback url(mandatory)
		 * 					position: start position sec,
		 * 					fullScreen: whether fullscreen playback,
		 * 					x: x coordinate,
		 * 					y: y corrdinate,
		 * 					width: width,
		 * 					height: height,
		 * 					loop: whether looping,
		 * 					drmScheme: drm scheme string(i.e: 'widevine'). if this is a drm content, mandatory
		 * 					drmLicenseUrl: drm license url, if this is a drm content, mandatory
		 * 					extension: file extension
		 * @return {Promise}
		 */
		playVideo: function(params) {
			W.log.info("playVideo ");
			W.log.inspect(params);
			if (params.url == undefined) {
				return new Promise(function (resolve, reject) {
					var returnObj = {
						code: 404,
						message: "URL is missing",
						data: undefined
					};
					reject(returnObj);
				});
			}

			if (params.loop == true)
				isLooping = true;
			else
				isLooping = false;

			if (!W.isPureBrowser)
				return W.NativeBridge.getMediaPlayer().playVideo(params);
			else {
				return play(params);
			}
		},
		/**
		 * request playback with background mode
		 * @method playBackgroundVideo
		 * @param {object} url, drmScheme, drmLicenseUrl, extension
		 * @return {Promise}
		 */
		playBackgroundVideo: function(params) {
			W.log.info("playBackgroundVideo " + params.url);
			if (params.url == undefined)
				throw new Error("URL is missing");

			//params.loop = true;
			params.fullScreen = true;

			if (!W.isPureBrowser)
				return W.NativeBridge.getMediaPlayer().playBackgroundVideo(params);
			else {
				return play(params);
			}
		},
		/**
		 * request pause
		 * @method pauseVideo
		 * @param
		 * @return {Promise}
		 */
		pauseVideo: function() {
			W.log.info("pauseVideo");
			if (!W.isPureBrowser)
				return W.NativeBridge.getMediaPlayer().pauseVideo();
			else {
				return new Promise(function(resolve, reject) {
					var returnObj = {
						code: 200,
						message: "Success",
						data: undefined
					};
					video.pause();
					resolve(returnObj);
				});
			}
		},
		/**
		 * request resume playback
		 * @method resumeVideo
		 * @param
		 * @return {Promise}
		 */
		resumeVideo: function() {
			W.log.info("resumeVideo");
			if (!W.isPureBrowser)
				return W.NativeBridge.getMediaPlayer().resumeVideo();
			else {
				return new Promise(function(resolve, reject) {
					var returnObj = {
						code: 200,
						message: "Success",
						data: undefined
					};
					video.play();
					resolve(returnObj);
				});
			}
		},
		/**
		 * request stop playback
		 * @method stopVideo
		 * @param
		 * @return {Promise}
		 */
		stopVideo: function() {
			W.log.info("stopVideo");
			if (!W.isPureBrowser)
				return W.NativeBridge.getMediaPlayer().stopVideo();
			else {
				return stop();
			}
		},
		/**
		 * request total duration of video
		 * @method getVideoDuration
		 * @param
		 * @return {Promise}	{data:{duration:_duration}}
		 */
		getVideoDuration: function() {
			W.log.info("getVideoDuration");
			if (!W.isPureBrowser)
				return W.NativeBridge.getMediaPlayer().getVideoDuration();
			else {
				return new Promise(function(resolve, reject) {
					var returnObj = {
						code: 200,
						message: "Success",
						data: { duration: video.duration}
					};
					resolve(returnObj);
				});
			}
		},
		/**
		 * request current position of video
		 * @method getVideoPosition
		 * @param
		 * @return {Promise}	{data:{duration:_position}}
		 */
		getVideoPosition: function() {
			W.log.info("getVideoPosition ");
			if (!W.isPureBrowser)
				return W.NativeBridge.getMediaPlayer().getVideoPosition();
			else {
				return new Promise(function(resolve, reject) {
					var returnObj = {
						code: 200,
						message: "Success",
						data: { position: video.currentTime}
					};
					resolve(returnObj);
				});
			}
		},
		/**
		 * request to change current position
		 * @method setVideoPosition
		 * @param {int} position new position
		 * @return {Promise}
		 */
		setVideoPosition: function(position) {
			W.log.info("setVideoPosition " + position);
			var param = {position: ""+position};
			//var param = {position:"5"};
			if (!W.isPureBrowser)
				return W.NativeBridge.getMediaPlayer().setVideoPosition(position);
			else {
				return new Promise(function(resolve, reject) {
					var returnObj = {
						code: 200,
						message: "Success",
						data: undefined
					};
					video.currentTime = position;
					resolve(returnObj);
				});
			}
		},
		/**
		 * request skip forward or backward
		 * @method skip
		 * @param {int} sec amount of seconds to change position
		 * @return {Promise}
		 */
		skip: function(sec) {
			W.log.info("skip " + sec);
			// skipSeconds 가 +/- 인지에 따라서 앞으로도 뒤로도 점프함
			//var param = {skipSeconds:"5"};
			var param = {skipSeconds:sec};

			if (!W.isPureBrowser)
				return W.NativeBridge.getMediaPlayer().skip(sec);
			else {
				return new Promise(function(resolve, reject) {
					var returnObj = {
						code: 200,
						message: "Success",
						data: undefined
					};
					video.currentTime = video.currentTime + sec;
					resolve(returnObj);
				});
			}
		},
		/**
		 * request to change playback rate(speed)
		 * @method setRate
		 * @param {int} rate playback rate(speed) to change
		 * @return {Promise}
		 */
		setRate : function(rate) {
			W.log.info("setRate " + rate);
			if (!W.isPureBrowser)
				return W.NativeBridge.getMediaPlayer().setRate(rate);
			else {
				return new Promise(function(resolve, reject) {
					var returnObj = {
						code: 200,
						message: "Success",
						data: undefined
					};
					video.playbackRate = rate;
					resolve(returnObj);
				});
			}
		},
		/**
		 * add event listener
		 *
		 * In case of Android and iOS platform,
		 * The W.MediaPlayer only supports "play" "timeupdate" "ended" and "error" events.
		 * In this case, a client MUST use "play" event to check whether or not a request for playing is successful.
		 *
		 * @method addMediaEventListener
		 * @param {String} fnName function name for listening
		 * @param {function} fn listener function
		 * @return {Promise}
		 */
		addMediaEventListener: function (fnName, fn) {
			W.log.info("addMediaEventListener " + fnName);
			var eventFnName;

			if (fnName === "ended") {
				eventFnName = "ended";
			} else if (fnName === "loadeddata") {
				eventFnName = "loadeddata";
			} else if (fnName === "timeupdate") {
				eventFnName = "timeupdate";
			} else if (fnName === "error") {
				eventFnName = "error";
			} else {
				throw new Error(fnName + " is Not Supported Event");
			}
			if (!W.isPureBrowser) {
				return W.NativeBridge.getMediaPlayer().addMediaEventListener(fnName, fn);
			} else {

				return new Promise(function(resolve, reject) {
					var returnObj = {
						code: 200,
						message: "Success",
						data: undefined
					};
					video.addEventListener(eventFnName, fn);
					resolve(returnObj);
				});
			}
		},
		/**
		 * remove event listener
		 * @method removeMediaEventListener
		 * @param {String} fnName function name for removing listener
		 * @param {function} fn listener function
		 * @return {Promise}
		 */
		removeMediaEventListener: function(fnName, fn) {
			W.log.info("removeMediaEventListener " + fnName);

			if (fnName === "ended") {
			} else if (fnName === "loadeddata") {
			} else if (fnName === "timeupdate") {
			} else if (fnName === "error") {
			} else {
				throw new Error(fnName + " is Not Supported Event");
			}
			if (!W.isPureBrowser) {

				return W.NativeBridge.getMediaPlayer().removeMediaEventListener(fnName, fn);
			} else {

				return new Promise(function(resolve, reject) {
					var returnObj = {
						code: 200,
						message: "Success",
						data: undefined
					};
					video.removeEventListener(fnName, fn);
					resolve(returnObj);
				});
			}
		},

		isLooping: function() {
			return isLooping;
		}
	});

	var mediaPlayer = new _mediaPlayer();

	return mediaPlayer;
});

//W.define("Version", function() { return {ver:"1.000", date:"201403"}});
//W.define("Version", function() { return {ver:"2.001", date:"20171108", desc:"adding touch event"}});
//W.define("Version", function() { return {ver:"2.002", date:"20171115", desc:["Adding gesture event","Applied modification by Jean511"]}});
W.define("Version", function() { return {ver:"2.003", date:"20180115", desc:["Implement NativeBridge"]}});
