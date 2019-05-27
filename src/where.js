const expressions = require('./expressions')
const expressionMap = expressions.map

/**
 * Transforms complex where arguments into join query
 */

function loopWhereExpr(table, obj) {
  if (!obj) {
    return ''
  }

  return `(
    ${
      Object.keys(obj)
        .filter(x => ['_and', '_or'].indexOf(x) < 0)
        .map(x => {
          const key = Object.keys(obj[x])[0] // take first _eq, _gte, _gt, ... (ignore others if more provided)
          const operator = expressionMap[key] || '='
          const wrap = (operator, value) => {
            let key = ''

            if (operator === 'LIKE') {
              key = '%'
            }

            return `${key}${value}${key}`
          }

          return `${table}.${x} ${operator} '${wrap(operator, obj[x][key])}'`
        })
        .join(' AND ')}
		${
      obj._and ? ` AND ${loopWhereExpr(table, obj._and)}` : 
        obj._or ? ` OR ${loopWhereExpr(table, obj._or)}` :
          ''
    }
  )`
}

module.exports = loopWhereExpr