/* eslint-disable camelcase */
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class playerSessions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      playerSessions.belongsTo(models.User, {
        foreignKey: "player_id",
      });
      playerSessions.belongsTo(models.Sessions, {
        foreignKey: "session_id",
      });
    }

    static addPlayers(player_name, session_id, player_id) {
      this.create(player_name, session_id, player_id);
    }

    static getPlayers(session_id) {
      return this.findAll({
        where: {
          session_id,
        },
      });
    }

    static getSessions(player_id) {
      return this.findAll({
        where: {
          player_id,
        },
      });
    }

    static async remove(id) {
      return this.destroy({
        where: { id },
      });
    }

    static async deleteSession(session_id) {
      return this.destroy({
        where: { session_id },
      });
    }

    static async removeById(session_id, player_id) {
      return this.destroy({
        where: { session_id, player_id },
      });
    }
  }
  playerSessions.init(
    {
      player_name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "playerSessions",
    }
  );
  return playerSessions;
};
