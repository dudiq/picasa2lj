(function(){
    var app = window.app;
    var notify = app('notify', {});

    // todo add notify as html item
    notify.error = function(msg){
        msg && alert('ошибка! ' + msg);
    };

})();