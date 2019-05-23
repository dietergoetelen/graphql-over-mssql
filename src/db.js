'use strict'

const knex = require('knex')

function getConnectionString(user, password, host, database) {
  return `mssql://${user}:${password}@${host}/${database}`
}

function getConnection(connectionString) {
  return knex({
    client: 'mssql',
    connection: connectionString
  })
}

module.exports = (opts) => {
  const connectionString = getConnectionString(opts.user, opts.password, opts.host, opts.database)
  const mssql = getConnection(connectionString)

  return {
    connection: mssql,
    async getTables() {
      try {
        const tables = await mssql
          .raw(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_type = 'BASE TABLE'
            AND table_name not like '[__]%'
          `) // __ is reserved name in GraphQL

          return tables.map(x => x.table_name)
      } catch(err) {
        console.error(err)
      }
    },
    async getOrdenedTableReferences() {
      try {
        const fkReferences = await mssql
          .raw(`
          SELECT  
              KCU1.TABLE_NAME AS fromTableName 
              ,KCU1.COLUMN_NAME AS fromColumnName
              ,KCU2.TABLE_NAME AS toTableName
              ,KCU2.COLUMN_NAME AS toColumnName
          FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS AS RC 

          INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU1 
              ON KCU1.CONSTRAINT_CATALOG = RC.CONSTRAINT_CATALOG  
              AND KCU1.CONSTRAINT_SCHEMA = RC.CONSTRAINT_SCHEMA 
              AND KCU1.CONSTRAINT_NAME = RC.CONSTRAINT_NAME 

          INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU2 
              ON KCU2.CONSTRAINT_CATALOG = RC.UNIQUE_CONSTRAINT_CATALOG  
              AND KCU2.CONSTRAINT_SCHEMA = RC.UNIQUE_CONSTRAINT_SCHEMA 
              AND KCU2.CONSTRAINT_NAME = RC.UNIQUE_CONSTRAINT_NAME 
              AND KCU2.ORDINAL_POSITION = KCU1.ORDINAL_POSITION 
          WHERE KCU1.TABLE_NAME != KCU2.TABLE_NAME
          `)

          return getOrdenedTables(fkReferences)
      } catch(err) {
        console.error(err)
      }
    },
    async getTableStructure(tableName) {
      try {
        const structure = await mssql
          .raw(`
            select 
              c.table_name as tableName, 
              c.COLUMN_NAME as columnName,
              c.ORDINAL_POSITION as ordinalPosition,
              c.IS_NULLABLE as isNullable, 
              c.DATA_TYPE as dataType, 
              t.CONSTRAINT_TYPE as constraintType
            from INFORMATION_SCHEMA.columns c
            LEFT JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE cu on c.COLUMN_NAME = cu.COLUMN_NAME AND c.TABLE_NAME = cu.TABLE_NAME
            LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS t on t.CONSTRAINT_NAME = cu.CONSTRAINT_NAME AND c.TABLE_NAME = cu.TABLE_NAME
            WHERE c.table_name = ?
          `, [tableName])
        
        return structure;
      } catch(err) {
        console.error(err)
      }
    }
  }
}

function getOrdenedTables(arr) {
	const tree = []
	function walk(arr, nextItem) {
		nextItem.seen = true;
		const nexttoTableNameCheck = arr.filter(x => x.fromTableName === nextItem.toTableName && !x.seen);
		
		if (nexttoTableNameCheck.length > 0) {
			for (const next of nexttoTableNameCheck) {
				walk(arr, next);
        tree.push(nextItem);
			}
		} else {
      tree.push(nextItem);
    }
		
		const next = arr.find(x => !x.seen);
		if (next) {
			walk(arr, next)
		}
		
		return tree;
	}

	return [
    ...walk(arr, arr[0]),
    ...arr // just add the original arr as a quick hack
  ]
}
