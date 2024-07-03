


export function getColumnNamesByType(dataInstance, targetcolumnTypes) {
  console.log(Object.keys(dataInstance.dataTypes).filter(key => targetcolumnTypes.includes(dataInstance.dataTypes[key])))
    return Object.keys(dataInstance.dataTypes).filter(key => targetcolumnTypes.includes(dataInstance.dataTypes[key]));
  }