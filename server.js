const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
// const session = require('express-session');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const app = express();

const config ={
    dbUrl : 'mongodb://kadaverin:1q2w3e@ds137530.mlab.com:37530/test-database'
}
  
  
const expressSession = require('express-session');

var sessionMiddleware = expressSession({
    secret: "fsdf3@@!EWEd123dsde123dwf233323",
    resave: false,
    saveUninitialized: false,
    store: new (require("connect-mongo")(expressSession))({
        url: config.dbUrl
    })
});

// var app = require("express")()
    app.use(sessionMiddleware) 
    app.use(passport.initialize())
    app.use(passport.session())

server = app.listen(3000, () => {
    console.log('listening on 3000')
})
    // ... more middleware ...
 
 
 
var io = require("socket.io")(server)
    .use(function(socket, next){
        // Wrap the express middleware
        sessionMiddleware(socket.request, {}, next);
    })


app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.use( session({
//     secret: 'asdfsdfqwerwerwe2EESDF2EDF45f',
//     resave: false,
//     saveUninitialized: false
// }));
 
// app.use(passport.initialize());
// app.use(passport.session());
app.use(express.static('public'))

app.set('views', './views')
app.set('view engine', 'pug')

const webRoutes = require("./routes/web/index")(app);
const apiRoutes = require("./routes/api/indexRoutes")(app)

mongoose.connect(config.dbUrl);

// server = app.listen(3000, () => {
//     console.log('listening on 3000')
// })

// const io = require('socket.io')(server)

// io.use( (socket, next) => {
//     session({
//     secret: 'asdfsdfqwerwerwe2EESDF2EDF45f',
//     resave: false,
//     saveUninitialized: false
// })(socket.request, {}, next)});

// io.use((socket, next) => {
//     passport.initialize(socket.request)
//     passport.session(socket.request)
//     next();
// } )

const socketEvents = require("./socket/initSocketEvents")(io)