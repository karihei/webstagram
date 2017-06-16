$(window).on('load', onLoad);
var Cropper;
var cropper;

const IMAGE_MIN_SIZE = 2048;

function onLoad() {
    $('.fileinput').change(onFileChange);
    $('.shutter_button').on('click', onShutterClick);
    $('.cancel_button').on('click', onCancelClick);
    $('.submit_button').on('click', onSubmitClick);
    Cropper = window.Cropper;
}

function onFileChange() {
    if (!this.files.length) {
        return;
    }

    const file = this.files[0];
    const fileReader = new FileReader();

    fileReader.onload = function(event) {
        const imgEl = $('.thumnail');
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
                modal: false,
                autoCropArea: 1,
                cropBoxMovable: false,
                cropBoxResizable: false,
                dragCrop: false,
                toggleDragModeOnDblclick: false,
                minCropBoxWidth: $('.edit_area').width() - 1
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
        const el = $('.edit_area');
        el.height(el.width());
        $('.edit_area').show();
        $('.cancel_button').show();
        $('.submit_button').show();
    } else {
        $('.edit_area').hide();
        $('.cancel_button').hide();
        $('.submit_button').hide();
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

    $.ajax({
        type: 'POST',
        url: '/upload',
        data: '{"imgBase64":"' + base64img + '"}',
        contentType: "application/json; charset=utf-8",

        success: function (data) {},
        error: function (jqXHR, textStatus, errorThrown) {}});
}
