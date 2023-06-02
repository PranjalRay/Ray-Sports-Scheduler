'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("SportSessions","sportId",{
      type: Sequelize.DataTypes.INTEGER
    })

    await queryInterface.addConstraint("SportSessions",{
      fields:['sportId'],
      type:'foreign key',
      references:{
        table:'Sports',
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
    await queryInterface.removeColumn("SportSessions", "sportId");

    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
