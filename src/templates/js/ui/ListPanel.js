W.defineModule("ui/ListPanel", ["Log"], function(Log) {
  "use strict";
  var log = new Log();
  log.setLog("ListPanel", W.log.DEBUG);

    var PAGE_OPT = [10,20,50,100];
    var _this;
    var scene;
    var curPage;
    var totalPage;
    var curRowCount = 0;
    var pageRowCount = 10;
    var data;

    var compTotalNum;

    var onchangeOption = function(evt) {
        console.log(evt.target.selectedIndex);
        var before = pageRowCount;
        pageRowCount = PAGE_OPT[evt.target.selectedIndex];
        totalPage = Math.floor((data.length+pageRowCount-1)/pageRowCount);
        if (before != pageRowCount) {
            curPage = 0;
            curRowCount = 0;
            createTable(0, pageRowCount-1);
        }
    }

    var resetData = function(_data) {
        curPage = 0;
        curRowCount = 0;
        totalPage = 0;
        data = _data;
        totalPage = Math.floor((data.length+pageRowCount-1)/pageRowCount);
        compTotalNum.setStyle({text:"Total: "+data.length});
        createTable(curPage*pageRowCount, ((curPage+1)*pageRowCount) -1);
    }

    var download = function(evt) {
        var idx = evt.target._wobj.idx;
        console.log("download " + idx);

        APP.XConfServer.downoladLog(data[idx].fileName);

        evt.cancelBubble = true;
    }

    var gotoFirst = function(evt) {
        if (curPage != 0) {
            curPage = 0;
            createTable(curPage*pageRowCount, ((curPage+1)*pageRowCount) -1);
        }
        evt.cancelBubble = true;
    }

    var gotoPrev = function(evt) {
        if (curPage > 9) {
            curPage = Math.floor((curPage-10)/10) * 10;
            createTable(curPage*pageRowCount, ((curPage+1)*pageRowCount) -1);
        }
        evt.cancelBubble = true;
    }

    var gotoNext = function(evt) {
        if (curPage < totalPage-1) {
            curPage = Math.floor((curPage+10)/10) * 10;
            createTable(curPage*pageRowCount, ((curPage+1)*pageRowCount) -1);
        }
        evt.cancelBubble = true;
    }

    var gotoLast = function(evt) {
        if (totalPage > 0 && curPage != totalPage -1) {
            curPage = totalPage -1;
            createTable(curPage*pageRowCount, ((curPage+1)*pageRowCount) -1);
        }
        evt.cancelBubble = true;
    }

    var gotoPage = function(evt) {
        var idx = evt.target._wobj.idx;
        curPage = idx;
        createTable(curPage*pageRowCount, ((curPage+1)*pageRowCount) -1);
        evt.cancelBubble = true;
    }

    var refreshPage = function() {
        compTotalNum.setStyle({text:"Total: "+data.length});
        createTable(curPage*pageRowCount, ((curPage+1)*pageRowCount) -1);
    }

    var deleteLog = function(evt) {
        var idx = evt.target._wobj.idx;
        evt.cancelBubble = true;
        if (confirm("Do you want to delete the log file? \n" +
                    "File Name: " + data[idx].fileName + "\n" +
                    "This is not recoverable.")) {
            
            var promise = APP.XConfServer.deleteLog(data[idx].fileName);
            promise.then(
                function(result) {
                    log.inspect(JSON.parse(result));
                    data.splice(idx, 1);
                    refreshPage();
                }
            )["catch"](function() {
               log.error("deleteLog error");
               alert("Failed to delete the log file!!");
            });
        }
    }

    var createRow = function(idx, table) {
        var row = new W.Div({className: "tb_r", width:"100%"});
        table.add(row);

        var c = new W.Div({className: "tb_c", width:"5%"});
        c.add(new W.Span({className: "t_txt", text:idx+1}));
        row.add(c);
        c = new W.Div({className: "tb_c", width:"55%"})
        c.add(new W.Span({className: "t_txt", text:data[idx].fileName}));
        row.add(c);
        c = new W.Div({className: "tb_c", width:"20%"})
        c.add(new W.Span({className: "t_txt", text:data[idx].createDate}));
        row.add(c);
        c = new W.Div({className: "tb_c", width:"10%"})
        c.add(new W.Span({className: "t_txt", text:data[idx].size}));
        row.add(c);
        c = new W.Div({className: "tb_c", width:"10%"});
        var down = new W.Span({className: "t_txt demo-icon", cursor:"pointer", 
                pointer:"all", title:"downolad", paddingTop: "15px", text:"\ue803"});
        down.onPointerClicked = download;
        down.onTouchEnd = download;
        down.idx = idx;
        c.add(down);
        c.add(new W.Span({className: "t_txt", paddingRight: "4px", text:""}));
        var del = new W.Span({className: "t_txt demo-icon", cursor:"pointer", 
                pointer:"all", title:"delete", paddingTop: "15px", text:"\ue804"})
        del.onPointerClicked = deleteLog;
        del.onTouchEnd = deleteLog;
        del.idx = idx;        
        c.add(del);
        row.add(c);
        table.add(new W.Div({className:"t_r_line"}));
    }

    var createTable = function(startIdx, endIdx) {
        log.info("createPage");
        // remove
        var tb = _this.comp.children.get("tb");
        for (var i=0; i<tb.children.size();) {
            tb.remove(tb.children.elementAt(i));
        }
        
        var row;
        var c;
        // title
        row = new W.Div({className: "tb_t", width:"100%"});
        tb.add(row);
        c = new W.Div({className: "tb_c", width:"5%"});
        c.add(new W.Span({className: "t_title", text:"No"}));
        row.add(c);
        c = new W.Div({className: "tb_c", width:"55%"})
        c.add(new W.Span({className: "t_title", text:"File Name"}));
        row.add(c);
        c = new W.Div({className: "tb_c", width:"20%"})
        c.add(new W.Span({className: "t_title", text:"Created Date"}));
        row.add(c);
        c = new W.Div({className: "tb_c", width:"10%"})
        c.add(new W.Span({className: "t_title", text:"Size"}));
        row.add(c);
        c = new W.Div({className: "tb_c", width:"10%"})
        c.add(new W.Span({className: "t_title", text:""}));
        row.add(c);
        console.log("data loength "+data.length)
        for (var i=startIdx; i<=endIdx; i++) {
            if (data.length > i) {
                curRowCount++;
                createRow(i, tb);
            } else
                break;
        }
        updateView();
        createPaging();
    }

    var createPaging = function() {
        var paging = _this.comp.children.get("paging");

        //remove all
        for (var i=0; i<paging.children.size();) {
            paging.remove(paging.children.elementAt(i));
        }

        var f = new W.Image({className:"page", pointer:"all", src:"page_icon_arrow01.png"});
        f.onPointerClicked = gotoFirst;
        f.onTouchEnd = gotoFirst;
        paging.add(f);

        paging.add(new W.Span({className:"page_g"}));
        f = new W.Image({className:"page", pointer:"all", src:"page_icon_arrow02.png"});
        paging.add(f);
        f.onPointerClicked = gotoPrev;
        f.onTouchEnd = gotoPrev;
        paging.add(new W.Span({className:"page_g"}));
        
        // number of page
        var startPage = Math.floor(curPage/10) * 10; 
        for (var i=startPage, n=0; n<10 && i<totalPage; n++,i++) {
            if (i == curPage)
                f = new W.Span({className:"page page_b", pointer:"all", text:(i+1)})
            else 
                f = new W.Span({className:"page", pointer:"all", text:(i+1)})
            
            paging.add(f);
            f.idx = i;
            f.onPointerClicked = gotoPage;
            f.onTouchEnd = gotoPage;
            paging.add(new W.Span({className:"page_g"}));
        }

        f = new W.Image({className:"page", pointer:"all", src:"page_icon_arrow03.png"})
        paging.add(f);
        f.onPointerClicked = gotoNext;
        f.onTouchEnd = gotoNext;
        paging.add(new W.Span({className:"page_g"}));
        f = new W.Image({className:"page", pointer:"all", src:"page_icon_arrow04.png"})
        paging.add(f);
        f.onPointerClicked = gotoLast;
        f.onTouchEnd = gotoLast;
    }

    var createComponent = function() {
        var comp = new W.Div({ id: "list_panel", position: "relative"});
        // upper space
        comp.add(new W.Div({className: "new_line", height:123}));
        // title 
        var t = new W.Div({className: "new_line", height:40});
        t.add(new W.Image({className:"f_left", paddingTop: "9px", paddingRight:"10px", src:"bul_s_tit.png"}))
        t.add(new W.Span({className:"f_left font_title", text:"XConf Log File List"}))
        comp.add(t);
        // select option
        var s = new W.Div({className: "new_line", id:"selector", position: "inherit", height:40});
        comp.add(s);
        var selectList = document.createElement("select");
        selectList.setAttribute("class", "page_opt");
        selectList.setAttribute("style", "width:70px;height:30px;");
        selectList.id = "select";
        for (var i = 0; i < PAGE_OPT.length; i++) {
            var option = document.createElement("option");
            option.value = PAGE_OPT[i];
            option.text = PAGE_OPT[i];
            selectList.appendChild(option);
        }
        s.comp.appendChild(selectList);
        selectList.onchange = onchangeOption;
        // total number
        compTotalNum = new W.Span({id:"total_num", text:"Total : 0"});
        s.add(compTotalNum, undefined, 1);
        // list
        comp.add(new W.Div({id: "tb", position: "inherit"}));
        // pagination
        comp.add(new W.Div({className:"new_line", height:30}));
        comp.add(new W.Div({id: "paging", className:"new_line"}));
        // lower space
        comp.add(new W.Div({className:"new_line", height:40}));
        return comp;
    };

    var updateView = function() {
    }

    var ListPanel = W.UI.extend({
        name: "ListPanel",

        create: function(sc, _param) {
            log.info("init");
            scene = sc;
            _this = this;
            this.comp = createComponent(this);
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
        },
        resetData: resetData
  });

  return ListPanel;


});
