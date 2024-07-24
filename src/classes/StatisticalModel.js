class StatisticalModel {
  _name;
  version = 0;
  _properties = [];

  constructor(name) {
    this._name = name;
    this._properties = [
      {
        value: 0.95,
        isArray: false,
        expects: "number",
        desc: "Select confidence level (e.g., 0.95 for 95%)",
        name: "confidence_level",
        isValid: true,
        isOptional: false,
      }
    ];
  }

  updateProperty(index, value) {
    let property = this._properties[index];
    if (property.isArray) {
      if (!property.value) {
        property.value = new Set();
      }
      if (Array.isArray(value)) {
        property.value = new Set(value);
      } else {
        property.value.add(value);
      }
      property.isValid = property.value.size > 0;
    } else {
      property.value = value;
      property.isValid = value !== null && value !== undefined && value !== '';
    }
  }

  isValid() {
    return this._properties.every(property => {
      if (property.expects === 'categories') {
        return property.value.size === 2;
      }
      return property.isValid || property.isOptional;
    });
  }
}

export class OneSampleTTest extends StatisticalModel {
  constructor() {
    super("OneSampleTTest");
    this._properties.push(
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable",
        name: "variable",
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "number",
        desc: "Enter population mean",
        name: "population_mean",
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "comparison",
        desc: "Select comparison type",
        name: "comparison",
        isValid: false,
        isOptional: false,
      }
    );
  }
}

export class IndependentTwoSampleTTest extends StatisticalModel {
  constructor() {
    super("IndependentTwoSampleTTest");
    this._properties.push(
      {
        value: null,
        isArray: false,
        expects: "select",
        desc: "Select comparison type",
        name: "comparison_type",
        options: ["Compare two columns", "Compare one column by category"],
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable for sample 1",
        name: "variable1",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable for sample 2",
        name: "variable2",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable",
        name: "numeric_variable",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a categorical variable",
        name: "categorical_variable",
        isValid: false,
        isOptional: true,
      },
      {
        value: new Set(),
        isArray: true,
        expects: "categories",
        desc: "Select two categories to compare",
        name: "categories",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "comparison",
        desc: "Select comparison type",
        name: "comparison",
        isValid: false,
        isOptional: false,
      },
      {
        value: true,
        isArray: false,
        expects: "boolean",
        desc: "Assume equal variances",
        name: "equal_variances",
        isValid: true,
        isOptional: true,
      }
    );
  }

  isValid() {
    const comparisonType = this._properties.find(prop => prop.name === 'comparison_type')?.value;
    if (comparisonType === 'Compare two columns') {
      return this._properties.every(property => {
        if (property.name === 'variable1' || property.name === 'variable2' || property.name === 'comparison') {
          return property.isValid;
        }
        return true;
      });
    } else if (comparisonType === 'Compare one column by category') {
      return this._properties.every(property => {
        if (property.name === 'numeric_variable' || property.name === 'categorical_variable' || property.name === 'categories' || property.name === 'comparison') {
          return property.isValid;
        }
        return true;
      });
    }
    return false;
  }
}

export class PairedSampleTTest extends StatisticalModel {
  constructor() {
    super("PairedSampleTTest");
    this._properties.push(
      {
        value: null,
        isArray: false,
        expects: "select",
        desc: "Select comparison type",
        name: "comparison_type",
        options: ["Compare two columns", "Compare one column by category"],
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable for sample 1",
        name: "variable1",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable for sample 2",
        name: "variable2",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable",
        name: "numeric_variable",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a categorical variable",
        name: "categorical_variable",
        isValid: false,
        isOptional: true,
      },
      {
        value: new Set(),
        isArray: true,
        expects: "categories",
        desc: "Select two categories to compare",
        name: "categories",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "comparison",
        desc: "Select comparison type",
        name: "comparison",
        isValid: false,
        isOptional: false,
      }
    );
  }

  isValid() {
    const comparisonType = this._properties.find(prop => prop.name === 'comparison_type')?.value;
    if (comparisonType === 'Compare two columns') {
      return this._properties.every(property => {
        if (property.name === 'variable1' || property.name === 'variable2' || property.name === 'comparison') {
          return property.isValid;
        }
        return true;
      });
    } else if (comparisonType === 'Compare one column by category') {
      return this._properties.every(property => {
        if (property.name === 'numeric_variable' || property.name === 'categorical_variable' || property.name === 'categories' || property.name === 'comparison') {
          return property.isValid;
        }
        return true;
      });
    }
    return false;
  }
}

