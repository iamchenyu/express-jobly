const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

let user = { firstName: "Aliya", lastName: "Winston", age: 32 };
let mapping = { age: "officialAge" };

describe("test partially update data", () => {
  test("Update a user profile", () => {
    const result = sqlForPartialUpdate(user, mapping);
    expect(result).toEqual({
      setCols: '"firstName"=$1, "lastName"=$2, "officialAge"=$3',
      values: ["Aliya", "Winston", 32],
    });
  });

  test("Update a user profile with no mapping", () => {
    const result = sqlForPartialUpdate(user);
    expect(result).toEqual({
      setCols: '"firstName"=$1, "lastName"=$2, "age"=$3',
      values: ["Aliya", "Winston", 32],
    });
  });

  test("Update a user profile without passing data", () => {
    expect(() => sqlForPartialUpdate({})).toThrow(BadRequestError);
  });
});
