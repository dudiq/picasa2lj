(function(){
    var app = window.app;
    var imports = app('imports');
    var helper = app('helper');
    var ls = app('local-storage');
    var notify = app('notify');
    var logger = app('errors').getLogger('storage');

    var storage = app('storage', {});

    var LS_LIST = 'list';
    var LS_PARSED_LIST = 'parsed';
    var LS_ALBUM_LINK = 'album';
    var LS_UNDO_LIST = 'undo';
    var LS_SETTINGS = 'settings';

    var DEFAULT_SIZE = 1200;

    var defaultOutStr = '<img src="{{path}}">\n{{pos}}<br>\n\n';

    var elements = [];
    var parsedElementsIds = [];
    var elMap = {};
    var undoElements = [];
    var settings = {
        fitToScreen: true,
        outputSize: DEFAULT_SIZE
    };

    function onImportDone(importsItems){
        elements.length = 0;
        parsedElementsIds.length = 0;
        helper.clearObj(elMap);
        undoElements.length = 0;

        for (var i = 0, l = importsItems.length; i < l; i++){
            var item = importsItems[i];
            elements.push(item);
            parsedElementsIds.push(item.id);
            elMap[item.id] = item;
        }

        ls(LS_LIST, elements);
        ls(LS_PARSED_LIST, parsedElementsIds);
        ls(LS_UNDO_LIST, undoElements);
    }

    storage.runImport = function(val, onDone){
        var oldLink = storage.albumLink();
        if (oldLink != val || this.isEmpty()){
            storage.albumLink(val);
            imports.parseUrl(val, function(err, data){
                if (!err){
                    onImportDone(data);
                } else {
                    notify.error(data);
                }
                onDone && onDone();
            })
        } else {
            onDone && onDone();
        }
    };

    storage.getParsedItems = function(){
        return parsedElementsIds;
    };
    
    storage.getItemById = function(id){
        return elMap[id]
    };

    storage.pushToParsed = function(id, pos){
        if (pos !== undefined){
            parsedElementsIds.splice(pos, 0, id);
        } else {
            parsedElementsIds.push(id);
        }
        ls(LS_PARSED_LIST, parsedElementsIds);
    };

    storage.isEmpty = function(){
        return (elements.length == 0);
    };

    storage.albumLink = function(val){
        var ret;
        if (val !== undefined){
            ls(LS_ALBUM_LINK, val);
        } else {
            ret = ls(LS_ALBUM_LINK);
        }
        return ret;
    };

    storage.removeItem = function(id){
        for (var i = 0, l = parsedElementsIds.length; i < l; i++){
            if (parsedElementsIds[i] == id){
                parsedElementsIds.splice(i, 1);
                undoElements.push({
                    pos: i,
                    id: id
                });
                break;
            }
        }

        ls(LS_PARSED_LIST, parsedElementsIds);
        ls(LS_UNDO_LIST, undoElements);
    };

    storage.undoItem = function(onGet){
        var params = undoElements.pop();
        var res = false;
        if (params){
            var pos = params.pos;
            var id = params.id;
            var item = this.getItemById(id);
            if (item && onGet){
                res = onGet(item, pos);
            }
        }
        onGet = null;
        (res !== false) && ls(LS_UNDO_LIST, undoElements);
    };

    storage.parseToOutput = function(withPos, size, outStr){
        var str = '';
        var oStr = outStr || defaultOutStr;
        for (var i = 0, l = parsedElementsIds.length; i < l; i++){
            var id = parsedElementsIds[i];
            var el = this.getItemById(id);
            var path = storage.getViewPath(el, size);
            var pos = withPos ? i + 1 : '';

            var item = oStr;
            item = item.replace('{{path}}', path);
            item = item.replace('{{pos}}', pos);

            str += item;
        }
        return str;
    };

    storage.getViewPath = function(el, size){
        !size && (size = settings.outputSize);
        return imports.getViewPath(el, size);
    };

    storage.moveItem = function(id, newPos){
        for (var i = 0, l = parsedElementsIds.length; i < l; i++){
            if (parsedElementsIds[i] == id){
                parsedElementsIds.splice(i, 1);
                parsedElementsIds.splice(newPos, 0, id);
                ls(LS_PARSED_LIST, parsedElementsIds);
                break;
            }
        }
    };

    storage.settings = function(fields, val){
        if (typeof fields == "string"){
            var tmp = {};
            tmp[fields] = val;
            fields = tmp;
            tmp = null;
            val = null;
        }
        if (fields){
            for (var key in fields){
                if (settings.hasOwnProperty(key)){
                    settings[key] = fields[key];
                }
            }
            ls(LS_SETTINGS, settings);
        }
        return settings;
    };

    storage.createThumb = function(id, pos){
        var el = this.getItemById(id);
        var viewPos = pos + 1;
        var str = '';
        if (el){
            var path = storage.getViewPath(el, 128);
            var title = el.fileName;
            str = '<li class="item ui-state-default" title="' + title + '">' +
                '<span class="item-title">' + title + '</span>' +
                '<span class="item-pos" data-pos-id="' + el.id + '">' + viewPos + '</span>' +
                '<img class="item-img" src="'+ path +'">' +
                '<span class="item-desc"></span>' +
                '</li>';
        } else {
            logger.error('not found element in list');
        }
        return str;
    };


    function fillParsedElements(processArr){
        for (var i = 0, l = processArr.length; i < l; i++){
            var item = processArr[i];
            parsedElementsIds.push(item.id ? item.id : item);
        }
    }

    app.onStart(function(){
        var els = ls(LS_LIST);
        var pEls = ls(LS_PARSED_LIST);
        var undos = ls(LS_UNDO_LIST);

        if (undos){
            undoElements = undos;
        }

        if (els){
            elements = els;
            helper.clearObj(elMap);
            for (var i = 0, l = elements.length; i < l; i++){
                var item = elements[i];
                elMap[item.id] = item;
            }

            var processArr = (pEls) ? pEls : elements;
            fillParsedElements(processArr);
        }
    });


})();