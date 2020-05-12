W.defineModule("XConfServer", [
    "Log"
], function(
    Log
) {
    'use strict';
    var log = new Log();
    log.setLog("XConfServer", W.log.DEBUG);

    return {
        test: function() {
            var url = APP.Config.BASE_URI + "/test";
            var requestHeader = {
                //"Content-Type" : "application/json"
            };
            var desc = {
                url : url,
                type : "GET",
                requestHeader : requestHeader,
                data : undefined
            }
            return W.XHRManager.send(desc);
        },
        info: function(createGt, createLt, sizeGt, sizeLt, name) {
            var url = APP.Config.BASE_URI + "/info";
            var queryString = "";
            if (createGt) {
                queryString += "create_date.gt="+createGt;
            }
            if (createLt) {
                queryString += queryString.length>0?"&":"";
                queryString += "create_date.lt="+createLt;
            }
            if (sizeGt) {
                queryString += queryString.length>0?"&":"";
                queryString += "size.gt="+sizeGt;
            }
            if (sizeLt) {
                queryString += queryString.length>0?"&":"";
                queryString += "size.lt="+sizeLt;
            }
            if (name) {
                queryString += queryString.length>0?"&":"";
                queryString += "file_name="+name;
            }
            url = url + (queryString.length>0?"?"+queryString:"");
            var requestHeader = {
                //"Content-Type" : "application/json"
            };
            var desc = {
                url : url,
                type : "GET",
                requestHeader : requestHeader,
                data : undefined
            }
            return W.XHRManager.send(desc);
        },
        getDownoladUrl: function(fileName) {
            //http://{{ip_address}}:8080/api/{{version}}/logs/download?name={{file_name}}
            return APP.Config.BASE_URI + "/download?name="+fileName;
        },
        deleteLog: function(fileName) {
            var url = APP.Config.BASE_URI + "/" + fileName;
            var requestHeader = {
                //"Content-Type" : "application/json"
            };
            var desc = {
                url : url,
                type : "DELETE",
                requestHeader : requestHeader,
                data : undefined
            }
            return W.XHRManager.send(desc);
        },
        downoladLog: function(fileName) {
            var fileUrl = APP.Config.BASE_URI + "/download?name="+fileName;
            if (APP.Config.BASE_URI == "http://192.168.1.121:8080/api/v1/logs")
                fileUrl = "http://henrysykim.tplinkdns.com:7000/webui.tar.gz";

            window.URL = window.URL || window.webkitURL;

            var xhr = new XMLHttpRequest();
            var a = document.createElement('a'), file;
            
            xhr.open('GET', fileUrl, true);
            xhr.responseType = 'blob';
            xhr.onload = function () {
                file = new Blob([xhr.response], { type : 'application/octet-stream' });
                a.href = window.URL.createObjectURL(file);
                a.download = fileName;
                a.click();
                a.remove();
            };
            xhr.send();
        }
    }
});