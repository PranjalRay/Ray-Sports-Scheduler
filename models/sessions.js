"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sessions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sessions.belongsTo(models.Sport, {
        foreignKey: "sportId",
      });
      Sessions.belongsTo(models.User, {
        foreignKey: "userId",
      });
      Sessions.hasMany(models.playerSessions, {
        foreignKey: "session_id",
      });
    }

    static addSession({
      sessionName,
      date,
      time,
      venue,
      playersNeeded,
      userId,
      sportId,
    }) {
      return this.create({
        sessionName,
        date,
        time,
        venue,
        playersNeeded,
        userId,
        sportId,
      });
    }

    static editSession({
      Session1,
      sessionName,
      date,
      time,
      venue,
      playersNeeded,
      userId,
      sportId,
    }) {
      return Session1.update({
        sessionName,
        date,
        time,
        venue,
        playersNeeded,
        userId,
        sportId,
      });
    }

    static UsergetSession(userId, sportId) {
      return this.findAll({
        where: {
          userId,
          sportId,
        },
      });
    }

    static incPlayerCount(Session) {
      return Session.update({ playersNeeded: Session.playersNeeded + 1 });
    }

    static decPlayerCount(Session) {
      return Session.update({ playersNeeded: Session.playersNeeded - 1 });
    }

    static async SportSessions(sportId) {
      return this.findAll({
        where: {
          sportId,
        },
      });
    }

    static async UserSessions(sessionIDs) {
      return this.findAll({
        where: {
          id: sessionIDs,
        },
      });
    }

    static async UpSessions(sportSessions) {
      const upSessions = sportSessions.filter(
        (sportSessions) =>
          new Date(`${sportSessions.date} ${sportSessions.time}`) >= new Date()
      );
      return upSessions;
    }

    static async PrevSessions(sportSessions) {
      const prevSessions = sportSessions.filter(
        (sportSessions) =>
          new Date(`${sportSessions.date} ${sportSessions.time}`) < new Date()
      );
      return prevSessions;
    }

    static async getUncancelSess() {
      return this.findAll({
        where: {
          canceled: null,
        },
      });
    }

    static async UncancelSess(session) {
      const UncancelSess = session.filter(
        (session) => session.canceled === null
      );
      return UncancelSess;
    }

    static async count(session, id) {
      let counter = 0;
      for (let j = 0; j < session.length; j++) {
        if (session[j].sportId === id) {
          counter++;
        }
      }
      return counter;
    }

    static async findRange(sessionlist, date1, date2) {
      const rangeSessions = sessionlist.filter(
        (sessionlist) =>
          new Date(`${sessionlist.date} ${sessionlist.time}`) >=
            new Date(date1) &&
          new Date(`${sessionlist.date} ${sessionlist.time}`) <= new Date(date2)
      );
      return rangeSessions;
    }

    static async deleteSession(sportId) {
      return this.destroy({
        where: { sportId },
      });
    }
  }
  Sessions.init(
    {
      date: DataTypes.DATEONLY,
      time: DataTypes.TIME,
      venue: DataTypes.STRING,
      playersNeeded: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      sessionName: DataTypes.STRING,
      sportId: DataTypes.INTEGER,
      canceled: DataTypes.BOOLEAN,
      message: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Sessions",
    }
  );
  return Sessions;
};
