$(window).on('load', onLoad);

var latestId = -1;

function onLoad() {
    fetchPhotos();
}

function insertPhotos(photos) {
    var row = $('#r1');
    photos.forEach(function(photo) {
        var path = 'uploads/' + photo.filename;
        var item = $('<span>', {'class': 'item'}).append($('<img>', {'src': path}));
        row.append(item);
    });
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