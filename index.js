import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import formidable from 'formidable';
// import { PubSub } from 'graphql-subscriptions';
import { SubscriptionServer } from 'subscriptions-transport-ws';

import models from './models';
import { refreshTokens } from './auth';

const SECRET = "fadiqua";
const SECRET2 = "fadiqua2";

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, './schema')));
const resolvers = mergeResolvers(fileLoader(path.join(__dirname, './resolvers')));

// Put together a schema
const schema = makeExecutableSchema({
    typeDefs,
    resolvers
});

// Initialize the app
const app = express();
app.use(cors('*'));


const addUser = async (req, res, next) => {
    const token = req.headers['x-token'];
    if (token) {
        try {
            const { user } = jwt.verify(token, SECRET);
            req.user = user;
        } catch (err) {
            const refreshToken = req.headers['x-refresh-token'];
            const newTokens = await refreshTokens(token, refreshToken, models, SECRET, SECRET2);
            if (newTokens.token && newTokens.refreshToken) {
                res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
                res.set('x-token', newTokens.token);
                res.set('x-refresh-token', newTokens.refreshToken);
            }
            req.user = newTokens.user;
        }
    }
    next();
};

app.use(addUser);

const uploadDir = 'files';

const fileMiddleware = (req, res, next) => {
  if (!req.is('multipart/form-data')) {
    return next();
  }

  const form = formidable.IncomingForm({
    uploadDir,
  });

  form.parse(req, (error, { operations }, files) => {
    if (error) {
      console.log(error);
    }

    const document = JSON.parse(operations);

    if (Object.keys(files).length) {
      const { file: { type, path: filePath } } = files;
      console.log(type);
      console.log(filePath);
      document.variables.file = {
        type,
        path: filePath,
      };
    }

    req.body = document;
    next();
  });
};

// The GraphQL endpoint
const graphqlEndpoint= '/graphql';

app.use(graphqlEndpoint,
    bodyParser.json(),
    fileMiddleware,
    graphqlExpress(req => ({
        schema,
        context: {
            models: models,
            user: req.user,
            SECRET, SECRET2
        }})
    ));

// GraphiQL, a visual editor for queries
app.use('/graphiql', graphiqlExpress({
    endpointURL: graphqlEndpoint,
    subscriptionsEndpoint: 'ws://localhost:3001/subscriptions'
}));

app.use('/files', express.static('files'))

const server = createServer(app);
// Start the server
const PORT = 3001;
models.sequelize.sync({
    // drop database
    // force: true
}).then(x => {
    server.listen(PORT, () => {
        console.log(`Go to http://localhost:${PORT}/graphiql to run queries!`);
        // eslint-disable-next-line no-new
        new SubscriptionServer(
            {
                execute,
                subscribe,
                schema,
                onConnect: async ({ token, refreshToken }, webSocket) => {
                    if (token && refreshToken) {
                        try {
                            const { user } = jwt.verify(token, SECRET);
                            return { models, user };
                        } catch (err) {
                            const newTokens = await refreshTokens(token, refreshToken, models, SECRET, SECRET2);
                            return { models, user: newTokens.user };
                        }
                    }

                    return { models };
                },
            },
            {
                server,
                path: '/subscriptions',
            },
        );
    });
});

