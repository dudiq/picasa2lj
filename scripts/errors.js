/*
 * Processing errors module
 *
 * var errors = app('errors');
 *
 * errors.log('myModule', 'some messageError');
 * //or
 * errors.log('myModule', 'some messageError', data, data2, etc...);
 *
 * */
(function(){
    var app = window.app;

    var errors = app('errors', {});

    errors.LEVEL_DEV = 5;
    errors.LEVEL_PROD = 0;
    errors.LEVEL_WARN = 4;

    var logLevel = errors.LEVEL_DEV;

    function getArgs(){
        return Array.prototype.slice.apply(arguments[0]);
    }

    var manConsole = (window['console'] && window.console) || {
            log: function(){
                //it's a cap
            },
            warn: function(){
                //it's a cap
            },
            info: function(){
                //it's a cap
            },
            warning : function(){
                //it's a cap
            },
            error: function(){
                //it's a cap
            },
            time: function(){
                //it's a cap
            },
            timeEnd: function(){
                //it's a cap
            }
        };

    var timeIds = {};
    var isNative = false;

    function apply(action, args){
        if (manConsole[action]){
            args = getArgs(args);
            args[0] = "#" + args[0] + ": ";
            if (isNative){
                args = [args.join(", ")];
            }
            manConsole[action].apply(manConsole, args);
            args = null;
        }
    }

    errors.setLevel = function(lev){
        logLevel = lev;
    };

    errors.getLevel = function(){
        return logLevel;
    };

    // first argument is module name, where error appear, others - it's just a params to show...
    errors.log = function(){
        if (logLevel){
            apply('log', arguments);
        }
    };

    errors.warning = errors.warn = function(){
        apply('warn', arguments);
    };

    errors.error = function(){
        apply('error', arguments);
    };

    errors.info = function(){
        apply('info', arguments);
    };

    errors.time = function(id, message){
        if (logLevel){
            if (!timeIds[id]){
                timeIds[id] = [];
            }
            pushTime(id, message);
        }
    };

    errors.timeEnd = function(id, message, header){
        if (logLevel){
            !header && (header = id);
            if (timeIds[id]){
                var timer = timeIds[id];
                pushTime(id, message);
                var title = "time";
                var total = 0;
                errors.warn(header, "---------- '" + id + "' ----------");
                for (var i = 0, l = timer.length - 1; i < l; i++){
                    var item = timer[i];
                    var nextItem = timer[i + 1];
                    var dx = nextItem.time - item.time;
                    total += dx;
                    errors.warn(title, item.message + " : " + dx + 'ms');
                }

                var last = timer[timer.length - 1];
                errors.warn(title, "total: " + total + "ms | " + last.message);
                errors.warn(header, "----------------------------");

                timer.clear();
                timer = null;
                timeIds[id] = null;
            } else {
                errors.warning('timeEnd', 'wrong End for "' + id + '" timer');
            }
        }
    };

    function pushTime(id, message){
        message = message || id;
        timeIds[id].push({
            time: getNow(),
            message: message
        });
    }

    function getNow(){
        return (new Date()).getTime();
    }


    function LoggerClass(name){
        this._name = name;
        this._enable = true;
    }

    function applyLogger(name, type, params){
        var args = getArgs(params);
        args.splice(0, 0, name);
        errors[type].apply(errors, args);
    }

    var p = LoggerClass.prototype;

    p.enable = function(val){
        if (val !== undefined){
            this._enable = val;
        }
        return this._enable;
    };

    p.log = function(){
        this._enable && applyLogger(this._name, 'log', arguments);
    };

    p.error = function(){
        this._enable && applyLogger(this._name, 'error', arguments);
    };

    p.warn = p.warning = function(){
        this._enable && applyLogger(this._name, 'warn', arguments);
    };

    p.info = function(){
        this._enable && applyLogger(this._name, 'info', arguments);
    };

    p.time = function(){
        this._enable && errors.time.apply(errors, arguments);
    };

    p.timeEnd = function(id, message){
        this._enable && errors.timeEnd.call(errors, id, message, this._name);
    };

    errors.getLogger = function(name){
        return new LoggerClass(name);
    };


})();