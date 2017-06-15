$(window).on('load', onLoad);
var Cropper;
var cropper;

const IMAGE_MIN_SIZE = 1024;

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
    const imgEl = $('.thumnail');

    fileReader.onload = function(event) {
        // 読み込んだデータをimgに設定
        resizeImage(event.target.result, function (dataurl) {
            imgEl.attr('src', dataurl);
            cropper = new Cropper(imgEl[0], {
                aspectRatio: 1,
                dragMode: "move",
                wheelZoomRatio: 0.05,
                modal: false,
                autoCropArea: 0.2,
                cropBoxMovable: false,
                cropBoxResizable: false,
                dragCrop: false,
                toggleDragModeOnDblclick: false,
                minCropBoxWidth: $('.edit_area').width() - 1,

                crop: function(e) {

                }
            });
        });

    };

    fileReader.readAsDataURL(file);

    editMode(true);
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

        success: function (data) {
        },
        error: function (jqXHR, textStatus, errorThrown) {
        }});
}

function resizeImage(base64image, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    var image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = function(event){
        var dstWidth, dstHeight;
        if (this.width > this.height) {
            dstWidth = IMAGE_MIN_SIZE;
            dstHeight = this.height * IMAGE_MIN_SIZE / this.width;
        } else {
            dstHeight = IMAGE_MIN_SIZE;
            dstWidth = this.width * IMAGE_MIN_SIZE / this.height;
        }
        canvas.width = dstWidth;
        canvas.height = dstHeight;
        ctx.drawImage(this, 0, 0, this.width, this.height, 0, 0, dstWidth, dstHeight);
        callback(canvas.toDataURL());
    };
    image.src = base64image;
};