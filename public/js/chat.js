(function () {
  const logoutEndpoint = "http://localhost:3000/logout";
  const userList = document.getElementById('users-list');
  const messageList = document.getElementById('msg-list')
  const sendMsgForm = document.getElementById('send-msg-form')
  const selectDirectTab = document.getElementById('input-nickname-tab')
  const usersListTab = document.getElementById('users-list-tab');
  const isTypingBlock = document.getElementById('isTypingNotification')
  const msgInput = document.getElementById('btn-input');

  const appState = {
    selectedNickForDirectMsg: null,
    usersArr: [],
    totalMsgs: null
  }

  document.getElementById('logout-btn').addEventListener('click' , logout)
  selectDirectTab.addEventListener('click', handleSelectNickForDirect);
  userList.addEventListener('click', handleSelectNickForDirect);
  sendMsgForm.addEventListener('submit', handleSendMessage);
  msgInput.addEventListener('input', handleMsgInput);
  msgInput.addEventListener('blur' , emitUserStopTyping);


  const socket = io.connect();

  socket.emit('connected' , currentUser)
 
  socket.on('chat data' , data => {
    appState.usersArr = data.users;
    appState.totalMsgs = data.messages.length
    showMessages(data.messages)
    showUsers(data.users)
  })

  socket.on('new message' , msg => {
    let prevScrollPos = messageList.scrollTop;
    let shouldScroll = (messageList.scrollTop + messageList.clientHeight === messageList.scrollHeight);

    if (appState.totalMsgs == 100){
      messageList.querySelector('.chat-msg').remove()
      appState.totalMsgs -= 1
    }

    let li = createMsgLiNode(msg)
    messageList.appendChild(li);
    appState.totalMsgs += 1
    handleScrollMsgList(shouldScroll, prevScrollPos);
  })


  socket.on('registered' , user => {
    appState.usersArr.push(user);
    let li = createUserLiNode(user);
    userList.appendChild(li);

    handleUserAuth(user);
  })

  socket.on('loggined', user => {
    handleUserAuth(user)
  })

  socket.on('user left' , user => {
    let userNode = findUserLiNodeByNickname(user.nickname)
    replaceFirstClassBySecond(userNode,'online', 'offline')
    userNode.children[1].children[2].innerText = 'just left';
    toggleInnerTextAfterMinute(userNode.children[1].children[2] ,'just left', 'offline')

    showNotification(`@${user.nickname} left the chat`);
  })

  socket.on('user is typing', user => {
    let text = isTypingBlock.innerText;
    let userName = "@" + user.name
    if(!text){
      isTypingBlock.innerText = `${userName} is typing ...`
    }else{
      if (text.includes(userName)) return;

      let indexToPaste = text.search('is typing')
      text.slice(0, indexToPaste) + userName + text.slice(indexToPaste);
      isTypingBlock.innerText = text;
    }
  })

  socket.on('user stop typing', user => {
    let text = isTypingBlock.innerText;
    let userName = "@" + user.name
    if(!text || !text.includes(userName )) return;
    if (text == `${userName} is typing ...`){
      text = ''
    }else{
      text = text.replace(userName, '')
    }
    isTypingBlock.innerText = text;
  })

  function emitUserStopTyping(){
    socket.emit('I am stop typing' , currentUser)
  }

  function emitUserTyping(){
    socket.emit('I am typing' , currentUser)
  }

  function handleUserAuth(user){
    let userNode = findUserLiNodeByNickname(user.nickname)
    replaceFirstClassBySecond(userNode, 'offline', 'online')
    userNode.children[1].children[2].innerText = 'just appeared';
    toggleInnerTextAfterMinute(userNode.children[1].children[2] , 'just appeared', 'online')
  }

  function toggleInnerTextAfterMinute(el , from , to ){
    setTimeout( () => {
      if (el.innerText === from){
        el.innerText = to;
      }
    }, 64000)
  }

  function findUserLiNodeByNickname(nick){
    let nicksNodes = userList.getElementsByClassName('nick')
    for( let i =1; i < nicksNodes.length; i++){
      if(nicksNodes[i].innerText.slice(1) === nick) {
        return nicksNodes[i].parentNode.parentNode;
      }
    }
  }

  function replaceFirstClassBySecond(el, classToRemove, classToAdd){
    el.classList.remove(classToRemove);
    el.classList.add(classToAdd);
  }

  function showNotification(text){
    let prevScrollPos = messageList.scrollTop;
    let shouldScroll = (messageList.scrollTop + messageList.clientHeight === messageList.scrollHeight);
    let msg = document.createElement('div');
    msg.classList.add('notification-msg')
    msg.innerHTML = `<p>${text}</p>`
    messageList.appendChild(msg)
    handleScrollMsgList(shouldScroll, prevScrollPos);
  }


  function handleSendMessage() {
    event.preventDefault();
    let text = msgInput.value.trim();

    if (appState.selectedNickForDirectMsg) {
      text = text.replace(`@${appState.selectedNickForDirectMsg}`, '')
    }

    if (!text) return;
    socket.emit('send message' , {
      text : text,
      senderName: currentUser.name,
      senderNick: currentUser.nickname,
      receiverNick : appState.selectedNickForDirectMsg,
    })
    emitUserStopTyping();
    msgInput.value = '';
  }

  function showUsers(users){
    for (let i = 0; i < users.length; i++) {
      let li = createUserLiNode(users[i])
      userList.appendChild(li)
    }
  }

  function createUserLiNode(userObj) {
    // <i class="fa fa-circle" aria-hidden="true" style='color: green'></i>
    let li = document.createElement('li');
    let status = userObj.isOnline ? 'online' : 'offline'
    li.classList.add('user-item', status);
    li.innerHTML = ` 
            <i class="fa fa-circle" aria-hidden="true"></i>
            <div class="content">
                <span class="name">${ userObj.name }</span>
                <span class = 'nick'>@${ userObj.nickname }</span>
                <p class  = 'text-muted' id = 'user-status-text'>${status}</p>
            </div>
        `;
    return li;
  }


  function showMessages(msgs){
    let prevScrollPos = messageList.scrollTop;
    let shouldScroll = (messageList.scrollTop + messageList.clientHeight === messageList.scrollHeight);
    messageList.innerHTML = '';

    for (let i = msgs.length -1 ; i >= 0; i--) {
      let li = createMsgLiNode(msgs[i]);
      messageList.appendChild(li);
    }

    handleScrollMsgList(shouldScroll, prevScrollPos);
  }

  function handleScrollMsgList(shouldScroll , prevScrollPos) {
    messageList.scrollTop = shouldScroll ? messageList.scrollHeight : prevScrollPos;
  }


  function createMsgLiNode(msgObj) {
    let li = document.createElement('li')
    li.classList.add('clearfix' , 'chat-msg')
    let msgBodyClass = '';
    if (msgObj.receiverNick == currentUser.nickname) {
      msgBodyClass = 'msg-for-current-user'
    }
    li.innerHTML = `  
                  <div class="clearfix chat-msg-content ${msgBodyClass} ">
                      <div class="header">
                          <strong class="primary-font">${ msgObj.senderName } (@${ msgObj.senderNick })</strong> 
                          <small class="pull-right text-muted">
                              <span class="glyphicon glyphicon-time"></span>
                              ${ (new Date(msgObj.createdAt)) }
                          </small>
                      </div>
                      <p>${ msgObj.text }</p>
                  </div>
              `;
    return li;
  }


  function substractNickFromString(str) {
    return str.includes(" ") ? str.slice(1, str.indexOf(' ')) : str.slice(1)
  }

  function handleMsgInput() {
    this.value? emitUserTyping() : emitUserStopTyping()
    let usrWantsSendDirectMsgRegExp = /@(.*)/
    let matched = this.value.match(usrWantsSendDirectMsgRegExp)
    if (matched) {
      let partOfNick = substractNickFromString(matched[0])
      let nickRegExp = new RegExp(partOfNick, 'i')

      matchedUsers = appState.usersArr.filter(user => {
        return nickRegExp.test(user.nickname)
      })

      handleShowSelectDirectTab(matchedUsers, partOfNick)

    } else hideSelectDirectTab()
  }

  function handleShowSelectDirectTab(usersThatMatchedToInput, searchPattern){
    switch (usersThatMatchedToInput.length) {
        case 1:
          {
            if (usersThatMatchedToInput[0].nickname === searchPattern) {
              hideSelectDirectTab();
            } else {
              showUsersForDirectMsg(usersThatMatchedToInput);
            }
            break;
          }
        case 0:
          {
            hideSelectDirectTab();
            appState.selectedNickForDirectMsg = null;
            break;
          }
        default: showUsersForDirectMsg(usersThatMatchedToInput);
      }
  }

  function hideSelectDirectTab(){
    selectDirectTab.style.display = 'none';
  }

  function handleSelectNickForDirect() {
    if (event.target.classList.contains('content')) {
      appState.selectedNickForDirectMsg = event.target.children[1].innerText.slice(1);
    } else if (event.target.tagName = 'SPAN') {
      appState.selectedNickForDirectMsg = event.target.parentNode.children[1].innerText.slice(1);
    } else return;

    insertSelectedNickIntoMsgInput()
    hideSelectDirectTab();
    msgInput.focus();
  }

  function insertSelectedNickIntoMsgInput(){
    let text = msgInput.value;
    let startIndex = text.indexOf('@');
    let spaceIndex = text.indexOf(" ", startIndex);
    if (spaceIndex === -1) {
      text = text.replace(text.slice(startIndex), "@" + appState.selectedNickForDirectMsg);
    } else {
      text = text.replace(text.substr(startIndex, spaceIndex), "@" + appState.selectedNickForDirectMsg);
    }
    msgInput.value = text;
  }

  function showUsersForDirectMsg(matchedUsers) {
    appState.selectedNickForDirectMsg = null;
    usersListTab.innerHTML = ``
    matchedUsers.forEach(user => {
      li = createSelectUserListItem(user)
      usersListTab.appendChild(li)
    })
    selectDirectTab.style.display = 'block'
  }

    function createSelectUserListItem(userObj) {
    // <i class="fa fa-circle" aria-hidden="true" style='color: green'></i>
    let li = document.createElement('li');
    li.classList.add('select-user-item');
    li.innerHTML = ` 
            <div class="content">
                <span class="name">${ userObj.name }</span>
                <span class = 'nick'>@${ userObj.nickname }</span>
            </div>
        `;
    return li;
  }

  function logout(){
    fetch(logoutEndpoint ,  { credentials: 'same-origin' })
    .then(res => {
      socket.emit('I left chat' , currentUser)
      window.location = res.url
    })
  }

})()