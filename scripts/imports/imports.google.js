(function(){
    var app = window.app;
    var imports = app('imports');
    var helper = app('helper');
    var BaseClass = app('import-base-class');

    var API_URL = 'https://picasaweb.google.com/data/feed/base';

    var TYPE_PICASA = 'picasa';
    var TYPE_GPLUS = 'gplus';

    function ClassGoogleImport(params){
        ClassGoogleImport._parent.constructor.call(this, params);
    }

    helper.inherit(ClassGoogleImport, BaseClass);

    var p = ClassGoogleImport.prototype;

    p.getViewPath = function(el, size){
        if (!isNaN(size)){
            size = 's' + size;
        }
        var path = el.path + size + '/' + el.fileName;
        return path;
    };

    p.parseToUrl = function(val){
        var type = this.getType();
        var url = '';

        if (type == TYPE_PICASA){
            url = importFromPicasa(val);
        } else {
            url = importFromGooglePlus(val);
        }

        return url;
    };

    p.getData = function(url, createNewElement, cb){
        var type = this.getType();
        $.get(url, function(data){
            if (data && data.feed){
                var feed = data.feed;
                var entry = feed.entry;
                var entries = [];
                for (var i = 0, l = entry.length; i < l; i++){
                    var el = entry[i];
                    var params = {
                        type: type,
                        title: el.title.$t,
                        src: el.content.src
                    };
                    var item = createNewElement(params);
                    params = null;
                    entries.push(item);
                }
                cb(false, entries);
            } else {
                cb(true, 'не верный формат данных');
            }
        });
    };

    function importFromPicasa(val){
        var url;
        var portions = val.split('google.com/');
        var subPortion = portions[1];
        if (subPortion){
            // all ok!
            var subData = subPortion.split('?');
            var userData = subData ? subData[0].split('/') : subPortion;
            var authData = subData ? subData[1] : '&';
            var authSubData = authData ? authData.split('&') : [];
            var authPushData = '';
            for (var i = 0, l = authSubData.length; i < l; i++){
                var item = authSubData[i];
                if (item.indexOf('authkey=') == 0){
                    authPushData = item;
                    break;
                }
            }

            url = API_URL + '/user/' + userData[0] + '/album/' + userData[1] + '?&alt=json&' + authPushData;
        }
        return url;
    }

    function importFromGooglePlus(val){
        var url = '';
        var portions = val.split('google.com/');
        var subPortion = portions[1];
        if (subPortion){
            // all ok!

            var subData = subPortion.split('?');
            var userData = subData ? subData[0].split('/') : subPortion;

            var authData = subPortion.split('?')[1];
            var authSubData = authData.split('&');
            var authPushData = '';
            for (var i = 0, l = authSubData.length; i < l; i++){
                var item = authSubData[i];
                if (item.indexOf('authkey=') == 0){
                    authPushData = item.replace('authkey=', 'authkey=Gv1sRg');
                    break;
                }
            }

            url = API_URL + '/user/' + userData[1] + '/albumid/' + userData[3] + '?&alt=json&' + authPushData;
        }
        return url;
    }


    var picasa = new ClassGoogleImport({
        name: TYPE_PICASA,
        type: TYPE_PICASA,
        detectPath: 'picasaweb.google.com'
    });

    var gPlus = new ClassGoogleImport({
        name: TYPE_GPLUS,
        type: TYPE_GPLUS,
        detectPath: 'plus.google.com'
    });


    imports(picasa);
    imports(gPlus);

})();