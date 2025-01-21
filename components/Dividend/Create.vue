<template>
    <v-dialog v-model="isOpen" @close="updateOpen(false)" max-width="400">
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
        <ModalConfirm :open="modal.confirm.open" :confirm.sync="modal.confirm.open" :method="submitForm" />

        <v-card class="custom-card" flat>
            <v-card-title class="d-flex align-center justify-center mb-3">
                <v-icon color="#24b224">mdi-star-plus</v-icon>&nbsp;
                <h3 class="custom-title">เพิ่มเงินปันผล</h3>
            </v-card-title>
            <v-card-text>
                <v-form ref="form" v-model="isFormValid" lazy-validation>
                    <v-row>
                        <v-col cols="5" sm="11" class="pa-0 ml-4">
                            <v-menu ref="datePickerMenu" v-model="datePickerMenu" :close-on-content-click="false"
                                transition="scale-transition" offset-y min-width="auto">
                                <template v-slot:activator="{ on, attrs }">
                                    <v-text-field v-model="selectedDate" label="วันที่" readonly v-bind="attrs"
                                        v-on="on" :rules="[(v) => !!v || 'กรุณาเลือกวันที่']" outlined dense>
                                    </v-text-field>
                                </template>
                                <v-date-picker v-model="selectedDate" @input="datePickerMenu = false"
                                    locale="th"></v-date-picker>
                            </v-menu>
                        </v-col>
                        <v-col cols="6" sm="5" class="pa-0 ml-4 mr-8">
                            <v-autocomplete v-model="stock_no" :items="stocks" item-text="name" item-value="no"
                                label="ชื่อหุ้น" dense outlined :rules="[(v) => !!v || 'กรุณากรอกชื่อหุ้น']" clearable>
                            </v-autocomplete>
                        </v-col>
                        <v-col cols="6" sm="5" class="pa-0">
                            <v-text-field v-model="dividend" :rules="[
                                (v) => !!v || 'โปรดกรอกเงินปันผล',
                                (v) => /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข'
                            ]" label="เงินปันผล" outlined dense required />
                        </v-col>

                    </v-row>
                </v-form>
                <v-card-actions class="card-title-center pa-0">
                    <v-col cols="12" class="text-center pa-0">
                        <v-btn @click="confirm" :disabled="!isFormValid || !selectedDate || !stock_no || !dividend"
                            color="#24b224">
                            ยืนยัน
                        </v-btn>
                        <v-btn @click="cancel" color="#e50211" class="ml-2">
                            ยกเลิก
                        </v-btn>
                    </v-col>
                </v-card-actions>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import moment from 'moment';

export default {
    props: {
        open: {
            type: Boolean,
            required: true,
        },
    },

    async mounted() {
        await this.fetchStockData()
    },

    data() {
        return {
            stock_no: '',
            stocks: [],
            dividend: '',
            isOpen: this.open,
            isFormValid: false,
            selectedDate: '',
            datePickerMenu: false,
            modal: {
                complete: { open: false, message: '' },
                error: { open: false, message: '' },
                confirm: { open: false, message: '' },
            },
        };
    },
    watch: {
        open(newVal) {
            this.isOpen = newVal;
        }
    },

    mounted() {
        this.fetchStockData();
        window.addEventListener('keydown', this.handleKeydown);
    },

    beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeydown);
    },

    methods: {
        async fetchStockData() {
            try {
                const response = await this.$store.dispatch('api/stock/getStock');
                if (response) {
                    this.stocks = response.map(item => ({ no: item.no, name: item.stock }));
                }
            } catch (error) {
                console.error('Error fetching stocks:', error);
            }
        },

        handleKeydown(event) {
            if (event.key === 'Escape') {
                this.cancel();
            }
        },

        updateOpen(val) {
            this.isOpen = val;
            this.$emit('update:open', val);
        },

        goBack() {
            window.location.reload();
        },

        async submitForm() {
            if (this.dividend.trim() === '') {
                this.modal.error.message = 'กรุณากรอกข้อมูลให้ครบถ้วน';
                this.modal.error.open = true;
                return;
            }
            try {
                const employee_no = this.$auth.user.no;
                const updated_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                const response = await this.$store.dispatch('api/dividend/addDividend', {
                    stock_no: this.stock_no,
                    dividend: this.dividend,
                    employee_no,
                    created_date: this.selectedDate,
                    updated_date,
                });

                this.modal.complete.message = 'เพิ่มข้อมูลเรียบร้อย';
                this.modal.complete.open = true;
                this.stock_no = '';
                this.selectedDate = '';
                this.dividend = '';
                this.$emit('update:open', false);
            } catch (error) {
                this.modal.error.message = 'มีบางอย่างผิดพลาด';
                this.modal.error.open = true;
            }
        },

        async confirm() {
            try {
                this.modal.confirm.open = true;
            } catch (error) {
                this.modal.error.open = true;
            }
        },

        cancel() {
            this.dividend = '';
            this.$emit('update:open', false);
        },
    },
};
</script>

<style scoped>
.custom-title {
    font-size: 1rem;
}

.card-title-center {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
}
</style>