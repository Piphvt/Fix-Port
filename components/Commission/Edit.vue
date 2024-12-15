<template>

  <div>
    <ModalConfirm :open="modal.confirm.open" :message="modal.confirm.message" :confirm.sync="modal.confirm.open"
      :method="handleConfirmMethod" />
    <ModalComplete :open="modal.complete.open" :message="modal.complete.message" :complete.sync="modal.complete.open"
      :method="goBack" />
    <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />

    <v-dialog persistent :retain-focus="false" v-model="open" v-if="data" max-width="250" max-height="300"
      content-class="rounded-xl">
      <v-card class="rounded-xl">
        <v-card-title class="card-title-center mb-7">แก้ไขค่าธรรมเนียม</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row>
              <v-col cols="12" class="pa-0">
                <v-text-field v-model="formData.commission" :rules="[(v) => !!v || 'โปรดกรอกค่าธรรมเนียม']"
                  label="ค่าธรรมเนียม" outlined required maxlength="12" class="text-center" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="card-title-center pa-0">
          <v-btn @click="confirm" :disabled="!valid || !hasChanges || !formData.commission" depressed color="#24b224"
            class="font-weight-medium mr-2 mb-5">
            บันทึก
          </v-btn>
          <v-btn color="#e50211" @click="cancel" class="font-weight-medium mb-5">ยกเลิก
          </v-btn>
        </v-card-actions>
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
        warning: {
          open: false,
          message: 'มีประเภทหุ้นชื่อนี้แล้ว',
        },
      },

      formData: { ...this.data },
      valid: false,
      originalData: {},

    };
  },

  computed: {
    hasChanges() {
      return JSON.stringify(this.formData) !== JSON.stringify(this.originalData);
    }
  },

  mounted() {
    this.formData = JSON.parse(JSON.stringify(this.data));
    this.originalData = JSON.parse(JSON.stringify(this.data));
    document.addEventListener('keydown', this.handleKeydown);
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

  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {

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
        return;
      }

      await this.updateData();
    },

    async updateData() {
      try {
        this.formData.emp_id = this.$auth.user.no;
        const req = await this.$store.dispatch('api/commission/updateCommission', this.formData);
        this.modal.complete.open = true;
        this.data = { ...this.formData };
        this.recordLogUpdate();
      } catch (warning) {
        this.modal.warning.open = true;
      }
    }
    ,

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

    recordLogUpdate() {
      const changes = [];
      if (this.formData.commission !== this.originalData.commission) {
        changes.push('ชื่อ : ' + this.formData.commission + '\n');
      }
      const log = {
        stock_id: this.originalData.commission,
        emp_name: this.$auth.user.fname + ' ' + this.$auth.user.lname,
        emp_email: this.$auth.user.email,
        detail: changes.join(''),
        type: 2,
        picture: this.$auth.user.picture || 'ไม่รู้จัก',
        action: 'แก้ไขข้อมูลประเภทหุ้น',
        time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      };
      this.$store.dispatch('api/log/addLogs', log);
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
</style>