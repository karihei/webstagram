var express = require('express');
var multer = require('multer');
var fs = require('fs');
var app = express();
var sqlite = require('sqlite3');
var db = new sqlite.Database('w.db');

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

var upload = multer({});
app.post('/api/upload', upload.single('image'), function(req, res, next) {
    var id = genId();
    var fileName = id + '.jpg';
    var imgBase64 = req.body['imgBase64'].split(',')[1];
    var comment = req.body['comment'] || '';
    fs.writeFile('./public/uploads/' + fileName, imgBase64, 'base64', function (err) {
        if (err) {
            return next(err);
        }
        insertPhotoData({id: id, filename: fileName, comment: comment});
        res.json({ 'result': 'success!' });
    })
});

app.post('/api/list', function(req, res, next) {
    var offset = req.body['offset'];
    var select = new Promise(function(resolve, reject) {
        db.serialize(function() {
            db.all('select * from photo_table where id >= ? order by id desc', [offset], function(err, rows) {
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

module.exports = app;