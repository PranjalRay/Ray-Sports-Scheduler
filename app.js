/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { request, response } = require("express");
const express = require("express");
const csrf = require("tiny-csrf");
const app = express();
const { Sport, User, Sessions, playerSessions } = require("./models");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(bodyParser.json());

app.set("view engine", "ejs");
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");

const flash = require("connect-flash");
app.set("views", path.join(__dirname, "views"));
app.use(flash());

const bcrypt = require("bcrypt");
const sport = require("./models/sport");
const saltRounds = 10;

app.use(
  session({
    secret: "my-super-secret-key-21728172615261563",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(null, false, {
            message: "Your account doesn't exist, try signing up",
          });
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

app.get("/", async (request, response) => {
  if (request.user) {
    return response.redirect("/sport");
  }
  return response.render("index", {
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/sport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log(request.user);
    const loggedInUserRole = request.user.role;
    console.log(loggedInUserRole);

    try {
      const allSports = await Sport.getSports();
      const playSessions = await playerSessions.getSessions(request.user.id);
      const sessionIDs = playSessions.map((v) => v.session_id);
      const UserSessions = await Sessions.UserSessions(sessionIDs);
      console.log(UserSessions);
      const allUpcoming = await Sessions.UpSessions(UserSessions);
      if (request.accepts("html")) {
        response.render("sports", {
          allSports,
          role: loggedInUserRole,
          allUpcoming,
          csrfToken: request.csrfToken(),
        });
      } else {
        response.json({
          allSports,
          allUpcoming,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  "/sport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Creating a sport", request.body);
    try {
      const sport = await Sport.addSport({
        title: request.body.title,
        userId: request.user.id,
      });
      return response.redirect("/sport");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  if (request.body.password.length < 8) {
    request.flash("error", "Password length can't less than 8");
    return response.redirect("/signup");
  }
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      role: request.body.role,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/sport");
    });
  } catch (error) {
    console.log(error);
    request.flash("error", error.errors[0].message);
    return response.redirect("/signup");
  }
});

app.post(
  "/createSession/:sportId",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.body.playersNeeded < 0) {
      request.flash("error", "Number of players needed can't less than 0");
      return response.redirect(`/sport/sessions/${request.params.sportId}`);
    }
    console.log(request.body);
    try {
      console.log("Sessions name", request.body.sessionName);
      const session = await Sessions.addSession({
        sessionName: request.body.sessionName,
        date: request.body.date,
        time: request.body.time,
        venue: request.body.venue,
        playersNeeded: request.body.playersNeeded,
        userId: request.user.id,
        sportId: request.params.sportId,
      });
      console.log(session);
      const names = request.body.names;
      const nameArr = names.split(",");
      console.log(session.id);
      for (let i = 0; i < nameArr.length; i++) {
        await playerSessions.create({
          player_name: nameArr[i],
          session_id: session.id,
        });
      }
      return response.redirect(`/sport/${request.params.sportId}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get("/login", (request, response) => {
  if (request.user) {
    return response.redirect("/sport");
  }
  return response.render("login", {
    title: "Login",
    csrfToken: request.csrfToken(),
  });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    response.redirect("/sport");
  }
);

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get(
  "/createSport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response, next) => {
    console.log(request.user.id);
    const allSportsPart = await Sport.UsergetSports(request.user.id);
    console.log(allSportsPart);
    try {
      response.render("createSpt", {
        csrfToken: request.csrfToken(),
        allSportsPart,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.get(
  "/sport/:sportId",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response, next) => {
    console.log("We have to consider sport with ID:", request.params.sportId);
    const sport = await Sport.findByPk(request.params.sportId);
    const allSessionPart = await Sessions.UsergetSession(
      request.user.id,
      request.params.sportId
    );
    const allSportSessions = await Sessions.SportSessions(
      request.params.sportId
    );
    let allUpcoming = await Sessions.UpSessions(allSportSessions);
    console.log(allUpcoming);
    allUpcoming = await Sessions.UncancelSess(allUpcoming);
    const userRole = request.user.role;
    if (request.accepts("html")) {
      try {
        response.render("ParticularSpt", {
          title: sport.title,
          sport,
          allSessionPart,
          allUpcoming,
          userRole,
          csrfToken: request.csrfToken(),
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      response.json({
        allSessionPart,
        allUpcoming,
        sport,
      });
    }
  }
);

app.get(
  "/sport/sessions/:sportId",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response, next) => {
    const sport = await Sport.findByPk(request.params.sportId);
    try {
      response.render("createSession", {
        title: sport.title,
        sport,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.delete(
  "/sport/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Delete a sport by ID: ", request.params.id);
    try {
      const session = await Sessions.SportSessions(request.params.id);
      const sessionIDs = session.map((v) => v.id);

      await playerSessions.deleteSession(sessionIDs);
      await Sessions.deleteSession(request.params.id);
      await Sport.remove(request.params.id);

      return response.json({ success: true });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/sport/edit/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response, next) => {
    const sport = await Sport.findByPk(request.params.id);
    try {
      response.render("editSport", {
        csrfToken: request.csrfToken(),
        sport,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  "/sport/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response, next) => {
    console.log("We have to update a Sport with ID:", request.params.id);
    const sport = await Sport.findByPk(request.params.id);
    try {
      const updatedSport = await Sport.setTitle(request.body.title, sport);
      console.log(updatedSport);
      return response.redirect(`/sport/${request.params.id}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/sport/partSession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response, next) => {
    console.log("We have to consider sportSession with ID:", request.params.id);
    const Session = await Sessions.findByPk(request.params.id);
    const Players = await playerSessions.getPlayers(Session.id);
    const userId = request.user.id;
    console.log("Players", Players);
    try {
      if (request.accepts("html")) {
        response.render("particularSession", {
          title: Session.sessionName,
          Session,
          Players,
          userId,
          csrfToken: request.csrfToken(),
        });
      } else {
        response.json({
          Players,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
);

app.delete(
  "/playerSession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Delete a player by ID: ", request.params.id);
    try {
      const playerRecord = await playerSessions.findByPk(request.params.id);
      const Session = await Sessions.findByPk(playerRecord.session_id);
      console.log("1st", Session);
      await playerSessions.remove(request.params.id);
      await Sessions.incPlayerCount(Session);
      console.log("2nd", Session);
      return response.json({ success: true });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/playerSession/player/:sessionId",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response, next) => {
    console.log("Joining in session:", request.user.id);
    const userId = request.user.id;
    try {
      const Session = await Sessions.findByPk(request.params.sessionId);
      await playerSessions.create({
        player_name: `${request.user.firstName} ${request.user.lastName}`,
        player_id: userId,
        session_id: request.params.sessionId,
      });
      await Sessions.decPlayerCount(Session);
      return response.redirect(
        `/sport/partSession/${request.params.sessionId}`
      );
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/playerSession/player/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Deleting a player");
    try {
      const Session = await Sessions.findByPk(request.params.id);
      await playerSessions.removeById(request.params.id, request.user.id);
      await Sessions.incPlayerCount(Session);
      return response.json({ success: true });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/sport/partSession/editSession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const Session = await Sessions.findByPk(request.params.id);
    const sport = await Sport.findByPk(Session.sportId);
    try {
      const Players = await playerSessions.getPlayers(Session.id);
      const mapped = Players.map((v) => v.player_name);
      const names = mapped.join(",");
      response.render("editSession", {
        csrfToken: request.csrfToken(),
        Session,
        names,
        sport,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  "/editSession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.body.playersNeeded < 0) {
      request.flash("error", "Number of players needed can't less than 0");
      return response.redirect(
        `/sport/partSession/editSession/${request.params.id}`
      );
    }
    try {
      const Session = await Sessions.findByPk(request.params.id);
      const newSession = await Sessions.editSession({
        Session1: Session,
        sessionName: request.body.sessionName,
        date: request.body.date,
        time: request.body.time,
        venue: request.body.venue,
        playersNeeded: request.body.playersNeeded,
      });
      console.log(newSession);
      const Players = await playerSessions.getPlayers(Session.id);
      await playerSessions.deleteSession(request.params.id);
      const names = request.body.names;
      const nameArr = names.split(",");
      for (let i = 0; i < nameArr.length; i++) {
        let value = false;
        for (let j = 0; j < Players.length; j++) {
          if (Players[j].player_name === nameArr[i]) {
            console.log("individual palyers", Players[j]);
            await playerSessions.addPlayers({
              player_name: nameArr[i],
              session_id: newSession.id,
              player_id: Players[j].player_id,
            });
            value = true;
            break;
          }
        }
        if (value === false) {
          await playerSessions.create({
            player_name: nameArr[i],
            session_id: newSession.id,
          });
        }
      }
      return response.redirect(`/sport/partSession/${request.params.id}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/sport/partSession/cancel/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const Session = await Sessions.findByPk(request.params.id);
    const sport = await Sport.findByPk(Session.sportId);
    try {
      response.render("cancelSession", {
        csrfToken: request.csrfToken(),
        Session,
        sport,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  "/cancel/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const Session = await Sessions.findByPk(request.params.id);
      console.log("Canceling Session");
      const CancelSession = await Session.update({
        canceled: true,
        message: request.body.message,
      });
      return response.redirect(`/sport/partSession/${request.params.id}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/sport/viewPreSessions/:sportId",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sport = await Sport.findByPk(request.params.sportId);
    const allSportSessions = await Sessions.SportSessions(
      request.params.sportId
    );
    const allPrevious = await Sessions.PrevSessions(allSportSessions);
    if (request.accepts("html")) {
      try {
        response.render("prevSession", {
          csrfToken: request.csrfToken(),
          sport,
          allPrevious,
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      response.json({
        allPrevious,
      });
    }
  }
);

app.get(
  "/viewReports",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      console.log(request.body);
      response.render("viewReports", {
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);

let NoOfSess, reports, Date1, Date2;
app.post(
  "/viewReports",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (new Date(request.body.date1) >= new Date(request.body.date2)) {
      request.flash("error", "Enter Valid Range");
      return response.redirect("/viewReports");
    }
    try {
      const allsessions = await Sessions.getUncancelSess();
      Date1 = request.body.date1;
      Date2 = request.body.date2;
      const sessions = await Sessions.findRange(
        allsessions,
        request.body.date1,
        request.body.date2
      );
      console.log("filtered sessions", sessions);
      NoOfSess = sessions.length;

      let sportIDs = sessions.map((v) => v.sportId);
      sportIDs = new Set(sportIDs);
      sportIDs = Array.from(sportIDs);

      console.log(sportIDs, sportIDs.length);

      reports = [];
      for (let i = 0; i < sportIDs.length; i++) {
        const counter = await Sessions.count(sessions, sportIDs[i]);
        const sport = await Sport.findByPk(sportIDs[i]);
        const obj = {
          sportId: sportIDs[i],
          sportName: sport.title,
          count: counter,
        };
        reports.push(obj);
      }
      console.log("reports", reports);
      response.redirect("/viewReportsResult");
    } catch (error) {
      console.log(error);
    }
  }
);
app.get(
  "/viewReportsResult",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      reports.sort((a, b) => b.count - a.count);
      console.log(reports);
      response.render("viewReportsResult", {
        NoOfSess,
        reports,
        Date1,
        Date2,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);
module.exports = app;
