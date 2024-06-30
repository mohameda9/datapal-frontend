export function getColumnNamesByType(dataInstance, targetcolumnTypes) {
    return Object.keys(dataInstance.dataTypes).filter(key => targetcolumnTypes.includes(dataInstance.dataTypes[key]));
  }