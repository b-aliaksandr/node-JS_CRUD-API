export const DATA_TYPES = {
  'STRING': 'STRING',
  'NUMBER': 'NUMBER',
  'ARRAY_OF_STRINGS': 'ARRAY_OF_STRINGS',
};

export const CONSTRAINTS = {
  'REQUIRED': 'REQUIRED',
  'UNIQUE': 'UNIQUE',
};

export const WHERE_CONDITIONS = {
  'EQUAL': 'EQUAL',
};

const whereConditionsCheckers = {
  [WHERE_CONDITIONS.EQUAL]: (entityValue, value) => {
    return entityValue === value;
  }
};

const dataTypesCheckers = {
  [DATA_TYPES.STRING]: (value) => {
    return 'string' === typeof value;
  },
  [DATA_TYPES.NUMBER]: (value) => {
    return 'number' === typeof Number(value);
  },
  [DATA_TYPES.ARRAY_OF_STRINGS]: (arr) => {
    return arr.every((value) => 'string' === typeof value);
  },
};

const constraintsCheckers = {
  [CONSTRAINTS.REQUIRED]: (value) => {
    if (typeof value === 'number') return Number.isSafeInteger(Number(value));
    return Boolean(value);
  },
  [CONSTRAINTS.UNIQUE]: (value, otherValuesSet) => {
    return !otherValuesSet.has(value);
  },
};

export default async function createMemoryDB({ logger }) {
  const memory = new Map();

  async function createTable(tableName, columns) {
    if (memory.has(tableName)) {
      return;
    }
    const tableStructure = new Map();

    // validating
    columns.forEach(({ name, dataType, constraints }) => {
      if (tableStructure.has(name)) {
        throw new Error(`Table ${name} already exists.`);
      }
      if (!DATA_TYPES[dataType]) {
        throw new Error(`Invalid data type. ${dataType}`);
      }
      constraints.forEach((constraint) => {
        if (!CONSTRAINTS[constraint]) {
          throw new Error(`Invalid constraint. ${constraint}`);
        }
      });

      return tableStructure.set(name, {
        dataType,
        constraints,
      });
    });
    memory.set(tableName, { tableStructure, rows: [] });

    logger.write(`memoryDB: Table ${tableName} created. \r\n`);
  }

  async function insert(tableName, rowData) {
    if (!memory.has(tableName)) {
      throw new Error(`Table ${tableName} not exists.`);
    }

    const { tableStructure, rows } = memory.get(tableName);
    // validate rowData
    for (const [name, value] of Object.entries(rowData)) {
      const { dataType, constraints } = tableStructure.get(name);

      const dataTypeChecker = dataTypesCheckers[dataType];
      const isValidDataType = dataTypeChecker(value);
      if (!isValidDataType) {
        throw new Error(`Invalid data type. ${dataType}. Value: ${value}`);
      }

      constraints.forEach((constraint) => {
        const checker = constraintsCheckers[constraint];
        const isValid = checker(value, new Set(rows.map((row) => row[name])));
        if (!isValid) {
          throw new Error(`${constraint} constrained failed. Value: ${value}`);
        }
      });
    }

    rows.push(rowData);
    return rowData;
  }

  async function update(tableName, newRowData, where) {
    if (!memory.has(tableName)) {
      throw new Error(`Table ${tableName} not exists.`);
    }

    const tableData = memory.get(tableName);
    const { tableStructure, rows } = tableData;
    // validate newRowData
    for (const [name, value] of Object.entries(newRowData)) {
      const { dataType, constraints } = tableStructure.get(name);

      const dataTypeChecker = dataTypesCheckers[dataType];
      const isValidDataType = dataTypeChecker(value);
      if (!isValidDataType) {
        throw new Error(`Invalid data type. ${dataType}. Value: ${value}`);
      }

      constraints.forEach((constraint) => {
        const checker = constraintsCheckers[constraint];
        const isValid = checker(value, new Set(rows.map((row) => row[name])));
        if (!isValid) {
          throw new Error(`${constraint} constrained failed. Value: ${value}`);
        }
      });
    }

    let updatedRows = [...rows];
    let updatedRowData = null;

    for (const { name, value, condition } of where) {
      const checker = whereConditionsCheckers[condition];

      updatedRows = updatedRows.map((rowData) => {
        const isCondition = checker(rowData[name], value);
        if (isCondition) {
          updatedRowData = {...rowData, ...newRowData};
          return updatedRowData;
        }
        return rowData;
      });
    }

    memory.set(tableName, { ...tableData, rows: updatedRows });
    return updatedRowData;
  }

  async function select(tableName, columns, where) {
    if (!memory.has(tableName)) {
      throw new Error(`Table ${tableName} not exists.`);
    }

    let rows = [];

    if (columns === '*') {
      rows = memory.get(tableName).rows;
    }

    if (where) {
      for (const { name, value, condition } of where) {
        const checker = whereConditionsCheckers[condition];
        rows = rows.filter((rowData) => {
          return checker(rowData[name], value);
        });
      }
    }

    return rows;
  }

  async function remove(tableName, where) {
    if (!memory.has(tableName)) {
      throw new Error(`Table ${tableName} not exists.`);
    }

    const tableData = memory.get(tableName);
    let updatedRows = [...tableData.rows];

    for (const { name, value, condition } of where) {
      const checker = whereConditionsCheckers[condition];

      updatedRows = updatedRows.filter((rowData) => {
        const isCondition = checker(rowData[name], value);
        return !isCondition;
      });
    }

    memory.set(tableName, { tableData, rows: updatedRows });
  }

  return {
    createTable,
    insert,
    select,
    remove,
    update,
  }
}