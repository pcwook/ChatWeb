var socket = io()

/* 접속 되었을 때 실행 */
socket.on('connect', function () {
  /* 이름을 입력받고 */
  var name = prompt('반갑습니다!', '')

  /* 이름이 빈칸인 경우 */
  if (!name) {
    name = '익명'
  }

  /* 서버에 새로운 유저가 왔다고 알림 */
  socket.emit('newUser', name)
})

/* 서버로부터 데이터 받은 경우 */
socket.on('update', function (data) {
  var chat = document.getElementById('chat')

  // 이미지 URL이 포함된 데이터인 경우 이미지를 채팅창에 추가
  if (data.type == 'image') {
    var img = document.createElement('img');
    img.src = data.fileUrl;
    chat.appendChild(img);
  } else if (data.type == 'file'){
    
    var link = document.createElement('a');
    link.href = data.fileUrl;
    link.textContent = data.filename;
    chat.appendChild(link);
  } else {
    // 텍스트 메시지인 경우 기존 코드로 처리
    var message = document.createElement('div')
    var node = document.createTextNode(`${data.name}: ${data.message}`)
    var className = ''

    // 타입에 따라 적용할 클래스를 다르게 지정
    switch (data.type) {
      case 'message':
        className = 'other'
        break

      case 'connect':
        className = 'connect'
        break

      case 'disconnect':
        className = 'disconnect'
        break
    }

    message.classList.add(className)
    message.appendChild(node)
    chat.appendChild(message)
  }
});

/* 메시지 전송 함수 */
function send() {
  // 입력되어있는 데이터 가져오기
  var message = document.getElementById('test').value

  // 가져왔으니 데이터 빈칸으로 변경
  document.getElementById('test').value = ''

  // 내가 전송할 메시지 클라이언트에게 표시
  var chat = document.getElementById('chat')
  var msg = document.createElement('div')
  var node = document.createTextNode(message)
  msg.classList.add('me')
  msg.appendChild(node)
  chat.appendChild(msg)

  // 서버로 message 이벤트 전달 + 데이터와 함께
  socket.emit('message', { type: 'message', message: message })
}



// 추가 코드
// 이미지 업로드 양식 제출
document.getElementById('image-upload-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var formData = new FormData(this);
  fetch('/upload', {
    method: 'POST',
    body: formData,
  })
    .then(response => response.json())
    .then(data => {
      socket.emit("update", data);

       // 파일 업로드 성공 메시지 채팅에 추가
       var chat = document.getElementById('chat');
       var fileUploadMessage = document.createElement('div');
       fileUploadMessage.classList.add('info'); 
       fileUploadMessage.textContent ='파일이 업로드되었습니다';
       
      chat.appendChild(fileUploadMessage);

      
    })
    .catch(error => console.error("Image upload error:", error));
});
