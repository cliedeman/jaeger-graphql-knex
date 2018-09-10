import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';

import UserService from './UserService';

const Person = new GraphQLObjectType({
  name: 'Person',
  fields: () => ({
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: async (parent: any, args: any, context: Context, info: any) => {
        const span = context.startResolverSpan(info, 'getPerson');

        try {
          const user = await UserService.getUserById({span}, parent.id);
          // Used to force an error
          // return null;
          // @ts-ignore
          return user.name;
        } finally {
          span.finish();
        }
      },
    },
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
    id: 1,
  },
  {
    id: 2,
  },
  {
    id: 3,
  },
];

const query = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    people: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Person))),
      resolve: async (parent: any, args: any, context: Context, info: any) => {
        const span = context.startResolverSpan(info, 'getPeople');
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
