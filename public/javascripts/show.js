$(window).on('load', onLoad);

var latestId = -1;
var minPhotoRowLength = 1;
var minHeight = 0;
const ROWS = 4;
var allPhotos = [];
var readyToPickup = false;
const PICKUP_INTERVAL = 4000;
const FETCH_INTERVAL = 5000;

var currentPickupPos = [];

function onLoad() {
    initDisplay();
    fetchPhotos();

    setInterval(function() {
        pickup(allPhotos[Math.floor(Math.random() * allPhotos.length)]);
    }, PICKUP_INTERVAL)


    setInterval(function() {
        fetchPhotos();
    }, FETCH_INTERVAL);
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
    return 'uploads/thumbnails/' + filename;
}

function insertPhotos(photos) {
    var loop = Math.ceil(minPhotoRowLength / photos.length);
    for (var i = 0;i < ROWS;i++) {
        var row = $('#r' + i);
        var photoByRowCount = 0;
        for (var j = 0;j < loop;j++) {

            shufflePhoto(photos).forEach(function (photo) {
                var item = $('<span>', {'class': 'item', 'id': 'i' + photoByRowCount + '_' + i}).append($('<img>', {'src': getPath(photo.filename)}));
                item.height(minHeight);
                item.css('left', photoByRowCount * minHeight);
                row.append(item);
                photoByRowCount++;
            });
        }
    }
}

function updatePhotos(photos) {
    var ngPoss = currentPickupPos;
    photos.forEach(function(photo) {
        do {
            var pos = randomUpdatePosition();
        } while (ngPoss.indexOf(pos.x + '_' + pos.y) == 0);
        ngPoss.push(pos.x + '_' + pos.y);
        $('#i' + pos.x + '_' + pos.y).remove();
        var row = $('#r' + pos.y);
        var item = $('<span>', {'class': 'item', 'id': 'i' + pos.x + '_' + pos.y}).append($('<img>', {'src': getPath(photo.filename)}));
        item.height(minHeight);
        item.css('left', pos.x * minHeight);
        row.append(item);
    });
}

function randomUpdatePosition() {
    var x = Math.floor(Math.random() * minPhotoRowLength);
    var y = Math.floor(Math.random() * ROWS);
    return {x: x, y: y};
}

function fetchPhotos() {
    var fetch = new Promise(function(resolve, reject) {
        $.ajax({
            type: 'POST',
            url: '/api/list',
            data: JSON.stringify({'offset': latestId}),
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
        allPhotos = allPhotos.concat(photos);
        if (!readyToPickup) {
            // first
            insertPhotos(photos);
            readyToPickup = true;
        } else {
            // updatePhotos(photos);
        }
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
    if (!readyToPickup) {
        return;
    }
    resetPickup();

    var pickupCells = [];
    var commentCell;
    var effect = 'rotateUp';
    var duration = 200;
    var startPos = randomStartPosition();
    var commentPos = {x: 0, y:0};
    var tileSize = 3;

    // TODO:ROWを順番に見ているので新しく追加されたCELLに対応できていない。座標指定でやるべし
    for (var i = startPos.y;i < startPos.y + tileSize;i++) {
        $('#r' + i + ' .item').each(function(index, item) {
            if (index >= startPos.x && index < (startPos.x + tileSize)) {
                pickupCells.push(item);
                currentPickupPos.push(index + '_' + i);
            } else if (index == (startPos.x + tileSize) && i == (startPos.y + 1)) {
                commentCell = item;
                commentPos = {x: index, y: i};
                currentPickupPos.push(index + '_' + i);
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
        commentContainer.width(minHeight - 20);
        commentContainer.height(minHeight - 20);
        commentContainer.css({'top': minHeight * commentPos.y + 2, 'left': minHeight * commentPos.x});
        commentContainer.append(comment);
        $('.container').append(commentContainer);
    }
}

function resetPickup() {
    $('.pickup_item').remove();
    $('.comment_container').remove();
    $('.item.magictime').removeClass('magictime slideDown rotateUp');
    currentPickupPos = [];
}

function randomStartPosition() {
    var x = Math.round(Math.random() * (minPhotoRowLength - 7));
    var y = Math.round(Math.random() * (ROWS - 3));
    return {x: x, y: y};
}

function randomRefresh() {

}