W.defineModule("Util", [
    "Log"
], function(
    Log
) {
    var log = new Log();
    log.setLog("Util", W.log.DEBUG);

    var clockThreadTimer;

    var clockThread = function(sec) {
        //log.info("clockThread " + sec);
        var executeTime = 60;
        if (sec)
            executeTime = sec;

        fireClockEvent();

        clockThreadTimer = setTimeout(function() {
            clockThread(60- (new Date()).getSeconds());
        }, executeTime*1000);
    };

    var fireClockEvent = function() {
        //log.info("fireClockEvent");
        var evt = W.createCustomEvent("ClockNotify", true, false,
            {
                date : new Date()
            });
        document.dispatchEvent(evt);
    };

    var util = W.Class.extend({
        getDateString: function(date, pattern) {
            var str = date.toISOString();
            var hour = date.getHours();
            var min = date.getMinutes();
            var sec = date.getSeconds();

            if (pattern == "MM.DD HH:mm") {
                str = str.substring(5, 7) + "." + str.substring(8, 10)
                    + " " + (hour < 10 ? "0" + hour : hour)
                    + ":" + (min < 10 ? "0" + min : min);
            } else if (pattern == "HH:mm") {
                str =  (hour < 10 ? "0" + hour : hour)
                    + ":" + (min < 10 ? "0" + min : min);
            } else if (pattern == "HH:mm:ss SSS") {
                str =  (hour < 10 ? "0" + hour : hour)
                    + ":" + (min < 10 ? "0" + min : min)
                    + ":" + (sec < 10 ? "0" + sec : sec)
                    + " " + str.substring(str.length-4, str.length-1);
            }
            return str;
        },
        //return 05.09(MON) HH:mm ~ HH:mm
        getFromToString: function(fromDate, endDate, includeDate) {
            var str = "";
            var hourF = fromDate.getHours();
            var minF = fromDate.getMinutes();

            var hourT = endDate.getHours();
            var minT = endDate.getMinutes();

            if (includeDate) {
                str += this.changeDigit((fromDate.getMonth() + 1), 2) + ".";
                str += this.changeDigit((fromDate.getDate()), 2);
                var day = fromDate.getDay();

                if (day == 1) {
                    str += "(MON) ";
                } else if (day == 2) {
                    str += "(TUE) ";
                } else if (day == 3) {
                    str += "(WED) ";
                } else if (day == 4) {
                    str += "(THU) ";
                } else if (day == 5) {
                    str += "(FRI) ";
                } else if (day == 6) {
                    str += "(SAT) ";
                } else if (day == 7) {
                    str += "(SUN) ";
                }
            }
            str += (hourF < 10 ? "0" + hourF : hourF) + ":" + (minF < 10 ? "0" + minF : minF) + " ~ ";
            str += (hourT < 10 ? "0" + hourT : hourT) + ":" + (minT < 10 ? "0" + minT : minT);

            return str;
        },
        addClockEventListener : function(handler) {
            if (clockThreadTimer == undefined)
                clockThread(60- (new Date()).getSeconds());

            log.info("addClockEventListener()");
            document.addEventListener("ClockNotify", handler, false);
            fireClockEvent();
        },
        removeClockEventListener : function(handler) {
            log.info("removeClockEventListener()");
            document.removeEventListener("ClockNotify", handler, false);
        },
        /**
         숫자를 문자로 반환, length 값으로 앞에 '0'을 채운다.
         */
        changeDigit : function(num,digit){
            var _tmpStr = "";
            if(num.toString().length<digit){
                for(var i=0;i<(digit-num.toString().length);i++){
                    _tmpStr+="0";
                }
            }
            return _tmpStr+num;
        },
        //Font Width 계산하기
        calcFontWidth : function (text, fontSize, fontFamily){

            var element =  document.createElement("canvas");
            var context = element.getContext('2d');
            var result = null;
            var tempSize = fontSize.toString();

            if(tempSize.indexOf("px") ==-1)
                tempSize = fontSize + "px";
            else tempSize = fontSize;

            context.font = tempSize+" "+fontFamily;
            result = context.measureText(text).width;

            element = undefined;
            context = undefined;

            return result;
        },
        checkDateString: function(str) {
            var dstr = new Date(str).toDateString("yyyy-MM-dd");
            if (dstr == "Invalid Date") {
                alert("Wrong Date Format");
                return false;
            }
            return true;
        },
        checkNumeric: function(str) {
            if (isNaN(Number(str))) {
                return false;
            }
            return true;
        }
    });

    var Util = new util();
    return Util;
});
