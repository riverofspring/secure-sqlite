## A Basic Interface for SQLite to Guard Against SQL Injections
A small package using a foreign function interface to access SQLite3 functions in Node, while preventing SQLIs and supporting Unicode characters.

Usage example:
```js
const {init,sql} = require('secure-sqlite');

init('test.db');

console.log(sql`SELECT SQLITE_VERSION()`);
console.log(sql`CREATE TABLE test (id TEXT)`);
console.log(sql`CREATE TABLE test2 (id INT)`);
console.log(sql`INSERT INTO test (id) VALUES ("中文以及unicode字符")`);
console.log(sql`INSERT INTO test2 (id) VALUES (5)`);
console.log(sql`SELECT * FROM test`);
console.log(sql`SELECT * FROM test2`);

const testId = "中文以及unicode字符";
console.log(sql`SELECT * FROM test WHERE id=${testId}`);

const test2Id = 5;
console.log(sql`SELECT * FROM test2 WHERE id=${test2Id}`);
```