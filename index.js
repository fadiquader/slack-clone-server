import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import cors from 'cors';
import models from './models';

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, './schema')));
const resolvers = mergeResolvers(fileLoader(path.join(__dirname, './resolvers')));

// Put together a schema
const schema = makeExecutableSchema({
    typeDefs,
    resolvers
});

// Initialize the app
const app = express();
app.use(cors('localhost:3000'))
// The GraphQL endpoint
const graphqlEndpoint= '/graphql';

app.use(graphqlEndpoint,
    bodyParser.json(),
    graphqlExpress({ schema, context: { models, user: { id: 1 } }}));

// GraphiQL, a visual editor for queries
app.use('/graphiql', graphiqlExpress({ endpointURL: graphqlEndpoint }));

// Start the server
const PORT = 3001;
models.sequelize.sync({
    // drop database
    // force: true
}).then(x => {
        app.listen(PORT, () => {
            console.log(`Go to http://localhost:${PORT}/graphiql to run queries!`);
        });
    });

