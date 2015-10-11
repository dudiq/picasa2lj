(function(){
    var app = window.app;
    var imports = app('imports');
    var helper = app('helper');
    var BaseClass = app('import-base-class');

    var API_URL = 'https://picasaweb.google.com/data/feed/base';

    var DEFAULT_SIZE = imports.DEFAULT_SIZE;

    function ClassYandexPhotoImport(params){
        ClassYandexPhotoImport._parent.constructor.call(this, params);
    }

    helper.inherit(ClassYandexPhotoImport, BaseClass);

    var p = ClassYandexPhotoImport.prototype;


    var yaPhoto = new ClassYandexPhotoImport({
        name: 'yandex.photo',
        type: 'yandex.photo',
        detectPath: 'yandex.photo????????????'
    });


    imports(yaPhoto);

})();