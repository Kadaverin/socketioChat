const passport = require('passport')


module.exports = function(io){
    io.on('connection' , socket => {
        // console.log('Client connected!')
        // socket.on('authorized' , user => {
        //     console.log('authorized new user!')
        //     console.log(user)
        //     console.log('socket.request')
        //     console.log(socket.request)
        //     console.log(socket.request.user)
        //     console.log(socket.request.passport)
        // })
        // socket.on
        socket.on('login request' , credentials => {
            console.log('login request')
            passport.authenticate('local', (err, user, info) => {
                
                if(info) { console.log(info) }
                // if (!user) { return res.redirect('/'); }
                socket.request.login(user, (err) => {
                if (err) { console.log(err) }
                    console.log('logginned')
                    console.log(user)
                    console.log(socket.request.passport)
                })
            })
        })
        socket.on('register request' , credentials => {
            console.log('register request')
            console.log(credentials);
        })
    })
}