(function(){
    var app = window.app;
    var ls = app('local-storage');
    var keyboard = app('keyboard');

    // storage const
    var LS_LIST = 'list';
    var LS_PARSED = 'parsed';
    var LS_ALBUM = 'album';
    var LS_UNDO = 'undo';

    var DEFAULT_SIZE = 1200;

    var TYPE_PICASA = 'picasa';
    var TYPE_GPLUS = 'gplus';

    var percentTimerId;

    var clickEvs = 'mouseup touchend';

    var API_URL = 'https://picasaweb.google.com/data/feed/base';


    var elements = [];
    var parsedElements = [];
    var parsedElementsMap = {};
    var undoElements = [];

    var currentElementPos = -1;

    var isSorted = false;

    // DOM elements
    var mainContainer;
    var importContainer;
    var picasaImportField;
    var helloTip;
    var topMenu;
    var progressContainer;
    var progressPercent;
    var elementsList;
    var viewerContainer;
    var viewerImg;
    var viewerTitle;
    var fitToScreen;
    var outputContainer;
    var outputTextarea;
    var settingsContainer;

    function guid(num){
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

    }

    function parseToOutput(withPos){
        var str = '';
        outputTextarea.val('');
        for (var i = 0, l = parsedElements.length; i < l; i++){
            var el = parsedElements[i];
            var path = el.path + 's' + DEFAULT_SIZE + '/' + el.fileName;
            var pos = i + 1;
            var item = '<img src="' + path + '">';
            withPos && (item += '\n' + pos + '<br>');
            item += '\n\n';
            str += item;
        }
        outputTextarea.val(str);
        outputContainer.show();
    }

    function showImport(){
        importContainer.show();
        picasaImportField.focus();
    }

    function importFromPicasa(val){
        var url;
        var portions = val.split('google.com/');
        var subPortion = portions[1];
        if (subPortion){
            // all ok!
            var subData = subPortion.split('?');
            var userData = subData ? subData[0].split('/') : subPortion;
            var authData = subData ? subData[1] : '&';
            var authSubData = authData.split('&');
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

    function getTypeOfUrl(val){
        var type = '';

        if (val.indexOf('picasaweb.google.com') != -1){
            type = TYPE_PICASA;
        } else if (val.indexOf('plus.google.com') != -1){
            type = TYPE_GPLUS;
        }
        return type;
    }

    function parseImportUrl(val, type){
        var url = '';

        if (type == TYPE_PICASA){
            url = importFromPicasa(val);
        } else if (type == TYPE_GPLUS){
            url = importFromGooglePlus(val);
        }

        return url;
    }

    function runPercents(){
        progressContainer.show();
        clearInterval(percentTimerId);
        var count = 0;
        percentTimerId = setInterval(function(){
            count++;
            var str = '';
            for (var i = 0; i < count; i++){
                str += '.';
            }
            (count > 4) && (count = 0);
            progressPercent.html(str);
        }, 500);
    }

    function stopPercents(){
        progressContainer.hide();
        clearInterval(percentTimerId);
    }

    function runImport(){
        helloTip.hide();
        var val = picasaImportField.val();
        ls(LS_ALBUM, val);
        importContainer.hide();
        elementsList.hide();

        runPercents();

        var type = getTypeOfUrl(val);
        var url = parseImportUrl(val, type);

        if (url){
            elements.length = 0;
            parsedElements.length = 0;
            undoElements.length = 0;
            clearObj(parsedElementsMap);
            $.get(url, function(data){
                if (data && data.feed){
                    var feed = data.feed;
                    var entry = feed.entry;
                    for (var i = 0, l = entry.length; i < l; i++){
                        var item = createNewElement(entry[i], type);
                        elements.push(item);
                        parsedElements.push(item);
                        parsedElementsMap[item.id] = item;
                    }
                    stopPercents();
                    onImportDone();
                } else {
                    // error
                }
            });
        } else {
            // error
        }
    }

    function createNewElement(picasaEl, type){
        var src = picasaEl.content.src;
        var fileName = src.split('/').pop();
        var path = src.substring(0, src.length - fileName.length);
        var ret = {
            id: guid(),
            type: type,
            title: picasaEl.title.$t,
            fileName: fileName,
            path: path
        };
        return ret;
    }

    function onImportDone(){
        ls(LS_LIST, elements);
        ls(LS_PARSED, parsedElements);
        ls(LS_UNDO, undoElements);

        helloTip.hide();
        topMenu.show();
        elementsList.empty();

        var buff = '';
        for (var i = 0, l = parsedElements.length; i < l; i++){
            var el = createThumb(parsedElements[i], i + 1);
            buff += el;
        }

        elementsList.append(buff);
        elementsList.show();
        setSelected(0);
    }

    function undoElement(){
        var params = undoElements.pop();
        if (params){
            var pos = params.pos;
            var id = params.id;
            var item = getElementbyId(id);
            if (item){
                var el = createThumb(item, pos + 1);
                var beforeEl = elementsList.find('.item:eq(' + pos + ')');
                if (beforeEl.length){
                    $(el).insertBefore(beforeEl);
                    pushToParsed(item, pos);
                } else {
                    elementsList.append(el);
                    pushToParsed(item);
                }
                updateAllPositions();
                setSelected(pos);
            }
        }
        ls(LS_UNDO, undoElements);
    }

    function removeElement(pos){
        var item = parsedElements[pos];
        parsedElements.splice(pos, 1);
        if (item) {
            undoElements.push({
                pos: pos,
                id: item.id
            });
            delete parsedElementsMap[item.id];
        }

        elementsList.find('.item:eq(' + pos + ')').remove();
        updateAllPositions();
        setSelected(pos);
        ls(LS_UNDO, undoElements);
    }

    function setSelected(pos){
        (pos < 0) && (pos = 0);
        (pos >= parsedElements.length - 1) && (pos = parsedElements.length - 1);
        currentElementPos = pos;
        elementsList.find('.item-selected').removeClass('item-selected');
        elementsList.find('.item:eq(' + pos + ')').addClass('item-selected');
        if (viewerContainer.is(':visible')){
            showPreview();
        }
    }

    function createThumb(el, pos){
        var path = el.path + 's128/' + el.fileName;
        var title = el.fileName;
        var str = '<li class="item ui-state-default" title="' + title + '">' +
            '<span class="item-title">' + title + '</span>' +
            '<span class="item-pos" data-pos-id="' + el.id + '">' + pos + '</span>' +
            '<img class="item-img" src="'+ path +'">' +
            '<span class="item-desc"></span>' +
            '</li>';

        return str;
    }

    function updateAllPositions(){
        parsedElements.length = 0;
        elementsList.find('.item-pos').each(function(index, el){
            el.innerHTML = (index + 1) + '';
            var id = el.getAttribute('data-pos-id');
            var item = parsedElementsMap[id];
            item && parsedElements.push(item);
        });

        ls(LS_PARSED, parsedElements);
    }

    function closePreview(){
        viewerContainer.hide();
    }

    function showPreview(){
        var current = parsedElements[currentElementPos];
        if (current){
            var path = current.path + 's' + DEFAULT_SIZE + '/' + current.fileName;
            viewerImg.attr('src', path);
            viewerTitle.html(current.fileName);

            if (fitToScreen.prop('checked')){
                viewerContainer.addClass('viewer-fit');
            } else {
                viewerContainer.removeClass('viewer-fit');
            }

            viewerContainer.show();
        }

    }

    function showSettings(){
        settingsContainer.show();
    }

    function isTargetClosest(target, className){
        return target.closest(className).length;
    }

    function bindClick(className, cb){
        mainContainer.find(className).on(clickEvs, function(e){
            if (isSorted){
                isSorted = false;
                return;
            }
            cb(e);
        });
    }

    function bindButtons(){


        bindClick('.btn-hello-tip, .btn-import', showImport);
        bindClick('.run-import', runImport);
        bindClick('.btn-prev', function(){
            setSelected(currentElementPos - 1);
        });
        bindClick('.btn-next', function(){
            setSelected(currentElementPos + 1);
        });
        bindClick('.popup-overflow', function(e){
            var target = $(e.target);
            target.closest('.popup-overflow').parent().hide();
        });

        bindClick('.viewer', closePreview);
        bindClick('.btn-build-number', function(){
            parseToOutput(true);
        });

        bindClick('.btn-build-no-number', function(){
            parseToOutput(false);
        });

        bindClick('.btn-settings', showSettings);

        bindClick('.btn-remove', function(){
            removeElement(currentElementPos);
        });

        bindClick('.btn-undo', function(){
            undoElement();
        });

        mainContainer.on(clickEvs, function(e){
            if (isSorted){
                isSorted = false;
                return;
            }
            var target = $(e.target);
            if (target.closest('.item').length){
                var pos = target.closest('.item').index();
                setSelected(pos);
                showPreview();
            }
        });
    }

    function initKeyboard(){
        var kCodes = keyboard.codes;
        keyboard.onPress(function(button){
            switch (button) {
                case kCodes.Z:
                    undoElement();
                    break;
                case kCodes.LEFT:
                    // move thumb to left
                    setSelected(currentElementPos - 1);
                    break;
                case kCodes.RIGHT:
                    // move to right
                    setSelected(currentElementPos + 1);
                    break;
                case kCodes.DELETE:
                    // remove thumb
                    removeElement(currentElementPos);
                    break;
                case kCodes.ESC:
                    mainContainer.find('.popup:visible').hide();
                    // close preview
                    break;
                case kCodes.ENTER:
                    showPreview();
                    break;
            }
        });
    }

    function initStorageData(){
        var album = ls(LS_ALBUM);
        picasaImportField.val(album);

        var els = ls(LS_LIST);
        var pEls = ls(LS_PARSED);
        var undos = ls(LS_UNDO);

        if (undos){
            undoElements = undos;
        }

        if (els){
            elements = els;
            clearObj(parsedElementsMap);
            var processArr = (pEls) ? pEls : elements;
            for (var i = 0, l = processArr.length; i < l; i++){
                var item = processArr[i];
                pushToParsed(item);
            }
            onImportDone();
        }
    }

    function pushToParsed(item, pos){
        if (pos !== undefined){
            parsedElements.splice(pos, 0, item);
        } else {
            parsedElements.push(item);
        }
        parsedElementsMap[item.id] = item;
    }

    function getElementbyId(id){
        var ret;
        for (var i = 0, l = elements.length; i < l; i++){
            var item = elements[i];
            if (item.id == id){
                ret = item;
                break;
            }
        }
        return ret;
    }

    function clearObj(obj){
        for (var key in obj){
            delete obj[key];
        }
    }

    app.onStart(function(){
        mainContainer = $('.container');

        importContainer = mainContainer.find('.picasa-import');
        picasaImportField = importContainer.find('.picasa-import-field');

        helloTip = mainContainer.find('.hello-tip');
        topMenu = mainContainer.find('.top-menu');

        progressContainer = mainContainer.find('.import-progress');
        progressPercent = progressContainer.find('.percents');

        elementsList = mainContainer.find('.thumbs-list');

        viewerContainer = mainContainer.find('.viewer');
        viewerImg = viewerContainer.find('.viewer-img');
        viewerTitle = viewerContainer.find('.viewer-title');

        fitToScreen = mainContainer.find('.fit-to-screen');

        outputContainer = mainContainer.find('.output');
        outputTextarea = outputContainer.find('.output-textarea');

        settingsContainer = mainContainer.find('.settings');

        picasaImportField.on('keydown', function(e){
            if (e.keyCode == 13){
                runImport();
            }
        });

        elementsList.sortable({
            start: function(){
                isSorted = true;
            },
            update: function(){
                updateAllPositions();
            }
        });

        bindButtons();
        initKeyboard();
        initStorageData();
    });

})();