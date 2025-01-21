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
        <v-card-title class="card-title-center mb-7">แก้ไขรายละเอียดหุ้นของลูกค้า</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row>

              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                <v-autocomplete v-model="formData.customer_no" :items="customers" :item-text="item => item.text"
                  :item-value="item => item.value" :rules="[(v) => !!v || 'โปรดกรอกรหัสสมาชิก']" label="รหัสสมาชิก"
                  dense outlined clearable solo hide-no-data hide-details />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-menu ref="menu" v-model="menu" :close-on-content-click="false" :nudge-right="40"
                  :return-value.sync="formData.created_date" transition="scale-transition" offset-y min-width="290px">
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field v-model="formattedCreatedDate" label="วันที่ซื้อหุ้น" dense outlined readonly
                      v-bind="attrs" v-on="on" :rules="[(v) => !!v || 'โปรดเลือกวันที่']"></v-text-field>
                  </template>
                  <v-date-picker v-model="formData.created_date" no-title scrollable @input="onDateSelected"
                    @change="onDateChange" :locale="'th'" :first-day-of-week="1" />
                </v-menu>
              </v-col>

              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                <v-autocomplete v-model="formData.stock_no" :items="stocks" :item-text="item => item.text"
                  :item-value="item => item.value" :rules="[(v) => !!v || 'โปรดกรอกชื่อหุ้น']" label="ชื่อหุ้น" dense
                  outlined clearable solo hide-no-data hide-details />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-select v-model="formData.from_no" :items="fromOptions" :item-text="item => item.text"
                  :item-value="item => item.value" :rules="[(v) => !!v || 'โปรดเลือกที่มาที่ไป']" label="ที่มาที่ไป"
                  dense outlined required>
                  <template v-slot:item="data">
                    <v-icon left>
                      {{ data.item.icon }}
                    </v-icon>
                    {{ data.item.text }}
                  </template>
                </v-select>
              </v-col>

              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                <v-text-field v-model="formData.detailprice" :rules="[
                  (v) => !!v || 'โปรดกรอกราคา',
                  (v) => /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข'
                ]" label="ราคา" dense outlined required />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-text-field v-model="formData.detailamount" :rules="[
                  (v) => !!v || 'โปรดกรอกจำนวน',
                  (v) => /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข'
                ]" label="จำนวน" dense outlined required />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="card-title-center pa-0">
          <v-btn @click="confirm" :disabled="!valid || !hasChanges" depressed color="#24b224"
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
import Decimal from 'decimal.js';

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

      menu: false,

      formData: {},
      valid: false,
      fromOptions: [],
      originalData: {},
      customers: [],
      stocks: [],
      employees: [],

      initialCreatedDate: '',

    };
  },

  computed: {
    hasChanges() {
      const dateHasChanged = !moment(this.formData.created_date).isSame(this.formattedCreatedDate, 'day');
      const customerNoHasChanged = this.formData.customer_no !== this.originalData.customer_no;
      const stockNoHasChanged = this.formData.stock_no !== this.originalData.stock_no;
      const fromNoHasChanged = this.formData.from_no !== this.originalData.from_no;
      const priceHasChanged = parseFloat(this.formData.detailprice).toFixed(2) !== parseFloat(this.originalData.detailprice).toFixed(2);
      const amountHasChanged = parseFloat(this.formData.detailamount).toFixed(2) !== parseFloat(this.originalData.detailamount).toFixed(2);
      return dateHasChanged || customerNoHasChanged || fromNoHasChanged || stockNoHasChanged || priceHasChanged || amountHasChanged;
    }
  },

  async mounted() {
    await this.fetchStockData();
    await this.fetchEmployeeData();
  },

  mounted() {
    this.fetchEmployeeData();
    this.fetchCustomerData();
    this.fetchStockData();
    this.setFromOptions();

    this.formData = JSON.parse(JSON.stringify(this.data));
    this.originalData = JSON.parse(JSON.stringify(this.data));
    this.initialCreatedDate = this.originalData.created_date;
    if (moment(this.formData.created_date).isValid()) {
      this.formattedCreatedDate = moment(this.formData.created_date).format('YYYY-MM-DD');
    } else {
      this.formattedCreatedDate = '';
    }
    document.addEventListener('keydown', this.handleKeydown);
  },

  watch: {
    data: {
      handler(newData) {
        this.formData = JSON.parse(JSON.stringify(newData));
        this.originalData = JSON.parse(JSON.stringify(newData));
        if (moment(this.formData.created_date).isValid()) {
          this.formattedCreatedDate = moment(this.formData.created_date).format('YYYY-MM-DD');
        } else {
          this.formattedCreatedDate = '';
        }
      },
      deep: true,
      immediate: true
    },
    formData: {
      handler(newFormData) {
        if (newFormData.stock_no) {
          this.fetchStockData();
        }
      },
      deep: true,
    }
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    onDateSelected(date) {
      if (moment(date).isValid()) {
        this.formData.created_date = moment(date).toDate();
        this.formattedCreatedDate = moment(date).format('YYYY-MM-DD');
        
      } else {
        this.formData.created_date = null;
        this.formattedCreatedDate = '';
      }
      this.menu = false;
    },

    onDateChange(date) {
      if (moment(date).isValid()) {
        this.formData.created_date = moment(date).toDate();
        this.formattedCreatedDate = moment(date).format('YYYY-MM-DD');
      } else {
        this.formData.created_date = null;
        this.formattedCreatedDate = '';
      }
      this.menu = false;
    },

    async fetchCustomerData() {
      try {
        this.customers = await this.$store.dispatch('api/customer/getCustomer');
        this.customers = this.customers.map(customer => ({
          value: customer.no,
          text: customer.id,
        }));

        if (this.data && this.data.customer_no) {
          const selectedType = this.customers.find(r => r.value === this.data.customer_no);
          this.customers = selectedType
            ? [selectedType, ...this.customers.filter(r => r.value !== this.data.customer_no)]
            : this.customers;
        }
      } catch (warning) {
        console.error(warning);
      }
    },

    async fetchStockData() {
      try {
        const fetchedStocks = await this.$store.dispatch('api/stock/getStock');
        this.stocks = fetchedStocks.map(stock => ({
          value: stock.no,
          text: stock.stock,
        }));

        if (this.formData && this.formData.stock_no) {
          const selectedType = this.stocks.find(r => r.value === this.formData.stock_no);
          this.stocks = selectedType
            ? [selectedType, ...this.stocks.filter(r => r.value !== this.formData.stock_no)]
            : this.stocks;
        }
      } catch (warning) {
        console.error(warning);
      }
    },

    async setFromOptions() {
      try {
        this.froms = await this.$store.dispatch('api/from/getFrom');

        const fromIcons = {
          'หุ้นเก่า': 'mdi-numeric-1',
          'หุ้นใหม่': 'mdi-numeric-2',
          'หุ้นแก้เกม': 'mdi-numeric-3',
        };

        const allTypes = this.froms.map(from => ({
          value: from.no,
          text: from.from,
          icon: fromIcons[from.from] || 'mdi-currency-usd'
        }));

        const prioritizedTypes = ['หุ้นเก่า', 'หุ้นใหม่', 'หุ้นแก้เกม'];
        this.fromOptions = prioritizedTypes.reduce((acc, fromName) => {
          const from = allTypes.find(r => r.text === fromName);
          if (from) acc.push(from);
          return acc;
        }, []).concat(allTypes.filter(r => !prioritizedTypes.includes(r.text)));

        if (this.data && this.data.from_no) {
          const selectedType = this.fromOptions.find(r => r.value === this.data.from_no);
          this.fromOptions = selectedType
            ? [selectedType, ...this.fromOptions.filter(r => r.value !== this.data.from_no)]
            : this.fromOptions;
        }
      } catch (warning) {
      }
    },

    getFromName(fromId) {
      const from = this.froms.find(f => f.no === fromId);
      return from ? from.from : 'ไม่ทราบ';
    },

    getStockName(stockID) {
      const stock = this.stocks.find(s => s.value === stockID);
      return stock ? stock.text : 'ไม่ทราบ';
    },

    getCustomerID(customerId) {
      const customer = this.customers.find(c => c.value === customerId);
      return customer ? customer.text : 'ไม่ทราบ';
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
        this.formData.created_date = this.formattedCreatedDate
        this.formData.price = this.formData.detailprice
        this.formData.amount = this.formData.detailamount
        const req = await this.$store.dispatch('api/detail/updateDetail', this.formData);
        this.modal.complete.open = true;
        this.recordLog();
      } catch (warning) {
        this.modal.warning.open = true;
        this.modal.warning.message = 'มีบางอย่างผิดปกติ';
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

    async fetchEmployeeData() {
      this.employees = await this.$store.dispatch('api/employee/getEmployee');
    },

    recordLog() {
      const Employee_No = this.$auth.user.no;
      const employee = this.employees.find(employee => employee.no === Employee_No);
      const Employee_Name = employee ? employee.fname + ' ' + employee.lname : 'ไม่รู้จัก';
      const Employee_Email = employee ? employee.email : 'ยังไม่ระบุ';
      const Employee_Picture = employee ? employee.picture : 'ยังไม่ระบุ';
      const changes = [];
      const StockText = this.getStockName(this.formData.stock_no);
      const originalStockText = this.getStockName(this.originalData.stock_no);

      const formattedDate = moment(this.formData.created_date).format('YYYY-MM-DD');
      const originalFormattedDate = moment(this.originalData.created_date).format('YYYY-MM-DD');
      const dateHasChanged = !moment(this.formData.created_date).isSame(this.originalData.created_date, 'day');

      // ตรวจสอบการเปลี่ยนแปลงวันที่
      if (dateHasChanged) {
        changes.push('วันที่ซื้อหุ้น จาก : ' + originalFormattedDate + ' เป็น : ' + formattedDate + '\n');
      }

      // ตรวจสอบการเปลี่ยนแปลงชื่อหุ้น
      if (StockText !== originalStockText) {
        changes.push('ชื่อหุ้น จาก : ' + originalStockText + ' เป็น : ' + StockText + '\n');
      }

      // ตรวจสอบการเปลี่ยนแปลงที่มาที่ไป
      const fromText = this.getFromName(this.formData.from_no);
      const originalfromText = this.getFromName(this.originalData.from_no);
      if (fromText !== originalfromText) {
        changes.push('ที่มาที่ไป จาก : ' + originalfromText + ' เป็น : ' + fromText + '\n');
      }

      // ตรวจสอบการเปลี่ยนแปลงรหัสสมาชิก
      const CustomerText = this.getCustomerID(this.formData.customer_no);
      const originalCustomerText = this.getCustomerID(this.originalData.customer_no);
      if (CustomerText !== originalCustomerText) {
        changes.push('รหัสสมาชิก จาก : ' + originalCustomerText + ' เป็น : ' + CustomerText + '\n');
      }

      // ตรวจสอบการเปลี่ยนแปลงราคา
      if (this.formData.price !== this.originalData.price) {
        changes.push('ราคา จาก : ' + this.originalData.price + ' เป็น : ' + this.formData.price + '\n');
      }

      // ตรวจสอบการเปลี่ยนแปลงจำนวน
      if (this.formData.amount !== this.originalData.amount) {
        changes.push('จำนวน จาก : ' + this.originalData.amount + ' เป็น : ' + this.formData.amount + '\n');
      }

      const log = {
        action: 'หุ้นของลูกค้า',
        name: originalStockText + ' ของ ' + originalCustomerText,
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