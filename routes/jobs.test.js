"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */
describe("TEST /POST", () => {
  let newJob = {
    title: "j4",
    salary: 20000,
    equity: 0.5,
    company_handle: "c3",
  };
  test("works for admin: post a new job", async () => {
    const result = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u4Token}`);
    expect(result.statusCode).toBe(201);
    expect(result.body).toEqual({ job: { id: expect.any(Number), ...newJob } });
  });

  test("fails for non-admin: post a new job", async () => {
    const result = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(result.statusCode).toBe(401);
  });

  test("fails with missing data", async () => {
    const result = await request(app)
      .post("/jobs")
      .send({ title: "j4" })
      .set("authorization", `Bearer ${u4Token}`);
    expect(result.statusCode).toBe(400);
  });

  test("fails with invalid datatype", async () => {
    newJob.equity = "123";
    const result = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u4Token}`);
    expect(result.statusCode).toBe(400);
  });

  test("fails with invalid schema", async () => {
    const result = await request(app)
      .post("/jobs")
      .send({ company_handle: "c4" })
      .set("authorization", `Bearer ${u4Token}`);
    expect(result.statusCode).toBe(400);
  });
});

/************************************** GET /jobs */
describe("TEST /GET", () => {
  test("works for admin user", async () => {
    const result = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u4Token}`);
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      jobs: [
        {
          id: 1,
          title: "j1",
          salary: 100000,
          equity: 0,
          company_handle: "c1",
        },
        {
          id: 2,
          title: "j2",
          salary: 80000,
          equity: 0.2,
          company_handle: "c1",
        },
        { id: 3, title: "j3", salary: 40000, equity: 0, company_handle: "c2" },
      ],
    });
  });

  test("works for all users", async () => {
    const result = await request(app).get("/jobs");
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      jobs: [
        {
          id: 1,
          title: "j1",
          salary: 100000,
          equity: 0,
          company_handle: "c1",
        },
        {
          id: 2,
          title: "j2",
          salary: 80000,
          equity: 0.2,
          company_handle: "c1",
        },
        { id: 3, title: "j3", salary: 40000, equity: 0, company_handle: "c2" },
      ],
    });
  });

  test("works with filters", async () => {
    const result = await request(app).get(
      `/jobs?title=j&minSalary=50000&hasEquity=true`
    );
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      jobs: [
        {
          id: 2,
          title: "j2",
          salary: 80000,
          equity: 0.2,
          company_handle: "c1",
        },
      ],
    });
  });

  test("fails with internal error", async () => {
    await db.query("DROP TABLE jobs CASCADE");
    const result = await request(app).get("/jobs");
    expect(result.statusCode).toBe(500);
  });
});

/************************************** GET /jobs/:id */
describe("TEST /GET/:id", () => {
  test("works for admin", async () => {
    const result = await request(app)
      .get("/jobs/1")
      .set("authorization", `Bearer ${u4Token}`);
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      job: {
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
      },
    });
  });

  test("works for non-admin", async () => {
    const result = await request(app).get("/jobs/1");
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      job: {
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
      },
    });
  });

  test("fails for nonexistent job", async () => {
    const result = await request(app).get("/jobs/nope");
    expect(result.statusCode).toBe(500);
  });
});

/************************************** UPDATE /jobs/:id */
describe("TEST /PATCH/:id", () => {
  test("works for admin user", async () => {
    const result = await request(app)
      .patch(`/jobs/1`)
      .send({ title: "newJ1", salary: 120000, equity: 0.5 })
      .set("authorization", `Bearer ${u4Token}`);
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      job: {
        id: 1,
        title: "newJ1",
        salary: 120000,
        equity: 0.5,
        company_handle: "c1",
      },
    });
  });

  test("fails for non-admin user", async () => {
    const result = await request(app)
      .patch("/jobs/1")
      .send({ title: "newJ1", salary: 120000, equity: 0.5 })
      .set("authorization", `Bearer ${u1Token}`);
    expect(result.statusCode).toBe(401);
  });

  test("works for partial update", async () => {
    const result = await request(app)
      .patch("/jobs/1")
      .send({ title: "newJ1" })
      .set("authorization", `Bearer ${u4Token}`);
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      job: {
        id: 1,
        title: "newJ1",
        salary: 100000,
        equity: 0,
        company_handle: "c1",
      },
    });
  });

  test("fails for invaild update", async () => {
    const result = await request(app)
      .patch("/jobs/1")
      .send({ id: 2, company_handle: "c4" })
      .set("authorization", `Bearer ${u4Token}`);
    expect(result.statusCode).toBe(400);
  });

  test("fails for nonexistent job", async () => {
    const result = await request(app)
      .patch("/jobs/0")
      .send({ title: "newJ1" })
      .set("authorization", `Bearer ${u4Token}`);
    expect(result.statusCode).toBe(404);
  });
});

/************************************** DELETE /jobs/:id */
describe("TEST /DELETE/:id", () => {
  test("works for admin user", async () => {
    const result = await request(app)
      .delete("/jobs/1")
      .set("authorization", `Bearer ${u4Token}`);
    expect(result.statusCode).toBe(200);

    const find = await request(app).get("/jobs/1");
    expect(find.statusCode).toBe(404);
  });

  test("fails for non-admin user", async () => {
    const result = await request(app)
      .delete("/jobs/1")
      .set("authorization", `Bearer ${u1Token}`);
    expect(result.statusCode).toBe(401);
  });

  test("fails for nonexistent job", async () => {
    const result = await request(app)
      .delete("/jobs/0")
      .set("authorization", `Bearer ${u4Token}`);
    expect(result.statusCode).toBe(404);
  });
});
