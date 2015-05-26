(function(){
    var app = window.app;

    var keyboard = app('keyboard', {});

    var dropNodes = {
        textarea: true,
        input: true
    };

    var codes = {
        LEFT: 'left',
        RIGHT: 'right',
        DELETE: 'delete',
        ENTER: 'enter',
        ESC: 'esc'
    };

    keyboard.codes = codes;

    var map = {
        37: codes.LEFT,
        39: codes.RIGHT,
        46: codes.DELETE,
        13: codes.ENTER,
        27: codes.ESC
    };

    var pressedCallbacks = [];
    keyboard.onPress = function(callback){
        pressedCallbacks.push(callback);
    };

    function processOnPress(name){
        for (var i = 0, l = pressedCallbacks.length; i < l; i++){
            pressedCallbacks[i](name);
        }
    }


    app.onStart(function(){
        $(document.body).bind('keydown', function(e) {
            var nodeName = e.target.nodeName.toLowerCase();
            if (!dropNodes[nodeName]){
                var pressed = map[e.keyCode];
                if (pressed){
                    processOnPress(pressed);
                }
            }
        });
    });

})();