import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';

const Person = new GraphQLObjectType({
  name: 'Person',
  fields: () => ({
    name: {type: new GraphQLNonNull(GraphQLString)},
  }),
});

import Context from './Context';

const wait = (seconds: number) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });

const people = [
  {
    name: 'Alice',
  },
  {
    name: 'Bob',
  },
];

const query = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    people: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Person))),
      resolve: async (parent: any, args: any, context: Context) => {
        const span = context.startSpan('someRemoteCall');
        // Mock Service call
        try {
          await wait(1);
          span.finish();
          return people;
        } catch (ex) {
          // TODO: simulate error
          span.finish();
        }
      },
    },
  }),
});

export default new GraphQLSchema({
  query,
});
