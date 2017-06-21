$(window).on('load', onLoad);

var latestId = -1;
var minPhotoRowLength = 1;
var minheight = 0;
const ROWS = 3;

function onLoad() {
    initDisplay();
    fetchPhotos();
}

function initDisplay() {
    minHeight = window.innerHeight / ROWS;
    $('.row').css('height', minHeight);
    minPhotoRowLength = Math.floor(window.innerWidth / minHeight) + 2;
}

function getPath(filename) {
    return 'uploads/' + filename;
}

function insertPhotos(photos) {
    var loop = Math.ceil(minPhotoRowLength / photos.length);
    for (var i = 1;i <= ROWS;i++) {
        var row = $('#r' + i);
        var photoByRowCount = 0;
        for (var j = 0;j < loop;j++) {
            photos.forEach(function (photo) {
                var item = $('<span>', {'class': 'item'}).append($('<img>', {'src': getPath(photo.filename)}));
                item.height(minHeight);
                item.css('left', photoByRowCount * minHeight);
                row.append(item);
                photoByRowCount++;
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
        pickup(photos[0]);
    });
}

function pickup(photo) {
    var pickupCells = [];
    var comemntCells = [];
    var effect = 'rotateUp';
    var duration = 200;
    for (var i = 1;i <= ROWS;i++) {
        $('#r' + i + ' .item').each(function(index, item) {
            if (index < 3) {
                pickupCells.push(item);
            }
            if (i == 2 && index > 2 && 6 > index) {
                comemntCells.push(item);
            }
        });
    }

    var pickupInterval = 0;
    pickupCells.forEach(function(cell, index) {
        pickupInterval = duration * index;
        setTimeout(function() {
            $(cell).addClass('magictime ' + effect);
        }, pickupInterval);
    });

    var pickupEl = $('<span>', {'class': 'pickup_item'});
    var imgEl = $('<img>', {'src' : getPath(photo.filename)});
    pickupEl.append(imgEl);
    pickupEl.width(minHeight * ROWS);
    pickupEl.height(minHeight * ROWS);

    $('.container').append(pickupEl);

    if (photo.comment.length > 0) {
        comemntCells.forEach(function (cell, index) {
            setTimeout(function () {
                $(cell).addClass('magictime ' + 'slideDown');
            }, pickupInterval + duration * index);
        });

        var commentContainer = $('<div>', {'class': 'comment_container'});
        var comment = $('<h1>', {'class': 'comment'});
        comment.text(photo.comment);
        commentContainer.width(minHeight * 3 - 20);
        commentContainer.height(minHeight - 10);
        commentContainer.css({'top': minHeight, 'left': minHeight * 3});
        commentContainer.append(comment);
        $('.container').append(commentContainer);
    }
}