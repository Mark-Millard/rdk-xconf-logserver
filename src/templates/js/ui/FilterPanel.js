W.defineModule("ui/FilterPanel", ["Log"], function(Log) {
  //"use strict";
  var log = new Log();
  log.setLog("FilterPanel", W.log.DEBUG);

    var _this;
    var scene;

    var createGt;
    var createLt;
    var sizeGt;
    var sizeLt;
    var name;

    var cStart = document.getElementById("start_date");
    var cEnd = document.getElementById("end_date");
    var cSizeGt = document.getElementById("size_from");
    var cSizeLt = document.getElementById("size_to");
    var cName = document.getElementById("file_name");
    
    var loadSavedFilter = function() {
        cStart.value = "";
        cEnd.value = "";
        cSizeGt.value = "";
        cSizeLt.value = "";
        cName.value = "";
        /*
        createGt = APP.LocalDataManager.get(APP.LocalDataManager.KEY.FT_CREATE_FROM);
        createLt = APP.LocalDataManager.get(APP.LocalDataManager.KEY.FT_CREATE_TO);
        sizeGt = APP.LocalDataManager.get(APP.LocalDataManager.KEY.FT_SIZE_FROM);
        sizeLt = APP.LocalDataManager.get(APP.LocalDataManager.KEY.FT_SIZE_TO);
        name = APP.LocalDataManager.get(APP.LocalDataManager.KEY.FT_FILE_NAME);

        if (createGt)
            cStart.value = createGt;
        if (createLt)
            cEnd.value = createLt;
        if (sizeGt)
            cSizeGt.value = sizeGt;
        if (sizeLt)
            cSizeLt.value = sizeLt;
        if (name)
            cName.value = name;
        */
    }

    var saveFilter = function() {
        APP.LocalDataManager.set(APP.LocalDataManager.KEY.FT_CREATE_FROM, createGt);
        APP.LocalDataManager.set(APP.LocalDataManager.KEY.FT_CREATE_TO, createLt);
        APP.LocalDataManager.set(APP.LocalDataManager.KEY.FT_SIZE_FROM, sizeGt);
        APP.LocalDataManager.set(APP.LocalDataManager.KEY.FT_SIZE_TO, sizeLt);
        APP.LocalDataManager.set(APP.LocalDataManager.KEY.FT_FILE_NAME, name);
    }

    var clear = function(evt) {
        log.info("clear")
        evt.cancelBubble = true;

        createGt = "";
        createLt = "";
        sizeGt = "";
        sizeLt = "";
        name = "";
        cStart.value = "";
        cEnd.value = "";
        cSizeGt.value = "";
        cSizeLt.value = "";
        cName.value = "";
        //saveFilter();
    }

    var search = function(evt) {
        log.info("search");
        createGt = cStart.value;
        createLt = cEnd.value;
        sizeGt = cSizeGt.value;
        sizeLt = cSizeLt.value;
        name = cName.value;
        // check validation
        if (createGt && !APP.Util.checkDateString(createGt))
            return;
        if (createLt && !APP.Util.checkDateString(createLt))
            return;
        if (sizeGt && !APP.Util.checkNumeric(sizeGt))
            return;
        if (sizeLt && !APP.Util.checkNumeric(sizeLt))
            return;

        var cgt;
        if (createGt) {
            cgt = createGt + "T00:00:00Z";
        }
        var clt;
        if (createLt) {
            clt = createLt + "T23:59:59Z";
        }
        saveFilter();
        scene.requestInfo(cgt, clt, sizeGt, sizeLt, name);
        evt.cancelBubble = true;
    }

    var createComponent = function() {
        var comp = new W.Div({ id: "filter_panel", position:"fixed",
                x: 0, y: 0, width: 240, height: "100%", color: "rgb(255,255,255)" });
        // upper space
        comp.add(new W.Div({className:"new_line", height: 80}));

        // title
        var t = new W.Div({className:"new_line", paddingLeft: "20px"});
        t.add(new W.Image({className: "f_left", src:"left_menu_icon02.png"}));     
        t.add(new W.Span({className: "f_left font_filter_title", paddingLeft: "14px", text:"Filter"}));     
        comp.add(t);
        // space
        comp.add(new W.Div({className:"new_line", height: 20}));
        // create date: 
        var d = new W.Div({className:"new_line", paddingLeft: "20px", height: 30});
        d.add(new W.Image({className:"f_left", paddingTop: "11px", paddingRight:"10px", src:"bul_s_tit.png"}));
        d.add(new W.Span({className: "f_left font_filter_item", paddingTop: "5px", text:"Create Date"}))
        comp.add(d);
        comp.add(new W.Span({className:"new_line font_filter_item", text:"~", lineHeight: 3,height:20}));
        // space
        comp.add(new W.Div({className:"new_line", height: 30}));
        // File size
        d = new W.Div({className:"new_line", paddingLeft: "20px", height: 30});
        d.add(new W.Image({className:"f_left", paddingTop: "11px", paddingRight:"10px", src:"bul_s_tit.png"}))
        d.add(new W.Span({className: "f_left font_filter_item", paddingTop: "5px", text:"File Size (bytes)"}))
        comp.add(d);
        comp.add(new W.Span({className:"new_line font_filter_item", text:"~", lineHeight: 3,height:20}));
        // space
        comp.add(new W.Div({className:"new_line", height: 30}));
        // File name
        d = new W.Div({className:"new_line", paddingLeft: "20px", height: 30});
        d.add(new W.Image({className:"f_left", paddingTop: "11px", paddingRight:"10px", src:"bul_s_tit.png"}))
        d.add(new W.Span({className: "f_left font_filter_item", paddingTop: "5px", text:"File Name"}))
        comp.add(d);
        // space
        comp.add(new W.Div({className:"new_line", height: 60}));
        // Search
        d = new W.Div({className:"new_line", paddingLeft: "20px", height: 30});
        d.add(new W.Span({className:"btn btn-dark f_right", onclick:search, width: 40, height: 15, marginRight: "37px", text:"Search"}));
        //d.onPointerClicked = search;
        //d.onTouchEnd = search;
        comp.add(d);
        // All Clear
        var a = new W.Span({id:"clear", className:"btn btn-dark f_right", 
                width: 40, height: 15, onclick:clear, marginRight: "10px", text:"Clear"});
        //a.onPointerClicked = clear;
        //a.onTouchEnd = clear;
        d.add(a);
        
        return comp;
    };

    var FilterPanel = W.UI.extend({
        name: "FilterPanel",

        create: function(sc, _param) {
            log.info("init");
            scene = sc;
            _this = this;
            this.comp = createComponent(this);
            loadSavedFilter();
        },
        show: function(mode, init) {
            this.mode = APP.Config.MODE_ACTIVE;
            this._super("show", mode, init);
        },
        hide: function() {
            this._super("hide");
        },
        updateView: function(init) {
            log.info("updateView " + this.visible);
        },
        onKeyPressed: function(evt) {
            log.info("onKeyPressed ");
            return false;
        }
  });

  return FilterPanel;


});
