"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filter = {}) {
    // Option 1 - Query everytime with 3 filters

    // const name = filter.name || "";
    // const min_employees = filter.min_employees || 0;
    // const max_employees = filter.max_employees || 1000;

    // if (min_employees > max_employees)
    //   throw new BadRequestError("Invalid Number of Employees Filter");

    // const filterByName = `WHERE name ILIKE '%${name}%' AND`;

    // const filterByMinEmp = `num_employees >= ${min_employees} AND`;

    // const filterByMaxEmp = `num_employees <= ${max_employees}`;

    // console.log(`SELECT handle,
    //               name,
    //               description,
    //               num_employees AS "numEmployees",
    //               logo_url AS "logoUrl"
    //        FROM companies ${filterByName} ${filterByMinEmp} ${filterByMaxEmp}
    //        ORDER BY name`);

    // const companiesRes = await db.query(
    //   `SELECT handle,
    //               name,
    //               description,
    //               num_employees AS "numEmployees",
    //               logo_url AS "logoUrl"
    //        FROM companies ${filterByName} ${filterByMinEmp} ${filterByMaxEmp}
    //        ORDER BY name`
    // );

    // return companiesRes.rows;

    // Option 2 - Query only with necessary filters

    let sqlQueries = [];
    let sqlValues = [];

    if (+filter.min_employees > +filter.max_employees) {
      throw new BadRequestError("Invalid Number of Employees Filter");
    }

    if (filter.name) {
      sqlValues.push(`%${filter.name}%`);
      sqlQueries.push(`name ILIKE $${sqlValues.length}`);
    }

    if (filter.min_employees) {
      sqlValues.push(+filter.min_employees);
      sqlQueries.push(`num_employees >= $${sqlValues.length}`);
    }

    if (filter.max_employees) {
      sqlValues.push(+filter.max_employees);
      sqlQueries.push(`num_employees <= $${sqlValues.length}`);
    }

    let basicQuery = `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies`;

    if (sqlValues.length > 0) {
      basicQuery = basicQuery + " WHERE " + sqlQueries.join(" AND ");
    }

    basicQuery += " ORDER BY name";
    console.log(basicQuery);
    console.log(sqlValues);

    let results = await db.query(basicQuery, sqlValues);
    return results.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const jobResults = await db.query(
      `SELECT id, title, salary, equity::DOUBLE PRECISION FROM jobs WHERE company_handle=$1`,
      [handle]
    );

    const jobs = jobResults.rows;
    company.jobs = jobs;

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
