W.defineModule("ui/TopPanel", ["Log"], function(Log) {
  "use strict";
  var log = new Log();
  log.setLog("TopPanel", W.log.DEBUG);

    var _this;
    var scene;
    var createComponent = function() {
        var comp = new W.Div({ id: "top_panel" });
        comp.add(new W.Div({position:"inherit", y:61, width:"100%", height: 2, color: "rgb(0,48,87)"}))
        comp.add(new W.Image({position:"relative", float:"right", paddingRight: "40px", paddingTop: "7px",
                src: "logo.png", }))
        comp.add(new W.Span({position:"fixed", className:"title",
        text:"Xconf Log Server"}));

        return comp;
    };

    var TopPanel = W.UI.extend({
        name: "TopPanel",

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
        destroy: function() {},
        isDestroyable: function() {
            return false;
        }
  });

  return TopPanel;


});
