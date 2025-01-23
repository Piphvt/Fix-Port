<template>

  <div>
    <ModalConfirmLogout :open="modal.confirmLogout.open" :message="modal.confirmLogout.message"
      @update:confirmLogout="(value) => (modal.confirmLogout.open = value)"
      @update:message="(value) => (modal.confirmLogout.message = value)" :method="sign_out" />
    <EmployeeProfile v-model="EmployeeProfileOpen" />

    <v-app :class="appBackground" :style="appBackgroundStyle">
      <v-app-bar :clipped-left="clipped" fixed app :color="navBarColor" dark>
        <v-toolbar-title class="d-flex align-center" @click="home">
          <v-img :src="`${$config.API_URL}/file/default/logo.png`" max-width="120" contain class="logo-img" />
        </v-toolbar-title>

        <v-menu bottom right :offset-y="true" :nudge-top="8" :nudge-right="8" class="user-menu">
          <template v-slot:activator="{ on, attrs }">
            <v-btn text v-bind="attrs" v-on="on" rounded>
              <v-icon class="icon-host">mdi-account-outline</v-icon>
            </v-btn>
          </template>

          <v-list class="custom-list">
            <v-list-item @click="goToManagement" class="custom-list-item">
              <v-list-item-icon style="margin-right: 5px;">
                <v-icon class="icon-tab">mdi-account</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title style="font-size: 0.8rem;">ลูกค้า</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3" @click="goToEmpManagement"
              class="custom-list-item">
              <v-list-item-icon style="margin-right: 5px;">
                <v-icon class="icon-tab">mdi-home</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title style="font-size: 0.8rem;">สมาชิก</v-list-item-title>
              </v-list-item-content>
              <v-icon v-if="pendingEmployeesCount > 0" class="employee-bell-icon"
                style="margin-left: 6px;">mdi-bell</v-icon>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-menu bottom right :offset-y="true" :nudge-top="8" :nudge-right="8" class="user-menu">
          <template v-slot:activator="{ on, attrs }" v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3 || $auth.user.rank_no === 4">
            <v-btn text v-bind="attrs" v-on="on" rounded>
              <v-icon class="icon-host">mdi-archive-outline</v-icon>
            </v-btn>
          </template>

          <v-list class="custom-list">
            <v-list-item v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3 || $auth.user.rank_no === 4"
              @click="goToStocksManagement" class="custom-list-item">
              <v-list-item-icon style="margin-right: 5px;">
                <v-icon class="icon-tab">mdi-archive</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title style="font-size: 0.8rem;">หุ้น</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3 || $auth.user.rank_no === 4"
              @click="goToStocksFollow" class="custom-list-item">
              <v-list-item-icon style="margin-right: 5px;">
                <v-icon class="icon-tab">mdi-archive-search</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title style="font-size: 0.8rem;">หุ้นที่กำลังเฝ้า</v-list-item-title>
              </v-list-item-content>
              <v-icon v-if="pendingStocksCount > 0" class="small-bell-icon" style="margin-left: 6px;">mdi-bell</v-icon>
            </v-list-item>

            <v-list-item v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3 || $auth.user.rank_no === 4"
              @click="goToImport" class="custom-list-item">
              <v-list-item-icon style="margin-right: 5px;">
                <v-icon class="icon-tab">mdi-file-import</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title style="font-size: 0.8rem;">นำเข้าไฟล์</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

          </v-list>
        </v-menu>

        <v-menu bottom right :offset-y="true" :nudge-top="8" :nudge-right="8" class="user-menu">
          <template v-slot:activator="{ on, attrs }">
            <v-btn text v-bind="attrs" v-on="on" rounded>
              <v-icon class="icon-host">mdi-cash</v-icon>
            </v-btn>
          </template>

          <v-list class="custom-list">
            <v-list-item @click="goToStockDetail" class="custom-list-item">
              <v-list-item-icon style="margin-right: 5px;">
                <v-icon class="icon-tab">mdi-wallet</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title style="font-size: 0.8rem;">หุ้นของลูกค้า</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item @click="goToStockTrade" class="custom-list-item">
              <v-list-item-icon style="margin-right: 5px;">
                <v-icon class="icon-tab">mdi-cash</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title style="font-size: 0.8rem;">การซื้อขายหุ้นของลูกค้า</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item v-if="$auth.user.rank_no === 2" @click="goToImport" class="custom-list-item">
              <v-list-item-icon style="margin-right: 5px;">
                <v-icon class="icon-tab">mdi-file-import</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title style="font-size: 0.8rem;">นำเข้าไฟล์</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-menu bottom right :offset-y="true" :nudge-top="8" :nudge-right="8" class="user-menu">
          <template v-slot:activator="{ on, attrs }">
            <v-btn text v-bind="attrs" v-on="on" rounded>
              <v-icon class="icon-host">mdi-history</v-icon>
            </v-btn>
          </template>

          <v-list class="custom-list">
            <v-list-item @click="goToDeleteHist" class="custom-list-item">
              <v-list-item-icon style="margin-right: 5px;">
                <v-icon class="icon-tab">mdi-delete-clock</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title style="font-size: 0.8rem;">ประวัติข้อมูลที่ลบ</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item @click="goToEditHist" class="custom-list-item">
              <v-list-item-icon style="margin-right: 5px;">
                <v-icon class="icon-tab">mdi-invoice-clock</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title style="font-size: 0.8rem;">ประวัติข้อมูลที่แก้ไข</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3" @click="goToEmpsHist"
              class="custom-list-item">
              <v-list-item-icon style="margin-right: 5px;">
                <v-icon class="icon-tab">mdi-home-clock</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title style="font-size: 0.8rem;">ประวัติสมาชิก</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
        <div class="d-flex align-center flex-grow-1"></div>

        <div class="d-flex align-center user-section">
          <v-btn @click="toggleTheme" rounded class="theme-toggle-btn">
            <h4>
              <v-icon :class="iconColor">
                {{ $vuetify.theme.dark ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
              </v-icon>
            </h4>
          </v-btn>

          <v-menu bottom right :offset-y="true" :nudge-top="8" :nudge-right="8" class="user-menu" offset-y>
            <template v-slot:activator="{ on, attrs }">
              <v-btn text v-bind="attrs" v-on="on" rounded :class="loginBtnClass">
                <v-icon>mdi-account-circle</v-icon>
              </v-btn>
            </template>

            <v-list class="custom-list">
              <v-card class="profile-card ml-2 mr-2 mt-2 mb-2 non-clickable">
                <v-img :src="profileImage" class="profile-image" @error="onImageError">
                </v-img>
              </v-card>

              <v-list-item @click="EmployeeProfileOpen = true" class="custom-list-item">
                <v-list-item-icon style="margin-right: 5px;">
                  <v-icon class="icon-tab">mdi-card-account-details-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title style="font-size: 0.8rem;">โปรไฟล์</v-list-item-title>
                </v-list-item-content>
              </v-list-item>

              <v-list-item @click="buttonSignOut" class="custom-list-item">
                <v-list-item-icon style="margin-right: 5px;">
                  <v-icon class="icon-tab">mdi-exit-run</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title style="font-size: 0.8rem;">ออกจากระบบ</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-menu>

        </div>
      </v-app-bar>
      <v-main>
        <v-container>
          <nuxt />
        </v-container>
      </v-main>
    </v-app>
  </div>

</template>

<script>

import moment from 'moment';
moment.locale('th');

export default {
  async mounted() {
    await this.fetchEmployeeData();
    await this.fetchPendingEmployeeCount();
    await this.fetchPendingStockCount();
    setInterval(async () => {
      await this.fetchPendingEmployeeCount();
      await this.fetchPendingStockCount();
    }, 15000);
  },

  data() {
    return {
      profileImage: `${this.$config.API_URL}/file/profile/${this.$auth.user.picture}`,
      employees: [],
      pendingEmployeesCount: 0,
      pendingStocksCount: 0,
      clipped: false,
      fixed: false,
      menuActive: false,
      snackbar: false,
      EmployeeText: '',
      StockText: '',
      modal: {
        confirmLogout: {
          open: false,
        },
      },
      EmployeeProfileOpen: false,
    };
  },

  methods: {
    async fetchPendingEmployeeCount() {
      try {
        if (this.isFetching) {
          return;
        }
        this.isFetching = true;
        const response = await this.$store.dispatch('api/employee/getEmployeeByStatus', '2');
        const newCount = response.length;
        if (newCount !== this.pendingEmployeesCount) {
          this.pendingEmployeesCount = newCount;
          this.EmployeeText = `มีคำร้องขอสมัครสมาชิก : ${this.pendingEmployeesCount} คน`;
          this.snackbar = true;
        }
      } catch (error) {
        console.error('Error fetching pending employees:', error);
      } finally {
        this.isFetching = false;
      }
    },

    async fetchPendingStockCount() {
      try {
        if (this.isFetching) {
          return;
        }
        this.isFetching = true;
        const response = await this.$store.dispatch('api/follow/getFollowByResult', '2');
        const newCount = response.length;
        if (newCount !== this.pendingStocksCount) {
          this.pendingStocksCount = newCount;
          this.StockText = `มีหุ้นที่ถึงเป้าแล้ว : ${this.pendingStocksCount} หุ้น`;
          this.snackbar = true;
        }
      } catch (error) {
        console.error('Error fetching pending employees:', error);
      } finally {
        this.isFetching = false;
      }
    },

    onImageError() {
      this.profileImage = `${this.$config.API_URL}/file/default/${this.$auth.user.picture}`;
    },

    toggleTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    },

    home() {
      this.$router.push('/app/home');
    },

    buttonSignOut() {
      this.modal.confirmLogout.open = true;
    },

    sign_out() {
      this.$auth.logout();
      this.recordLog();
    },

    async fetchEmployeeData() {
      this.employees = await this.$store.dispatch('api/employee/getEmployee');
    },

    async recordLog() {
      const Employee_No = this.$auth.user.no;
      const employee = this.employees.find(employee => employee.no === Employee_No);
      const Employee_Name = employee ? employee.fname + ' ' + employee.lname : 'ไม่รู้จัก';
      const Employee_Email = employee ? employee.email : 'ยังไม่ระบุ';
      const Employee_Picture = employee ? employee.picture : 'ยังไม่ระบุ';
      let userLocation = 'ไม่รู้จัก';
      let userIP = 'ไม่รู้จัก';

      try {
        const response = await fetch('https://ipinfo.io/json?token=a29d27593626a2');
        const data = await response.json();
        userLocation = `${data.city}, ${data.region}, ${data.country}`;
        userIP = data.ip;
      } catch (error) {
      }

      const log = {
        action: 'ออกจากระบบ',
        detail: `ที่อยู่ : ${userLocation}\nไอพี : ${userIP}`,
        type: 3,
        employee_name: Employee_Name,
        employee_email: Employee_Email,
        employee_picture: Employee_Picture,
        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      };
      this.$store.dispatch('api/log/addLog', log);
    },

    goToManagement() {
      this.$router.push('/app/data/customer');
    },

    goToEmpManagement() {
      this.$router.push('/app/data/employee');
    },

    goToDeleteHist() {
      this.$router.push('/app/history/delete');
    },

    goToEditHist() {
      this.$router.push('/app/history/edit');
    },

    goToEmpsHist() {
      this.$router.push('/app/history/employee');
    },

    goToStocksManagement() {
      this.$router.push('/app/data/stock');
    },

    goToStocksFollow() {
      this.$router.push('/app/data/follow');
    },

    goToImport() {
      this.$router.push('/app/import');
    },


    goToStockDetail() {
      this.$router.push('/app/data/detail');
    },

    goToStockTrade() {
      this.$router.push('/app/data/transaction');
    },

  },

  computed: {
    iconColor() {
      return this.$vuetify.theme.dark ? 'night-icon' : 'day-icon';
    },

    loginBtnClass() {
      return this.$vuetify.theme.dark ? 'login-btn-night' : 'login-btn-day';
    },

    navBarColor() {
      return this.$vuetify.theme.dark ? '#545454' : '#fff6ea';
    },

    appBackground() {
      const backgroundUrl = `${this.$config.API_URL}/file/default/background.png`;
      return this.$vuetify.theme.dark
        ? `background-dark`
        : `background-light custom-background`;
    },

    appBackgroundStyle() {
      return {
        backgroundImage: `url(${this.$config.API_URL}/file/default/background.png)`,
      };
    },
  }
};

</script>

<style scoped>
.logo-img {
  cursor: pointer;
}

.theme-toggle-btn {
  background-color: #000000 !important;
  margin-right: 8px;
}

.day-icon {
  color: #ffc800 !important;
}

.night-icon {
  color: #85d7df !important;
}

.login-btn-night {
  background-color: #000000 !important;
  color: #85d7df !important;
}

.login-btn-day {
  background-color: #000000 !important;
  color: #ffc800 !important;
}

.background-dark {
  background-color: #545454 !important;
  background-size: 45% !important;
  background-position: center;
  background-repeat: no-repeat;
}

.background-light {
  background-color: #fff6ea !important;
  background-size: 45% !important;
  background-position: center;
  background-repeat: no-repeat;
}

.user-section {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.v-app-bar .user-section {
  margin-left: auto;
}

.icon-tab {
  font-size: 120% !important;
}

.icon-host {
  font-size: 220% !important;
}

.background-dark .icon-host {
  color: #ffffff !important;
}

.background-light .icon-host {
  color: #000000 !important;
}

.background-dark .icon-tab {
  color: #000000 !important;
}

.background-light .icon-tab {
  color: #ffffff !important;
}

.custom-list {
  padding: 0.4px 2px;
  background-color: #ffffff;
}

.custom-list-item {
  padding: 0.1px 8px;
  color: #000000;
}

.background-dark .custom-list {
  background-color: #ffffff !important;
}

.background-dark .custom-list-item {
  color: #000000 !important;
}

.background-light .custom-list {
  background-color: #000000 !important;
}

.background-light .custom-list-item {
  color: #ffffff !important;
}

.profile-card {
  width: 120px;
  height: 120px;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.non-clickable {
  pointer-events: none;
}

@keyframes shake {
  0% {
    transform: rotate(0deg);
  }

  25% {
    transform: rotate(-10deg);
  }

  50% {
    transform: rotate(10deg);
  }

  75% {
    transform: rotate(-10deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

.employee-bell-icon {
  font-size: 0.8rem;
  vertical-align: middle;
  color: #ffc800;
  animation: shake 0.8s ease infinite;
}

.small-bell-icon {
  font-size: 0.8rem;
  vertical-align: middle;
  color: #ffc800;
  animation: shake 0.8s ease infinite;
}

.v-snackbar {
  top: 50% !important;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
}

.snackbar-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  width: 100%;
}
</style>