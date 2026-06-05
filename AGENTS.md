<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

Architecture and clean code are more important than speed of development, so make sure to take the time to design the system properly before starting to code. We want to avoid technical debt as much as possible, so make sure to write clean and maintainable code from the start.

---

Testing is very important from the first lines of code there should be tests. Both vitest for unit tests and cypress for end to end tests. We want to make sure that the system is stable and reliable, so we need to have a good test coverage.

---

the app should be built to be mobile first, as most of the administration will be done on phones. desktop is secondary, but should still be supported.

---

We always want to work towards a solution for the root cause of a problem, not just a quick fix. If this means that we need to refactor some code or change the architecture, then we should do that. We want to avoid technical debt as much as possible, so we need to make sure that we are building a solid foundation for the app.

---

At the end of each prompt all test should be ran, including linting, type checking, unit tests and end to end tests. This will help us to catch any errors early and ensure that the code is of high quality.

---

We dont like to mock in unit tests, they should be closer to integration tests, so we want to test the actual code as much as possible. This means that we will be using a real database for testing, the onlything we mock are network requests to third party services.

the test will have the same file structure as the code, so if we have a file called src/features/attendance.ts, we will have a test file called tests/features/attendance.test.ts. This will help us to keep the tests organized and easy to find.

if one feature depends on another feature, we create a test in both files but we dont combine them into one test file, this way we can keep the tests focused on the feature they are testing and avoid creating large test files that are hard to maintain.

Do not create large combined test files, split them out by the source files.
