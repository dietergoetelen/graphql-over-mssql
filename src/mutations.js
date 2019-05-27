const { GraphQLObjectType, GraphQLInt, GraphQLInputObjectType, GraphQLNonNull } = require('graphql')
const getFields = require('./fields')

const getAffectedRowsType = (type) => new GraphQLObjectType({
  name: `${type}_affected_rows`,
  fields: {
    affectedRows: {
      type: GraphQLInt
    }
  }
})

module.exports = (tables, tableReferences, connection) => {
  const insertAffectedRowsType = getAffectedRowsType('insert')
  const updateAffectedRowsType = getAffectedRowsType('update')
  const deleteAffectedRowsType = getAffectedRowsType('delete')

  return tables.reduce((prev, next) => {
    const { tableName, columns } = next

    const fields = getFields(columns)
    const getType = type => GraphQLNonNull(new GraphQLInputObjectType({
      name: `${type}_${tableName}`,
      fields
    }))

    return {
      ...prev,
      ['delete_' + tableName]: {
        type: deleteAffectedRowsType,
        args: {
          where: {
            type: getType('delete')
          }
        },
        resolve: async(parent, args, context, { fieldName }) => {
          const [_, table] = fieldName.split('_')
          const sql = `
            DELETE FROM ${table}
            WHERE 
              ${Object.keys(args.where).map(key => `${key}='${args.where[key]}'`).join(' AND ')}
          `

          await connection.raw(sql)

          return {
            affectedRows: 1
          }
        }
      },
      ['update_' + tableName]: {
        type: updateAffectedRowsType,
        args: {
          data: {
            type: getType('update')
          },
          where: {
            type: getType('update_where')
          }
        },
        resolve: async (parent, args, context, { fieldName }) => {
          const [_, table] = fieldName.split('_')
          const sql = `
            UPDATE ${table} 
            SET 
              ${Object.keys(args.data).map(key => `${key}='${args.data[key]}'`).join(',')}
            WHERE
              ${Object.keys(args.where).map(key => `${key}='${args.where[key]}'`).join(' AND ')}
          `

          await connection.raw(sql)

          return {
            affectedRows: 1
          }
        }
      },
      ['insert_' + tableName]: {
        type: insertAffectedRowsType,
        args: {
          data: {
            type: getType('insert')
          }
        },
        resolve: async (parent, args, context, { fieldName }) => {
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
