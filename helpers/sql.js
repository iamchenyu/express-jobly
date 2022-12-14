const { BadRequestError } = require("../expressError");

// Updatethe database entry partially

function sqlForPartialUpdate(dataToUpdate = {}, jsToSql = {}) {
  const keys = Object.keys(dataToUpdate);

  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

// { setCols: '"first_name"=$1, "age"=$2', values: [ 'Aliya', 32 ] }

module.exports = { sqlForPartialUpdate };
