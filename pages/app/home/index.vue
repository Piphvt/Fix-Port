<template>
    <div>
      <v-container class="fill-height" fluid justify="center" align="center">
        <v-row justify="center">
          <v-col cols="12" sm="10" md="8">
            <v-row>
              <!-- Top-Left Table -->
              <v-col cols="12" sm="6" md="6">
                <v-card>
                  <v-card-title>Top-Left Table</v-card-title>
                  <v-card-text>
                    <v-simple-table>
                      <thead>
                        <tr>
                          <th>Header 1</th>
                          <th>Header 2</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Row 1, Col 1</td>
                          <td>Row 1, Col 2</td>
                        </tr>
                        <tr>
                          <td>Row 2, Col 1</td>
                          <td>Row 2, Col 2</td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                  </v-card-text>
                </v-card>
              </v-col>
  
              <!-- Top-Right Table -->
              <v-col cols="12" sm="6" md="6">
                <v-card>
                  <v-card-title>Top-Right Table</v-card-title>
                  <v-card-text>
                    <v-simple-table>
                      <thead>
                        <tr>
                          <th>Header 1</th>
                          <th>Header 2</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Row 1, Col 1</td>
                          <td>Row 1, Col 2</td>
                        </tr>
                        <tr>
                          <td>Row 2, Col 1</td>
                          <td>Row 2, Col 2</td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
  
            <v-row>
              <!-- Bottom-Left Table -->
              <v-col cols="12" sm="6" md="6">
                <v-card>
                  <v-card-title>Bottom-Left Table</v-card-title>
                  <v-card-text>
                    <v-simple-table>
                      <thead>
                        <tr>
                          <th>Header 1</th>
                          <th>Header 2</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Row 1, Col 1</td>
                          <td>Row 1, Col 2</td>
                        </tr>
                        <tr>
                          <td>Row 2, Col 1</td>
                          <td>Row 2, Col 2</td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                  </v-card-text>
                </v-card>
              </v-col>
  
              <!-- Bottom-Right Table -->
              <v-col cols="12" sm="6" md="6">
                <v-card>
                  <v-card-title>Bottom-Right Table</v-card-title>
                  <v-card-text>
                    <v-simple-table>
                      <thead>
                        <tr>
                          <th>Header 1</th>
                          <th>Header 2</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Row 1, Col 1</td>
                          <td>Row 1, Col 2</td>
                        </tr>
                        <tr>
                          <td>Row 2, Col 1</td>
                          <td>Row 2, Col 2</td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </template>


<script>

export default {

    layout: 'user',
    middleware: 'auth',

    async mounted() {
        await this.checkRank();
        await this.fetchPendingEmployeeCount();
    },

    data() {
        return {
            pendingEmployeesCount: 0,
        };
    },

    methods: {
        async fetchPendingEmployeeCount() {
            try {
                const response = await this.$store.dispatch('api/employee/getEmployeeByStatus', '2');
                this.pendingEmployeesCount = response.length;
            } catch (error) {
                console.error('Error fetching pending employees:', error);
            }
        },

        async checkRank() {
            if (this.$auth.loggedIn) {
                const Status = this.$auth.user.status.toString();
                const RankID = this.$auth.user.rank_no.toString();
                if (Status === '2') {
                    this.$router.push('/');
                    await this.$auth.logout();
                }
                else {
                    if (RankID === '1') {
                        this.$router.push('/app/home');
                    } else if (RankID === '2') {
                        this.$router.push('/app/home');
                    } else if (RankID === '3') {
                        this.$router.push('/app/home');
                    } else {
                        this.$router.push('/auth');
                    }
                }
            } else {
                this.$router.push('/auth');
            }
        },

    }
}

</script>

<style scoped>
@keyframes shake {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
  75% { transform: rotate(-10deg); }
  100% { transform: rotate(0deg); }
}

.small-bell-icon {
  font-size: 1.2rem;
  vertical-align: middle;
  color: #ffc800;
  animation: shake 0.8s ease infinite;
}
</style>
