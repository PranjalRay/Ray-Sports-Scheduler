'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("cancelSessions","sessionId",{
      type: Sequelize.DataTypes.INTEGER
    })

    await queryInterface.addConstraint("cancelSessions",{
      fields:['sessionId'],
      type:'foreign key',
      references:{
        table:'SportSessions',
        field:'id'
      }
    }) 
    
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
