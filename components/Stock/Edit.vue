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
                <v-text-field v-model="formData.stock" :rules="[
                  (v) => !!v || 'โปรดกรอกชื่อหุ้น'
                ]" label="ชื่อหุ้น" dense outlined required maxlength="12" />

              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-select v-model="formData.set_no" :items="setOptions" :item-text="item => item.text"
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

              <v-col cols="5" sm="11" class="pa-0 ml-4">
                <v-text-field v-model="formData.comment" label="หมายเหตุ" dense outlined />
              </v-col>
            </v-row>
          </v-form>
          <v-card-actions class="card-title-center pa-0">
            <v-btn @click="confirm" :disabled="!valid || !hasChanges || !formData.stock" depressed color="#24b224"
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
      originalData: {},

    };
  },

  computed: {
    hasChanges() {
      return JSON.stringify(this.formData) !== JSON.stringify(this.originalData);
    }
  },

  async mounted() {
    await this.fetchDetailData();
    await this.fetchStockData();
  },

  mounted() {
    this.fetchDetailData();
    this.fetchStockData();
    this.setSetOptions();
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
        this.formData.emp_id = this.$auth.user.no;
        const req = await this.$store.dispatch('api/stock/updateStock', this.formData);
        this.modal.complete.open = true;
        this.data = { ...this.formData };
        this.recordLogUpdate();
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
      if (this.formData.stock !== this.originalData.stock) {
        changes.push('ชื่อ : ' + this.formData.stock + '\n');
      }
      const setText = this.getSetName(this.formData.set_no);
      const originalTypeText = this.getSetName(this.originalData.set_no);
      if (setText !== originalTypeText) {
        changes.push('ประเภท : ' + setText + '\n');
      }

      if (this.formData.closing_price !== this.originalData.closing_price) {
        changes.push('ราคาปิด : ' + this.formData.closing_price + '\n');
      }

      if (this.formData.dividend_amount !== this.originalData.dividend_amount) {
        changes.push('จำนวนปันผล : ' + this.formData.dividend_amount + '\n');
      }

      if (this.formData.comment !== this.originalData.comment) {
        changes.push('หมายเหตุ : ' + this.formData.comment + '\n');
      }
      const log = {
        stock_id: this.originalData.stock,
        emp_name: this.$auth.user.fname + ' ' + this.$auth.user.lname,
        emp_email: this.$auth.user.email,
        detail: changes.join(''),
        type: 2,
        picture: this.$auth.user.picture || 'ไม่รู้จัก',
        action: 'แก้ไขข้อมูลหุ้น',
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