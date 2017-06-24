$(window).on('load', onLoad);

var latestId = -1;
var minPhotoRowLength = 1;
var minHeight = 0;
var allPhotos = [];
var currentPickupPos = [];
var readyToPickup = false;
var lotsMode = false;
var pickupStreak = 0;
var updatePhotoQueue = [];
const maxPickupStreak = 3;

const ROWS = 4;
const PICKUP_INTERVAL = 10000;
const FETCH_INTERVAL = 5000;

const PICKUP_EFFECT = 'vanishOut';
const UPDATE_EFFECT = 'vanishIn';
const COMMENT_EFFECT = 'vanishOut';

$(window).keydown(function(e){
    if (e.keyCode == 32) { // space key
        startLots();
    }
    return false;
});

function onLoad() {
    initDisplay();
    fetchPhotos();
    setInterval(function() {
        if (!lotsMode) {
            pickup(allPhotos[Math.floor(Math.random() * allPhotos.length)]);
        }
    }, PICKUP_INTERVAL)


    setInterval(function() {
        if (!lotsMode) {
            fetchPhotos();
        }
    }, FETCH_INTERVAL);
}

function initDisplay() {
    minHeight = window.innerHeight / ROWS;

    for (var i = 0;i < ROWS;i++) {
        const row = $('<div>', {'id': 'r' + i, 'class': 'row'});
        row.css('height', minHeight);
        $('.container').append(row);
    }

    minPhotoRowLength = Math.floor(window.innerWidth / minHeight) + 1;
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
            photos = shufflePhoto(photos);
            for (var k = 0;k < photos.length;k++) {
                const photoIndex = minPhotoRowLength * i + photoByRowCount;
                if (photoByRowCount < minPhotoRowLength && photoIndex < photos.length) {
                    const item = $('<span>', {
                        'class': 'item',
                        'id': 'i' + photoByRowCount + '_' + i
                    }).append($('<img>', {'src': getPath(photos[photoIndex].filename)}));
                    item.height(minHeight);
                    item.css('left', photoByRowCount * minHeight);
                    row.append(item);
                    photoByRowCount++;
                }
            }
        }
    }
}

function updatePhotos(photos) {
    var ngPoss = currentPickupPos.concat();
    photos.forEach(function(photo) {
        do {
            var pos = randomUpdatePosition();
        } while (ngPoss.indexOf(pos.x + '_' + pos.y) >= 0);
        ngPoss.push(pos.x + '_' + pos.y);
        $('#i' + pos.x + '_' + pos.y).remove();
        const row = $('#r' + pos.y);
        const item = $('<span>', {'class': 'item', 'id': 'i' + pos.x + '_' + pos.y}).append($('<img>', {'src': getPath(photo.filename)}));
        item.height(minHeight)
            .css('left', pos.x * minHeight)
            .hide();
        const placeholder = $('<span>', {'class': 'item_placeholder'})
            .css('left', pos.x * minHeight)
            .height(minHeight)
            .width(minHeight);
        setTimeout(function() {
            $(item).show().addClass('magictime ' + UPDATE_EFFECT);
            $(placeholder).fadeOut(300, function () {
                $(this).remove();
            });
        }, 400);
        row.append(placeholder);
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
            data: JSON.stringify({'offset': latestId, limit: minPhotoRowLength * ROWS}),
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
            updatePhotos(photos);
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
    pickupStreak++;
    if (!readyToPickup && pickupStreak < 0) {
        return;
    }
    if (pickupStreak > maxPickupStreak) {
        resetPickup();
        pickupStreak = -1;
        return;
    }

    currentPickupPos = [];
    var pickupCells = [];
    var commentCells = [];
    var commentPos;
    const duration = 50;
    const startPos = {x: 0, y: 0}; // randomStartPosition(); 解像度によってはランダム要素いらないかも
    const tileSize = 3;

    for (var i = startPos.y;i < startPos.y + tileSize;i++) {
        for(var j = 0;j < minPhotoRowLength;j++) {
            const posStr = j + '_' + i;
            const item = $('#i' + posStr);
            if (j >= startPos.x && j < (startPos.x + tileSize)) {
                pickupCells.push(item);
                currentPickupPos.push(posStr);
            } else if ((j == (startPos.x + tileSize) || j == (startPos.x + tileSize + 1)) && i == (startPos.y + 1)) {
                commentCells.push(item);
                if (!commentPos) {
                    commentPos = {x: j, y: i};
                }
                currentPickupPos.push(posStr);
            }
        }
    }

    var pickupInterval = 0;
    pickupCells.forEach(function(cell, index) {
        pickupInterval = duration * index;
        setTimeout(function() {
            $(cell).addClass('magictime ' + PICKUP_EFFECT);
        }, pickupInterval);
    });

    const pickupEl = $('<span>', {'class': 'pickup_item magictime vanishIn'});
    const imgEl = $('<img>', {'src' : getPath(photo.filename)});
    pickupEl.append(imgEl);
    pickupEl.css({'top': minHeight * startPos.y, 'left': minHeight * startPos.x})
        .width(minHeight * tileSize)
        .height(minHeight * tileSize);

    $('.container').append(pickupEl);

    if (photo.comment.length > 0) {
        commentCells.forEach(function(cell, index) {
            setTimeout(function () {
                $(cell).addClass('magictime ' + COMMENT_EFFECT);
            }, pickupInterval + duration);
        });

        const commentContainer = $('<div>', {'class': 'comment_container'})
            .width(minHeight * 2 - 20)
            .height(minHeight - 25)
            .css({'top': minHeight * commentPos.y + 4, 'left': minHeight * commentPos.x});

        const comment = $('<h1>', {'class': 'comment'})
            .text(photo.comment)
            .css('font-size', calcFontSize(photo.comment, commentContainer) + 'px');

        commentContainer.append(comment);
        $('.container').append(commentContainer);
    }
}

function calcFontSize(comment, container) {
    if (comment.length > 0) {
        return Math.sqrt(container.width() * container.height() / comment.length * 0.6);
    } else {
        return 0;
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

function startLots() {
    lotsMode = true;
}