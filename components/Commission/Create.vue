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
                            <v-text-field v-model="newStockType" label="ค่าธรรมเนียม" dense required outlined 
                            :rules="[value => !!value || 'กรุณากรอกค่าธรรมเนียม']">
                            </v-text-field>
                        </v-col>
                    </v-row>
                </v-form>
                <v-card-actions class="card-title-center pa-0">
                    <v-btn @click="confirm" :disabled="!isFormValid || !newStockType" color="#24b224">
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
            newStockType: '',
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
    mounted() {
        window.addEventListener('keydown', this.handleKeydown);
    },
    beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeydown);
    },
    methods: {
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
            if (this.newStockType.trim() === '') {
                this.modal.error.message = 'กรุณากรอกชื่อประเภทหุ้น';
                this.modal.error.open = true;
                return;
            }
            try {
                const employee_no = this.$auth.user.no;
                const created_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                const updated_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                const response = await this.$store.dispatch('api/commission/addCommission', {
                    commission: this.newStockType,
                    employee_no,
                    created_date,
                    updated_date,
                });

                this.modal.complete.message = 'เพิ่มค่าธรรมเนียมสำเร็จ';
                this.modal.complete.open = true;
                this.recordLog();
                this.newStockType = '';
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
            this.newStockType = '';
            this.$emit('update:open', false);
        },
        recordLog() {
            const log = {
                emp_name: this.$auth.user.fname + ' ' + this.$auth.user.lname,
                emp_email: this.$auth.user.email,
                detail: this.newStockType,
                type: 1,
                picture: this.$auth.user.picture || 'Unknown',
                action: 'เพิ่มค่าธรรมเนียมใหม่',
                time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
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

.custom-title {
    font-size: 1rem;
}
</style>