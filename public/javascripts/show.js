$(window).on('load', onLoad);

var latestId = -1;
var minPhotoRowLength = 1;
var minHeight = 0;
var allPhotos = [];
var currentPickupPos = [];
var readyToPickup = false;

const ROWS = 4;
const PICKUP_INTERVAL = 10000;
const FETCH_INTERVAL = 5000;

const PICKUP_EFFECT = 'rotateUp';
const COMMENT_EFFECT = 'slideDown';

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
        const row = $('<div>', {'id': 'r' + i, 'class': 'row'});
        row.css('height', minHeight);
        $('.container').append(row);
    }

    minPhotoRowLength = Math.floor(window.innerWidth / minHeight) + 2;
}

function getPath(filename) {
    return 'uploads/thumbnails/' + filename;
}

function insertPhotos(photos) {
    const loop = Math.ceil(minPhotoRowLength / photos.length);
    for (var i = 0;i < ROWS;i++) {
        const row = $('#r' + i);
        var photoByRowCount = 0;
        for (var j = 0;j < loop;j++) {

            shufflePhoto(photos).forEach(function (photo) {
                const item = $('<span>', {'class': 'item', 'id': 'i' + photoByRowCount + '_' + i}).append($('<img>', {'src': getPath(photo.filename)}));
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
        const row = $('#r' + pos.y);
        const item = $('<span>', {'class': 'item', 'id': 'i' + pos.x + '_' + pos.y}).append($('<img>', {'src': getPath(photo.filename)}));
        item.height(minHeight);
        item.css('left', pos.x * minHeight);
        row.append(item);
    });
}

function randomUpdatePosition() {
    const x = Math.floor(Math.random() * minPhotoRowLength);
    const y = Math.floor(Math.random() * ROWS);
    return {x: x, y: y};
}

function fetchPhotos() {
    const fetch = new Promise(function(resolve, reject) {
        $.ajax({
            type: 'POST',
            url: '/api/list',
            data: JSON.stringify({'offset': latestId}),
            contentType: "application/json; charset=utf-8",

            success: function (res) {
                const photos = res['result'];
                if (photos.length > 0) {
                    resolve(photos);
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
        const r = Math.floor(Math.random() * (i + 1));
        const tmp = array[i];
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
    var commentPos = {x: 0, y:0};
    const duration = 200;
    const startPos = randomStartPosition();
    const tileSize = 3;

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
            $(cell).addClass('magictime ' + PICKUP_EFFECT);
        }, pickupInterval);
    });

    const pickupEl = $('<span>', {'class': 'pickup_item'});
    const imgEl = $('<img>', {'src' : getPath(photo.filename)});
    pickupEl.append(imgEl);
    pickupEl.css({'top': minHeight * startPos.y, 'left': minHeight * startPos.x})
        .width(minHeight * tileSize)
        .height(minHeight * tileSize);

    $('.container').append(pickupEl);

    if (photo.comment.length > 0) {
        setTimeout(function () {
            $(commentCell).addClass('magictime ' + COMMENT_EFFECT);
        }, pickupInterval + duration);


        const commentContainer = $('<div>', {'class': 'comment_container'});
        const comment = $('<h1>', {'class': 'comment'});
        comment.text(photo.comment);
        commentContainer
            .width(minHeight - 20)
            .height(minHeight - 20)
            .css({'top': minHeight * commentPos.y + 2, 'left': minHeight * commentPos.x})
            .append(comment);
        $('.container').append(commentContainer);
    }
}

function resetPickup() {
    $('.pickup_item').remove();
    $('.comment_container').remove();
    $('.item.magictime').removeClass('magictime ' + COMMENT_EFFECT + ' ' + PICKUP_EFFECT);
    currentPickupPos = [];
}

function randomStartPosition() {
    const x = Math.round(Math.random() * (minPhotoRowLength - 7));
    const y = Math.round(Math.random() * (ROWS - 3));
    return {x: x, y: y};
}

function randomRefresh() {
    // TODO
}