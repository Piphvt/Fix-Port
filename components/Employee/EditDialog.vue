<template>

  <div>
    <ModalConfirm :open="modal.confirm.open" :message="modal.confirm.message" :confirm.sync="modal.confirm.open"
      :method="handleConfirmMethod" />
    <ModalComplete :open="modal.complete.open" :message="modal.complete.message" :complete.sync="modal.complete.open"
      :method="goBack" />
    <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />

    <v-dialog persistent :retain-focus="false" v-model="open" v-if="data" max-width="400" max-height="300"
      content-class="rounded-xl">
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-center mb-3">
          <v-icon color="#ffc800" size="30">mdi-account-edit</v-icon>&nbsp;
          <span class="custom-title">แก้ไขข้อมูลส่วนตัว</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row>
              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                <v-text-field v-model="formData.fname" :rules="[
                  (v) => !!v || 'โปรดกรอกชื่อเล่น',
                  (v) => /^[\u0E00-\u0E7F]+$/.test(v) || 'ชื่อเล่นต้องเป็นภาษาไทยเท่านั้น'
                ]" label="ชื่อเล่น" dense outlined required />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-text-field v-model="formData.lname" :rules="[
                  (v) => !!v || 'โปรดกรอกชื่อ',
                  (v) => /^[\u0E00-\u0E7F]+$/.test(v) || 'ชื่อต้องเป็นภาษาไทยเท่านั้น'
                ]" label="ชื่อ" dense outlined required />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                <v-text-field v-model="formData.phone" :rules="[
                  (v) => !!v || 'โปรดกรอกเบอร์โทรศัพท์',
                  (v) => (v && v.length === 10) || 'เบอร์โทรศัพท์ต้องมี 10 หลัก',
                  (v) => /^0/.test(v) || 'เบอร์โทรศัพท์ต้องมี 10 หลัก'
                ]" label="เบอร์โทรศัพท์" dense outlined required />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-select v-model="formData.gender" :items="genderOptions" :item-text="item => item.text"
                  :item-value="item => item.value" :rules="[(v) => !!v || 'โปรดเลือกเพศ']" label="เพศ" dense outlined
                  required>
                  <template v-slot:item="data">
                    <v-icon left>
                      {{ data.item.icon }}
                    </v-icon>
                    {{ data.item.text }}
                  </template>
                </v-select>
              </v-col>

              <v-col cols="5" sm="11" class="pa-0 ml-4" v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3">
                <v-text-field v-model="formData.email" label="อีเมล" type="text" dense outlined
                  :rules="validateUserRules(formData)" />
              </v-col>
            </v-row>
          </v-form>
          <v-card-actions class="card-title-center pa-0">
            <v-btn @click="confirm"
              :disabled="!valid || !hasChanges"
              depressed color="#24b224" class="font-weight-medium mr-2">
              บันทึก
            </v-btn>
            <v-btn color="#e50211" @click="cancel" class="font-weight-medium">ยกเลิก
            </v-btn>
          </v-card-actions>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>

</template>

<script>

