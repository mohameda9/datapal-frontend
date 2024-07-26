<template>
    <div class="home-layout">
      <div class="header">
        <h1>DataPal</h1>
        <div class="header-buttons">
          <Button
            v-if="!isAuthenticated"
            @click="showSignInDialog = true"
            label="Sign In"
            class="secondary-button"
          ></Button>
          <Button
            v-if="!isAuthenticated"
            @click="showSignUpDialog = true"
            label="Get Started"
            class="secondary-button"
          ></Button>
          <Button
            v-if="isAuthenticated"
            @click="logout"
            label="Logout"
            class="secondary-button"
          ></Button>
        </div>
      </div>
      <div class="main-content">
        <div class="hero-section">
          <h2>Free No Code ML Platform</h2>
          <p>
            DataPal is your comprehensive data management and analysis tool. Easily
            upload and process your data, and build sophisticated predictive models.
            DataPal provides No Code solutions to transform your datasets and automates
            Model Evaluation.
          </p>
          <div class="hero-buttons">
            <Button
              label="Get Started Now"
              class="secondary-button"
              @click="showSignUpDialog = true"
              v-if="!isAuthenticated"
            ></Button>
            <Button label="Watch Video" class="secondary-button"></Button>
          </div>
        </div>
        <div class="features">
          <div class="features-grid">
            <div class="feature-card feature-card-blue">
              <h3>Transform Your Data</h3>
              <p>
                Revolutionize your raw data into powerful insights with advanced
                processing techniques.
              </p>
              <ul>
                <li>Innovative Feature Engineering</li>
                <li>Seamless Data Transformation</li>
              </ul>
            </div>
            <div class="feature-card feature-card-green">
              <h3>Unlock Hidden Patterns</h3>
              <p>
                Discover underlying trends and validate your hypotheses with robust
                statistical analysis.
              </p>
              <ul>
                <li>Comprehensive Hypothesis Testing</li>
                <li>In-depth Distribution Analysis</li>
              </ul>
            </div>
            <div class="feature-card feature-card-red">
              <h3>Evaluate with Precision</h3>
              <p>
                Measure and enhance the performance of your models using
                industry-standard metrics.
              </p>
              <ul>
                <li>Accurate Performance Metrics</li>
                <li>Rigorous Validation Techniques</li>
              </ul>
            </div>
            <div class="feature-card feature-card-yellow">
              <h3>Build Predictive Models</h3>
              <p>
                Create cutting-edge predictive models to forecast outcomes and drive
                decisions.
              </p>
              <ul>
                <li>Advanced Model Building</li>
                <li>Optimized Hyperparameter Tuning</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  
      <Dialog v-model:visible="showSignInDialog" header="Sign In"  class="custom-dialog">
        <div class="login-section">
          <input v-model="email" type="email" placeholder="Enter your email" />
          <input v-model="password" type="password" placeholder="Enter your password" />
          <Button @click="signIn" label="Sign In" class="dialog-button" />
          <p v-if="signInError" class="error-message">{{ signInError }}</p>
        </div>
      </Dialog>
  
      <Dialog v-model:visible="showSignUpDialog" header="Sign Up"  class="custom-dialog">
        <div class="login-section">
          <input v-model="email" type="email" placeholder="Enter your email" />
          <input v-model="password" type="password" placeholder="Enter your password" />
          <Button @click="signUp" label="Sign Up" class="dialog-button" />
          <p v-if="signUpError" class="error-message">{{ signUpError }}</p>
        </div>
      </Dialog>
  
      <Dialog v-model:visible="showAddProjectDialog" header="Add Project"  class="custom-dialog">
        <div class="project-section">
          <input v-model="newProjectName" type="text" placeholder="Enter project name" />
          <Button @click="newProject" label="Add Project" class="dialog-button"></Button>
          <p v-if="addProjectError" class="error-message">{{ addProjectError }}</p>
        </div>
      </Dialog>
  
      <div v-if="isAuthenticated" class="projects-section">
        <div class="projects-header">
          <h2>Your Projects</h2>
          <Button @click="showAddProjectDialog = true" label="+ Project" class="secondary-button"></Button>
        </div>
        <table class="projects-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Last Modified</th>
              <th class="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projects" :key="project.name">
              <td @click="selectProject(project)">{{ project.name }}</td>
              <td>{{ project.last_modified }}</td>
              <td class="actions-column">
                <button @click="removeProject(project.name)" class="delete-button">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script>
  import { mapActions, mapGetters } from 'vuex';
  import Dialog from 'primevue/dialog';
  import Button from 'primevue/button';
  
  export default {
    data() {
      return {
        email: '',
        password: '',
        newProjectName: '',
        showSignInDialog: false,
        showSignUpDialog: false,
        showAddProjectDialog: false,
        signInError: '',
        signUpError: '',
        addProjectError: ''
      };
    },
    components: {
      Dialog,
      Button
    },
    computed: {
      ...mapGetters(['isAuthenticated', 'getUser', 'getProjects', 'getCurrentProject']),
      projects() {
        const raw_projects = this.getProjects;
        return raw_projects.map(project => ({
          ...project,
          last_modified: this.formatDate(project.last_modified)
        }));
      },
      ActiveProject() {
        return this.getCurrentProject;
      }
    },
    methods: {
      ...mapActions(['signup', 'login', 'setProject', 'fetchProjects', 'addProject', 'logout', 'deleteProject']),
      async signUp() {
        try {
          await this.signup({ email: this.email, password: this.password });
          this.showSignUpDialog = false;
          this.signUpError = '';
          this.loadProjects();
        } catch (error) {
          this.signUpError = error.message;
        }
      },
      async signIn() {
        try {
          await this.login({ email: this.email, password: this.password });
          this.showSignInDialog = false;
          this.signInError = '';
          this.loadProjects();
        } catch (error) {
          this.signInError = error.message;
        }
      },
      async loadProjects() {
        try {
          await this.fetchProjects();
        } catch (error) {
          console.error(error.message);
        }
      },
      async newProject() {
        if (!this.newProjectName) {
          this.addProjectError = 'Project name cannot be empty';
          return;
        }
        this.addProjectError = '';
        try {
          await this.addProject(this.newProjectName);
          this.showAddProjectDialog = false;
          this.newProjectName = '';
        } catch (error) {
          this.addProjectError = error.message;
        }
      },
      selectProject(project) {
        this.setProject({ id: project.name, name: project.name });
        this.$router.push({ name: 'ProjectPage' });
      },
      async removeProject(projectName) {
        try {
          await this.deleteProject(projectName);
          this.loadProjects();
        } catch (error) {
          console.error(error.message);
        }
      },
      formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleString();
      }
    }
  };
  </script>
  
  <style scoped>
  .home-layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #031525;
    min-height: 100vh;
    padding: 20px;
  }
  
  .header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: #031525;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    margin-bottom: 20px;
  }
  
  .header h1 {
    margin: 0;
    font-size: 2rem;
    color: #007bff;
  }
  
  .header-buttons {
    display: flex;
    gap: 10px;
  }
  
  .header-button:hover {
    background-color: #263c55;
  }
  
  .main-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    text-align: center;
  }
  
  .hero-section {
    padding: 40px;
    width: 50%;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 40px;
  }
  
  .hero-section h2 {
    font-size: 2rem;
    margin-bottom: 20px;
    color: #b2b0b0;
  }
  
  .hero-section p {
    font-size: 1.2rem;
    margin-bottom: 40px;
    color: #ccc;
  }
  
  .hero-buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
  }
  
  .secondary-button {
    padding: 10px 20px;
    background-color: #263c55;
    border: 2px solid #051627;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .secondary-button:hover {
    background-color: #455a72;
  }
  
  .features {
    width: 80%;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 40px;
  }
  
  .features h2 {
    font-size: 2rem;
    margin-bottom: 40px;
    color: #b2b0b0;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  
  .feature-card {
    background-color: #263c55;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: 1px solid #455a72;
    color: #0776f5;
  }
  
  .feature-card h3 {
    margin: 0;
    margin-bottom: 10px;
  }
  
  .feature-card p {
    flex-grow: 1;
    color: #ccc;
  }
  
  .feature-card ul {
    list-style: none;
    padding: 0;
    margin: 0;
    margin-top: 10px;
    color: #ccc;
  }
  
  .feature-card ul li {
    text-align: left;
    padding: 5px 0;
  }
  
  .feature-card:hover {
    transform: translate(0);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  
  .projects-section {
    width: 60%;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-top: 5px;
    color: #c3d1e1;
  }
  
  .projects-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
  }
  
  .projects-table {
    width: 100%;
    background-color: #071a27;
    border-collapse: collapse;
    border: 500px #455a72;
    box-shadow: 0 5px 30px rgba(0, 0, 0, 0.1);
  }
  
  .projects-table th,
  .projects-table td {
    padding: 10px;
    text-align: left;
  }
  
  .projects-table th {
    background-color: #263c55;
    color: white;
  }
  
  .projects-table .actions-column {
    text-align: right;
  }
  
  .projects-table .delete-button {
    padding: 5px 10px;
    background-color: #f90f0f;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: white;
  }
  
  .projects-table .delete-button:hover {
    background-color: #2a0f16;
  }
  
  .login-section {
    width: 50vh;

    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .project-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  input {
    width: calc(100% - 20px);
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  .error-message {
    color: red;
  }

  .custom-dialog{
    color: rgb(204, 204, 37);
    width: 50vh;
  }
  
  /* Custom Dialog Styles */
  .custom-dialog .p-dialog {
    background-color: #263c55;
    color: #0b2e56;
    border: 1px solid #455a72;
    border-radius: 8px;
  }
  
  .custom-dialog .p-dialog-header {
    background-color: #031525;
    color: #007bff;
  }
  
  .custom-dialog .p-dialog-footer .dialog-button {
    background-color: #007bff;
    color: white;
    border: none;
  }
  
  .custom-dialog .p-dialog-footer .dialog-button:hover {
    background-color: #0056b3;
  }
  </style>
  