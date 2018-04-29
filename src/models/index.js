import Sequelize from 'sequelize';

const sequelize = new Sequelize(process.env.TEST_DB || 'slack',
  'postgres',
  process.env.POSTGRES_PASSWORD || '1234',
  {
  dialect: 'postgres',
  operatorsAliases: Sequelize.Op,
  host: process.env.DB_HOST || 'localhost',
  define: {
    // convert all our columns to underscore to using snack case ex. teamId => team_id
    underscored: true
  }
});

const models = {
    User: sequelize.import('./user'),
    Channel: sequelize.import('./channel'),
    Member: sequelize.import('./member'),
    Message: sequelize.import('./message'),
    Team: sequelize.import('./team'),
    DirectMessage: sequelize.import('./directMessage'),
};

Object.keys(models).forEach((modelName) => {
    if ('associate' in models[modelName]) {
        models[modelName].associate(models);
    }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;
models.op = Sequelize.Op;

export default models;