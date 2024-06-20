<script>
export default {
  name: 'ModalInstance',
  props: {
    existingNames: {
      type: Array,
      required: true
    }
  },
  methods: {
    close() {
      console.log(this.name);
      this.$emit('close', this.name);
    },
    submitName() {
      console.log(this.existingNames);
      if (!this.name) {
        this.errorMessage = "Name cannot be blank";
        return;
      } else if (this.existingNames.includes(this.name)) {
        this.errorMessage = "Name already exists, should be unique";
        return;
      } else {
        this.$emit('submitName', this.name);
        this.close();
      }
    }
  },
  data() {
    return {
      name: "",
      errorMessage: ""
    };
  }
};
</script>

<template>
  <div class="ModalInstance-backdrop" role="dialog" aria-labelledby="modal-title" aria-describedby="modal-desc">
    <div class="ModalInstance">
      <header class="ModalInstance-header">
        <slot name="header">
          <h2 id="modal-title">Create a new instance</h2>
        </slot>
        <button type="button" class="btn-close" @click="close" aria-label="Close modal"></button>
      </header>

      <section class="ModalInstance-body" id="modal-desc">
        <slot name="body">
            <p1> instance name: </p1>
          <input v-model="name" aria-describedby="error-message"/>
          <div v-if="errorMessage" class="error-message" id="error-message">{{ errorMessage }}</div>
        </slot>
      </section>

      <footer class="ModalInstance-footer">
        <slot name="footer">
            <button type="button" class="btn-green" @click="submitName">
            Save name
            </button>
        </slot>
      </footer>
    </div>
  </div>
</template>

<style>
.ModalInstance-backdrop {
  z-index: 1000;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.ModalInstance {
  background: #FFFFFF;
  box-shadow: 2px 2px 20px 1px;
  overflow-x: auto;
  display: flex;
  flex-direction: column;
}

.ModalInstance-header,
.ModalInstance-footer {
  padding: 15px;
  display: flex;
}

.ModalInstance-header {
  position: relative;
  border-bottom: 1px solid #eeeeee;
  color: #4AAE9B;
  justify-content: space-between;
}

.ModalInstance-footer {
  border-top: 1px solid #eeeeee;
  flex-direction: column;
  justify-content: flex-end;
}

.ModalInstance-body {
  position: relative;
  padding: 20px 10px;
}

.btn-close {
  position: absolute;
  top: 0;
  right: 0;
  border: none;
  font-size: 20px;
  padding: 10px;
  cursor: pointer;
  font-weight: bold;
  color: #4AAE9B;
  background: transparent;
}

.btn-green {
  color: white;
  background: #4AAE9B;
  border: 1px solid #4AAE9B;
  border-radius: 2px;
}

.error-message {
  color: red;
  margin-top: 10px;
}
</style>
