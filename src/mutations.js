const { GraphQLObjectType, GraphQLInt, GraphQLInputObjectType, GraphQLNonNull } = require('graphql')
const getFields = require('./fields')

module.exports = (tables, tableReferences, connection) => {
  const affectedRowsType = new GraphQLObjectType({
    name: 'affected_rows',
    fields: {
      affectedRows: {
        type: GraphQLInt
      }
    }
  })
  return tables.reduce((prev, next) => {
    const { tableName, columns } = next

    const fields = getFields(columns)
    const type = GraphQLNonNull(new GraphQLInputObjectType({
      name: 'insert_' + tableName,
      fields
    }))

    return {
      ...prev,
      ['insert_' + tableName]: {
        type: affectedRowsType,
        args: {
          data: {
            type
          }
        },
        resolve: async (parent, args, context, { fieldName }) => {
          if (!args.data) {
            return {
              affectedRows: 0
            }
          }
          const [_, table] = fieldName.split('_')

          const sql = `
            INSERT INTO ${table} (${Object.keys(args.data).join(',')})
            VALUES (${Object.keys(args.data).map(key => `'${args.data[key]}'`).join(',')})
          `

          await connection.raw(sql)

          return {
            affectedRows: 1
          }
        }
      }
    }
  }, {})
}
