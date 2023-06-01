"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("playerSessions", "player_id", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("playerSessions", {
      fields: ["player_id"],
      type: "foreign key",
      references: {
        table: "Users",
        field: "id",
      },
    });

    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("playerSessions", "player_id");
    /**
     *
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
