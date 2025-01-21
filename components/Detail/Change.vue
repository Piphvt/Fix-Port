<template>

    <div>
        <ModalConfirm :open="modal.confirm.open" :message="modal.confirm.message" :confirm.sync="modal.confirm.open"
            :method="handleConfirmMethod" />
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />

        <v-dialog persistent :retain-focus="false" v-model="open" v-if="data" max-width="300" max-height="300"
            content-class="rounded-xl">
            <v-card class="rounded-xl">
                <v-card-title class="d-flex align-center justify-center mb-3">แก้ไข</v-card-title>
                <v-card-text>
                    <v-form ref="form" v-model="valid" lazy-validation>
                        <v-row>
                            <v-col cols="11" class="pa-0 ml-3 mr-3">
                                <v-autocomplete v-model="formData.staff_no" :items="employees" item-text="name"
                                    item-value="no" label="ชื่อผู้ติดตามหุ้น" dense outlined
                                    :rules="[(v) => !!v || 'กรุณากรอกชื่อผู้ติดตามหุ้น']" clearable>
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
                    message: 'มีประเภทหุ้นชื่อนี้แล้ว',
                },
            },

            employees: [],
            stocks: [],
            formData: { ...this.data },
            valid: false,
            originalData: {},

        };
    },

    computed: {
        hasChanges() {
            const staffNoHasChanged = this.formData.staff_no !== this.originalData.staff_no;
            return staffNoHasChanged;
        },
    },

    async mounted() {
        await this.fetchEmployeeData();
        await this.fetchStockData();
    },

    mounted() {
        this.fetchEmployeeData();
        this.fetchStockData();
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
        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock')
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
                const req = await this.$store.dispatch('api/stock/updateStockStaff', this.formData);
                this.modal.complete.open = true;
                this.recordLog();
            } catch (warning) {
                this.modal.warning.open = true;
            }
        },

        getStaffNameByNo(No) {
            const staff = this.employees.find(item => item.no === No);
            return staff ? staff.name : "ยังไม่ระบุ";
        },

        getStockNameByNo(No) {
            const stock = this.stocks.find(item => item.no === No);
            return stock ? stock.stock : "ยังไม่ระบุ";
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
            const log = {
                action: 'หุ้น',
                name: this.getStockNameByNo(this.originalData.stock_no),
                detail: 'ผู้ติดตามหุ้น จาก : ' + this.getStaffNameByNo(this.originalData.staff_no) + ' เป็น : ' + this.getStaffNameByNo(this.formData.staff_no),
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