export class MannWhitneyUTest extends StatisticalModel {
  constructor() {
    super("MannWhitneyUTest");
    this._properties.push(
      {
        value: null,
        isArray: false,
        expects: "select",
        desc: "Select comparison type",
        name: "comparison_type",
        options: ["Compare two columns", "Compare one column by category"],
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable for sample 1",
        name: "variable1",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable for sample 2",
        name: "variable2",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable",
        name: "numeric_variable",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a categorical variable",
        name: "categorical_variable",
        isValid: false,
        isOptional: true,
      },
      {
        value: new Set(),
        isArray: true,
        expects: "categories",
        desc: "Select two categories to compare",
        name: "categories",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "comparison",
        desc: "Select comparison type",
        name: "comparison",
        isValid: false,
        isOptional: false,
      }
    );
  }

  isValid() {
    const comparisonType = this._properties.find(prop => prop.name === 'comparison_type')?.value;
    if (comparisonType === 'Compare two columns') {
      return this._properties.every(property => {
        if (property.name === 'variable1' || property.name === 'variable2' || property.name === 'comparison') {
          return property.isValid;
        }
        return true;
      });
    } else if (comparisonType === 'Compare one column by category') {
      return this._properties.every(property => {
        if (property.name === 'numeric_variable' || property.name === 'categorical_variable' || property.name === 'categories' || property.name === 'comparison') {
          return property.isValid;
        }
        return true;
      });
    }
    return false;
  }
}

export class KruskalWallisTest extends StatisticalModel {
  constructor() {
    super("KruskalWallisTest");
    this._properties.push(
      {
        value: null,
        isArray: false,
        expects: "select",
        desc: "How are groups represented?",
        name: "group_representation",
        options: ["Groups in one column", "Groups in separate columns"],
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable",
        name: "numeric_variable",
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a categorical variable",
        name: "categorical_variable",
        isValid: false,
        isOptional: false,
      },
      {
        value: new Set(),
        isArray: true,
        expects: "variables",
        desc: "Select group columns",
        name: "group_columns",
        isValid: false,
        isOptional: false,
      }
    );
  }

  isValid() {
    const groupRepresentation = this._properties.find(prop => prop.name === 'group_representation')?.value;
    if (groupRepresentation === 'Groups in one column') {
      const numericVariable = this._properties.find(prop => prop.name === 'numeric_variable');
      const categoricalVariable = this._properties.find(prop => prop.name === 'categorical_variable');
      return numericVariable.isValid && categoricalVariable.isValid;
    } else if (groupRepresentation === 'Groups in separate columns') {
      const groupColumns = this._properties.find(prop => prop.name === 'group_columns');
      return groupColumns.isValid;
    }
    return false;
  }
}





export class OneWayANOVA extends StatisticalModel {
  constructor() {
    super("OneWayANOVA");
    this._properties.push(
      {
        value: null,
        isArray: false,
        expects: "select",
        desc: "How are groups represented?",
        name: "group_representation",
        options: ["Groups in one column", "Groups in separate columns"],
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable",
        name: "numeric_variable",
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a categorical variable",
        name: "categorical_variable",
        isValid: false,
        isOptional: false,
      },
      {
        value: new Set(),
        isArray: true,
        expects: "variables",
        desc: "Select group columns",
        name: "group_columns",
        isValid: false,
        isOptional: false,
      }
    );
  }

  isValid() {
    const groupRepresentation = this._properties.find(prop => prop.name === 'group_representation')?.value;
    if (groupRepresentation === 'Groups in one column') {
      const numericVariable = this._properties.find(prop => prop.name === 'numeric_variable');
      const categoricalVariable = this._properties.find(prop => prop.name === 'categorical_variable');
      return numericVariable.isValid && categoricalVariable.isValid;
    } else if (groupRepresentation === 'Groups in separate columns') {
      const groupColumns = this._properties.find(prop => prop.name === 'group_columns');
      return groupColumns.isValid;
    }
    return false;
  }
}


export class Correlation extends StatisticalModel {
  constructor() {
    super("Correlation");
    this._properties.push(
      {
        value: new Set(),
        isArray: true,
        expects: "variables",
        desc: "Select columns for correlation analysis",
        name: "columns",
        isValid: false,
        isOptional: false,
      },
      {
        value: "pearson",
        isArray: false,
        expects: "select",
        desc: "Select type of correlation",
        name: "correlation_type",
        options: ["pearson", "spearman"],
        isValid: true,
        isOptional: false,
      },
      {
        value: "drop_rows",
        isArray: false,
        expects: "select",
        desc: "Select NaN handling method",
        name: "nan_handling",
        options: ["drop_rows", "pairwise"],
        isValid: true,
        isOptional: false,
      }
    );
  }
}


export class KolmogorovSmirnovTest extends StatisticalModel {
  constructor() {
    super("KolmogorovSmirnovTest");
    this._properties.push(
      {
        value: null,
        isArray: false,
        expects: "variable",
        desc: "Select a numeric variable",
        name: "variable",
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "select",
        desc: "Select a distribution",
        name: "distribution",
        options: ["normal", "pareto", "gamma", "uniform", "exponential"],
        isValid: false,
        isOptional: false,
      }
    );
  }
}