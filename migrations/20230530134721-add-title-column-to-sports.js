'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Add the "title" column
    await queryInterface.addColumn('Sports', 'title', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // Step 2: Update existing records with a valid value
    await queryInterface.sequelize.query('UPDATE "Sports" SET "title" = \'Unknown\' WHERE "title" IS NULL;');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Sports', 'title');
  }
};
