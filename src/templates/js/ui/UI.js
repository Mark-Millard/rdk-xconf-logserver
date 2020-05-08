W.defineModule("ui/UI", [
], function (
) {
	W.define('UI', function() {
        "use strict";

		var UI = W.Class.extend( {
	        init: function() {
				W.log.info("UI init");
	            this._super('init', arguments);
	            this.visible = false;
				this.pid = W.id++;
				this.mode = APP.Config.MODE_INACTIVE;
				this.comp;
	        },
	        getComponent : function() {
				return this.comp;
	        },
			create : function(sc, param) {
				W.log.error("create is not implemented");
				throw new Error("create is not implemented");
			},
	        destroy : function() {
				if (this.isDestroyable()) {
					W.log.error("destroy is not implemented");
					throw new Error("destroy is not implemented");
				}
			},
			setStyle : function(map) {
				if (this.comp) {
					this.comp.setStyle(map);
				}
			},
			updateView : function() {
				W.log.error("updateView is not implemented");
				throw new Error("updateView is not implemented");
			},
	        show : function(_mode, init) {
				//W.log.info("UI show");
				//if you need to override this function. follow below
				/**
				 * show : function(_mode, init) {
				 * 		//add whatever here
				 *
				 * 		//this is Mandatory
				 * 		this._super("show", _mode, init);
				 * }
				 */

				if (this.comp == undefined)
					throw new Error("comp is not created");

				this.visible = true;
				if (_mode == APP.Config.MODE_ACTIVE)
					this.setActiveMode(init);
				else if (_mode == APP.Config.MODE_PASSIVE)
				    this.setPassiveMode(init);	
				else if (_mode == APP.Config.MODE_INACTIVE)
					this.setInactiveMode(init);
				else
					this.updateView(init);
	        },
	        hide : function(init) {
				//W.log.info("UI hide");
				this.visible = false;
				this.updateView(init);
	        },
	        setActiveMode : function(init) {
				this.visible = true;
				this.mode = APP.Config.MODE_ACTIVE;
				this.updateView(init);
	        },
	        setInactiveMode : function(init) {
				this.visible = true;
				this.mode = APP.Config.MODE_INACTIVE;
				this.updateView(init);
	        },
			setPassiveMode : function(init) {
				this.visible = true;
				this.mode = APP.Config.MODE_PASSIVE;
				this.updateView(init);
			},
			onPopupOpened : function(popup, desc) {
            },
            onPopupClosed : function(popup, desc) {
            },
			/**
	         * If UI have no content(data), UI should implement hasContent method.
	         */
	        hasContent : function() {
	        	return true;
	        },
			isDestroyable : function() {
	        	return false;
	        },
	        onChangePR : function() {
	        },
			onChangeLang : function() {
			},
	        onBack : function() {
	        },
	        refreshAllData : function() {
	        },
			onTransactionEnd : function(success, menu) {
			},
        });
    	return UI;
    });
});
