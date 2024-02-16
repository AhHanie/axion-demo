module.exports = {
  createUser: [
    {
      path: "username",
      required: true,
      length: { min: 3, max: 20 },
      regex: "^[a-z_]+$",
    },
    // (?=.*[a-z]) : Positive lookahead assertion ensuring at least one lowercase letter
    // (?=.*[A-Z]) : Positive lookahead assertion ensuring at least one uppercase letter
    // (?=.*[0-9]) : Positive lookahead assertion ensuring at least one digit
    // (?=.*[@$!%*#?&]) : Positive lookahead assertion ensuring at least one special character from a specific set
    // [a-zA-Z0-9@$!%*#?&] : Matches any character from the allowed set (lowercase, uppercase, digits, and specific special characters)
    // {8, } : Matches at least 8 characters
    {
      path: "password",
      required: true,
      length: { min: 8, max: 20 },
      regex:
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*#?&])[a-zA-Z0-9@$!%*#?&]{8,}$",
    },
    {
      path: "role",
      required: true,
      oneOf: ["SuperAdmin", "SchoolAdmin"],
    },
  ],
  loginUser: [
    {
      path: "username",
      required: true,
      length: { min: 3, max: 20 },
      regex: "^[a-z_]+$",
    },
    // (?=.*[a-z]) : Positive lookahead assertion ensuring at least one lowercase letter
    // (?=.*[A-Z]) : Positive lookahead assertion ensuring at least one uppercase letter
    // (?=.*[0-9]) : Positive lookahead assertion ensuring at least one digit
    // (?=.*[@$!%*#?&]) : Positive lookahead assertion ensuring at least one special character from a specific set
    // [a-zA-Z0-9@$!%*#?&] : Matches any character from the allowed set (lowercase, uppercase, digits, and specific special characters)
    // {8, } : Matches at least 8 characters
    {
      path: "password",
      required: true,
      length: { min: 8, max: 20 },
      regex:
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*#?&])[a-zA-Z0-9@$!%*#?&]{8,}$",
    },
  ],
  userIdParams: [
    {
      path: "id",
      length: 24,
      custom: "_id",
      required: true,
    },
  ],
};
