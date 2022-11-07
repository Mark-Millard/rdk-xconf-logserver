W.defineModule("Config", [], function() {
    'use strict';

    var uiVersion = "0.0.0";
    var isLog = true;

    return {
      UI_VERSION: uiVersion,
      IMAGE_PATH: "resource/images/",

      // Set BASE_URI to the URL for the XConf Log Server RESTful API.
      //BASE_URI: "http://52.7.35.185:8080/api/v1/logs",
      BASE_URI: "http://192.168.1.41:8080/api/v1/logs"
    };
  });
