<template>
    <div
      class="AdvancedColumnCreator-backdrop"
      role="dialog"
      aria-labelledby="column-modal-title"
      aria-describedby="column-modal-desc"
    >
      <div class="AdvancedColumnCreator">
        <header class="AdvancedColumnCreator-header">
          <slot name="header">
            <h2 id="column-modal-title">Create New Column with Conditions</h2>
          </slot>
          <button
            type="button"
            class="btn-close"
            @click="close"
            aria-label="Close modal"
          ></button>
        </header>
  
        <section class="AdvancedColumnCreator-body" id="column-modal-desc">
          <slot name="body">
            <p>Column name:</p>
            <input
              v-model="columnName"
              @input="CheckNewColumnName($event.target.value)"
              aria-describedby="column-error-message"
            />
            <p v-if="columnNameExistsWarn != null" :style="{ color: 'red' }">
              {{ columnNameExistsWarn }}
            </p>
  
            <div
              v-for="(conditionGroup, groupIndex) in conditionGroups"
              :key="groupIndex"
              class="condition-group"
            >
              <p>Condition Group {{ groupIndex + 1 }}:</p>
              <div
                v-for="(condition, condIndex) in conditionGroup.conditions"
                :key="condIndex"
                class="condition"
              >
                <select
                  v-model="condition.column"
                  class="column-select"
                  @change="updateOperators(groupIndex, condIndex)"
                >
                  <option v-for="col in availableColumns" :key="col" :value="col">
                    {{ col }}
                  </option>
                </select>
                <select v-model="condition.operator">
                  <option
                    v-for="operator in condition.availableOperators"
                    :key="operator"
                    :value="operator"
                  >
                    {{ operator }}
                  </option>
                </select>
                <input v-model="condition.value" placeholder="Value" />
                <button
                  type="button"
                  class="btn-remove"
                  @click="removeANDCondition(groupIndex, condIndex)"
                  aria-label="Remove condition"
                >
                  Remove
                </button>
              </div>
              <div class="result-row">
                <input
                  v-model="conditionGroup.result"
                  placeholder="Result Expression"
                  class="result-input"
                />
              </div>
              <div v-if="conditionGroup.errorMessage" class="error-message">
                {{ conditionGroup.errorMessage }}
              </div>
              <button
                type="button"
                class="btn-add"
                @click="addANDCondition(groupIndex)"
              >
                Add an AND clause
              </button>
            </div>
            <button type="button" class="btn-and" @click="addConditionGroup">
              Add condition group
            </button>
  
            <p>Default (else) value:</p>
            <div class="result-row">
              <input
                v-model="defaultValue"
                placeholder="Default Expression"
                class="result-input"
              />
            </div>
            <div v-if="elseErrorMessage" class="error-message">
              {{ elseErrorMessage }}
            </div>
  
            <div v-if="errorMessage" class="error-message" id="column-error-message">
              {{ errorMessage }}
            </div>
          </slot>
        </section>
  
        <footer class="AdvancedColumnCreator-footer">
          <slot name="footer">
            <button type="button" class="btn-green" @click="submit">
              Create Column
            </button>
          </slot>
        </footer>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AdvancedColumnCreator',
    props: {
      availableColumns: {
        type: Array,
        required: true,
      },
      columnTypes: {
        type: Array,
        required: true,
      },
      instanceIndex: {
        type: Array,
        required: true,
      },
    },
    data() {
      return {
        columnName: '',
        columnNameExistsWarn: null,
        conditionGroups: [],
        defaultValue: '',
        elseErrorMessage: '',
        errorMessage: '',
      };
    },
    methods: {
      close() {
        this.$emit('close');
      },
      addANDCondition(groupIndex) {
        this.conditionGroups[groupIndex].conditions.push({
          column: '',
          operator: '',
          value: '',
          availableOperators: [],
        });
      },
      removeANDCondition(groupIndex, condIndex) {
        this.conditionGroups[groupIndex].conditions.splice(condIndex, 1);
        if (this.conditionGroups[groupIndex].conditions.length === 0) {
          this.conditionGroups.splice(groupIndex, 1);
        }
      },
      addConditionGroup() {
        this.conditionGroups.push({
          conditions: [
            {
              column: '',
              operator: '',
              value: '',
              availableOperators: [],
            },
          ],
          result: '',
          errorMessage: '',
        });
      },
      updateOperators(groupIndex, condIndex) {
        const column = this.conditionGroups[groupIndex].conditions[condIndex].column;
        const columnType = this.columnTypes[column];
  
        let operators = ['='];
        if (columnType === 'numeric') {
          operators = ['=', '>', '<', '<='];
        } else if (columnType === 'categorical') {
          operators = ['=', 'contains'];
        }
  
        this.conditionGroups[groupIndex].conditions[condIndex].availableOperators = operators;
        this.conditionGroups[groupIndex].conditions[condIndex].operator = operators[0];
      },
      submit() {
        this.errorMessage = ''; // Reset error message
        this.elseErrorMessage = ''; // Reset else error message
        let allValid = true;
  
        if (!this.columnName) {
          this.errorMessage = 'Column name cannot be blank';
          return;
        } else if (
          this.conditionGroups.some(
            (group) =>
              group.conditions.some((cond) => !cond.column || !cond.value) ||
              !group.result
          )
        ) {
          this.errorMessage = 'All condition fields and results must be filled';
          return;
        } else if (!this.defaultValue) {
          this.errorMessage = 'Default value cannot be blank';
          return;
        }
  
        // Validate each result in condition groups
        this.conditionGroups.forEach((group) => {
          const isValid = this.validateExpression(group.result);
          if (!isValid[0]) {
            group.errorMessage = isValid[1];
            allValid = false;
          } else {
            group.errorMessage = '';
          }
        });
  
        // Validate else value if it's an expression
        const isValidElse = this.validateExpression(this.defaultValue);
        if (!isValidElse[0]) {
          this.elseErrorMessage = isValidElse[1];
          allValid = false;
        }
  
        if (!allValid) {
          return;
        }
  
        const metaData = this.conditionGroups.map((group) => ({
          conditions: group.conditions.map((cond) => ({
            column: cond.column,
            operator: cond.operator,
            value:
              cond.operator === 'isin'
                ? cond.value.split(',').map((val) => val.trim())
                : cond.value,
          })),
          result: group.result,
        }));
  
        metaData.forEach((group, index) => {
          console.log(`Condition ${index + 1}:`, group);
        });
        console.log('Else:', this.defaultValue);
  
        this.$emit('submit', {
          columnName: this.columnName,
          conditionGroups: metaData,
          defaultValue: this.defaultValue,
        });
        this.close();
      },
  
      validateExpression(expression) {
        var expressionValidationMessage;
  
        // Check if expression is enclosed in quotes
        if (expression.startsWith('"') && expression.endsWith('"')) {
          return [true, 'Valid expression.'];
        }
  
        // Check for logical syntax, balanced parentheses, and valid identifiers
        if (!this.isValidExpression(expression)) {
          expressionValidationMessage =
            'Expression syntax is invalid. Please check for balanced parentheses, logical syntax, and ensure all identifiers are correctly referenced as model.columnname.';
          return [false, expressionValidationMessage];
        }
  
        // Extract columns from the expression and validate their existence
        const columns = this.extractColumnsFromExpression(expression);
        const invalidColumns = columns.filter((col) => !this.columnExists(col));
        if (invalidColumns.length > 0) {
          expressionValidationMessage = `Invalid columns: ${invalidColumns.join(
            ', '
          )}`;
          return [false, expressionValidationMessage];
        } else {
          expressionValidationMessage = 'Valid expression.';
          return [true, expressionValidationMessage];
        }
      },
  
      columnExists(columnName) {
        return this.availableColumns.includes(columnName);
      },
  
      isValidExpression(expression) {
        const stack = [];
        const tokens = expression
          .split(/([()+\-*/^]|\s+)/)
          .filter((token) => token.trim() !== '');
        const validOperators = ['+', '-', '*', '/', '^', '(', ')'];
        const validColumnPattern = /^model\.[a-zA-Z_][a-zA-Z0-9_]*$/;
        let lastToken = '';
        let expectingOperand = true; // Track when an operand is expected
  
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i].trim();
  
          if (validOperators.includes(token)) {
            if (expectingOperand && token !== '(' && token !== '-') {
              return false; // An operand is expected but found an operator (except '(' and unary '-')
            }
            if (token === '(') {
              stack.push(token);
              expectingOperand = true; // After '(', an operand is expected
            } else if (token === ')') {
              if (stack.length === 0 || stack.pop() !== '(') {
                return false; // Unbalanced parenthesis found
              }
              expectingOperand = false; // After ')', an operator is expected
            } else {
              expectingOperand = true; // After an operator, an operand is expected
            }
          } else if (!isNaN(token)) {
            expectingOperand = false; // After a number, an operator is expected
          } else if (validColumnPattern.test(token)) {
            expectingOperand = false; // After a column reference, an operator is expected
          } else {
            return false; // Invalid token found
          }
  
          lastToken = token;
        }
  
        if (expectingOperand && lastToken !== ')') {
          return false; // Expression cannot end with an operator except for ')'
        }
  
        return stack.length === 0; // Ensure all opened parentheses are closed
      },
  
      extractColumnsFromExpression(expression) {
        // Regular expression to extract column references as model.columnname
        const regex = /model\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        const columns = [];
  
        // Extract column names from the expression
        while ((match = regex.exec(expression)) !== null) {
          columns.push(match[1]);
        }
  
        return columns;
      },
  
      CheckNewColumnName(newColumnName) {
        if (this.availableColumns.some((column) => column == newColumnName)) {
          this.columnNameExistsWarn =
            'Column name already exists; will be overwritten if you continue';
        } else {
          this.columnNameExistsWarn = null;
        }
      },
    },
  };
  </script>
  
  <style>
  body,
  html,
  #app {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    font-family: 'Arial', sans-serif;
    background-color: #f0f2f5;
  }
  
  .AdvancedColumnCreator-backdrop {
    z-index: 1000;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .AdvancedColumnCreator {
    background: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 900px; /* Adjusted width for better content display */
    max-width: 90%;
    border-radius: 10px;
    max-height: 80%; /* Ensure the modal does not overflow the viewport */
  }
  
  .AdvancedColumnCreator-header,
  .AdvancedColumnCreator-footer {
    padding: 20px;
    display: flex;
    align-items: center;
    margin: 0;
    background: linear-gradient(135deg, #4aae9b, #2b8c87);
    color: white;
  }
  
  .AdvancedColumnCreator-header {
    position: relative;
    border-bottom: 1px solid #eeeeee;
    justify-content: space-between;
  }
  
  .AdvancedColumnCreator-footer {
    border-top: 1px solid #eeeeee;
    justify-content: flex-end;
    background: #f9f9f9;
  }
  
  .AdvancedColumnCreator-body {
    padding: 20px;
    flex-grow: 1; /* Ensure the body grows to fill available space */
    display: flex;
    flex-direction: column;
    overflow-y: auto; /* Make the body scrollable */
    margin: 0;
    background-color: #ffffff;
  }
  
  .AdvancedColumnCreator-body p,
  .AdvancedColumnCreator-body input,
  .AdvancedColumnCreator-body select {
    margin-bottom: 10px; /* Reduce spacing for better fit */
  }
  
  .AdvancedColumnCreator-body input,
  .AdvancedColumnCreator-body select {
    width: calc(100% - 20px);
    padding: 10px;
    border: 1px solid #dddddd;
    border-radius: 5px;
    font-size: 16px;
  }
  
  .condition-group {
    margin-bottom: 15px; /* Reduce spacing for better fit */
    padding: 10px;
    border: 1px solid #4aae9b;
    border-radius: 5px;
    background-color: #f9f9f9;
  }
  
  .condition {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .condition select,
  .condition input {
    margin-right: 10px;
  }
  
  .column-select {
    width: 150px; /* Increase width for better visibility */
  }
  
  .result-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .result-input {
    width: 100%;
    margin-right: 10px;
  }
  
  .btn-close {
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    font-size: 20px;
    padding: 10px;
    cursor: pointer;
    font-weight: bold;
    color: white;
    background: transparent;
  }
  
  .btn-add,
  .btn-remove,
  .btn-and {
    margin-top: 10px;
    margin-right: 10px;
    color: white;
    background: #4aae9b;
    border: 1px solid #4aae9b;
    border-radius: 5px;
    padding: 8px 15px; /* Ensure consistent padding */
    cursor: pointer;
    transition: background 0.3s, box-shadow 0.3s;
  }
  
  .btn-add:hover,
  .btn-remove:hover,
  .btn-and:hover {
    background: #2b8c87;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .btn-green {
    color: white;
    background: #4aae9b;
    border: 1px solid #4aae9b;
    border-radius: 5px;
    padding: 10px 20px; /* Ensure consistent padding */
    cursor: pointer;
    transition: background 0.3s, box-shadow 0.3s;
  }
  
  .btn-green:hover {
    background: #2b8c87;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .error-message {
    color: red;
    margin-top: 10px;
  }
  </style>
  