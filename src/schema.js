const { GraphQLObjectType, GraphQLSchema, GraphQLString } = require('graphql')

module.exports = (queries, mutations) => {
  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'RootQueryType',
      fields: {
        ...queries
      }
    }),
    mutation: new GraphQLObjectType({
      name: 'RootMutationType',
      fields: {
        ...mutations
      }
    })
  })
}
