var express = require('express');
var router = express.Router();
var multer = require('multer');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit:50000}));

/* GET home page. */
app.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var upload = multer({});

// ファイルアップロード
app.post('/upload', upload.single('image'), function(req, res) {
    var fileName = genId() + '.png';
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