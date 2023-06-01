"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("playerSessions", "session_id", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("playerSessions", {
      fields: ["session_id"],
      type: "foreign key",
      references: {
        table: "Sessions",
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
    await queryInterface.removeColumn("playerSessions", "session_id");
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
