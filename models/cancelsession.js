'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class cancelSession extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      cancelSession.belongsTo(models.SportSession,{
        foreignKey:"sessionId",
      })
      cancelSession.belongsTo(models.Sport,{
        foreignKey:"sportId",
      })
      
      
    }

    static async addReason({reason,sessionId,sportId}){
      return this.create({reason:reason,sessionId:sessionId,sportId});
    }


  }
  cancelSession.init({
    reason: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'cancelSession',
  });
  return cancelSession;
};
