const { GraphQLObjectType, GraphQLList, GraphQLString, GraphQLInputObjectType } = require('graphql')
const getFields = require('./fields')

const joinMonster = require('join-monster').default

module.exports = (tables, sortedTableReferences, connection) => {
  const types = {}

  return tables.reduce((prev, next) => {
    const { tableName, columns } = next
    const constraint = columns.find(x => x.constraintType === 'PRIMARY KEY')

    // No primary key? no graphql!
    if (!constraint) {
      return prev
    }

    const primaryKey = constraint.columnName

    const fields = getFields(columns)

    const type = new GraphQLObjectType({
      name: tableName,
      fields: () => {
        const createField = (tableName, key, type, next) => {
          if (!type) {
            return undefined
          }

          return {
            [key + tableName]: {
              type,
              sqlJoin(tableA, tableB) {
                return `${tableA}.${next.fromColumnName} = ${tableB}.${next.toColumnName}`
              }
            }
          }
        }

        // extend fields with foreign keys
        // add this point all types are known
        // it should be safe to add foreign keys here
        return {
          ...fields,
          ...sortedTableReferences.filter(x => x.toTableName === tableName)
            .reduce((prev, next) => {
              if (!types[next.fromTableName]) {
                return prev
              }

              return {
                ...prev,
                ...createField(next.fromTableName, 'multiple_', new GraphQLList(types[next.fromTableName]), next)
              }
            }, {}),
          ...sortedTableReferences.filter(x => x.fromTableName === tableName)
            .reduce((prev, next) => ({
              ...prev,
              ...createField(next.toTableName, 'single_', types[next.toTableName], next)
            }), {}),
        }
      }
    })

    type._typeConfig = {
      sqlTable: tableName,
      uniqueKey: primaryKey
    }

    types[tableName] = type

    const filterType = new GraphQLInputObjectType({
      name: tableName + "_bool_exp",
      fields: {
        ...fields
      }
    })

    return {
      ...prev,
      [tableName]: {
        args: {
          filter: { type: filterType },
        },
        type: new GraphQLList(type),
        where: (table, args, context) => {
          if (args.filter) {
            const keys = Object.keys(args.filter)
            return keys.map(key => `${table}.${key} = '${args.filter[key]}'`).join(' AND ')
          }
        },
        resolve: (parent, args, context, resolveInfo) => {
          return joinMonster(resolveInfo, {}, sql => {
            return connection.raw(sql)
          })
        }
      }
    }
  }, {})
}
