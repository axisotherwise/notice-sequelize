const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const nunjucks = require("nunjucks");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");
const multer = require("multer");
const hpp = require("hpp");
const helmet = require("helmet");
const passport = require("passport");
// const redis = require("redis");
// const RedisStore = require("connect-redis")(session);

dotenv.config();
// const redisClient = redis.createClient({
//   url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
//   password: process.env.REDIS_PASSWORD,
// });
const { sequelize } = require("./models");
const indexRouter = require("./routes");
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const noticeRouter = require("./routes/notice");
const passportConfig = require("./passport");
const logger = require("./logger");

const app = express();
app.set("port", process.env.PORT || 1000);
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
})
sequelize.sync({ force: false })
  .then(() => {
    console.log("db connect");
  })
  .catch((err) => {
    console.error(err);
  });
if (process.env.NODE_ENV === "production") {
  // app.enable("trust proxy"); // 프록시 서버 적용 시
  app.use(morgan("combined"));
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(hpp());
} else {
  app.use(morgan("dev"));
}

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/img", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
  // store: new RedisStore({ client: redisClient }),
}));
passportConfig();
app.use(passport.initialize());
app.use(passport.session());

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/notice", noticeRouter);
app.use("/user", userRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 존재하지 않습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

const server = app.listen(app.get("port"), () => {
  console.log("1000");
});