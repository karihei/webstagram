var express = require('express');
var multer = require('multer');
var fs = require('fs');
var app = express();
var sqlite = require('sqlite3');
var db = new sqlite.Database('w.db');
var easyimg = require('easyimage');

var UPLOAD_DIR = './public/uploads/';

// DB init
db.serialize(function () {
    var create = new Promise(function (resolve, reject) {
        db.get('select count(*) from sqlite_master where type="table" and name=$name',{ $name: 'photo_table' }, function (err, res) {
            var exists = false;
            if (0 < res['count(*)']) { exists = true; }

            resolve(exists);
        });
    });

    create.then(function (exists) {
        if (!exists) {
            db.run('create table photo_table (id integer primary key, filename text, comment text)');
        }
    });
});

function insertPhotoData(param) {
    db.serialize(function() {
        db.run('insert or ignore into photo_table (id, filename, comment) values (?, ?, ?)', [param.id, param.filename, param.comment]);
    });
}

/* GET home page. */
app.get('/', function(req, res, next) {
    res.render('index', { title: 'kinstagram' });
});

app.get('/show', function(req, res, next) {
    res.render('show', { title: 'show - kinstagram' });
});

fs.readdir('./public/uploads/', function(err, files){
    if (err) throw err;
    files.filter(function(file){
        return /.*\.jpg$/.test(file); //絞り込み
    }).forEach(function (file) {
        genThumbnail(file);
    });
});

var upload = multer({});
app.post('/api/upload', upload.single('image'), function(req, res, next) {
    var id = genId();
    var fileName = id + '.jpg';
    var imgBase64 = req.body['imgBase64'].split(',')[1];
    var comment = req.body['comment'] || '';
    fs.writeFile(UPLOAD_DIR + fileName, imgBase64, 'base64', function (err) {
        if (err) {
            return next(err);
        }
        genThumbnail(fileName);
        insertPhotoData({id: id, filename: fileName, comment: comment});
        res.json({ 'result': 'success!' });
    })
});

app.post('/api/list', function(req, res, next) {
    var size = req.body['limit'] || 30;
    var offset = req.body['offset'] || 0;
    var select = new Promise(function(resolve, reject) {
        db.serialize(function() {
            db.all('select * from photo_table where id >= ? order by id desc limit ?', [offset, size], function(err, rows) {
                if (!err) {
                    resolve(rows);
                }
            });
        });
    });

    select.then(function(rows){
        res.json({ 'result': rows});
    });
});

function genId() {
    return new Date().getTime() + Math.floor(Math.random() * (9999 - 1000) + 1000);
}

function genThumbnail(src) {
    easyimg.thumbnail({
        src: UPLOAD_DIR + src, dst: UPLOAD_DIR + '/thumbnails/' + src,
        width: 800, height: 800
    });

    easyimg.thumbnail({
        src: UPLOAD_DIR + src, dst: UPLOAD_DIR + '/small/' + src,
        width: 200, height: 200
    });
}

module.exports = app;