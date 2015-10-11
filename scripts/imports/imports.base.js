(function(){
    var app = window.app;
    // Base Class of single import module

    function BaseImportClass(params){
        this._params = params;
    }

    var p = BaseImportClass.prototype;

    p.getData = function(){
        //cap
    };

    p.parseToUrl = function(){
        //cap
    };

    p.getDetectPath = function(){
        return this._params.detectPath;
    };

    p.getViewPath = function(el, size){
        var path = el.path + size + '/' + el.fileName;
        return path;
    };

    p.getType = function(){
        return this._params.type;
    };

    p.getName = function(){
        return this._params.name;
    };

    app('import-base-class', BaseImportClass);

})();