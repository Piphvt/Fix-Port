<template>
    <v-dialog v-model="dialog" max-width="1000px">
        <v-card>
            <div>
                <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen"
                    @update:confirm="modalConfirmOpen = false" />
                <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
                    :complete.sync="modal.complete.open" :method="goBack" />
                <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
            </div>
            <v-card-title class="d-flex justify-center">
                <v-icon justify="center" class="mr-3" size="40" color="#85d7df">mdi-robot</v-icon>
                <span class="headline">หุ้นจากบอท</span>
            </v-card-title>
            
            <v-card-text>
                <v-data-table :headers="headers" :items="follows" item-value="no" item-key="no" :items-per-page="5">
                    <template v-slot:item.stock_no="{ item }">
                        <div class="text-center">{{ getStockName(item.stock_no) }}</div>
                    </template>
                    <template v-slot:item.employee_no="{ item }">
                        <div class="text-center">{{ getEmployeeName(item.employee_no) }}</div>
                    </template>
                    <template v-slot:item.created_date="{ item }">
                        <div class="text-center">{{ formatDateTime(item.created_date) }}</div>
                    </template>
                    <template v-slot:item.detail="{ item }">
                        <div class="text-center">
                            <v-menu offset-y>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-icon v-bind="attrs" v-on="on" color="#85d7df">mdi-dots-vertical</v-icon>
                                </template>
                                <v-list class="custom-list">
                                    <v-list-item @click="showConfirmDialog('approve', item)" class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 4px;">
                                            <v-icon class="icon-tab" color="#24b224">mdi-check-circle</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content style="font-size: 0.8rem;">อนุมัติ</v-list-item-content>
                                    </v-list-item>

                                    <v-list-item @click="showConfirmDialog('reject', item)" class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 4px;">
                                            <v-icon class="icon-tab" color="#e50211">mdi-close-circle</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content style="font-size: 0.8rem;">ไม่อนุมัติ</v-list-item-content>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </div>
                    </template>
                </v-data-table>
            </v-card-text>
            <div class="text-center">
                <v-btn @click="dialog = false" class="mb-4" color="#e50211">ปิด</v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>

<script>
import moment from 'moment-timezone';
import 'moment/locale/th';

export default {
    props: {
        value: Boolean,
    },

    data() {
        return {
            modal: {
                error: {
                    open: false,
                    message: '',
                },
                confirm: {
                    open: false,
                },
                complete: {
                    open: false,
                    message: '',
                },
            },

            follows: [],
            stocks: [],
            employee: [],

            currentAction: '',
            currentItem: null,
            modalConfirmOpen: false,

            headers: [
                {
                    text: 'ข้อมูลวันที่',
                    value: 'created_date',
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ชื่อหุ้น',
                    value: 'stock_no',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'LOW PRICE',
                    value: 'low_price',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'UP PRICE',
                    value: 'up_price',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'หมายเหตุ',
                    value: 'remark',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: '',
                    value: 'detail',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },
            ],

            dialog: this.value,
        };
    },

    watch: {
        value(newValue) {
            this.dialog = newValue;
        },
        dialog(newValue) {
            this.$emit('input', newValue);
        },
    },

    async mounted() {
        await this.fetchFollowData();
        await this.fetchStockData();
        await this.fetchEmployeeData();
    },

    methods: {
        getReachText(reach) {
            if (reach === 1) {
                return 'Low Price';
            } else if (reach === 2) {
                return 'Up Price';
            } else {
                return '-';
            }
        },

        goBack() {
            window.location.reload();
        },

        showConfirmDialog(action, item) {
            this.currentAction = action;
            this.currentItem = item;
            this.modalConfirmOpen = true;
        },

        async handleConfirm() {
            try {
                if (this.currentAction === 'approve') {
                    await this.$store.dispatch('api/employee/updateEmployeeStatus', {
                        no: this.currentItem.no,
                        status: 1,
                        employee_no: this.$auth.user.no
                    });
                    this.recordLog();
                    this.modal.complete.message = 'อนุมัติผู้ใช้งานเรียบร้อยแล้ว';
                } else if (this.currentAction === 'reject') {
                    await this.$store.dispatch('api/employee/deleteEmployee', this.currentItem.no);
                    this.modal.complete.message = 'ลบผู้ใช้งานนี้เรียบร้อยแล้ว';
                    this.recordLog();
                }

                this.modal.complete.open = true;
            } catch (error) {
                this.modal.complete.message = 'เกิดข้อผิดพลาดในการดำเนินการ';
                this.modal.complete.open = true;
            }

            this.modalConfirmOpen = false;
        },

        async fetchFollowData() {
            this.follows = await this.$store.dispatch('api/follow/getFollowByResult', '3');
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock')
        },

        getStockName(stockNo) {
            const stock = this.stocks.find(s => s.no === stockNo);
            return stock ? stock.stock : '';
        },

        async fetchEmployeeData() {
            this.employees = await this.$store.dispatch('api/employee/getEmployee')
        },

        getEmployeeName(employeeNo) {
            const employee = this.employees.find(e => e.no === employeeNo);
            return employee ? employee.fname + ' ' + employee.lname : '';
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('DD/MM/YYYY HH:mm');
            }
            return 'Invalid Date';
        },

        getStatusText(status) {
            if (status === 'รอการยืนยันผู้ใช้งาน') {
                return { text: 'รอการยืนยันผู้ใช้งาน', color: '#e50211' };
            } else {
                return { text: 'สถานะไม่ทราบ', color: 'inherit' };
            }
        },

        recordLog() {
            const Employee_Name = this.$auth.user.fname + ' ' + this.$auth.user.lname;
            const Employee_Email = this.$auth.user.email;
            const Employee_Picture = this.$auth.user.picture;
            const log = {
                action: this.currentAction === 'approve'
                    ? 'อนุมัติผู้ใช้งาน'
                    : 'ไม่อนุมัติผู้ใช้งาน',
                name: this.currentItem.fname + ' ' + this.currentItem.lname,
                detail: this.currentAction === 'approve'
                    ? `อีเมล : ${this.currentItem.email}\nเบอร์โทรศัพท์ : ${this.currentItem.phone}\nเพศ : ${this.currentItem.gender}`
                    : `อีเมล : ${this.currentItem.email}\nเบอร์โทรศัพท์ : ${this.currentItem.phone}\nเพศ : ${this.currentItem.gender}`,
                type: 4,
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

<style>
.custom-list-item {
    padding: 0.1px 8px;
}

.custom-list {
    padding: 0.4px 2px;
}
</style>
