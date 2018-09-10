# Read Me

This project is an experiment to see how well open tracing can work with graphql, express and objection/knex

![alt Sample Trace](https://github.com/cliedeman/jaeger-graphql-knex/blob/master/img/jaeger-ui.png)

# Getting Started

## Requirements

- node
- yarn
- docker and docker-compose

## Setup

    docker-compose up # To start jaeger
    yarn install
    yarn start

[Server](http://localhost:5000/graphql)

[Jaeger UI](http://localhost:16686)

Sample Query:

```
query PeopleQuery {
  people {
    name
  }
}
```

Open the graphql playground and excute the query a few times and then observe the spans created in jaeger

# TODO

- [x] Get every single span to log - Done using `ConstSampler`
- [x] Retrieve spans in resolvers using `GraphQLResolveInfo`
- [x] Types for opentracing
- [ ] Submit Opentracing types to definitely typed or enahnce npm package
- [x] Figure out how to deal with parallel field resolution - Works I think...
- [ ] Add objection/knex integration
- [ ] Add joinmonster integration (This may be convered by field instrumentation)
- [ ] Test how it works with batch execution

# Notes

[Context added to all extension methods](https://github.com/apollographql/apollo-server/pull/1547/files)
Remove patch package when this is released