import moment from 'moment';
moment.locale('th');

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

  computed: {
    hasChanges() {
      return JSON.stringify(this.formData) !== JSON.stringify(this.originalData);
    }
  },

  watch: {
    data: {
      handler(newData) {
        this.formData = JSON.parse(JSON.stringify(newData));
        this.originalData = JSON.parse(JSON.stringify(newData));
      },
      deep: true,
      immediate: true
    }
  },

  data() {
    return {

      modal: {
        confirm: {
          open: false,
          message: 'ยืนยันการแก้ไขข้อมูล?',
        },
        complete: {
          open: false,
          message: 'แก้ไขข้อมูลสำเร็จ',
        },
        error: {
          open: false,
          message: 'โปรดกรอกข้อมูลให้ครบถ้วน',
        },
      },

      valid: false,
      genderOptions: [],
      originalData: {},
      formData: {},
      employees: []

    }
  },

  mounted() {
    this.setGenderOptions();
    this.fetchEmployeeData();
    this.formData = JSON.parse(JSON.stringify(this.data));
    this.originalData = JSON.parse(JSON.stringify(this.data));
    document.addEventListener('keydown', this.handleKeydown);
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    async fetchEmployeeData() {
      try {
        const response = await this.$store.dispatch('api/employee/getEmployee');
        if (response) {
          this.employees = response.map(item => ({ no: item.no, email: item.email }));
        }
      } catch (error) {
      }
    },

    validateUserRules(formData) {
      return [
        (v) => !!v || 'โปรดกรอกอีเมล',
        (v) => /.+@.+\..+/.test(v) || 'โปรดกรอกอีเมลที่ถูกต้อง',
        (v) => {
          if (formData.email.toLowerCase() === this.originalData.email.toLowerCase()) {
            return true;
          }
          if (!Array.isArray(this.employees)) {
            return 'ข้อมูลสมาชิกไม่ถูกต้อง';
          }
          const stockExists = this.employees.some(e => e.email && e.email.toLowerCase() === formData.email.toLowerCase());
          if (stockExists) {
            return 'มีอีเมลนี้อยู่แล้ว';
          }
          return true;
        },
      ];
    },

    async confirm() {
      this.modal.confirm.open = true;
      await new Promise((resolve) => {
        this.$watch('modal.confirm.open', (newValue) => {
          if (!newValue) {
            resolve();
          }
        });
      });
      if (!this.modal.confirm.open) {
      }
    },

    async updateData() {
      try {
        const req = await this.$store.dispatch('api/employee/updateEmployee', this.formData);
        this.recordLog();
        this.modal.complete.open = true;
      } catch (error) {
        this.modal.error.open = true;
      }
    },

    setGenderOptions() {
      const allGenders = [
        { text: 'ชาย', value: 'ชาย', icon: 'mdi-face-man' },
        { text: 'หญิง', value: 'หญิง', icon: 'mdi-face-woman' },
        { text: 'ไม่ระบุ', value: 'ไม่ระบุ', icon: 'mdi-not-equal-variant' }
      ];

      if (this.data && this.data.gender) {
        this.genderOptions = [
          { text: this.data.gender, value: this.data.gender, icon: this.getGenderIcon(this.data.gender) },
          ...allGenders.filter(g => g.value !== this.data.gender)
        ];
      } else {
        this.genderOptions = allGenders;
      }
    },

    getGenderIcon(gender) {
      switch (gender) {
        case 'ชาย':
          return 'mdi-face-man';
        case 'หญิง':
          return 'mdi-face-woman';
        case 'ไม่ระบุ':
          return 'mdi-not-equal-variant';
        default:
          return '';
      }
    },

    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.cancel();
      }
    },

    cancel() {
      this.modal.confirm.open = false;
      this.$emit('update:edit', false);
    },

    goBack() {
      window.location.reload();
    },

    handleConfirmMethod() {
      this.modal.confirm.open = false;
      this.updateData();
    },

    recordLog() {
      const Employee_Name = this.$auth.user.fname + ' ' + this.$auth.user.lname;
      const Employee_Email = this.$auth.user.email;
      const Employee_Picture = this.$auth.user.picture;
      const changes = [];
      if (this.formData.fname !== this.originalData.fname) {
        changes.push('ชื่อเล่น จาก : ' + this.originalData.fname + ' เป็น : ' + this.formData.fname + '\n');
      }
      if (this.formData.lname !== this.originalData.lname) {
        changes.push('ชื่อ จาก : ' + this.originalData.lname + ' เป็น : ' + this.formData.lname + '\n');
      }
      if (this.formData.phone !== this.originalData.phone) {
        changes.push('เบอร์โทรศัพท์ จาก : ' + this.originalData.phone + ' เป็น : ' + this.formData.phone + '\n');
      }
      if (this.formData.gender !== this.originalData.gender) {
        changes.push('เพศ จาก : ' + this.originalData.gender + ' เป็น : ' + this.formData.gender + '\n');
      }
      if (this.formData.email !== this.originalData.email) {
        changes.push('อีเมล จาก : ' + this.originalData.email + ' เป็น : ' + this.formData.email + '\n');
      }

      const log = {
        action: 'แก้ไขข้อมูลส่วนตัว',
        edit_no: this.originalData.no,
        detail: changes.join(''),
        type: 4,
        employee_name: Employee_Name,
        employee_email: Employee_Email,
        employee_picture: Employee_Picture,
        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      }
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

.file-input {
  margin-bottom: 0px !important;
}

.v-card-actions {
  padding: 0 !important;
}

.v-btn {
  margin-top: 0px !important;
}

.v-card-title .custom-title {
  font-size: 1.5rem !important;
}
</style>
