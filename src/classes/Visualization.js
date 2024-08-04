class Visualization {
  _name;
  version = 0;
  _properties = [];

  constructor(name) {
    this._name = name;
    this._properties = [];
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
}

export class Histogram extends Visualization {
  constructor() {
    super("Histogram");
    this._properties.push(
      {
        value: null,
        isArray: false,
        expects: "variables",
        desc: "Show",
        name: "y",
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variables",
        desc: "by",
        name: "hue",
        isValid: false,
        isOptional: true,
      },
      {
        value: new Set(),
        isArray: true,
        expects: "values",
        desc: "Select values for hue",
        name: "hue_values",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "number",
        desc: "Number of bins",
        name: "num_bins",
        isValid: true,
        isOptional: true,
      }
    );
  }
}

export class BarPlot extends Visualization {
  constructor() {
    super("BarPlot");
    this._properties.push(
      {
        value: null,
        isArray: false,
        expects: "variables",
        desc: "Show",
        name: "y",
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variables",
        desc: "By",
        name: "x",
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variables",
        desc: "and",
        name: "hue",
        isValid: false,
        isOptional: true,
      },
      {
        value: new Set(),
        isArray: true,
        expects: "values",
        desc: "Select values for hue",
        name: "hue_values",
        isValid: false,
        isOptional: true,
      },
      {
        value: new Set(),
        isArray: true,
        expects: "values",
        desc: "Select values for x-axis",
        name: "x_values",
        isValid: true,
        isOptional: true,
      },
      {
        value: "vertical",
        isArray: false,
        expects: "orientation",
        desc: "Orientation",
        name: "orientation",
        isValid: true,
        isOptional: false,
      },
      {
        value: "mean",
        isArray: false,
        expects: "aggregate",
        desc: "Aggregate Function",
        name: "aggregate",
        isValid: true,
        isOptional: false,
      }
    );
  }
}


export class BoxWhiskerPlot extends Visualization {
  constructor() {
    super("BoxWhiskerPlot");
    this._properties.push(
      {
        value: null,
        isArray: false,
        expects: "variables",
        desc: "Show",
        name: "y",
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variables",
        desc: "by",
        name: "x",
        isValid: false,
        isOptional: true,
      },
      {
        value: null,
        isArray: false,
        expects: "variables",
        desc: "and",
        name: "hue",
        isValid: false,
        isOptional: true,
      },
      {
        value: new Set(),
        isArray: true,
        expects: "values",
        desc: "Select values for hue",
        name: "hue_values",
        isValid: false,
        isOptional: true,
      }
    );
  }
}

export class ScatterPlot extends Visualization {
  constructor() {
    super("ScatterPlot");
    this._properties.push(
      {
        value: null,
        isArray: false,
        expects: "variables",
        desc: "By",
        name: "x",
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variables",
        desc: "Show",
        name: "y",
        isValid: false,
        isOptional: false,
      }
    );
  }
}



export class PieChart extends Visualization {
  constructor() {
    super("PieChart");
    this._properties.push(
      {
        value: null,
        isArray: false,
        expects: "variables",
        desc: "Show",
        name: "y",
        isValid: false,
        isOptional: false,
      },
      {
        value: null,
        isArray: false,
        expects: "variables",
        desc: "By",
        name: "hue",
        isValid: false,
        isOptional: false,
      }
    );
  }
}
