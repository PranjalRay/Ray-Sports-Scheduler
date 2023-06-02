"use strict";
const { Model, BOOLEAN } = require("sequelize");
const { Sequelize } = require(".");
module.exports = (sequelize, DataTypes) => {
  class SportSession extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      SportSession.belongsTo(models.Sport, {
        foreignKey: "sportId",
      });
      SportSession.belongsTo(models.User, {
        foreignKey: "userId",
      });
      SportSession.hasMany(models.cancelSession,{
        foreignKey:"sessionId",
      })
      
      // SportSession.belongsTo(models.Sport, {
      //   foreignKey: "SportName",
      // });
    }
    static addSession({
      date,
      time,
      place,
      player,
      TotalPlayer,
      sportId,
      userId,
      playerId,
      SportName,
      isCanceled,
      reason,
    }) {
      return this.create({
        date,
        time,
        place,
        player,
        TotalPlayer,
        sportId,
        userId,
        playerId,
        SportName,
        isCanceled,
        reason,
      });
    }

    static async getSessionDetail(sportId) {
      return this.findAll({
        where: {
          sportId,
        },
      });
    }

    static async remove(id,userId) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }

    static async updatePlayer({ player, id}) {
      return this.update(
        { player: player },
        {
          where: {
            id,
          },
        },
      );
    }

    static async updatePlayerId({playerId, id}){
      return this.update(
        {playerId:playerId},
        {
          where:{
            id,
          }
        }
      )
    }

    static async getPlayerSessionsBySport(userId,sportId){
      return this.findAll({where:{
        userId,
        sportId,
      }})
    }
  }
  SportSession.init(
    {
      date: DataTypes.DATEONLY,
      time: DataTypes.STRING,
      place: DataTypes.STRING,
      player: DataTypes.STRING,
      TotalPlayer: DataTypes.INTEGER,
      playerId: DataTypes.ARRAY(DataTypes.INTEGER),
      SportName: DataTypes.STRING,
      isCanceled: DataTypes.BOOLEAN,
      reason: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "SportSession",
    }
  );
  return SportSession;
};
