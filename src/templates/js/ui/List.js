/**
 * Represents a UI List
 *
 * @example
 * 	//Definition List Component
 * 	var list = new W.List({x:0, y:0, width:200, height:200});
 *
 * 	//Definition List Cell. List have only one cell.
 *		// but Cell can has multi components.
 * 	var cell = new W.Div({x:0, y:0, width:200, height:40});
 *
 * 	//Definition Components in Cell
 * 	// _tmpIcon1 is always visible.
 * 	var _tmpIcon1	= new W.Image({id:"ch_icon1",src:"img/icon_fav.png", x:0, y:0});
 * 	// _tmpIcon2 is visible after binding data if value of data named attr.name is true
 * 	var _tmpIcon2	= new W.Image({id:"ch_icon2",src:"img/icon_fav_f.png", x:0, y:0,
	 * 		attr:{name:IList.BIND_PREFIX_IMG+"icon", value:""}});
 *
 * 	var _tmpLine_1 = new W.Image({id:"line",src:"img/line_dca_01.png",x:35,y:-10});
 * 	// textContent of _tmpText is visible after binding data by value of data named attr.name
 * 	var _tmpText = new W.Span({id:"ch_name",text:"",overflow:"ellipsis",
	 * 		attr:{name:IList.BIND_PREFIX_TEXT+"name", value:""},
	 * 		fontSize:17, textColor:"white", width:160, height:20});
 *
 * 	cell.add(_tmpIcon1);
 * 	cell.add(_tmpIcon2);
 * 	cell.add(_tmpLine_1);
 * 	cell.add(_tmpText);
 *
 * 	this.list.setListConf( {
	 * 		//animationEffect:{duration:300},
	 * 		scrollType : IList.SCROLL_TYPE_ROLLING_EDGE,
	 * 		cell : cell,
	 * 		rowHeight : 40,
	 * 		rows : 5
	 * 	});
 *
 * 	//Adding List to Scene
 * 	parent.add(list);
 *
 * 	//data binding
 * 	//Data must be Array
 * 	var chData = [];
 * 	//Item of Array must be Object
 * 	//And item must have properties named attribute name in list cell component.
 * 	for(var i=0;i<list.length;i++){
	 * 		chData[i] = {};
	 * 		chData[i].IList.BIND_PREFIX_TEXT + "name" = "xxx";
	 * 		chData[i].IList.BIND_PREFIX_IMG + "icon" = true;
	 * 	}
 * 	list.setData(chData);
 *
 * @class W.List
 * @constructor
 */
