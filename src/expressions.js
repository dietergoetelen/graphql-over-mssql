const { GraphQLInt, GraphQLString, GraphQLInputObjectType } = require('graphql')

module.exports = {
  map: {
    _eq: '=',
    _gt: '>',
    _gte: '>=',
    _lt: '<',
    _lte: '<=',
    _like: 'LIKE'
  },
  int: new GraphQLInputObjectType({
    name: 'int_compare_expr',
    fields: {
      _eq: {
        type: GraphQLInt
      },
      _gt: {
        type: GraphQLInt
      },
      _gte: {
        type: GraphQLInt
      },
      _lt: {
        type: GraphQLInt
      },
      _lte: {
        type: GraphQLInt
      }
    }
  }),
  varchar: new GraphQLInputObjectType({
    name: 'text_compare_expr',
    fields: {
      _eq: {
        type: GraphQLString
      },
      _gt: {
        type: GraphQLString
      },
      _gte: {
        type: GraphQLString
      },
      _lt: {
        type: GraphQLString
      },
      _lte: {
        type: GraphQLString
      },
      _like: {
        type: GraphQLString
      }
    }
  })
}
