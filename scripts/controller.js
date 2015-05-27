(function(){
    var app = window.app;
    var ls = app('local-storage');
    var keyboard = app('keyboard');

    // storage const
    var LS_LIST = 'list';
    var LS_PARSED = 'parsed';
    var LS_ALBUM = 'album';

    var DEFAULT_SIZE = 1200;

    var percentTimerId;

    var API_URL = 'https://picasaweb.google.com/data/feed/base';


    var elements = [];
    var parsedElements = [];
    
    var currentElementPos = -1;

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

    function parseToOutput(withPos){
        var str = '';
        outputTextarea.val('');
        for (var i = 0, l = parsedElements.length; i < l; i++){
            var el = parsedElements[i];
            var path = el.path + 's' + DEFAULT_SIZE + '/' + el.fileName;
            var pos = i + 1;
            var item = '<img src="' + path + '">';
            withPos && (item += '\n<br> ' + pos);
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

    function parseImportUrl(val){
        var url = '';

        if (val.indexOf('picasaweb.google.com') != -1){
            url = importFromPicasa(val);
        } else if (val.indexOf('plus.google.com') != -1){
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

        var url = parseImportUrl(val);

        if (url){
            elements.length = 0;
            parsedElements.length = 0;
            $.get(url, function(data){
                if (data && data.feed){
                    var feed = data.feed;
                    var entry = feed.entry;
                    for (var i = 0, l = entry.length; i < l; i++){
                        var item = createNewElement(entry[i]);
                        elements.push(item);
                        parsedElements.push(item);
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

    function createNewElement(picasaEl){
        var src = picasaEl.content.src;
        var fileName = src.split('/').pop();
        var path = src.substring(0, src.length - fileName.length);
        var ret = {
            title: picasaEl.title.$t,
            fileName: fileName,
            path: path
        };
        return ret;
    }

    function onImportDone(){
        ls(LS_LIST, elements);
        ls(LS_PARSED, parsedElements);

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

    function removeElement(pos){
        parsedElements.splice(pos, 1);
        ls(LS_PARSED, parsedElements);
        elementsList.find('.item:eq(' + pos + ')').remove();
        updateAllPositions();
        setSelected(pos);
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
            '<span class="item-pos">' + pos + '</span>' +
            '<img class="item-img" src="'+ path +'">' +
            '<span class="item-desc"></span>' +
            '</li>';

        return str;
    }

    function updateAllPositions(){
        elementsList.find('.item-pos').each(function(index, el){
            el.innerHTML = (index + 1) + '';
        });
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

    function bindButtons(){
        
        mainContainer.on('mousedown touchstart', function(e){
            var target = $(e.target);
            if (target.closest('.btn-hello-tip').length){
                // clicked to first tip, open 
                showImport();
            } else if (target.closest('.run-import').length){
                runImport();
            } else if (target.closest('.btn-import').length){
                showImport();
            } else if (target.closest('.btn-prev').length){
                setSelected(currentElementPos - 1);
            } else if (target.closest('.btn-next').length){
                setSelected(currentElementPos + 1);
            } else if (target.closest('.popup-overflow').length){
                target.closest('.popup-overflow').parent().hide();
            } else if (target.closest('.item').length){
                var pos = target.closest('.item').index();
                setSelected(pos);
                showPreview();
            } else if (target.closest('.viewer').length){
                closePreview();
            } else if (target.closest('.btn-build-number').length){
                parseToOutput(true);
            } else if (target.closest('.btn-build-no-number').length){
                parseToOutput(false);
            }
        });
    }

    function initKeyboard(){
        var kCodes = keyboard.codes;
        keyboard.onPress(function(button){
            switch (button) {
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
        if (els){
            elements = els;
            if (pEls){
                parsedElements = pEls;
            } else {
                for (var i = 0, l = elements.length; i < l; i++){
                    parsedElements.push(elements[i]);
                }
            }
            onImportDone();
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

        picasaImportField.on('keydown', function(e){
            if (e.keyCode == 13){
                runImport();
            }
        });

        elementsList.sortable({
            update: function(){
                updateAllPositions();
            }
        });

        bindButtons();
        initKeyboard();
        initStorageData();
    });

})();