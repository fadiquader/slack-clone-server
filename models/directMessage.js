export default (sequelize, DataTypes) => {
    const DirectMessage = sequelize.define('direct_message', {
      text: DataTypes.STRING,
      // url: DataTypes.STRING,
      // filetype: DataTypes.STRING,
    }, {
      indexes: [
        {
          // unique: true,
          fields: ['created_at']
        }
      ]
    });

    DirectMessage.associate = (models) => {
        // 1:M
        DirectMessage.belongsTo(models.Team, {
            foreignKey: {
                name: 'teamId',
                field: 'team_id',
            },
        });
        // 1:M
        DirectMessage.belongsTo(models.User, {
            foreignKey: {
                name: 'receiverId',
                field: 'receiver_id',
            },
        });
        DirectMessage.belongsTo(models.User, {
            foreignKey: {
              name:  'senderId',
              field:  'sender_id',
            },
        });
    };

    return DirectMessage;
};