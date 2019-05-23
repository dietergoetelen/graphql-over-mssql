const { GraphQLString } = require('graphql')
const regex = /^[_a-zA-Z][_a-zA-Z0-9]*$/

module.exports = columns => {
  return columns.reduce((prevColumn, nextColumn) => {
    // for some reason some people like to create columns with spaces and dots
    // we do not support this for now and we force to be complient to the
    // grapqh regex!
    if (!nextColumn.columnName.match(regex)) {
      return prevColumn
    }

    return {
      ...prevColumn,
      [nextColumn.columnName]: {
        type: GraphQLString
      }
    }
  }, {})
}
