(function(){
    var app = window.app;
    var helper = app('helper', {});

    helper.guid = function (num){
        var today = (new Date()).getTime().toString(16);
        function fourChars() {
            return Math.floor(
                Math.random() * 0x10000 /* 65536 */
            ).toString(16);
        }

        if (num) {
            var ret = fourChars();
            for (var i = 0; i < (num); i++) {
                ret += '-' + fourChars();
            }
            return (ret + '');
        } else {
            // return as "8x-8x-7x" (x - max chars)
            return (
            fourChars() + fourChars() + fourChars() + '-' +
            fourChars() + fourChars() + fourChars() + '-' +
            today
            );
        }

    };

    helper.clearObj = function(obj){
        for (var key in obj){
            delete obj[key];
        }
    };

    // helper for inherit child from parent
    helper.inherit = function(child, parent){
        function F() {}
        F.prototype = parent && parent.prototype;

        child.prototype = new F();
        child._parent = parent.prototype;
        child._parent.constructor = parent;
    };

})();