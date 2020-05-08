W.defineModule("LocalDataManager", [
    "Log"
], function(
	Log
) {
    'use strict';
	var log = new Log();
	log.setLog("LocalDataManager", W.log.DEBUG);

    var getData = function(_key) {
    	if (_key == undefined)
    		return undefined;

    	log.info("key "  + _key);
    	log.info("data "  + localStorage.getItem(_key));
    	return localStorage.getItem(_key);
    };

    var setData = function(_key, _value) {
    	if (_key == undefined)
    		return;

    	try {
    		log.info("key "  + _key);
    		log.info("value "  + _value);
    		localStorage.setItem(_key, _value);
    	} catch(err) {
    		log.error(err);
    	}
    };

    var setJsonData = function(_key, _value) {
    	try {
    		log.info("key "  + _key);
			var jsonData = JSON.stringify(_value);
			log.info("jsonData "  + jsonData);
			localStorage.setItem(_key, jsonData);
		}catch(err){
			log.error(err);
		}
    };

    var getJsonData = function(_key) {
    	if (_key == undefined)
    		return undefined;

    	try {
    		log.info("key "  + _key);
    		log.info("data "  + localStorage.getItem(_key));
    		var data = JSON.parse(localStorage.getItem(_key));
    		return data;
    	} catch(err) {
    		log.error(err);
    	}
    };

    var removeData = function(_key) {
    	if (_key == undefined)
    		return undefined;

    	try {
    		log.info("removeData "  + _key);
    		localStorage.removeItem(_key);
    	} catch(err) {
    		log.error(err);
    	}
    };

    var isJson = function(str) {
        try {
            if (typeof JSON.parse(str) == "object")
				return true;
			else
				return false;
        } catch (e) {
            return false;
        }
    };

    /**
     * manage local data(localStorage on Browser)
     * @class LocalDataManager
     * @constructor
     */
    var _localDataManager = W.Class.extend({

    	visible : false,

    	initialize: function() {
			log.info("initialize");
    	    var _this = this;

            this.KEY = {};
            this.KEY["FT_CREATE_FROM"] = "FT_CREATE_FROM";
            this.KEY["FT_CREATE_TO"] = "FT_CREATE_TO";
            this.KEY["FT_SIZE_FROM"] = "FT_SIZE_FROM";
            this.KEY["FT_SIZE_TO"] = "FT_SIZE_TO";
            this.KEY["FT_FILE_NAME"] = "FT_FILE_NAME";
        },

    	set : function(_key, _value) {
    		log.info("set "  + _key);

    		if (typeof(_value) == "object")
    			setJsonData(_key, _value);
    		else
    			setData(_key, _value);
    	},

    	get : function(_key) {
    		log.info("get "  + _key);

    		var _value = getData(_key);

    		if (isJson(_value))
    			return getJsonData(_key);
    		else
    			return _value;
    	},

    	reset : function() {
    		log.info("reset");
    		localStorage.clear();
    	},

    	resetLocalData : function() {
    		log.info("resetLocalData");
    		for (var key in this.KEY_MAP) {
    			removeData(key);
    		}
    	}
    });

    var LocalDataManager = new _localDataManager();
    LocalDataManager.initialize();
    return LocalDataManager;
});
