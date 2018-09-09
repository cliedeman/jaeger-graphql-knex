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
      resolve: () => {
        return people;
      },
    },
  }),
});

export default new GraphQLSchema({
  query,
});
