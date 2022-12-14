"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */
class Job {
  /** Create a job (from data), update db, return new company data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company not already in database.
   * */

  static async create({ title, salary, equity, company_handle }) {
    // make sure the company already exists in our db
    const companyResult = await db.query(
      `SELECT handle, name, num_employees, description, logo_url FROM companies WHERE handle=$1`,
      [company_handle]
    );

    if (companyResult.rows.length === 0)
      throw new NotFoundError(`No such company - ${company_handle}`);

    // if the company exists, we create the job
    const jobResult = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
      VALUES ($1, $2, $3, $4) RETURNING id, title, salary, equity::DOUBLE PRECISION, company_handle`,
      [title, salary, equity, company_handle]
    );

    const job = jobResult.rows[0];
    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */
  static async findAll(filter = {}) {
    let sqlQueries = [];
    let sqlValues = [];

    if (filter.title) {
      sqlValues.push(`%${filter.title}%`);
      sqlQueries.push(`title ILIKE $${sqlValues.length}`);
    }

    if (filter.minSalary) {
      sqlValues.push(filter.minSalary);
      sqlQueries.push(`salary >= $${sqlValues.length}`);
    }

    if (filter.hasEquity) {
      sqlValues.push(0);
      sqlQueries.push(`equity != $${sqlValues.length}`);
    }

    let basicQuery = `SELECT id, title, salary, equity::DOUBLE PRECISION, company_handle FROM jobs`;

    if (sqlValues.length > 0) {
      basicQuery = basicQuery + " WHERE " + sqlQueries.join(" AND ");
    }

    basicQuery += " ORDER BY title";

    const results = await db.query(basicQuery, sqlValues);
    return results.rows;
  }

  /** Given a job title, return an array of jobs with the same title.
   *
   * Returns [{ id, title, salary, equity, company }, ...]
   *   where company_handle is { handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const result = await db.query(
      `SELECT id, title, salary, equity::DOUBLE PRECISION, company_handle
      FROM jobs  
      WHERE id=$1`,
      [id]
    );

    let job = result.rows[0];

    if (!job) throw new NotFoundError(`No such job`);

    const companyResult = await db.query(
      `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE handle=$1`,
      [job.company_handle]
    );

    const company = companyResult.rows[0];

    job.company = company;
    delete job.company_handle;
    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   * But company needs to be in the db already.
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const update = sqlForPartialUpdate(data);
    const result = await db.query(
      `UPDATE jobs SET ${update.setCols} WHERE id=$${
        update.values.length + 1
      } RETURNING id, title, salary, equity::DOUBLE PRECISION, company_handle`,
      [...update.values, id]
    );

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No such job`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/
  static async remove(id) {
    const result = await db.query(
      `DELETE FROM jobs WHERE id=$1 RETURNING id, title, salary, equity::DOUBLE PRECISION, company_handle`,
      [id]
    );

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No such job`);

    return job;
  }
}

module.exports = Job;
