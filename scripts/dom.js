(function(){
    var app = window.app;

    var storage = app('storage');
    var keyboard = app('keyboard');

    var mainContainer;
    var picasaImportField;
    var helloTip;
    var importContainer;
    var elementsList;
    var topMenu;

    var progressContainer;
    var progressPercent;

    var viewerContainer;
    var viewerImg;
    var viewerTitle;

    var outputContainer;
    var outputTextarea;

    var settingsContainer;
    var fitToScreen;

    var currentElementPos = -1;
    var percentTimerId;
    var isSorted = false;

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
        importContainer.hide();
        elementsList.hide();

        runPercents();
        storage.runImport(val, function(){
            stopPercents();
            onImportDone()
        });
    }

    function onImportDone(){
        var items = storage.getParsedItems();
        helloTip.hide();
        topMenu.show();
        elementsList.empty();

        var buff = '';
        for (var i = 0, l = items.length; i < l; i++){
            var el = storage.createThumb(items[i], i);
            buff += el;
        }

        elementsList.append(buff);
        elementsList.show();
        setSelected(0);
    }

    function setSelected(pos){
        var items = storage.getParsedItems();
        (pos < 0) && (pos = 0);
        (pos >= items.length - 1) && (pos = items.length - 1);
        currentElementPos = pos;
        elementsList.find('.item-selected').removeClass('item-selected');
        elementsList.find('.item:eq(' + pos + ')').addClass('item-selected');
        if (viewerContainer.is(':visible')){
            showPreview();
        }
    }

    function showImport(){
        importContainer.show();
        picasaImportField.focus();
    }

    function showPreview(){
        var items = storage.getParsedItems();
        var id = items[currentElementPos];
        var el = id ? storage.getItemById(id) : null;
        if (el){
            var path = storage.getViewPath(el);
            viewerImg.attr('src', path);
            viewerTitle.html(el.fileName);

            if (fitToScreen.prop('checked')){
                viewerContainer.addClass('viewer-fit');
            } else {
                viewerContainer.removeClass('viewer-fit');
            }

            viewerContainer.show();
        }

    }

    function closePreview(){
        viewerContainer.hide();
    }

    function bindClick(className, cb){
        mainContainer.find(className).on('jrclick', function(e){
            if (isSorted){
                isSorted = false;
                return;
            }
            cb(e);
        });
    }

    function showSettings(){
        settingsContainer.show();
    }

    function updateAllPositions(){
        elementsList.find('.item-pos').each(function(index, el){
            el.innerHTML = (index + 1) + '';
            var id = el.getAttribute('data-pos-id');
        });
    }

    function removeElement(pos){
        var items = storage.getParsedItems();
        var id = items[pos];
        if (id) {
            storage.removeItem(id);
            elementsList.find('.item:eq(' + pos + ')').remove();
            updateAllPositions();
            setSelected(pos);
        }
    }

    function undoElement(){
        storage.undoItem(function(item, pos){
            var id = item.id;
            var el = storage.createThumb(id, pos);
            var res = false;
            if (el){
                res = true;
                var beforeEl = elementsList.find('.item:eq(' + pos + ')');
                if (beforeEl.length){
                    $(el).insertBefore(beforeEl);
                    storage.pushToParsed(id, pos);
                } else {
                    elementsList.append(el);
                    storage.pushToParsed(id);
                }
                updateAllPositions();
                setSelected(pos);
            }
            return res;
        });
    }


    function parseToOutput(withPos){
        var str = storage.parseToOutput(withPos);
        outputTextarea.val(str);
        outputContainer.show();
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

        mainContainer.on('jrclick', function(e){
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

    function defineSettings(){
        var sets = storage.settings();
        if (sets.fitToScreen){
            fitToScreen.prop('checked', 'checked');
        }

        fitToScreen.on('change', function(){
            var isFit = fitToScreen.prop('checked');
            storage.settings('fitToScreen', isFit);
        });

        var imgSize = mainContainer.find('.image-size-field');
        if (sets.outputSize){
            imgSize.val(sets.outputSize);
        }

        imgSize.on('change', function(){
            var val = imgSize.val();
            storage.settings('outputSize', val);
        });
    }

    function onStart(){
        mainContainer = $('.container');
        importContainer = mainContainer.find('.picasa-import');
        picasaImportField = importContainer.find('.picasa-import-field');
        helloTip = mainContainer.find('.hello-tip');

        elementsList = mainContainer.find('.thumbs-list');

        progressContainer = mainContainer.find('.import-progress');
        progressPercent = progressContainer.find('.percents');

        viewerContainer = mainContainer.find('.viewer');
        viewerImg = viewerContainer.find('.viewer-img');
        viewerTitle = viewerContainer.find('.viewer-title');

        topMenu = mainContainer.find('.top-menu');

        outputContainer = mainContainer.find('.output');
        outputTextarea = outputContainer.find('.output-textarea');

        settingsContainer = mainContainer.find('.settings');
        fitToScreen = settingsContainer.find('.fit-to-screen');

        picasaImportField.on('keydown', function(e){
            if (e.keyCode == 13){
                runImport();
            }
        });

        bindButtons();
        initKeyboard();
        defineSettings();

        var link = storage.albumLink();
        picasaImportField.val(link);

        elementsList.sortable({
            start: function(){
                isSorted = true;
            },
            update: function(ev, data){
                var el = data.item;
                var newPos = el.index();
                var id = el.find('.item-pos').data('pos-id');
                storage.moveItem(id, newPos);
                updateAllPositions();
            }
        });
        if (!storage.isEmpty()){
            runImport();
        }
    }


    app.onStart(onStart);
})();