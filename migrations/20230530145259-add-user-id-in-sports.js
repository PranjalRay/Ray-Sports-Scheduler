"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableName = "Sports";
    const columnName = "userId";
    const constraintName = `${tableName}_${columnName}_fkey`;

    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Check if the column already exists
      const table = await queryInterface.describeTable(tableName, { transaction });

      if (!table[columnName]) {
        // Add the column
        await queryInterface.addColumn(tableName, columnName, {
          type: Sequelize.DataTypes.INTEGER,
        }, { transaction });

        // Create the foreign key constraint
        await queryInterface.addConstraint(tableName, {
          fields: [columnName],
          type: "foreign key",
          references: {
            table: "Users",
            field: "id",
          },
          name: constraintName,
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
          transaction,
        });
      }

      // Commit the transaction
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface) => {
    const tableName = "Sports";
    const columnName = "userId";
    const constraintName = `${tableName}_${columnName}_fkey`;

    await queryInterface.removeConstraint(tableName, constraintName);
    await queryInterface.removeColumn(tableName, columnName);
  },
};
