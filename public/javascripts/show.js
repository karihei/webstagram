$(window).on('load', onLoad);

var latestId = -1;
var minPhotoRowLength = 1;
var ROWS = 3;

function onLoad() {
    initDisplay();
    fetchPhotos();
}

function initDisplay() {
    var minHeight = window.innerHeight / 2;
    $('.row').css('height', minHeight);
    minPhotoRowLength = Math.floor(window.innerWidth / minHeight) + 2;
}

function insertPhotos(photos) {
    var totalPhotoLength = minPhotoRowLength * ROWS;
    var loop = Math.ceil(minPhotoRowLength / photos.length);
    for (var i = 0;i < loop;i++){
        for (var j = 1;j <= ROWS;j++) {
            var row = $('#r' + j);
            photos.forEach(function (photo) {
                var path = 'uploads/' + photo.filename;
                var item = $('<span>', {'class': 'item'}).append($('<img>', {'src': path}));
                row.append(item);
            });
        }
    }
}

function fetchPhotos() {
    var fetch = new Promise(function(resolve, reject) {
        $.ajax({
            type: 'POST',
            url: '/api/list',
            data: JSON.stringify({'offset': 1497870075524}),
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