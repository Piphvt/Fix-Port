<template>

  <div>
    <ModalConfirm :open="modal.confirm.open" :message="modal.confirm.message" :confirm.sync="modal.confirm.open"
      :method="handleConfirmMethod" />
    <ModalComplete :open="modal.complete.open" :message="modal.complete.message" :complete.sync="modal.complete.open"
      :method="goBack" />
    <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />

    <v-dialog persistent :retain-focus="false" v-model="open" v-if="data" max-width="400" max-height="300"
      content-class="rounded-xl">
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-center mb-3">
          <v-icon color="#ffc800" size="30">mdi-account-edit</v-icon>&nbsp;
          <span class="custom-title">แก้ไข</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row>
              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                <v-text-field v-model="formData.id" @input="setFullId(formData)" label="ไอดีลูกค้า" type="text" dense
                  outlined prepend="AQT" maxlength="12" :rules="validateStockRules(formData)" />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-text-field v-model="formData.nickname"
                  :rules="[(v) => !!v || 'โปรดกรอกชื่อเล่นลูกค้า', (v) => /^[\u0E00-\u0E7F]+$/.test(v) || 'ต้องเป็นภาษาไทยเท่านั้น']"
                  label="ชื่อเล่น" dense outlined required />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4  ">
                <v-select v-model="formData.type_no" :items="typeOptions" :item-text="item => item.text"
                  :item-value="item => item.value" :rules="[(v) => !!v || 'โปรดเลือกประเภท']" label="ประเภท" dense
                  outlined required>
                  <template v-slot:item="data">
                    <v-icon left>
                      {{ data.item.icon }}
                    </v-icon>
                    {{ data.item.text }}
                  </template>
                </v-select>
              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-select v-model="formData.base_no" :items="baseOptions" :item-text="item => item.text"
                  :item-value="item => item.value" :rules="[(v) => !!v || 'โปรดเลือกฐานทุน']" label="ฐานทุน" dense
                  outlined required>
                  <template v-slot:item="data">
                    <v-icon left>
                      {{ data.item.icon }}
                    </v-icon>
                    {{ data.item.text }}
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </v-form>
          <v-card-actions class="card-title-center pa-0">
            <v-btn @click="confirm" :disabled="!valid || !hasChanges" depressed color="#24b224"
              class="font-weight-medium mr-2">
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
          message: 'มีลูกค้าไอดีนี้แล้ว',
        },
      },

      formData: { ...this.data },
      valid: false,
      customers: [],
      typeOptions: [],
      baseOptions: [],
      originalData: {},

    };
  },

  computed: {
    hasChanges() {
      return JSON.stringify(this.formData) !== JSON.stringify(this.originalData);
    }
  },

  mounted() {
    this.fetchCustomerData();
    this.setTypeOptions();
    this.setBaseOptions();
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
    validateStockRules(formData) {
      return [
        (v) => !!v || 'กรุณากรอกรหัสสมาชิก',
        (v) => /^(AQT)?\d{9}$/i.test(v) || 'กรุณากรอกรหัสสมาชิกในรูปแบบที่ถูกต้อง',
        (v) => {
          if (formData.id.toLowerCase() === this.originalData.id.toLowerCase()) {
            return true;
          }
          if (!Array.isArray(this.customers)) {
            return 'ข้อมูลสมาชิกไม่ถูกต้อง';
          }
          const stockExists = this.customers.some(c => c.id && c.id.toLowerCase() === formData.id.toLowerCase());
          if (stockExists) {
            return 'มีรหัสสมาชิกนี้อยู่แล้ว';
          }
          return true;
        },
      ];
    },

    async fetchCustomerData() {
      try {
        const response = await this.$store.dispatch('api/customer/getCustomer');
        if (response) {
          this.customers = response
            .map((item) => ({
              no: item.no,
              id: item.id ? item.id.trim().toLowerCase() : null,
            }))
            .filter((customer) => customer.id);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    },

    setFullId(formData) {
      const prefix = 'AQT';
      if (!formData.id.toUpperCase().startsWith(prefix)) {
        formData.id = prefix + formData.id;
      } else {
        formData.id = formData.id.toUpperCase();
      }
    },

    async setBaseOptions() {
      try {
        this.bases = await this.$store.dispatch('api/base/getBase');

        const baseIcons = {
          'มีเงิน': 'mdi-cash-100',
          'รอจังหวะ': 'mdi-timer-sand',
          'รอคุย': 'mdi-phone-in-talk',
        };

        const allBases = this.bases.map(base => ({
          value: base.no,
          text: base.base,
          icon: baseIcons[base.base] || 'mdi-cash'
        }));

        const prioritizedBases = ['มีเงิน', 'รอจังหวะ', 'รอคุย'];
        this.baseOptions = prioritizedBases.reduce((acc, baseName) => {
          const base = allBases.find(r => r.text === baseName);
          if (base) acc.push(base);
          return acc;
        }, []).concat(allBases.filter(r => !prioritizedBases.includes(r.text)));

        if (this.data && this.data.base_no) {
          const selectedBase = this.baseOptions.find(r => r.value === this.data.base_no);
          this.baseOptions = selectedBase
            ? [selectedBase, ...this.baseOptions.filter(r => r.value !== this.data.base_no)]
            : this.baseOptions;
        }
      } catch (warning) {
      }
    },

    async setTypeOptions() {
      try {
        this.types = await this.$store.dispatch('api/type/getType');

        const typeIcons = {
          'เทรดเอง': 'mdi-account-tie-hat',
          'เทรดตามโค้ช': 'mdi-account-cowboy-hat',
        };

        const allTypes = this.types.map(type => ({
          value: type.no,
          text: type.type,
          icon: typeIcons[type.type] || 'mdi-cash'
        }));

        const prioritizedTypes = ['เทรดเอง', 'เทรดตามโค้ช'];
        this.typeOptions = prioritizedTypes.reduce((acc, typeName) => {
          const type = allTypes.find(r => r.text === typeName);
          if (type) acc.push(type);
          return acc;
        }, []).concat(allTypes.filter(r => !prioritizedTypes.includes(r.text)));

        if (this.data && this.data.type_no) {
          const selectedType = this.typeOptions.find(r => r.value === this.data.type_no);
          this.typeOptions = selectedType
            ? [selectedType, ...this.typeOptions.filter(r => r.value !== this.data.type_no)]
            : this.typeOptions;
        }
      } catch (warning) {
      }
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
        return;
      }

      await this.updateData();
    },

    async updateData() {
      try {
        this.formData.emp_id = this.$auth.user.no;
        const req = await this.$store.dispatch('api/customer/updateCustomer', this.formData);
        this.modal.complete.open = true;
        this.recordLog();
      } catch (warning) {
        this.modal.warning.open = true;
      }
    },

    getTypeName(typeId) {
      const type = this.types.find(t => t.no === typeId);
      return type ? type.type : 'ไม่ทราบ';
    },

    getBaseName(baseId) {
      const base = this.bases.find(b => b.no === baseId);
      return base ? base.base : 'ไม่ทราบ';
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
      if (this.formData.id !== this.originalData.id) {
        changes.push('รหัสสมาชิก จาก : ' + this.originalData.id + ' เป็น : ' + this.formData.id + '\n');
      }
      if (this.formData.nickname !== this.originalData.nickname) {
        changes.push('ชื่อเล่น จาก : ' + this.originalData.nickname + ' เป็น : ' + this.formData.nickname + '\n');
      }

      const typeText = this.getTypeName(this.formData.type_no);
      const originalTypeText = this.getTypeName(this.originalData.type_no);
      if (typeText !== originalTypeText) {
        changes.push('ประเภท จาก : ' + originalTypeText + ' เป็น : ' + typeText + '\n');
      }

      const baseText = this.getBaseName(this.formData.base_no);
      const originalBaseText = this.getBaseName(this.originalData.base_no);
      if (baseText !== originalBaseText) {
        changes.push('ฐานทุน จาก : ' + originalBaseText + ' เป็น : ' + baseText + '\n');
      }

      const log = {
        action: 'ลูกค้า',
        name: this.originalData.id,
        detail: changes.join(''),
        type: 2,
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
