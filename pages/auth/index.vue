<template>

  <div @keyup.enter="login" class="login-container">
    <ModalComplete :open="modal.complete.open" :message="modal.complete.message" :complete.sync="modal.complete.open" />
    <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
    <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />

    <v-container fluid fill-height class="d-flex align-center justify-center">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="6">
          <v-card>
            <v-card-title style="justify-content: center; display: flex;">
              <span class="headline">ยินดีต้อนรับ</span>
            </v-card-title>
            <v-card-subtitle
              style="justify-content: center; display: flex;">เข้าสู่ระบบด้วยผู้ใช้งานของคุณ</v-card-subtitle>
            <v-card-text>
              <v-text-field v-model="form.email" label="อีเมล" prepend-icon="mdi-email" type="email" outlined dense
                class="small-text-field"></v-text-field>
              <v-text-field v-model="form.password" prepend-icon="mdi-lock" label="รหัสผ่าน"
                :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'" :type="show1 ? 'text' : 'password'"
                @click:append="show1 = !show1" outlined dense class="small-text-field"></v-text-field>

              <v-btn @click="login" :disabled="!form.email || !form.password" color="#24b224" block>
                เข้าสู่ระบบ
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>

</template>

<script>

import moment from 'moment';
moment.locale('th');

export default {

  layout: 'blank',

  async mounted() {
    await this.checkRank();
    await this.fetchEmployeeData();
  },

  watch: {
    open(val) {
      if (val) {
        document.addEventListener('keydown', this.handleKeydown);
      } else {
        document.removeEventListener('keydown', this.handleKeydown);
      }
    },
  },

  data() {
    return {
      modal: {
        complete: {
          open: false,
          message: 'เข้าสู่ระบบสำเร็จ',
        },
        error: {
          open: false,
          message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        },
        warning: {
          open: false,
          message: 'ผู้ใช้นี้ยังไม่ได้รับการอนุมัติ',
        },
      },

      valid: false,
      show1: false,
      show2: false,
      employees: [],

      form: {
        email: '',
        password: '',
      },
    }
  },

  methods: {

    async fetchEmployeeData() {
      this.employees = await this.$store.dispatch('api/employee/getEmployee');
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
          } else if (RankID === '4') {
            this.$router.push('/app/home');
          } else {
            this.$router.push('/auth');
          }
        }
      } else {
        this.$router.push('/auth');
      }
    },

    async login() {
      try {
        await this.$auth.loginWith('local', {
          data: {
            email: this.form.email,
            password: this.form.password,
          }
        });
        if (this.$auth.user.status.toString() !== '2') {
          this.recordLog();
        }
        this.modal.complete.open = true;
      } catch (error) {
        this.modal.error.open = true;
      }
    },

    handleKeydown(e) {
      if (e.key === 'Enter') {
        this.confirm();
      }
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
        action: 'เข้าสู่ระบบ',
        detail: `ที่อยู่ : ${userLocation}\nไอพี : ${userIP}`,
        type: 3,
        employee_name: Employee_Name,
        employee_email: Employee_Email,
        employee_picture: Employee_Picture,
        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      };
      this.$store.dispatch('api/log/addLog', log);
    },
  },
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.v-card {
  max-width: 400px;
  max-height: 600px;
  margin: auto;
}

.forgot-password-text {
  font-size: 0.85rem;
  color: #bf2b2b;
  text-align: left;
  cursor: pointer;
  text-decoration: none;
}

.small-text-field .v-input__control .v-input__slot {
  font-size: 0.75rem;
}

.small-text-field .v-text-field__slot {
  padding: 8px;
}
</style>
