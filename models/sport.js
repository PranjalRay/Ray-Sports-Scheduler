'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sport.hasMany(models.SportSession,{
        foreignKey: "sportId"
      })
      Sport.hasMany(models.cancelSession,{
        foreignKey: "sportId"
      })
      Sport.belongsTo(models.SportSession, {
        foreignKey: "userId",
      });
      // Sport.hasMany(models.SportSession,{
      //   foreignKey: "SportName"
      // })
    }

    static async addSport({SportName,userId}){
      return this.create({SportName:SportName,userId:userId});
    }

    static async getSportName(){
      return this.findAll();
    }

    static async perticulerSport(id){
      return this.findByPk(id);
    }

    static async remove(id){
      return this.destroy({where:{
        id,
      }});
    }
  }
  Sport.init({
    SportName: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Sport',
  });
  return Sport;
};
