import Sequelize from 'sequelize';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default async () => {
  let maxReconnects = 20;
  let connected = false;
  const sequelize = new Sequelize(
    process.env.TEST_DB || 'slack',
    'postgres',
    process.env.POSTGRES_PASSWORD || 'postgres',
    {
      dialect: 'postgres',
      operatorsAliases: Sequelize.Op,
      host: process.env.DB_HOST || 'localhost',
      define: {
        // convert all our columns to underscore to using snack case ex. teamId => team_id
        underscored: true,
      },
    },
  );

  while (!connected && maxReconnects) {
    try {
      await sequelize.authenticate();
      connected = true;
    } catch (err) {
      console.log('reconnecting in 5 seconds: ', err.message);
      // eslint-disable-next-line no-await-in-loop
      await sleep(5000);
      maxReconnects -= 1;
    }
  }

  if (!connected) {
    return null;
  }

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

  return models;
};

