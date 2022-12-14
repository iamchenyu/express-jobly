"use strict";

const express = require("express");
const { validate } = require("jsonschema");
const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * company should be { title, salary, equity, company_handle }
 *
 * Returns {job: { id, title, salary, equity, company_handle }}
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async (req, res, next) => {
  try {
    const validator = validate(req.body, jobNewSchema);
    if (!validator.valid) {
      throw new BadRequestError(validator.errors.map((err) => err.stack));
    }
    // const { title, salary, equity, company_handle } = req.body;
    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (e) {
    return next(e);
  }
});

/** GET /  =>
 *   { companies: [ { id, title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity (when set to true, it will find records with equity more than 0)
 *
 * Authorization required: none
 */

router.get("/", async (req, res, next) => {
  try {
    const jobs = await Job.findAll(req.query);
    return res.json({ jobs });
  } catch (e) {
    return next(e);
  }
});

/** GET /[id]  =>  { job }
 *
 *  Job  is { id, title, salary, equity, company_handle }
 *  where company_handle is [{ handle, name, description, numEmployees, logoUrl }, ...]
 *
 * Authorization required: none
 */

router.get("/:id", async (req, res, next) => {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (e) {
    return next(e);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, company_handel }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async (req, res, next) => {
  try {
    const validator = validate(req.body, jobUpdateSchema);
    if (!validator.valid)
      throw new BadRequestError(validator.errors.map((err) => err.stack));

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (e) {
    return next(e);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete("/:id", ensureAdmin, async (req, res, next) => {
  try {
    const job = await Job.remove(req.params.id);
    return res.json({ deleted: job });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
