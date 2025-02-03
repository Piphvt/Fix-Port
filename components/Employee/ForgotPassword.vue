<template>

  <div>
    <ModalConfirm :open="modal.confirm.open" :confirm.sync="modal.confirm.open" :method="updateData" />
    <ModalComplete :open="modal.complete.open" :message="modal.complete.message" :complete.sync="modal.complete.open"
      :method="goBack" />
    <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />

    <v-dialog persistent :retain-focus="false" v-model="open" v-if="data" max-width="400" max-height="300"
      content-class="rounded-xl">
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-center mb-3">
          <v-icon color="#24b224" size="30">mdi-sync</v-icon>&nbsp;
          <span class="custom-title">เปลี่ยนรหัสผ่านสมาชิก</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row>
              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                <v-text-field :append-icon="show2 ? 'mdi-eye' : 'mdi-eye-closed'" :type="show2 ? 'text' : 'password'"
                  v-model="data.new_password" :rules="validatePasswordRules()" @click:append="show2 = !show2"
                  label="รหัสผ่านใหม่" dense outlined required>
                  <template v-slot:append>
                    <v-icon tabindex="-1" @click="show2 = !show2">{{ show2 ? 'mdi-eye' : 'mdi-eye-closed' }}</v-icon>
                  </template>
                </v-text-field>
              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-text-field :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-closed'" :type="show1 ? 'text' : 'password'"
                  v-model="data.confirm_password" :rules="[
                    (v) => !!v || 'โปรดยืนยันรหัสผ่านใหม่',
                    (v) => v === data.new_password || 'รหัสผ่านไม่ตรงกัน'
                  ]" @click:append="show1 = !show1" label="ยืนยันรหัสผ่านใหม่" dense outlined required
                  append-icon-props="{ tabindex: '-1' }">
                  <template v-slot:append>
                    <v-icon tabindex="-1" @click="show1 = !show1">{{ show1 ? 'mdi-eye' : 'mdi-eye-closed' }}</v-icon>
                  </template>
                </v-text-field>
              </v-col>
            </v-row>
          </v-form>
          <v-card-actions class="card-title-center pa-0">
            <v-btn color="#24b224" @click="confirm"
              :disabled="!valid || data.new_password === null || data.new_password === undefined || data.confirm_password === null || data.confirm_password === undefined"
              depressed class="font-weight-medium mr-2">
              บันทึก
            </v-btn>
            <v-btn color="#e50211" @click="cancel" class="font-weight-medium">
              ยกเลิก
            </v-btn>
          </v-card-actions>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>

</template>

<script>

import moment from 'moment'
moment.locale('th')

export default {

  props: {
    method: { type: Function },
    open: {
      required: true,
    },
    data: {
      required: true,
    },
  },

  data() {
    return {

      modal: {
        confirm: {
          open: false,
          message: 'ยืนยันการเปลี่ยนรหัสผ่าน?',
        },
        complete: {
          open: false,
          message: 'เปลี่ยนรหัสผ่านสำเร็จ',
        },
        error: {
          open: false,
          message: 'โปรดกรอกข้อมูลให้ครบถ้วน',
        },
      },

      confirm_password: '',
      password: '',
      new_password: '',
      valid: false,
      show1: false,
      show2: false,
      employees: [],

    };
  },
  async mounted() {
    await this.fetchEmployeeData();
    document.addEventListener('keydown', this.handleKeydown);
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    validatePasswordRules() {
      return [
        (v) => !!v || 'โปรดกรอกรหัสผ่านใหม่',
        (v) => (v && v.length >= 8) || 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
      ];
    },

    async confirm() {
      try {
        this.$emit('update:edit', false);
        this.modal.confirm.open = true;
      } catch (error) {
        this.modal.error.open = true;
      }
    },

    async updateData() {
      try {
        if (this.data.new_password !== this.data.confirm_password) {
          this.modal.error.message = 'รหัสผ่านไม่ตรงกัน';
          this.modal.error.open = true;
          return;
        }
        this.data.password = this.data.new_password;

        const req = await this.$store.dispatch('api/employee/updatePassword', this.data);
        this.modal.complete.open = true;
        this.recordLog();
      } catch (error) {
        this.modal.error.message = 'เปลี่ยนรหัสผ่านไม่สำเร็จ';
      }
    },

    async fetchEmployeeData() {
      this.employees = await this.$store.dispatch('api/employee/getEmployee');
    },

    cancel() {
      this.$emit('update:edit', false);
    },

    goBack() {
      window.location.reload();
    },

    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.cancel();
      }
    },

    recordLog() {
      const Employee_Name = this.$auth.user.fname + ' ' + this.$auth.user.lname;
      const Employee_Email = this.$auth.user.email;
      const Employee_Picture = this.$auth.user.picture;
      const log = {
        action: 'เปลี่ยนรหัสผ่านสมาชิก',
        edit_no: this.data.no,
        detail: 'รหัสผ่าน : ' + this.data.new_password,
        type: 4,
        employee_name: Employee_Name,
        employee_email: Employee_Email,
        employee_picture: Employee_Picture,
        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      };
      this.$store.dispatch('api/log/addLog', log);
    },
  },
};

</script>

<style scoped>
.card-title-center {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.v-card-title .custom-title {
  font-size: 1.5rem !important;
}
</style>