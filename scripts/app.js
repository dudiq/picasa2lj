(function(){

    var collection = {};

    var isStarted = false;
    var startCallbacks = [];

    var app = function(name, value){
        if (value){
            collection[name] = value;
        }
        return collection[name];
    };



    app.onStart = function(callback){
        if (isStarted){
            callback();
        } else {
            startCallbacks.push(callback);
        }
    };

    $(document).ready(function(){
        isStarted = true;
        for (var i = 0, l = startCallbacks.length; i < l; i++){
            startCallbacks[i]();
        }
        startCallbacks.length = 0;
    });

    window.app = app;
})();