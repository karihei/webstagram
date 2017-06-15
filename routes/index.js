var express = require('express');
var router = express.Router();
var multer = require('multer');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit:50000}));

/* GET home page. */
app.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var storage = multer.diskStorage({
    // ファイルの保存先
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },

    // ファイル名
    filename: function (req, file, cb) {
        cb(null, new Date().getTime() + '_' + file.originalname)
    }
});
var upload = multer({ storage: storage });

// ファイルアップロード
app.post('/upload', upload.single('image'), function(req, res) {
    res.json({ 'result': 'success!' });
});

module.exports = app;