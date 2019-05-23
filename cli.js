'use strict'

const express = require('express')
const expressGraphQL = require('express-graphql')
const app = express()
const PORT = process.env.PORT || 4000
const cors = require('cors')
const bodyParser = require('body-parser')
const inquirer = require('inquirer')
const db = require('./src/db')
const generateQueries = require('./src/queries')
const generateMutations = require('./src/mutations')
const generateSchema = require('./src/schema')

async function promptMessage(prop, message, type = 'input') {
  return await inquirer.prompt([
    {
      name: prop,
      type,
      message
    }
  ])
}

async function create() {
  const { database } = await promptMessage('database', 'Database?')
  const { host } = await promptMessage('host', 'Host?')
  const { user } = await promptMessage('user', 'Database user?')
  const { password } = await promptMessage('password', 'Password?', 'password')
  
  const mssql = db({ database, host, user, password })
  const tables = await mssql.getTables()
  const tableStructures = await Promise.all(
    tables.map(async tableName => ({ 
        tableName, 
        columns: await mssql.getTableStructure(tableName) 
      })
    )
  )
  const ordenedTableReferences = await mssql.getOrdenedTableReferences()

  const queries = generateQueries(tableStructures, ordenedTableReferences, mssql.connection)
  const mutations = generateMutations(tableStructures, ordenedTableReferences, mssql.connection)
  const schema = generateSchema(queries, mutations)

  app.use(
    "/graphql",
    cors(),
    bodyParser.json(),
    expressGraphQL({
      schema,
      graphiql: true
    })
  )

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

create();
