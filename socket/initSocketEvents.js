const passport = require('passport')
const MessageService = require('../services/message')
const UserService = require('../services/user')

let connectedUsersFlags = {}


module.exports = function(io){
  io.on('connection' , socket => {
    emitChatData(socket)

    socket.on('connected' , user => {
      connectedUsersFlags[user.nickname] = true
    })

    socket.on('send message' , msg => {
      MessageService.createNewMessage(msg , (err , newMsg) => {
        if(!err) io.emit('new message', newMsg)
      })
    })

    socket.on('I am typing' , user => {
      socket.broadcast.emit('user is typing' , user)
    })

    socket.on('I left chat' , user => {
      delete connectedUsersFlags[user.nickname]
      socket.broadcast.emit('user left' , user)
    })

    socket.on('I am stop typing' , user => {
      socket.broadcast.emit('user stop typing' , user)
    })

  })
}

function emitChatData(socket){
  MessageService.getLastMessages(100 , (err , msgs) => {
    if(err) return  socket.emit('fetch msgs error')
    UserService.all( (err , users) => {
      if (!err) {
        // add isOnline property to each user object
        let usersArr = users.map( user => {
          let modifiedUser = {...user}
          modifiedUser['isOnline'] =  !!connectedUsersFlags[user.nickname];
          return modifiedUser
        })

        socket.emit('chat data' , {messages: msgs , users: usersArr})
      }
    })
  })
}