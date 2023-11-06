/* 필요한 모듈 불러오기 */
const express = require('express');
const http = require('http');
const socket = require('socket.io');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socket(server);

/* 포트번호 */
const port = 8080;

app.use('/css', express.static('./static/css'));
app.use('/js', express.static('./static/js'));
app.use('/uploads', express.static('uploads'));

/* 이미지 업로드를 위한 Multer 설정 */
const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, 'uploads'); // 이미지 업로드 디렉토리 설정
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|txt|pdf|docx|xlsx|pptx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
      return cb(null,true);
    }

    cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
  }
});




/* 파일 업로드 디렉토리 생성 */
const uploadDirectory = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

/* Get 방식으로 / 경로에 접속하면 실행됨 */
app.get('/', function (request, response) {
  fs.readFile('./static/index.html', function (err, data) {
    if (err) {
      response.send('에러');
    } else {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.write(data);
      response.end();
    }
  });
});

/* 이미지 업로드 경로 설정 */
app.post('/upload', upload.single('file'), (req, res) => { // 'file'은 클라이언트의 input 필드 name과 일치해야 합니다.
  if (!req.file) {
    return res.status(400).send('No files were uploaded.');
  }

  const fileUrl = `/uploads/${req.file.originalname}`;
  
  io.sockets.emit('update', { 
    type: req.file.mimetype.startsWith('image') ? 'image' : 'file',
    filetype: req.file.mimetype,
    filename: req.file.originalname,
    fileUrl: fileUrl 
});
});






/* 서버를 8080 포트로 listen */
server.listen(port, function () {
  console.log('서버 실행 중..' + port);
});

io.sockets.on('connection', function (socket) {
  /* 새로운 유저가 접속했을 경우 다른 소켓에게도 알려줍니다. */
  socket.on('newUser', function (name) {
    console.log(name + ' 님이 접속하였습니다.');

    /* 소켓에 이름 저장해두기 */
    socket.name = name;

    /* 모든 소켓에게 전송 */
    io.sockets.emit('update', { type: 'connect', name: 'SERVER', message: name + '님이 접속하였습니다.' });
  });

  /* 전송한 메시지 받기 */
  socket.on('message', function (data) {
    /* 받은 데이터에 누가 보냈는지 이름을 추가 */
    data.name = socket.name;

    console.log(data);

    /* 보낸 사람을 제외한 나머지 유저에게 메시지 전송 */
    socket.broadcast.emit('update', data);

  });

  /* 접속 종료 */
  socket.on('disconnect', function () {
    console.log(socket.name + '님이 나가셨습니다.');

    /* 나가는 사람을 제외한 나머지 유저에게 메시지 전송 */
    socket.broadcast.emit('update', { type: 'disconnect', name: 'SERVER', message: socket.name + '님이 나가셨습니다.' });
  });
});
