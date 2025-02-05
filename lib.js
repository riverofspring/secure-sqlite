const ffi = require('ffi-napi');
const ref = require('ref-napi');
 
const sqlite3 = ref.types.void;
const sqlite3Ptr = ref.refType(sqlite3);
const sqlite3PtrPtr = ref.refType(sqlite3Ptr);
 
const sqlstatement = ref.types.void;
const sqlstatementPtr = ref.refType(sqlstatement);
const sqlstatementPtrPtr = ref.refType(sqlstatementPtr);
 
// yoink constants from reading sqlite3.h and put here
 
const SQLITE_ROW = 100;
const SQLITE_OK = 0;
const SQLITE_INT = 1;
const SQLITE_FLOAT = 2;
const SQLITE_STR = 3;
const SQLITE_BLOB = 4;
const SQLITE_NULL = 5;

const _lib = ffi.Library('libsqlite3', {
  'sqlite3_open': [ 'int', [ 'string', sqlite3PtrPtr ] ],
  'sqlite3_prepare_v2': [ 'int', [ sqlite3Ptr, 'string', 'int', sqlstatementPtrPtr, 'int' ] ],
  'sqlite3_close': [ 'int', [ sqlite3Ptr ] ],
  'sqlite3_exec': [ 'int', [ sqlite3Ptr, 'string', 'pointer', 'pointer', 'string' ] ],
  'sqlite3_step': ['int',[sqlstatementPtr]],
  'sqlite3_libversion': ['string', []],
  'sqlite3_column_name': ['string', [sqlstatementPtr, 'int']],
  'sqlite3_column_count': ['int', [sqlstatementPtr]],
  'sqlite3_column_type': ['int', [sqlstatementPtr, 'int']],
  'sqlite3_column_text': ['string', [sqlstatementPtr, 'int']],
  'sqlite3_column_int': ['int', [sqlstatementPtr, 'int']],
  'sqlite3_column_double': ['double', [sqlstatementPtr, 'int']],
  'sqlite3_bind_double': ['int', [sqlstatementPtr, 'int', 'double']],
  'sqlite3_bind_int': ['int', [sqlstatementPtr, 'int', 'double']],
  'sqlite3_bind_text': ['int', [sqlstatementPtr, 'int', 'string', 'int', 'long long']],
  'sqlite3_finalize': ['int', [sqlite3Ptr]]
});
 
// eventually, your code should be structured into this class
class SQLite {
  #ss_db;
  constructor(filename=':memory:') {
    this.#ss_db = ref.alloc(sqlite3PtrPtr);
    let rc = 0;
    rc = _lib.sqlite3_open(filename, this.#ss_db);
    if (rc != SQLITE_OK){
      throw new Error("Failed to open file");
    }
 }
  query(q, lst=[]) {
    const res = ref.alloc(sqlstatementPtrPtr);
    let rc = 0;
    rc = _lib.sqlite3_prepare_v2(this.#ss_db.deref(), q, -1, res, 0);
    if (rc != SQLITE_OK){
      throw new Error("Failed to prepare file");
    }
    let ret = []
    if (lst.length != 0){
      for (let i = 0; i < lst.length; i++){
        if (typeof lst[i] != 'number'){
          _lib.sqlite3_bind_text(res.deref(), i+1, lst[i], (new TextEncoder().encode(lst[i])).length, 0)
        }
        else if (Number.isInteger(lst[i])){
          _lib.sqlite3_bind_double(res.deref(), i+1, lst[i])
        }
        else{
          _lib.sqlite3_bind_int(res.deref(), i+1, lst[i]) 
        }
      }
    }
    while (_lib.sqlite3_step(res.deref()) == SQLITE_ROW){
      let obj = {};
      for (let i = 0; i < _lib.sqlite3_column_count(res.deref()); i++){
        switch(_lib.sqlite3_column_type(res.deref(), i)){
          case SQLITE_STR:
            obj[_lib.sqlite3_column_name(res.deref(), i)] = _lib.sqlite3_column_text(res.deref(), i);
            break;
          case SQLITE_INT:
            obj[_lib.sqlite3_column_name(res.deref(), i)] = _lib.sqlite3_column_int(res.deref(), i);
            break;
          case SQLITE_FLOAT:
            obj[_lib.sqlite3_column_name(res.deref(), i)] = _lib.sqlite3_column_double(res.deref(), i);
            break;
        }
      }
      ret.push(obj);
    }
    _lib.sqlite3_finalize(res.deref());
    return ret;
  }
}
let db;
function init(filename = ':memory:'){
  db = new SQLite(filename);
}
function sql(strings, ...vals){
  if (vals.length == 0){
    ret = db.query(strings[0])
    return ret;
  }
  else{
    ret = strings.join("?");
    bind_array = vals;
    ret_val =  db.query(ret, bind_array);
    return ret_val;
  }
}
module.exports = {init, sql}
