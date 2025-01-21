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
        <v-card-title class="card-title-center mb-3">แก้ไขรายละเอียดหุ้น</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row>
              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                <v-text-field v-model="formData.stock" @input="setFullText(formData)" label="ชื่อหุ้น" type="text" dense
                  outlined :rules="validateStockRules(formData)" />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-select v-model="formData.set_no" :items="setOptions" :item-text="item => item.text"
                  :item-value="item => item.value" label="ประเภท" dense clearable outlined required>
                  <template v-slot:item="data">
                    <v-icon left>
                      {{ data.item.icon }}
                    </v-icon>
                    {{ data.item.text }}
                  </template>
                </v-select>
              </v-col>

              <v-col cols="5" sm="11" class="pa-0 ml-4" v-if="$auth.user.rank_no === 2 || $auth.user.rank_no === 4">
                <v-text-field v-model="formData.comment" label="หมายเหตุ" dense clearable outlined />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4" v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3">
                <v-text-field v-model="formData.comment" label="หมายเหตุ" dense clearable outlined />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0" v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3">
                <v-autocomplete v-model="formData.staff_no" :items="employees" item-text="name" item-value="no"
                  label="ชื่อผู้ติดตามหุ้น" dense outlined :rules="[(v) => !!v || 'กรุณากรอกชื่อผู้ติดตามหุ้น']"
                  clearable>
                </v-autocomplete>
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
          message: 'มีหุ้นชื่อนี้แล้ว',
        },
      },

      formData: { ...this.data },
      valid: false,
      setOptions: [],
      details: [],
      stocks: [],
      employees: [],
      originalData: {},

    };
  },

  computed: {
    hasChanges() {
      const stockNoHasChanged = this.formData.stock !== this.originalData.stock;
      const setNoHasChanged = this.formData.set_no !== this.originalData.set_no;
      const commentNoHasChanged = this.formData.comment !== this.originalData.comment;
      const staffNoHasChanged = this.formData.staff_no !== this.originalData.staff_no;
      return stockNoHasChanged || setNoHasChanged || commentNoHasChanged || staffNoHasChanged;
    },
  },

  async mounted() {
    await this.fetchDetailData();
    await this.fetchStockData();
    await this.fetchEmployeeData();
  },

  mounted() {
    this.fetchDetailData();
    this.fetchStockData();
    this.setSetOptions();
    this.fetchEmployeeData();
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

    setFullText(formData) {
      formData.stock = formData.stock.toUpperCase();
    },

    validateStockRules(formData) {
      return [
        (v) => !!v || 'กรุณากรอกชื่อหุ้น',
        (v) => {
          if (formData.stock.toLowerCase() === this.originalData.stock.toLowerCase()) {
            return true;
          }
          if (!Array.isArray(this.stocks)) {
            return 'ข้อมูลหุ้นไม่ถูกต้อง';
          }
          const stockExists = this.stocks.some(s => s.stock && s.stock.toLowerCase() === formData.stock.toLowerCase());
          if (stockExists) {
            return 'มีชื่อหุ้นนี้อยู่แล้ว';
          }
          return true;
        },
      ];
    },

    async fetchEmployeeData() {
      try {
        const response = await this.$store.dispatch('api/employee/getEmployee');
        if (response) {
          this.employees = response.map(item => ({ no: item.no, name: item.fname + ' ' + item.lname }));
        }
      } catch (error) {
      }
    },

    async setSetOptions() {
      try {
        this.sets = await this.$store.dispatch('api/set/getSet');

        const setIcons = {
          'SET': 'mdi-numeric-1',
          'SET50': 'mdi-numeric-2',
          'SET100': 'mdi-numeric-3',
          'ETF': 'mdi-numeric-4',
          'MAI': 'mdi-numeric-5',
          'Warrants': 'mdi-numeric-6',
          'DR': 'mdi-numeric-7',
          'Preferred Stock': 'mdi-numeric-8',
        };

        const allTypes = this.sets.map(set => ({
          value: set.no,
          text: set.set,
          icon: setIcons[set.set] || 'mdi-currency-usd'
        }));

        const prioritizedTypes = ['SET', 'SET50', 'SET100', 'ETF', 'MAI', 'Warrants', 'DR', 'Preferred Stock'];
        this.setOptions = prioritizedTypes.reduce((acc, setName) => {
          const set = allTypes.find(r => r.text === setName);
          if (set) acc.push(set);
          return acc;
        }, []).concat(allTypes.filter(r => !prioritizedTypes.includes(r.text)));

        if (this.data && this.data.set_no) {
          const selectedType = this.setOptions.find(r => r.value === this.data.set_no);
          this.setOptions = selectedType
            ? [selectedType, ...this.setOptions.filter(r => r.value !== this.data.set_no)]
            : this.setOptions;
        }
      } catch (warning) {
      }
    },

    getSetName(setId) {
      const set = this.sets.find(s => s.no === setId);
      return set ? set.set : 'ไม่ทราบ';
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
        this.formData.employee_no = this.$auth.user.no;
        const req = await this.$store.dispatch('api/stock/updateStock', this.formData);
        this.modal.complete.open = true;
        this.recordLog();
      } catch (warning) {
        this.modal.warning.open = true;
      }
    },

    async fetchDetailData() {
      this.details = await this.$store.dispatch('api/detail/getDetail');
    },

    async fetchStockData() {
      this.stocks = await this.$store.dispatch('api/stock/getStock');
    },

    getStockNameByNo(stockNo) {
      const stock = this.stocks.find(item => item.no === stockNo);
      return stock ? stock.stock : "ไม่พบข้อมูลหุ้น";
    },

    getStaffNameByNo(No) {
      const staff = this.employees.find(item => item.no === No);
      return staff ? staff.name : "ยังไม่ระบุ";
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
      if (this.formData.stock !== this.originalData.stock) {
        changes.push('ชื่อ : ' + this.formData.stock + '\n');
      }
      const setText = this.getSetName(this.formData.set_no);
      const originalTypeText = this.getSetName(this.originalData.set_no);
      if (setText !== originalTypeText) {
        changes.push('ประเภท : ' + setText + '\n');
      }

      if (this.formData.comment !== this.originalData.comment) {
        changes.push('หมายเหตุ : ' + this.formData.comment + '\n');
      }

      if (this.formData.staff_no !== this.originalData.staff_no) {
        changes.push('ผู้ติดตามหุ้น : ' + this.getStaffNameByNo(this.formData.staff_no) + '\n');
      }
      const log = {
        action: 'หุ้น',
        name: this.originalData.stock,
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
</style>