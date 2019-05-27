const { GraphQLBoolean, GraphQLString, GraphQLInt, GraphQLFloat } = require('graphql')
const regex = /^[_a-zA-Z][_a-zA-Z0-9]*$/

const types = {
  'varchar': GraphQLString,
  'decimal': GraphQLFloat,
  'bit': GraphQLBoolean,
  'int': GraphQLInt
}

module.exports = columns => {
  return columns.reduce((prevColumn, nextColumn) => {
    const { dataType } = nextColumn
    const type = types[dataType] || GraphQLString

    // for some reason some people like to create columns with spaces and dots
    // we do not support this for now and we force to be complient to the
    // grapqh regex!
    if (!nextColumn.columnName.match(regex)) {
      return prevColumn
    }

    return {
      ...prevColumn,
      [nextColumn.columnName]: {
        type: type
      }
    }
  }, {})
}
