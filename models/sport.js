"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sport.belongsTo(models.User, {
        foreignKey: "userId",
      });
      Sport.hasMany(models.Sessions, {
        foreignKey: "sportId",
      });
    }

    static addSport({ title, userId }) {
      return this.create({ title, userId });
    }

    static getSports() {
      return this.findAll();
    }

    static UsergetSports(userId) {
      return this.findAll({
        where: {
          userId,
        },
      });
    }

    static async remove(id) {
      return this.destroy({
        where: { id },
      });
    }

    static async setTitle(newtitle, sport) {
      return sport.update({ title: newtitle });
    }
  }
  Sport.init(
    {
      title: DataTypes.STRING,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Sport",
    }
  );
  return Sport;
};
