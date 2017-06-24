$(window).on('load', onLoad);
var Cropper, cropper;
const IMAGE_MIN_SIZE = 1500;
var enablePhotoClick = false;

function onLoad() {
    $('.fileinput').on('change', onFileChange);
    $('.shutter_button').on('click', onShutterClick);
    $('.cancel_button').on('click', onCancelClick);
    $('.submit_button').on('click', onSubmitClick);
    $('.close_button').on('click', onCloseClick);
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
    const imgEl = $('.thumnail');
    const thumbnailWidth = $('.edit_area').width();

    const fileLoad = new Promise(function (resolve, reject) {
        fileReader.onload = function() {
            imgEl.css({
                'min-height': thumbnailWidth,
                'max-height': thumbnailWidth
            });
            if (cropper) {
                imgEl.attr('src', null);
                cropper.destroy();
            }
            resolve(file);
        };
    });

    fileLoad.then(function(file) {
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
                minCropBoxWidth: thumbnailWidth - 1,
                ready: function() {
                    showProgress(false);
                }
            });
        });
    });

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
        $('.commentform').val('').show();
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

function detailMode(enable, photo) {
    var detailClassName = 'detail_mode';
    if (enable) {
        $('.show_area').addClass(detailClassName);
        $('.detail_area').addClass(detailClassName);
        $('.detail_photo').attr('src', './uploads/' + photo.filename);
        $('.detail_comment').text(photo.comment);
        $('.cancel_button').show();

    } else {
        $('.show_area').removeClass(detailClassName);
        $('.detail_area').removeClass(detailClassName);
        $('.detail_photo').attr('src', null);
        $('.bg_container').scrollTop = 200;
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
    detailMode(false);
}

function onSubmitClick() {
    const base64img = cropper.getCroppedCanvas().toDataURL();
    const comment = escapeHtml($('.commentform').val());

    showProgress(true);
    $.ajax({
        type: 'POST',
        url: '/api/upload',
        data: JSON.stringify({'imgBase64': base64img, 'comment': comment}),
        contentType: "application/json; charset=utf-8",

        success: function () {
            showProgress(false);
            $('.edit_area').fadeOut(300, function () {
                editMode(false);
            });
            showSuccess();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showError();
        }});
}

function showSuccess() {
    const successEl = $('.success');
    successEl.css({'display': 'inline-block'}).addClass('magictime vanishIn');
    setTimeout(function() {
        successEl.fadeOut(500);
    }, 2000);
}

function showError() {
    const el = $('.error');
    el.css({'display': 'inline-block'}).addClass('magictime vanishIn');
    setTimeout(function() {
        el.fadeOut(500);
    }, 2000);
}

function onCloseClick() {
    $('.welcome_board').hide();
    $('.bg_container').removeClass('background_mode');
    enablePhotoClick = true;
}

function fetchPhotos() {
    const fetch = new Promise(function(resolve, reject) {
        $.ajax({
            type: 'POST',
            url: '/api/list',
            data: JSON.stringify({'limit': 20}),
            contentType: "application/json; charset=utf-8",

            success: function (res) {
                const photos = res['result'];
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
    const bgContainer = $('.bg_container');
    photos.forEach(function(photo) {
        const tile = $('<span>', {'class': 'bg_item'});
        const img = $('<img>', {'src': './uploads/small/' + photo.filename});
        tile.on('click', {value: photo}, onItemClick);
        tile.append(img);
        bgContainer.append(tile);
    });
}

function onItemClick(e) {
    if (!enablePhotoClick) {
        return;
    }
    detailMode(true, e.data.value);
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