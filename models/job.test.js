"use strict";

const Job = require("./job");
const { BadRequestError, NotFoundError } = require("../expressError");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */
describe("Test create", () => {
  let job = {
    title: "new",
    salary: 50000,
    equity: 0.75,
    company_handle: "c3",
  };

  test("works", async () => {
    const response = await Job.create(job);
    expect(response).toEqual({ id: expect.any(Number), ...job });
  });

  test("fails: cannot find company", async () => {
    job.company_handle = "c100";
    // Option 1
    // try {
    //   await Job.create(job);
    // } catch (err) {
    //   expect(err instanceof BadRequestError).toBeTruthy();
    // }

    // Option 2
    expect(async () => await Job.create(job)).rejects.toThrow(NotFoundError);
  });
});

/************************************** find */
describe("Test find all", () => {
  test("Find all jobs without filter", async () => {
    const jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: 0,
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 80000,
        equity: 0.2,
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 40000,
        equity: 0,
        company_handle: "c2",
      },
    ]);
  });

  test("Find all jobs with 1 filter", async () => {
    const jobs = await Job.findAll({ title: "2" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 80000,
        equity: 0.2,
        company_handle: "c1",
      },
    ]);
  });

  test("Find all jobs with 3 filters", async () => {
    const jobs = await Job.findAll({
      title: "J",
      minSalary: 50000,
      hasEquity: true,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 80000,
        equity: 0.2,
        company_handle: "c1",
      },
    ]);
  });
});

describe("Test find one", () => {
  test("Find one job by id", async () => {
    const job = await Job.get(1);
    expect(job).toEqual({
      id: 1,
      title: "j1",
      salary: 100000,
      equity: 0,
      company: {
        handle: "c1",
        name: "C1",
        numEmployees: 1,
        description: "Desc1",
        logoUrl: "http://c1.img",
      },
    });
  });

  test("Find a nonexistent one and throw 404", async () => {
    expect(async () => await Job.get(0)).rejects.toThrow(NotFoundError);
  });
});

/************************************** update */
describe("Test update", () => {
  test("Update with full data", async () => {
    const job = await Job.update(1, {
      title: "newj1",
      salary: 120000,
      equity: 0.5,
    });
    expect(job).toEqual({
      id: 1,
      title: "newj1",
      salary: 120000,
      equity: 0.5,
      company_handle: "c1",
    });
  });

  test("Update with partial data", async () => {
    const job = await Job.update(1, {
      title: "newj1",
    });
    expect(job).toEqual({
      id: 1,
      title: "newj1",
      salary: 100000,
      equity: 0,
      company_handle: "c1",
    });
  });

  test("Update with no data", async () => {
    expect(async () => await Job.update(1)).rejects.toThrow(BadRequestError);
  });

  test("fails: cannot find a job", async () => {
    expect(
      async () =>
        await Job.update(0, {
          title: "newj1",
        })
    ).rejects.toThrow(NotFoundError);
  });
});

/************************************** delete */
describe("Test delete", () => {
  test("works: delete a job by id", async () => {
    const job = await Job.remove(1);
    expect(job).toEqual({
      id: 1,
      title: "j1",
      salary: 100000,
      equity: 0,
      company_handle: "c1",
    });

    expect(async () => await Job.get(1)).rejects.toThrow(NotFoundError);
  });

  test("fails: cannot find a job", async () => {
    expect(async () => await Job.remove(0)).rejects.toThrow(NotFoundError);
  });
});
