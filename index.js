require('dotenv').config()
cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const Sentry = require("@sentry/node");
const { Server } = require("socket.io");
const http = require('http');
const {PORT = 3000, ENV, SENTRY_DSN} = process.env;

const index = express();
const server = http.createServer(index);
const io = new Server(server);

const bodyParser  = require('body-parser');

Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Sentry.Integrations.Express({ index }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    environment: ENV,
  });

index.use(morgan('combined'));
index.set('views', './views');
index.set('view engine', 'ejs');
index.use(cors());
index.use(express.json());
index.use(bodyParser.urlencoded({extended:true})); 
index.use(bodyParser.json());

index.use(Sentry.Handlers.requestHandler());

index.use(Sentry.Handlers.tracingHandler());

index.get("/", (req, res) => {
  return res.json({
    status: true,
    message: "Hello World!",
    error: null,
    data: null,
  });
});

const router = require('./routers');
index.use(router);

index.use((req, res, next) => {
    req.io = io;
    next();
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinRoom', (userId) => {
      socket.join(userId);
    });
  });

index.listen(PORT, () => console.log(`App is running at PORT ${PORT}`))