W.defineModule("ui/List", [], function () {
    'use strict';

    var BIND_PREFIX_TEXT = "txt_";
    var BIND_PREFIX_IMG = "img_";
    var BIND_PREFIX_IMG_SRC = "imgsrc_";

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

    var _dataBind = function(data, el, key, curIndex, totalNum) {
        if (key.indexOf(BIND_PREFIX_TEXT) == 0) {
            if (curIndex >= totalNum) {
                if (el.parentElement)
                    el.parentElement.style["visibility"] = "hidden";
            } else {
                if (el.parentElement)
                    el.parentElement.style["visibility"] = "inherit";
                el.textContent = data[key];
            }
        } else if (key.indexOf(BIND_PREFIX_IMG) == 0) {
            if (curIndex >= totalNum) {
                el.style["visibility"] = "hidden";
            } else {
                if (data[key])
                    el.style["visibility"] = "inherit";
                else
                    el.style["visibility"] = "hidden";
            }
        } else if (key.indexOf(BIND_PREFIX_IMG_SRC) == 0) {
            if (curIndex >= totalNum) {
                el.style["visibility"] = "hidden";
            } else {
                if (data[key])
                    el.src = data[key];
                else
                    el.src = "";
            }
        }
    };

    var WList = W.Component.extend({

        init: function(desc) {
            //W.log.info("WSpan init");
            this.rows = 0;
            this.data = null;
            this.focusIndex = 0;
            this.dataIndex = 0;
            this.startIndex = 0;
            this.animationEffect = null;
            this.isRendered = false;

            desc.overflow = "hidden";
            this._super("init", "div", desc.id, desc);
        },
        _add : function(_comp, desc, order) {
            this._super("add", _comp, desc, order);
        },
        add : function() {
            throw new Error("Can not call add method on List Component");
        },
        getSelectedData : function() {
            if (this.data)
                return this.data[this.dataIndex];
            else
                return null;
        },
        getFocusIndex : function() {
            if (this.data)
                return this.focusIndex;
            else
                return -1;
        },
        setDataIndex : function(_idx) {
            this.dataIndex = _idx;
            this.focusIndex = this.dataIndex%this.rows;
        },
        getFocusedComp : function() {
            return this.children.elementAt(this.focusIndex);
        },
        /**
         * Setting data to list.
         * If list was rendered. list data will be visible.
         * @method setData
         * @param {Array} _data Object Array
         * 		[
         * 		{ bind_id0:data0, bind_id1:data1, ...},
         * 		{ bind_id0:data0, bind_id1:data1, ...},
         * 		...
         * 		]
         */
        setData : function(_data) {
            this.data = _data;

            if (this.isRendered) {
                this._onFocusLosted(this.focusIndex);
                this._setDataBinding(0);
                this._onFocusGained(this.focusIndex);
            }
        },

        addData : function(_data) {
            if (this.data == undefined || this.data.length == 0) {
                this.setData(_data);
                return;
            }

            this.data = this.data.concat(_data);

            if (this.isRendered) {
                this._addDataBinding();
            }
        },
        /**
         * setting config of list
         * @method setListConf
         * @param {Object} conf Configuration
         * 	@param {Integer} conf.rows row count of list
         * 	@param {Component} conf.cell Component
         * 	@param {Integer} conf.rowHeight
         * 	@param {Object} conf.animationEffect animation effect
         * 		@param {Integer} conf.animationEffect.duration duration
         */
        setListConf : function(conf) {
            if (this.isRendered)
                throw new Error("Can not set config After rendering");

            this.animationEffect = conf.animationEffect;
            this.rows = conf.rows;
            this.rowHeight = conf.rowHeight;
            this.cellComp = conf.cell;

            this.data = [];
            this.focusIndex = 0;
            this.dataIndex = 0;
            this.isRendered = false;
        },

        reset : function() {
            this.isRendered = false;
            while(this.comp.firstChild)
                this.comp.removeChild(this.comp.firstChild);

            this.rows = 0;
            this.rowHeight = 0;
            this.cellComp = undefined;
            this.data = [];
        },
        /**
         * rendering of list
         * @method render
         */
        render : function() {

            if (!this.cellComp)
                throw new Error("Cell Component is not assigned !!");
            if (!this.rows)
                throw new Error("List size is not defined !!");

            this.isRendered = true;
            this.focusIndex = 0;
            this.dataIndex = 0;
            this.children = new W.Hash();
            while(this.comp.firstChild)
                this.comp.removeChild(this.comp.firstChild);

            var child;

            if (this.animationEffect) {
                child = W.cloneComponent(this.cellComp);
                child.comp._wobj = child;
                this._add(child, {id:"list_-1", y:(this.rowHeight)*-1});
            }

            for (var i=0; i<this.rows; i++) {
                child = W.cloneComponent(this.cellComp);
                child.comp._wobj = child;
                this._add(child, {id:"list_"+i, y:(this.rowHeight)*i});
            }
            if (this.animationEffect) {
                child = W.cloneComponent(this.cellComp);
                child.comp._wobj = child;
                this._add(child, {id:"list_"+this.rows, y:(this.rowHeight)*this.rows});
            }

            if (this.data)
                this._setDataBinding(0);

        },
        _onFocusGained : function(index) {
            var duration = this.animationEffect ? this.animationEffect.duration:undefined;
            if (index != undefined)
                this.children.get("list_"+index)._onFocusGained(duration);
            else
                this.children.get("list_"+this.focusIndex)._onFocusGained(duration);
        },
        _onFocusLosted : function(index) {
            var duration = this.animationEffect ? this.animationEffect.duration:undefined;
            if (index != undefined)
                this.children.get("list_"+index)._onFocusLosted(duration);
            else
                this.children.get("list_"+this.focusIndex)._onFocusLosted(duration);
        },
        _setDataBinding : function(_idx) {
            this.startIndex = _idx;
            this.focusIndex = _idx;
            this.dataIndex = _idx;
            if (this.animationEffect) {
                this.__setDataBindingAni();
            } else {
                this.__setDataBindingNoAni();
            }
        },
        _addDataBinding : function() {
            if (this.animationEffect) {
                this.__setDataBindingAni();
            } else {
                this.__setDataBindingNoAni();
            }
        },
        __setDataBindingAni : function() {

            if (this.data && this.data.length > 0) {

                var _keys = this.data[0];
                this._rowComps = {};
                for (var key in _keys) {
                    //W.log.info("_setDataBinding key " + key);
                    this._rowComps[key] = this.comp.querySelectorAll("["+key+"]");

                    //case of  index is zero.
                    if (this.data.length > this.rows) {
                        _dataBind(this.data[this.data.length-1], this._rowComps[key][0], key, this.data.length-1, this.data.length);

                        _dataBind(this.data[this.rows], this._rowComps[key][this.rows+1],
                            key, this.rows, this.data.length);
                    }

                    for (var i=this.startIndex,j=1; i<this.rows; i++,j++) {
                        _dataBind(this.data[i], this._rowComps[key][j], key, i, this.data.length);
                    }
                }
            } else {
                if (this._rowComps) {
                    for (var key in this.children.key)
                        this.children.obj[key].set({visibility:"hidden"});
                }
            }

        },
        __setDataBindingNoAni : function() {
            W.log.info("__setDataBindingNoAni");
            if (this.data && this.data.length > 0) {
                for (var key in this.children.key)
                    this.children.obj[key].set({visibility:"visible"});
                var _keys = this.data[0];
                this._rowComps = {};
                for (var key in _keys) {
                    W.log.info("_setDataBinding key " + key + " ");
                    this._rowComps[key] = this.comp.querySelectorAll("["+key+"]");

                    for (var i=this.startIndex,j=0; i<this.rows; i++,j++) {


                        if (key.indexOf(BIND_PREFIX_TEXT) == 0) {
                            if (i >= this.data.length) {
                                this.children.get("list_"+j).set({visibility:"hidden"});//at least one text data exists
                            } else {
                                this.children.get("list_"+j).set({visibility:"visible"});
                                this._rowComps[key][j].textContent = this.data[i][key];
                            }
                        } else if (key.indexOf(BIND_PREFIX_IMG) == 0) {
                            if (i >= this.data.length) {
                                this._rowComps[key][j].style["visibility"] = "hidden";
                            } else {
                                if (this.data[i][key])
                                    this._rowComps[key][j].style["visibility"] = "inherit";
                                else
                                    this._rowComps[key][j].style["visibility"] = "hidden";
                            }
                        } else if (key.indexOf(BIND_PREFIX_IMG_SRC) == 0) {
                            if (i >= this.data.length) {
                                this._rowComps[key][j].style["visibility"] = "hidden";
                            } else {
                                if (this.data[i][key]){
                                    this._rowComps[key][j].style["visibility"] = "inherit";
                                    this._rowComps[key][j].src = this.data[i][key];
                                }
                                else
                                    this._rowComps[key][j].style["visibility"] = "hidden";
                            }
                        }
                    }
                }
            } else {
                if (this._rowComps) {
                    for (var key in this.children.key)
                        this.children.obj[key].set({visibility:"hidden"});
                }
            }
        },
        /**
         * list be scrolled to up / down
         * @method scroll
         * @param {Integer} direction direction is presented keyCode. (W.KEY.UP or W.KEY.DOWN)
         */
        scroll : function(direction) {
            var _this = this;
            if (this.animationEffect && this.data.length > this.rows) {
//    			W.log.info("aniTimer " + this.aniTimer);
//    			W.log.info("startScrollContsKey " + this.startScrollContsKey);
//    			W.log.info("continueTimer " + this.continueTimer);

                if (this.aniTimer && !this.startScrollContsKey) {
                    this.startScrollContsKey = true;

                    var children = this.comp.children;
                    for (var i=0; i<children.length; i++) {
                        children[i].style.webkitTransitionDuration = "0ms";
                    }
                    clearTimeout(this.aniTimer);
                    if (this.aniTimerFunction)
                        this.aniTimerFunction();
                    //W.log.info("animation timer forced running!! ");
                }
                if (!this.aniTimer && this.continueTimer) {
                    this.startScrollContsKey = true;
                    var _keys = this.data[0];
                    for (var key in _keys) {
                        this._rowComps[key] = [].slice.call(this.comp.querySelectorAll("["+key+"]"));
                        this._rowComps[key].shift();
                        this._rowComps[key].pop();
                    }
                    clearTimeout(this.continueTimer);
                    //W.log.info("continueTimer runnining ");
                }

                if (this.startScrollContsKey) {

                    this._scrollNoAni(direction);

                    //clearTimeout(this.continueTimer);
                    this.continueTimer =
                        setTimeout( function() {
                            _this.startScrollContsKey = false;
                            _this.continueTimer = undefined;
                            //W.log.info("continueTimer complete !!! ");
                            //set data on first and last hidden Cell
                            var _keys = _this.data[0];
                            for (var key in _keys) {
                                //last
                                var _childComp = [].slice.call(_this.comp.children[_this.rows+1].querySelectorAll("["+key+"]"));
                                //W.log.inspect(_childComp[0]);
                                _dataBind(_this.data[(_this.startIndex+_this.rows)%_this.data.length], _childComp[0], key,
                                    (_this.startIndex+_this.rows)%_this.data.length, _this.data.length);

                                //first
                                _childComp = [].slice.call(_this.comp.children[0].querySelectorAll("["+key+"]"));
                                //W.log.inspect(_childComp[0]);
                                _dataBind(_this.data[(_this.startIndex-1+_this.data.length)%_this.data.length], _childComp[0], key,
                                    (_this.startIndex-1+_this.data.length)%_this.data.length, _this.data.length);
                            }

                        }, this.animationEffect.duration);

                    return;
                }
                this._scrollAni(direction);
            } else {
                this._scrollNoAni(direction);
            }

        },
        _scrollAni : function(direction) {

            var _this = this;
            var move = false;
            var prevIndex = this.focusIndex;

            if (direction == W.KEY.UP) {
                this.dataIndex = (--this.dataIndex + this.data.length)%this.data.length;
                if (this.focusIndex > 0)
                    --this.focusIndex;
                else {
                    this.startIndex = (--this.startIndex + this.data.length)%this.data.length;
                    move = true;
                }
            } else {
                this.dataIndex = ++this.dataIndex%this.data.length;

                if (this.data.length > this.rows) {
                    if (this.focusIndex < this.rows-1)
                        ++this.focusIndex;
                    else {
                        this.startIndex = ++this.startIndex%this.data.length;
                        move = true;
                    }
                } else {
                    if (this.focusIndex < this.data.length-1)
                        ++this.focusIndex;
                }
            }


            if (!move) {
                this._onFocusLosted(prevIndex);
                this._onFocusGained(this.focusIndex);
                return;
            }

            if (direction == W.KEY.UP) {
                var children = this.comp.children;
                var top = 0;
                for (var i=0; i<children.length; i++) {
                    children[i].style.webkitTransitionDuration = this.animationEffect.duration + "ms";
                    top = _getNumberFromPX(children[i].style.top);
                    children[i].style.top = (top+this.rowHeight) + "px";

                    if (i == children.length-1) {
                        children[i].remove();
                    } else {
                        children[i].id = "list_"+i;
                        if (this.children.get("list_"+i))
                            this.children.put("list_"+i, children[i]._wobj);
                    }
                }
                this.aniTimerFunction = function() {
                    var child = W.cloneComponent(_this.cellComp);
                    child.comp._wobj = child;
                    _this._add(child, {id:"list_-1", y:(_this.rowHeight)*-1}, 0);

                    var _keys = _this.data[0];
                    for (var key in _keys) {
                        var _childComp = [].slice.call(child.comp.querySelectorAll("["+key+"]"));
                        //W.log.inspect(_childComp[0]);
                        _dataBind(_this.data[(_this.startIndex-1+_this.data.length)%_this.data.length], _childComp[0], key,
                            (_this.startIndex-1+_this.data.length)%_this.data.length, _this.data.length);
                    }
                    _this.aniTimer = undefined;
                    _this.aniTimerFunction = undefined;
                }
                this.aniTimer = setTimeout(
                    this.aniTimerFunction
                    , this.animationEffect.duration);
                this._onFocusLosted((this.focusIndex+1)%this.rows);
                this._onFocusGained(this.focusIndex);
            } else {
                var children = this.comp.children;
                children[0].remove();
                for (var i=0; i<children.length; i++) {
                    children[i].style.webkitTransitionDuration = this.animationEffect.duration + "ms";
                    top = _getNumberFromPX(children[i].style.top);
                    children[i].style.top = (top-this.rowHeight) + "px";
                    children[i].id = "list_"+(i-1);
                    if (this.children.get("list_"+(i-1)))
                        this.children.put("list_"+(i-1), children[i]._wobj);
                }
                this.aniTimerFunction = function() {
                    var child = W.cloneComponent(_this.cellComp);
                    child.comp._wobj = child;
                    _this._add(child, {id:"list_"+_this.rows, y:(_this.rowHeight)*(_this.rows)});

                    var _keys = _this.data[0];
                    for (var key in _keys) {
                        var _childComp = [].slice.call(child.comp.querySelectorAll("["+key+"]"));
                        _dataBind(_this.data[(_this.startIndex+_this.rows)%_this.data.length], _childComp[0], key,
                            (_this.startIndex+_this.rows)%_this.data.length, _this.data.length);
                    }
                    _this.aniTimer = undefined;
                    _this.aniTimerFunction = undefined;
                    //}
                }
                this.aniTimer = setTimeout( this.aniTimerFunction, this.animationEffect.duration);
                this._onFocusLosted((this.focusIndex-1+this.rows)%this.rows);
                this._onFocusGained(this.focusIndex);
            }
        },
        _scrollNoAni : function(direction) {
            //W.log.info("scrollNoAni");
            var move = false;
            var prevIndex = this.focusIndex;
            if (this.data.length > this.rows) {
                if (direction == W.KEY.UP) {
                    this.dataIndex = (--this.dataIndex + this.data.length)%this.data.length;
                    if (this.focusIndex > 0)
                        --this.focusIndex;
                    else {
                        this.startIndex = (--this.startIndex + this.data.length)%this.data.length;
                        move = true;
                    }

                } else {
                    this.dataIndex = ++this.dataIndex%this.data.length;

                    if (this.data.length > this.rows) {
                        if (this.focusIndex < this.rows-1)
                            ++this.focusIndex;
                        else {
                            this.startIndex = ++this.startIndex%this.data.length;
                            move = true;
                        }
                    } else {
                        if (this.focusIndex < this.data.length-1)
                            ++this.focusIndex;
                    }
                }
            } else {
                var prevStartIndex = this.startIndex;
                if (direction == W.KEY.UP) {
                    this.dataIndex = (--this.dataIndex + this.data.length)%this.data.length;
                } else {
                    this.dataIndex = ++this.dataIndex%this.data.length;
                }
                this.focusIndex = this.dataIndex%this.rows;
                this.startIndex = parseInt(this.dataIndex / this.rows) * this.rows;
                if (prevStartIndex != this.startIndex)
                    move = true;
            }
            if (!move) {
                this._onFocusLosted(prevIndex);
                this._onFocusGained(this.focusIndex);
                return;
            }
            var _keys = this.data[0];
            for (var key in _keys) {
                var i=this.startIndex;
                for (var j=0; j<this.rows; i++,j++) {

                    if (key.indexOf(BIND_PREFIX_TEXT) == 0) {
                        if (this.data.length > this.rows && i >= this.data.length)
                            i = 0;
                        else if (this.data.length <= this.rows && i >= this.data.length) {
                            this._rowComps[key][j].textContent = "";
                            continue;
                        }
                        this._rowComps[key][j].textContent = this.data[i][key];
                    } else if (key.indexOf(BIND_PREFIX_IMG) == 0) {
                        if (this.data.length > this.rows && i >= this.data.length)
                            i = 0;
                        else if (this.data.length <= this.rows && i >= this.data.length) {
                            this._rowComps[key][j].style["visibility"] = "hidden";
                            continue;
                        }
                        if (this.data[i][key])
                            this._rowComps[key][j].style["visibility"] = "inherit";
                        else
                            this._rowComps[key][j].style["visibility"] = "hidden";

                    } else if (key.indexOf(BIND_PREFIX_IMG_SRC) == 0) {
                        if (this.data.length > this.rows && i >= this.data.length)
                            i = 0;
                        else if (this.data.length <= this.rows && i >= this.data.length) {
                            this._rowComps[key][j].style["visibility"] = "hidden";
                            continue;
                        }
                        if (this.data[i][key]){
                            this._rowComps[key][j].style["visibility"] = "inherit";
                            this._rowComps[key][j].src = this.data[i][key];
                        }
                        else
                            this._rowComps[key][j].style["visibility"] = "hidden";

                    }
                }
            }
            if (prevIndex != this.focusIndex) {
                this._onFocusLosted(prevIndex);
                this._onFocusGained(this.focusIndex);
            }
        }

    });

    Object.defineProperty(WList, "BIND_PREFIX_TEXT", {
        writable:false, configurable:false,
        value: "txt_"
    });
    Object.defineProperty(WList, "BIND_PREFIX_IMG", {
        writable:false, configurable:false,
        value: "img_"
    });
    Object.defineProperty(WList, "BIND_PREFIX_IMG_SRC", {
        writable:false, configurable:false,
        value: "imgsrc_"
    });

    return WList;
});