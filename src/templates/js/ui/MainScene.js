W.defineModule(
  "ui/MainScene",
  [
    "Log",
    "Util",
    "LocalDataManager",
    "XConfServer",
    "ui/FilterPanel",
    "ui/ListPanel",
    "ui/TopPanel"
  ],
  function(
    Log,
    Util,
    LocalDataManager,
    XConfServer,
    FilterPanel,
    ListPanel,
    TopPanel
  ) {
    "use strict";
    var log = new Log();
    log.setLog("MainScene", W.log.DEBUG);

    APP.Util = Util;
    APP.XConfServer = XConfServer;
    APP.LocalDataManager = LocalDataManager;
    var topPanel;
    var filterPanel;
    var listPanel;
    var _this;

    var createComponent = function() {
      // top panel
      topPanel = new TopPanel();
      topPanel.create(_this);
      _this.add(topPanel.getComponent());

      var middle = new W.Div({id:"middle_panel"});
      _this.add(middle);

      // left panel
      filterPanel = new FilterPanel();
      filterPanel.create(_this);
      middle.add(filterPanel.getComponent());

      // right panel
      var right = new W.Div({position:"fixed", id:"right_panel", x:0, y:0, height: "100%"});
      var container = new W.Div({id:"container", x:0, y:0, height: "100%"});
      
      listPanel = new ListPanel();
      listPanel.create(_this);
      container.add(listPanel.getComponent());
      right.add(container);
      middle.add(right);
    }

    var windowResized = function() {
      var width = window.innerWidth;
      if (width < 1000) {
        filterPanel.setStyle({display:"none"});
        //if (width > 500)
        //  listPanel.setStyle({width:width});
      } else {
        filterPanel.setStyle({display:""});
        //listPanel.setStyle({width:Math.min(width-240, 1100)});
      }
    }

    var requestInfo = function(createGt, createLt, sizeGt, sizeLt, name) {
      var promise = APP.XConfServer.info(createGt, createLt, sizeGt, sizeLt, name);
      promise.then(
          function(result) {
              //log.inspect(JSON.parse(result));
              var data = JSON.parse(result).info;
              listPanel.resetData(data);
          }
      )["catch"](function() {
         log.error("requestInfo error");
      });
    }

    return W.Scene.extend({
      onCreate: function(param) {
        _this = this;
        this.setKeys([W.KEY.ALL]);
        this.setStyle({});
        createComponent();
        //window.addEventListener("resize", windowResized);
        log.info("onCreate");
      },
      onStart: function(param) {
        log.info("onStart");
        _this = this;
        requestInfo();
      },
      onKeyPressed: function(event) {
        log.info("onKeyPressed " + event.keyCode);
        return false;
      },
      requestInfo: function(createGt, createLt, sizeGt, sizeLt, name) {
        requestInfo(createGt, createLt, sizeGt, sizeLt, name);
      }
    });
  }
);
