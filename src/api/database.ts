import request from "@/utils/request";

const DATABASE_BASE_URL = "/v1/database";

const DatabaseAPI = {
  /** 获取数据库列表 */
  getDatabases() {
    return request<any, { code: string; data: string[] }>({
      url: `${DATABASE_BASE_URL}/databases`,
      method: "get",
    });
  },

  /** 获取指定数据库的表列表 */
  getTables(database?: string) {
    return request<any, { code: string; data: string[] }>({
      url: `${DATABASE_BASE_URL}/tables`,
      method: "get",
      params: { database },
    });
  },

  /** 获取表结构 */
  getTableColumns(tableName: string, database?: string) {
    return request<any, { code: string; data: Array<Record<string, any>> }>({
      url: `${DATABASE_BASE_URL}/tables/${tableName}/columns`,
      method: "get",
      params: { database },
    });
  },

  /** 分页获取表数据 */
  getTableData(tableName: string, pageNum: number, pageSize: number, database?: string) {
    return request<any, { code: string; data: { total: number; list: Array<Record<string, any>> } }>({
      url: `${DATABASE_BASE_URL}/tables/${tableName}/data`,
      method: "get",
      params: { database, pageNum, pageSize },
    });
  },

  /** 执行 SQL 查询 */
  executeSQL(sql: string) {
    return request<any, { code: string; data: { columns: string[]; rows: Array<Record<string, any>>; total: number } }>({
      url: `${DATABASE_BASE_URL}/query`,
      method: "post",
      data: { sql },
    });
  },

  /** 获取数据库连接信息 */
  getConnectionInfo() {
    return request<any, { code: string; data: { type: string; host: string; port: number; user: string; database: string; version: string } }>({
      url: `${DATABASE_BASE_URL}/connection-info`,
      method: "get",
    });
  },

  /** 创建数据库 */
  createDatabase(name: string, charset?: string, collation?: string) {
    return request<any, { code: string; data: { name: string }; msg?: string }>({
      url: `${DATABASE_BASE_URL}/create`,
      method: "post",
      data: { name, charset, collation },
    });
  },

  /** 自然语言转 SQL */
  nlToSQL(text: string, database?: string) {
    return request<any, { code: string; data: { sql: string; explanation: string } }>({
      url: `${DATABASE_BASE_URL}/nl-to-sql`,
      method: "post",
      data: { text, database },
    });
  },
};

export default DatabaseAPI;
