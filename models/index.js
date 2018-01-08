import Sequelize from 'sequelize';

const sequelize = new Sequelize('slack', 'postgres', '1234', {
    dialect: 'postgres',
    define: {
        // convert all our columns to underscore to using snack case ex. teamId => team_id
        underscored: true
    }
});

const models = {
    User: sequelize.import('./user'),
    Channel: sequelize.import('./channel'),
    // Member: sequelize.import('./member'),
    Message: sequelize.import('./message'),
    Team: sequelize.import('./team'),
};

Object.keys(models).forEach((modelName) => {
    if ('associate' in models[modelName]) {
        models[modelName].associate(models);
    }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

export default models;