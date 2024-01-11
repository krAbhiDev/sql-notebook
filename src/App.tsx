import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import Database from "tauri-plugin-sql-api";
function useDb(path: string) {
  const [db, setDb] = useState<Database>();
  useEffect(() => {
    const initDatabase = async () => {
      try {
        const _db = await Database.load(path);
        setDb(_db);
      } catch (error) {
        console.log(error);
      }
    };
    initDatabase();
    return () => {
      db?.close();
    };
  }, []);
  return db;
}
function App() {
  const db = useDb("mysql://abhishek:123@localhost/test");

  useEffect(() => {
    if (db) {
      console.log("database connected", db);
    }
  }, [db]);
  async function insert() {
    if (!db) return;
    // const res = await db.select("select * from user");
    const res = await db.execute("insert into user (name,age) values(?,?)", [
      "abhi " + Math.floor(Math.random() * 100),
      Math.floor(Math.random() * 30),
    ]);
    console.log(res);
  }
  async function select() {
    if (!db) return;
    run("select * from user");
  }
  async function delete_() {
    if (!db) return;
    run("DELETE FROM user WHERE id = 1");
  }
  async function createTable() {
    if (!db) return;
    run(` CREATE TABLE user2${parseInt(Math.random() * 10000 + "")} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INT
    )`);
  }
  async function run(q: string) {
    if (!db) return;
    const res = await db.execute(q);
    let out = undefined;
    if (res.lastInsertId == 0 && res.rowsAffected == 0) {
      try {
        const selectRes = (await db.select(q)) as [];
        if (selectRes.length == 0) {
          out = "nothing to show";
        } else {
          out = tableArray(selectRes);
        }
      } catch (error) {
        out = res;
      }
    } else {
      out = res;
    }
    setTable(out);

    console.log(out);
    console.log("ta", tableArray(out));
  }
  async function descTable() {
    if (!db) return;
    run("DESCRIBE user");
  }
  //all table
  async function allTable() {
    if (!db) return;
    run("show tables");
    run("show databases");
  }

  //array of objet to table
  function tableArray(data: any) {
    //table {col1:[],col2:[]}
    //if data is array
    if (!Array.isArray(data)) return {};

    const map = new Map<string, any[]>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (map.has(key)) {
          const existingArray = map.get(key) || [];
          map.set(key, [...existingArray, item[key]]);
        } else {
          map.set(key, [item[key]]);
        }
      });
    });
    const tableObject: SqlTableType = {};
    map.forEach((value, key) => {
      tableObject[key] = value;
    });
    return tableObject;
  }
  const [table, setTable] = useState<
    SqlTableType | string | SqlExecuteType | undefined
  >();

  function isSqlExecuteType(data: any): data is SqlExecuteType {
    return (
      typeof data == "object" &&
      data.lastInsertId != undefined &&
      data.rowsAffected != undefined
    );
  }
  function isSqlTableType(data: any): data is SqlTableType {
    return typeof data == "object" && Object.keys(data).length > 0;
  }
  function isString(data: any): data is string {
    return typeof data == "string";
  }
  function ResultView(props: { data: any }) {
    if (isSqlExecuteType(props.data)) {
      return <div>{JSON.stringify(props.data, null, 2)}</div>;
    } else if (isSqlTableType(props.data)) {
      return <SqlTable data={props.data} />;
    } else if (isString(props.data)) {
      return <div>{props.data}</div>;
    } else {
      return <div>nothing to show</div>;
    }
  }

  return (
    <div className="p-2">
      <div className=" flex space-x-1">
        <button className="btn-primary" onClick={select}>
          select
        </button>
        <button className="btn-primary" onClick={insert}>
          insert
        </button>
        <button className="btn-primary" onClick={descTable}>
          descTable
        </button>
        <button className="btn-primary" onClick={delete_}>
          delete
        </button>
        <button className="btn-primary" onClick={allTable}>
          allTable
        </button>
        <button className="btn-primary" onClick={createTable}>
          createTable
        </button>
      </div>
      <div>
        <ResultView data={table} />
      </div>
    </div>
  );
}
interface SqlTableType {
  [key: string]: any[];
}
interface SqlExecuteType {
  lastInsertId: number;
  rowsAffected: number;
}
function SqlTable(props: { data: SqlTableType }) {
  //create html table from tableArray
  //if object is empty show
  return (
    <div className="max-h-[200px] overflow-y-auto ">
      <table>
        <thead>
          <tr>
            {Object.keys(props.data).map((key, i) => (
              <th key={i}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.values(props.data)[0].map((_, i) => (
            <tr key={i}>
              {Object.values(props.data).map((item, j) => (
                <td key={j}>{item[i]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
