<template>
    <v-dialog v-model="isOpen" @close="updateOpen(false)" max-width="300px">
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
        <ModalConfirm :open="modal.confirm.open" :confirm.sync="modal.confirm.open" :method="submitForm" />

        <v-card flat>
            <v-card-title class="d-flex align-center justify-center mb-3">
                <v-icon color="#24b224" size="30">mdi-credit-card-plus</v-icon>&nbsp;
                <h3 class="custom-title">เพิ่มค่าธรรมเนียม</h3>
            </v-card-title>

            <v-card-text>
                <v-form ref="form" v-model="isFormValid" lazy-validation>
                    <v-row>
                        <v-col cols="5" sm="11" class="pa-0 ml-3">
                            <v-text-field v-model="commission" label="ค่าธรรมเนียม" type="text" dense outlined
                                :rules="validateStockRules(commission)" />
                        </v-col>
                    </v-row>
                </v-form>
                <v-card-actions class="card-title-center pa-0">
                    <v-btn @click="confirm" :disabled="!isFormValid || !commission" color="#24b224">
                        ยืนยัน
                    </v-btn>
                    <v-btn @click="cancel" color="#e50211" class="ml-2">
                        ยกเลิก
                    </v-btn>
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

    data() {
        return {
            commissions: [],
            commission: '',
            isOpen: this.open,
            isFormValid: false,
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

    async mounted() {
        await this.fetchCommissionData();
    },

    mounted() {
        this.fetchCommissionData();
        window.addEventListener('keydown', this.handleKeydown);
    },

    beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeydown);
    },

    methods: {
        validateStockRules(commission) {
            return [
                (v) => !!v || 'กรุณากรอกค่าธรรมเนียม',
                (v) => /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข',
                (v) => {
                    if (typeof v !== 'string' || !v.trim()) {
                        return true;
                    }
                    const stockExists = this.commissions.some(c => !isNaN(c.name) && parseFloat(c.name) === parseFloat(commission));
                    if (stockExists) {
                        return 'มีค่าธรรมเนียมนี้อยู่แล้ว';
                    }
                    return true;
                },
            ];
        },

        async fetchCommissionData() {
            try {
                const response = await this.$store.dispatch('api/commission/getCommission');
                if (response) {
                    this.commissions = response.map(item => ({
                        no: item.no,
                        name: item.commission
                    }));
                }
            } catch (error) {
                console.error('Error fetching commissions:', error);
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
            if (this.commission.trim() === '') {
                this.modal.error.message = 'กรุณากรอกชื่อประเภทหุ้น';
                this.modal.error.open = true;
                return;
            }
            try {
                const employee_no = this.$auth.user.no;
                const created_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                const updated_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                const response = await this.$store.dispatch('api/commission/addCommission', {
                    commission: this.commission,
                    employee_no,
                    created_date,
                    updated_date,
                });

                this.modal.complete.message = 'เพิ่มข้อมูลเรียบร้อย';
                this.modal.complete.open = true;
                this.commission = '';
                this.$emit('update:open', false);
            } catch (error) {
                this.modal.error.message = 'มีค่าธรรมเนียมนี้แล้ว';
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
            this.commission = '';
            this.$emit('update:open', false);
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

.custom-title {
    font-size: 1rem;
}
</style>