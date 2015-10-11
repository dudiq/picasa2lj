(function(){
    var app = window.app;

    var helper = app('helper');
    var logger = app('errors').getLogger('imports');

    var collection = {};
    var imports = app('imports', function(inst){
        var name = inst.getName();
        if (!collection[name]){
            collection[name] = inst;
        } else {
            logger.error('module "' + name + '" already exists');
        }
    });

    // return path with defined size of current element
    imports.getViewPath = function(el, size){
        var inst = collection[el.type];
        var ret = '';
        if (inst){
            ret = inst.getViewPath(el, size);
        } else {
            logger.error('wrong importer for getting view path');
        }
        return ret;
    };

    // process user url of album by defined importers
    imports.parseUrl = function(val, cb){
        var importer = getUrlFromImport(val);

        if (importer){
            var url = importer.parseToUrl(val);
            if (url){
                importer.getData(url, createNewElement, cb);
            } else {
                cb(true, 'нет ссылки!');
            }
        } else {
            cb(true, 'нет импортера для вашей ссылки');
        }

    };

    function createNewElement(entry){
        //{
        //    type: 'type',
        //    title: 'title',
        //    src: 'src'
        //}

        var src = entry.src;
        var fileName = src.split('/').pop();
        var path = src.substring(0, src.length - fileName.length);

        var ret = {
            id: helper.guid(),
            type: entry.type,
            title: entry.title,
            fileName: fileName,
            path: path,
            src: src
        };
        return ret;
    }

    function getUrlFromImport (val){
        var ret;

        for (var key in collection){
            var inst = collection[key];
            var detectPath = inst.getDetectPath();
            if (val.indexOf(detectPath) != -1){
                ret = inst;
            }
        }
        return ret;
    }

})();