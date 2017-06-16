var express = require('express');
var multer = require('multer');
var fs = require('fs');
var app = express();

/* GET home page. */
app.get('/', function(req, res, next) {
  res.render('index', { title: 'kinstagram' });
});

var upload = multer({});

// ファイルアップロード
app.post('/upload', upload.single('image'), function(req, res) {
    var fileName = genId() + '.jpg';
    var imgBase64 = req.body['imgBase64'].split(',')[1];
    fs.writeFile('./uploads/' + fileName, imgBase64, 'base64', function (err) {
        if (err) return next(err);
        res.json({ 'result': 'success!' });
    })
});

function genId() {
    return new Date().getTime() + Math.floor(Math.random() * 100000000);
}

module.exports = app;