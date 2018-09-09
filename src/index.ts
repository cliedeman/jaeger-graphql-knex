import express from 'express';
import {ApolloServer} from 'apollo-server-express';
// @ts-ignore
import middleware from 'express-opentracing';

import tracer from './tracer';
import schema from './schema';
import ApolloTracingExtension from './ApolloTracingExtension';

const port = 5000;
const server = new ApolloServer({
  schema,
  extensions: [() => new ApolloTracingExtension<any>()],
});

const app = express();

/*
Control tracing per route
app.use((req, res, next) => {
  // exclude paths that start with '/css' or '/js'
  if (req.path.startsWith('/css') || req.path.startsWith('/js')) {
    return next();
  }
  // trace calls
  middleware({tracer: tracer})(req, res, next);
});
*/

app.use(middleware({tracer}));

server.applyMiddleware({app});

app.listen({port}, () =>
  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  )
);
