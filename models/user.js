module.exports = function(sequelize, DataTypes) {
  return sequelize.define("User", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    name: DataTypes.TEXT,
    age: DataTypes.INTEGER,
    gender: DataTypes.BOOLEAN, // false = male, true = female
    pictures: DataTypes.ARRAY(DataTypes.BLOB)
  });
}
