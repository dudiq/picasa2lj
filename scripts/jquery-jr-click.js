(function(){

    var touchMap = {
        touchstart: true,
        touchend: true,
        touchmove: true,
        touchcancel: true,
        MSPointerDown: true,
        MSPointerMove: true,
        MSPointerUp: true
    };

    var mouseUp = "touchend.sys-jrclick mouseup.sys-jrclick";
    var mouseMove = "touchmove.sys-jrclick mousemove.sys-jrclick";
    var mouseDown = "touchstart.sys-jrclick mousedown.sys-jrclick";
    var mouseLeave = "touchcancel.sys-jrclick mouseleave.sys-jrclick";

    var CONST_TRESHOLD = 3;
    var CONST_DEFAULT_TIMEOUT = 400;
    var CONST_CLICKER_TIMEOUT = 500;

    var clickerTimerId = 0;

    var clickId = 0;

    var process = false;

    var clickMap = {};

    var preventStart = false;
    var timerId;

    function isTouch(e){
        return touchMap[e.type];
    }

    function getX(e){
        var ret;
        if (isTouch(e)){
            // touch event
            ret = e.originalEvent.touches[0].pageX;
        } else {
            ret = e.clientX;
        }
        return ret;
    }

    function getY(e){
        var ret;
        if (isTouch(e)){
            // touch event
            ret = e.originalEvent.touches[0].pageY;
        } else {
            ret = e.clientY;
        }
        return ret;
    }

    function doPrevent(timeout){
        clearTimeout(timerId);
        preventStart = true;
        timerId = setTimeout(function(){
            preventStart = false;
        }, timeout);
    }

    function dropWorks(){
        for (var key in clickMap){
            if (clickMap[key].work){
                clickMap[key].work = false;
            }
        }
    }
    
    $.event.special.jrclick = {
        setup: function(data, namespaces, handle){
            clickId++;
            data = data || {};
            var obj = {
                id: clickId,

                work: false,
                moved: false,

                posx: 0,
                posy: 0,

                posEx: 0,
                posEy: 0
            };
            clickMap[clickId] = obj;
            
            var $this = $(this);

            // this is hack for do not click twice to one element.
            var longClickTimeout = data.longClick;

            (longClickTimeout === true) && (longClickTimeout = 600);

            $this.on(mouseDown, function(ev){
                if (!obj.work && !preventStart){
                    obj.work = true;
                    obj.posx = obj.posEx = getX(ev);
                    obj.posy = obj.posEy = getY(ev);
                    obj.moved = false;
                }
            });

            $this.on(mouseLeave, function(){
                obj.work = false;
                obj.moved = false;
            });

            $this.on(mouseMove, function(ev){
                if (obj.work){
                    if (!obj.moved){
                        obj.posEx = getX(ev);
                        obj.posEy = getY(ev);
                        var dx = Math.abs(obj.posEx - obj.posx);
                        var dy = Math.abs(obj.posEy - obj.posy);
                        if ((dx > CONST_TRESHOLD) ||
                            (dy > CONST_TRESHOLD)){
                            obj.moved = true;
                        }
                    }
                }
            });

            $this.on(mouseUp, function(ev){
                if (obj.work && !preventStart){
                    var testTime = (new Date()).getTime();


                    if (testTime > (clickerTimerId + CONST_CLICKER_TIMEOUT)){
                        clickerTimerId = testTime;
                        process = false;
                    }

                    if (!process){
                        dropWorks();
                        
                        if (!obj.moved){
                            process = true;
                            ev.otype = ev.type;
                            ev.type = "jrclick";
                            ev.posEx = obj.posEx;
                            ev.posEy = obj.posEy;
                            handle.apply(this, arguments);
                            
                        }
                        obj.moved = true;
                        if (longClickTimeout){
                            doPrevent(longClickTimeout);
                        }
                    }
                }
            });
        },
        imPrevent: function(timeout){
            doPrevent(timeout || CONST_DEFAULT_TIMEOUT);
        },
        isPrevent: function(){
            return preventStart;
        },
        teardown: function(){
            var $this = $(this);
            $this.off(".sys-jrclick");
        }
    };

})();