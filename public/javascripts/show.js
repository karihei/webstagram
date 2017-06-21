$(window).on('load', onLoad);

var latestId = -1;
var minPhotoRowLength = 1;
var minHeight = 0;
const ROWS = 4;

function onLoad() {
    initDisplay();
    fetchPhotos();
}

function initDisplay() {
    minHeight = window.innerHeight / ROWS;

    for (var i = 0;i < ROWS;i++) {
        var row = $('<div>', {'id': 'r' + i, 'class': 'row'});
        row.css('height', minHeight);
        $('.container').append(row);
    }

    minPhotoRowLength = Math.floor(window.innerWidth / minHeight) + 2;
}

function getPath(filename) {
    return 'uploads/' + filename;
}

function insertPhotos(photos) {
    var loop = Math.ceil(minPhotoRowLength / photos.length);
    for (var i = 0;i < ROWS;i++) {
        var row = $('#r' + i);
        var photoByRowCount = 0;
        for (var j = 0;j < loop;j++) {

            shufflePhoto(photos).forEach(function (photo) {
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

function shufflePhoto(array) {
    for(var i = array.length - 1; i > 0; i--){
        var r = Math.floor(Math.random() * (i + 1));
        var tmp = array[i];
        array[i] = array[r];
        array[r] = tmp;
    }
    return array;
}

function pickup(photo) {
    var pickupCells = [];
    var commentCell;
    var effect = 'rotateUp';
    var duration = 200;
    var startPos = randomStartPosition();
    var commentPos = {x: 0, y:0};
    var tileSize = 3;

    for (var i = startPos.y;i < startPos.y + tileSize;i++) {
        $('#r' + i + ' .item').each(function(index, item) {
            if (index >= startPos.x && index < (startPos.x + tileSize)) {
                pickupCells.push(item);
            } else if (index == (startPos.x + tileSize) && i == (startPos.y + 1)) {
                commentCell = item;
                commentPos = {x: index, y: i};
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
    pickupEl.css({'top': minHeight * startPos.y, 'left': minHeight * startPos.x});
    pickupEl.width(minHeight * tileSize);
    pickupEl.height(minHeight * tileSize);

    $('.container').append(pickupEl);

    if (photo.comment.length > 0) {
        setTimeout(function () {
            $(commentCell).addClass('magictime ' + 'slideDown');
        }, pickupInterval + duration);


        var commentContainer = $('<div>', {'class': 'comment_container'});
        var comment = $('<h1>', {'class': 'comment'});
        comment.text(photo.comment);
        commentContainer.width(minHeight - 40);
        commentContainer.height(minHeight - 10);
        commentContainer.css({'top': minHeight * commentPos.y, 'left': minHeight * commentPos.x});
        commentContainer.append(comment);
        $('.container').append(commentContainer);
    }
}

function randomStartPosition() {
    var x = Math.round(Math.random() * (minPhotoRowLength - 7));
    var y = Math.round(Math.random() * (ROWS - 3));
    return {x: x, y: y};
}

function randomRefresh() {

}