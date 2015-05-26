(function(){
    var app = window.app;
    var localStorage = window.localStorage;

    var customPrefix = '';

    var lsModStorage = app('local-storage', function(key, value){

        var ret;
        if (value !== undefined){
            //setter
            // for each item creating new object with some params.
            var pattObj = {
                val: null
            };
            pattObj.val = value;
            try {
                var setVal = JSON.stringify(pattObj);
                localStorage.setItem(customPrefix + key, setVal);
                ret = value;
            } catch(e){
                ret = null;
            }
            delete pattObj.val;
            delete pattObj.time;
            pattObj = null;
        } else {
            try {
                var getVal = JSON.parse(localStorage.getItem(customPrefix + key));
                ret = getVal.val;
                getVal = null;
            } catch(e){
                ret = null;
            }
            //getter
        }
        return ret;
    });

    lsModStorage.remove = function(key){
        var ret = true;
        try {
            var getVal = localStorage.removeItem(customPrefix + key);
            getVal = null;
            ret = true;
        } catch(e){
            ret = false;
        }
        return ret;
    };

    lsModStorage.clear = function(){
        localStorage.clear();
    };

})();