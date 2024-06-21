class Model {
   _name;
   _types = [];
   _selectedType = "";
   version = 0;
   _properties = {}
   constructor(name) {
      this._name = name;
   }  

   updateProperty(index, value) {
      let property = this._properties[index];
      if (property.isArray) {
         if (!property.value) property.value = new Set();
 
         if (property.value.has(value)) property.value.delete(value);
         else property.value.add(value);

         property.isValid = property.value.size > 0;
       } else {
         property.value = value;
         property.isValid = true;
       }
   }
}

export class LinearRegression extends Model {
   constructor() {
      super("Linear Regression");   
      this._types = ["Lasso", "L1", "L2"]; 
      this._properties = [
         {
            value: null,
            isArray: false,
            expects: "variables",
            desc: "Select the target variable",
            name: "Target Variable",
            isValid: false,
         },
         {
            value: new Set(),
            isArray: true,
            expects: "variables",
            desc: "To be added",
            name: "From Variable",
            isValid: false,
         }
      ]
   }
}

export class LassoRegression extends Model {
   constructor() {
      super("Lasso Regression");   
      this._types = ["a", "b"];   
   }
}