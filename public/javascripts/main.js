$(window).on('load', onLoad);
var Cropper;
var cropper;

const IMAGE_MIN_SIZE = 1500;

function onLoad() {
    $('.fileinput').change(onFileChange);
    $('.shutter_button').on('click', onShutterClick);
    $('.cancel_button').on('click', onCancelClick);
    $('.submit_button').on('click', onSubmitClick);
    Cropper = window.Cropper;

    initBalloon();
    fetchPhotos();
}

function initBalloon() {
    if (localStorage.getItem('hasShowBalloon') == '1') {
        $('.balloon').hide();
    } else {
        $('.balloon').show();
        localStorage.setItem("hasShowBalloon", "1");
    }

}

function onFileChange() {
    if (!this.files.length) {
        return;
    }
    showProgress(true);
    const file = this.files[0];
    const fileReader = new FileReader();

    fileReader.onload = function(event) {
        const imgEl = $('.thumnail');
        const thumnailWidth = $('.edit_area').width();
        imgEl.css({
            'min-height': thumnailWidth,
            'max-height': thumnailWidth
        });
        if (cropper) {
            imgEl.attr('src', null);
            cropper.destroy();
        }

        adjustImage(file, function(canvas) {
            imgEl.attr('src', canvas.toDataURL());
            cropper = new Cropper(imgEl[0], {
                aspectRatio: 1,
                dragMode: "move",
                viewMode: 3,
                wheelZoomRatio: 0.05,
                cropBoxMovable: false,
                cropBoxResizable: false,
                dragCrop: false,
                toggleDragModeOnDblclick: false,
                minCropBoxWidth: thumnailWidth - 1,
                ready: function() {
                    showProgress(false);
                }
            });
        });
    };

    fileReader.readAsDataURL(file);
    editMode(true);
}

function adjustImage(file, callback) {
    loadImage.parseMetaData(file, function (data) {
        var options = {
            canvas: true,
            maxWidth: IMAGE_MIN_SIZE,
            maxHeight: IMAGE_MIN_SIZE
        };
        if (data.exif) {
            options.orientation = data.exif.get('Orientation');
        }
        loadImage(file, callback, options);
    });
}

function editMode(enable) {
    if (enable) {
        $('.commentform').val('');
        $('.commentform').show();
        $('.edit_area').show();
        $('.show_area').hide();
        $('.cancel_button').show();
        $('.submit_button').show();
        $('.footer').hide();
    } else {
        $('.commentform').hide();
        $('.edit_area').hide();
        $('.show_area').show();
        $('.cancel_button').hide();
        $('.submit_button').hide();
        $('.footer').show();
    }
}

function showProgress(enable) {
    if (enable) {
        $('.progress_bar').show();
    } else {
        $('.progress_bar').hide();
    }
}

function onShutterClick() {
    $('.fileinput').click();
}

function onCancelClick() {
    $('.reset').click();
    editMode(false);
}

function onSubmitClick() {
    const base64img = cropper.getCroppedCanvas().toDataURL();
    showProgress(true);

    var comment = escapeHtml($('.commentform').val());
    $.ajax({
        type: 'POST',
        url: '/api/upload',
        data: '{"imgBase64":"' + base64img + '", "comment":"' + comment + '"}',
        contentType: "application/json; charset=utf-8",

        success: function (data) {
            showProgress(false);
            var successEl = $('.success');
            successEl.css({'display': 'inline-block'});
            successEl.addClass('magictime vanishIn');
            $('.edit_area').fadeOut(300, function () {
                editMode(false);
            });

            setTimeout(function() {
                successEl.fadeOut(500);
            }, 3000);
        },
        error: function (jqXHR, textStatus, errorThrown) {}});
}

function fetchPhotos() {
    var fetch = new Promise(function(resolve, reject) {
        $.ajax({
            type: 'POST',
            url: '/api/list',
            data: JSON.stringify({'limit': 20}),
            contentType: "application/json; charset=utf-8",

            success: function (res) {
                var photos = res['result'];
                if (photos.length > 0) {
                    resolve(res['result']);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {}});
    });

    fetch.then(function(photos) {
        latestId = photos[0].id;
        insertPhotos(photos);
    });
}

function insertPhotos(photos) {
    var bgContainer = $('.bg_container');
    photos.forEach(function(photo) {
        var tile = $('<span>', {'class': 'bg_item'});
        var img = $('<img>', {'src': './uploads/small/' + photo.filename});
        tile.append(img);
        bgContainer.append(tile);
    });
}

function escapeHtml (string) {
    if(typeof string !== 'string') {
        return string;
    }
    return string.replace(/[&'`"<>]/g, function(match) {
        return {
            '&': '&amp;',
            "'": '&#x27;',
            '`': '&#x60;',
            '"': '&quot;',
            '<': '&lt;',
            '>': '&gt;',
        }[match]
    });
}