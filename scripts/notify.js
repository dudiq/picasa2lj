(function(){
    var app = window.app;
    var notify = app('notify', {});

    var tpl = "";

    notify.error = function(msg){
        return show(msg, 'error');
    };

    function show(msg, type){

    }

})();