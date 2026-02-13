

// models/Category.js
module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Categories',
          key: 'id'
        }
      },
      level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 3
        }
      },
      original_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'categories',
      timestamps: true,
      underscored: false
    });
  
    // Self-reference for parent-child relationship
    Category.associate = function(models) {
      Category.belongsTo(models.Category, {
        as: 'parent',
        foreignKey: 'parent_id'
      });
      
      Category.hasMany(models.Category, {
        as: 'children',
        foreignKey: 'parent_id'
      });
      
      // For closure table pattern
      Category.belongsToMany(models.Category, {
        as: 'descendants',
        through: 'CategoryClosure',
        foreignKey: 'ancestorId',
        otherKey: 'descendantId'
      });
      
      Category.belongsToMany(models.Category, {
        as: 'ancestors',
        through: 'CategoryClosure',
        foreignKey: 'descendantId',
        otherKey: 'ancestorId'
      });
    };
  
    return Category;
  };