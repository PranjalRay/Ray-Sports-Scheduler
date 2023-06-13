/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
var csrf = require("csurf");
var cookieParser = require("cookie-parser");
const { User, Sport, SportSession, cancelSession } = require("./models");
const bodyParser = require("body-parser");
const { where } = require("sequelize");
const path = require("path");
const { urlencoded, response } = require("express");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const { error, count, time } = require("console");
const flash = require("connect-flash");
const bcrypt = require("bcrypt");
const { request } = require("http");
const { log } = require("util");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(csrf({ cookie: true }));
app.use(
  session({
    secret: "my key super secret ",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
const saltRounds = 10;
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname + "/public")));
app.use(flash());
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Credentials" });
          }
        })
        .catch((error) => {
          return error;
        });
    }
  )
);
passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});
function AdminOfSport(request, response, next) {
  const adminEmail = request.user.email;
  const actualAdminEmail = "admin@admin.com";
  if (adminEmail == actualAdminEmail) {
    return next();
  } else {
    response.redirect("/sportList");
    request.flash("error", "Please login with admin user id and password.");
  }
}
function validateUser(req, res, next) {
  User.findOne({ where: { email: req.body.email } })
    .then(async (user) => {
      console.log(user);
      const result = await bcrypt.compare(req.body.password, user.password);
      if (result) {
        res.cookie(`em`, user.email, {
          maxAge: 500 * 60 * 60 * 1000,
          secure: true,
          httpOnly: true,
        });
        res.cookie(`ps`, user.password, {
          maxAge: 500 * 60 * 60 * 1000,
          secure: true,
          httpOnly: true,
        });
        res.cookie(`fn`, user.firstName, {
          maxAge: 500 * 60 * 60 * 1000,
          secure: true,
          httpOnly: true,
        });
        console.log(result);
        next();
      } else {
        return done(null, false, { message: "Invalid Credentials" });
      }
    })
    .catch((error) => {
      console.log(error);
      return error;
    });
}
app.get("/", async function (request, response) {
  const user = request.user;
  if (request.accepts("html")) {
    response.render("index", {
      user,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({});
  }
});
app.get("/player", (request, response) => {
  response.render("player", {
    title: "player",
    csrfToken: request.csrfToken(),
  });
});
app.get("/signUp", (request, response) => {
  response.render("signup", {
    csrfToken: request.csrfToken(),
  });
});
app.get(
  "/SportList",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const userId = request.user.id;
      const sportListInfo = await Sport.getSportName();
      const userName = await request.cookies.fn;
      console.log(sportListInfo);
      console.log(userName);
      if (request.accepts("html")) {
        response.render("SportList", {
          sportListInfo,
          userName,
          userId,
          csrfToken: request.csrfToken(),
        });
      } else {
        response.json({
          userName,
          sportListInfo,
        });
      }
    } catch (error) {
      console.log(err);
    }
  }
);
app.get("/login", (request, response) => {
  response.render("login", {
    csrfToken: request.csrfToken(),
  });
});
app.post("/users", async (request, response) => {
  let isAdmin = false;
  if (request.body.isAdmin != true) {
    isAdmin = true;
  }
  if (request.body.firstName.length == 0) {
    request.flash("error", "First-Name cannot be empty!");
    return response.redirect("/signup");
  }
  if (request.body.email.length == 0) {
    request.flash("error", "Email address cannot be empty!");
    return response.redirect("/signup");
  }
  if (request.body.password.length == 0) {
    request.flash("error", "Password cannot be empty!");
    return response.redirect("/signup");
  }
  const hashedpwd = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedpwd,
      isAdmin: isAdmin,
    });
    request.login(user, (error) => {
      if (error) {
        console.log(error);
      }
      request.flash("success", "You have signed-up successfully.");
      response.redirect("/login");
    });
  } catch (error) {
    console.log(error);
  }
});
app.post(
  "/session",
  validateUser,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    const userId = request.user.id;
    request.flash("success", "You have logged in successfully.");
    if (AdminOfSport) {
      response.redirect("/admin/createSport/" + userId);
    } else {
      response.redirect("/sportList");
    }
  }
);
app.get("/signout", (request, response, next) => {
  request.logout((error) => {
    if (error) {
      return next(error);
    }
    request.flash("success", "You have successfully sign-out.");
    response.redirect("/");
  });
});
app.get("/admin", async (request, response) => {
  const user = request.user;
  const sportName = await Sport.getSportName();
  response.render("login", {
    user,
    sportName,
    csrfToken: request.csrfToken(),
  });
});
app.get(
  "/admin/createSport/:userId",
  AdminOfSport,
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const userId = request.user.id;
      const sportListInfo = await Sport.getSportName();
      const userName = request.cookies.fn;
      console.log(sportListInfo);
      if (request.accepts("html")) {
        return response.render("admin/createSport", {
          sportListInfo,
          userName,
          userId,
          csrfToken: request.csrfToken(),
        });
      } else {
        response.json({
          sportListInfo,
        });
      }
    } catch (error) {
      console.log(err);
    }
  }
);
app.post(
  "/admin/createSport/:userId",
  connectEnsureLogin.ensureLoggedIn(),
  AdminOfSport,
  async (request, response) => {
    try {
      const userId = request.user.id;
      console.log(userId);
      const sport = await Sport.addSport({
        SportName: request.body.SportName,
        userId: userId,
      });
      response.cookie(`sn`, sport.SportName, {
        maxAge: 500 * 60 * 60 * 1000,
        secure: true,
        httpOnly: true,
      });
      request.flash("success", "Sport has been created successfully!");
      response.redirect("/SportList");
    } catch (err) {
      console.log(err);
    }
  }
);
app.delete(
  "/admin/createSport/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete Sport with ID: ", request.params.id);
    try {
      await Sport.remove(request.params.id);
      request.flash("success", "You have deleted sport.");
      return response.json({ success: true });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
app.get(
  "/sportDetail/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const userId = request.user.id;
      const sportId = request.params.id;
      console.log("Id");
      console.log(userId);
      const sportDetail = await Sport.perticulerSport(request.params.id);
      const sportsession = await SportSession.getSessionDetail(
        request.params.id
      );
      const rowsOfPlayerJoinedId = await SportSession.findAll({
        where: {
          playerId: {
            [Op.contains]: [userId],
          },
          sportId,
          isCanceled: false,
        },
      });
      const NotrowsOfPlayerJoinedId = await SportSession.findAll({
        where: {
          [Op.not]: {
            playerId: {
              [Op.contains]: [userId],
            },
          },
          sportId,
          isCanceled: false,
        },
      });
      const saperateCreatedSession = await SportSession.findAll({
        where: {
          userId: {
            [Op.eq]: [userId],
          },
          sportId,
          isCanceled: false,
        },
      });
      const canceledSession = await SportSession.findAll({
        where: {
          playerId: {
            [Op.contains]: [userId],
          },
          sportId,
          isCanceled: true,
        },
      });
      console.log(rowsOfPlayerJoinedId);
      console.log(NotrowsOfPlayerJoinedId);
      const userName = request.cookies.fn;
      response.render("sportDetail", {
        userName,
        sportDetail,
        rowsOfPlayerJoinedId,
        NotrowsOfPlayerJoinedId,
        saperateCreatedSession,
        canceledSession,
        csrfToken: request.csrfToken(),
      });
    } catch (err) {
      console.log(err);
    }
  }
);
app.get(
  "/sessionCreate/:id/:userId/:SportName",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const userId = request.user.id;
    const sportDetail = await Sport.perticulerSport(request.params.id);
    const userName = request.cookies.fn;
    response.render("sessionCreate", {
      userName,
      sportDetail,
      userId,
      csrfToken: request.csrfToken(),
    });
  }
);
app.post(
  "/sessionCreate/:id/:userId/:SportName",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    let sportId = request.params.id;
    let userId = request.user.id;
    let playerId = new Array();
    const sports = await Sport.findOne({
      where: {
        id: request.params.id,
      },
    });
    console.log(sports);
    console.log(sports.SportName);
    try {
      const sportsession = await SportSession.addSession({
        date: request.body.date,
        time: request.body.time,
        place: request.body.place,
        player: request.body.player,
        TotalPlayer: request.body.TotalPlayer,
        SportName: sports.SportName,
        sportId: sportId,
        userId: userId,
        playerId,
        isCanceled: false,
        reason: null,
      });
      response.cookie(`tp`, sportsession.TotalPlayer, {
        maxAge: 500 * 60 * 60 * 1000,
        secure: true,
        httpOnly: true,
      });
      request.flash("success", "Session has been created successfully!");
      response.redirect("/sportDetail/" + sportId);
    } catch (err) {
      console.log(err);
    }
  }
);
app.delete(
  "/sportDetail/:id/:userId",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete Sport with ID: ", request.params.id);
    console.log(request.params.userId);
    try {
      await SportSession.remove(request.params.id, request.user.id);
      return response.json({ success: true });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
app.get(
  "/sportDetail/:id/joinSession/:sid",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      console.log("Have to add player in session id : ", request.params.id);
      const sessionId = request.params.sid;
      const sportId = request.params.id;
      const userId = request.user.id;
      const me = request.cookies.fn;
      const players = await SportSession.findOne({
        where: {
          id: sessionId,
          sportId: sportId,
        },
      });
      console.log(players);
      const TotalPlayer = request.cookies.tp;
      console.log(TotalPlayer);
      const ListPlayer = players.player;
      const playerIdList = players.playerId;
      console.log(players);
      console.log(playerIdList);
      const splitPlayer = ListPlayer.split(",");
      const CountPlayers = splitPlayer.length;
      console.log(CountPlayers);
      const date = new Date().toISOString();
      if (splitPlayer.includes(me)) {
        request.flash("success", "You have already joined session!");
      } else if (players.date < date) {
        request.flash("error", "You cannot join past Session");
      } else if (CountPlayers < TotalPlayer) {
        splitPlayer.push(me);
        playerIdList.push(userId);
        console.log(playerIdList);
        await SportSession.update(
          {
            playerId: playerIdList,
          },
          {
            where: { id: sessionId },
          }
        );
        request.flash("success", "You have Successfully joined the session.");
      } else {
        request.flash("error", "Sorry,session is full!");
      }
      let arrToString = splitPlayer.toString();
      await SportSession.updatePlayer({
        player: arrToString,
        id: sessionId,
      });
      const sportDetail = await Sport.perticulerSport(request.params.id);
      const sportsession = await SportSession.getSessionDetail(
        request.params.id
      );
      response.redirect("/sportDetail/" + sportId);
    } catch (error) {
      console.log(error);
    }
  }
);
app.get(
  "/sportDetail/:id/leaveSession/:sid",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      console.log(
        "We have to remove player in session id : ",
        request.params.id
      );
      const sessionId = request.params.sid;
      const sportId = request.params.id;
      const me = request.cookies.fn;
      const userId = request.user.id;
      const players = await SportSession.findOne({
        where: {
          id: sessionId,
          sportId: sportId,
        },
      });
      const TotalPlayer = request.cookies.tp;
      console.log(TotalPlayer);
      const ListPlayer = players.player;
      const playerIdList = players.playerId;
      const indexPlayerId = playerIdList.indexOf(userId);
      console.log(playerIdList);
      const splitPlayer = ListPlayer.split(",");
      const CountPlayers = splitPlayer.length;
      console.log(CountPlayers);
      const indexOfme = splitPlayer.indexOf(me);
      console.log(indexPlayerId);
      if (splitPlayer.includes(me)) {
        splitPlayer.splice(indexOfme, 1);
        playerIdList.splice(indexPlayerId, 1);
        request.flash("success", "You have Successfully left the session.");
      } else {
        request.flash("error", "Sorry, You are not in session!");
      }
      console.log(playerIdList);
      let arrToString = splitPlayer.toString();
      await SportSession.updatePlayer({
        player: arrToString,
        id: sessionId,
      });
      await SportSession.updatePlayerId({
        playerId: playerIdList,
        id: sessionId,
      });
      const sportDetail = await Sport.perticulerSport(request.params.id);
      const sportsession = await SportSession.getSessionDetail(
        request.params.id
      );
      response.redirect("/sportDetail/" + sportId);
    } catch (error) {
      console.log(error);
    }
  }
);
app.get(
  "/viewReport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const countSport = await Sport.count();
      const getSportByName = await Sport.findAll();
      const getAllSessionDetails = await SportSession.findAll({
        where: {
          date: {
            [Op.gt]: new Date().toISOString(),
          },
        },
      });
      const getAllTodaySessionDetails = await SportSession.findAll({
        where: {
          date: {
            [Op.eq]: new Date().toISOString(),
          },
        },
      });
      const getAllPreviousSessionDetails = await SportSession.findAll({
        where: {
          date: {
            [Op.lt]: new Date().toISOString(),
          },
        },
      });
      return response.render("viewReport", {
        csrfToken: request.csrfToken(),
        countSport,
        getSportByName,
        getAllSessionDetails,
        getAllTodaySessionDetails,
        getAllPreviousSessionDetails,
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
app.get(
  "/playerJoinedSession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const userId = request.user.id;
      const rowsOfPlayerId = await SportSession.findAll({
        where: {
          playerId: {
            [Op.contains]: [userId],
          },
        },
      });
      console.log(rowsOfPlayerId);
      return response.render("playerJoinedSession", {
        rowsOfPlayerId,
        userId,
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
app.get(
  "/cancelSession/:sportId/:sessionId",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const sportId = request.params.sportId;
      const sessionId = request.params.sessionId;
      const sportCancel = await cancelSession.findOne({
        where: {
          sessionId: sessionId,
          sportId: sportId,
        },
      });
      return response.render("cancelSession", {
        sportCancel,
        sportId,
        sessionId,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/cancelSession/:sportId/:sessionId",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const sportId = request.params.sportId;
      const sessionId = request.params.sessionId;
      const sportCancel = await cancelSession.findOne({
        where: {
          sessionId: sessionId,
          sportId: sportId,
        },
      });
      if (!sportCancel) {
        throw new Error("Session not found");
      }
      await cancelSession.update(
        {
          reason: request.body.reason,
        },
        {
          where: {
            sessionId: sessionId,
            sportId: sportId,
          },
        }
      );
      await SportSession.update(
        {
          isCanceled: true,
          reason: request.body.reason,
        },
        {
          where: {
            id: sessionId,
          },
        }
      );
      request.flash("success", "You have successfully canceled the session.");
      response.redirect("/sportDetail/" + sportId);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get("/cancelSession", (request, response) => {
  response.status(404).send("Not Found");
});

app.get(
  "/resetPassword/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const userId = request.user.id;
    const user = await User.findOne({
      email: request.cookies.em,
    });
    return response.render("resetPassword", {
      userId,
      user,
      csrfToken: request.csrfToken(),
    });
  }
);
app.post(
  "/resetPassword/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const hashedpwd = await bcrypt.hash(request.body.password, saltRounds);
      const userId = request.user.id;
      const user_password = await User.update(
        {
          password: hashedpwd,
        },
        {
          where: {
            id:userId,
          },
        }
      );
      request.flash("success", "Password reset is done!");
      response.redirect("/login");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
module.exports = app;
