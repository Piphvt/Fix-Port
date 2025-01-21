<template>
    <v-dialog v-model="dialog" max-width="600px">
        <v-card>
            <div>
                <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen"
                    @update:confirm="modalConfirmOpen = false" />
                <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
                    :complete.sync="modal.complete.open" :method="goBack" />
                <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
                <DividendCreate :open="createDividendOpen" @update:open="createDividendOpen = false" />
                <DividendEdit :open="editDividend" :data="editAllData" @update:edit="editDividend = false" />
            </div>
            <v-card-title class="d-flex justify-center">
                <v-icon justify="center" class="mr-3" size="40" color="#85d7df">mdi-history</v-icon>
                <span class="headline">ประวัติการแก้ไข</span></v-card-title>
            <v-card-text>
                <v-data-table :headers="headers" :items="filteredDividends" item-value="no" item-key="no"
                    :items-per-page="5">
                    <template v-slot:item.created_date="{ item }">
                        <td class="text-center">{{ formatDateTime(item.created_date) }}</td>
                    </template>
                    <template v-slot:item.action="{ item }">
                        <div class="text-center" :style="{ color: getActionColor(item.action) }">
                            {{ item.action }}
                        </div>
                    </template>
                    <template v-slot:item.employee_no="{ item }">
                        <td class="text-center">{{ getEmployeeName(item.edit_no) }}</td>
                    </template>
                    <template v-slot:item.detail="{ item }">
                        <div class="text-center">
                            <v-icon @click="openDetail(item)" color="#85d7df">mdi-eye</v-icon>
                        </div>
                    </template>
                </v-data-table>
                <v-dialog v-model="history" max-width="500px">
                    <v-card>
                        <v-card-title class="headline" style="justify-content: center; display: flex;">
                            {{ 'ข้อมูลที่แก้ไข' }}
                        </v-card-title>
                        <v-card-text
                            style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
                            <div v-for="line in formattedDetailLines" :key="line"
                                style="text-align: center; width: 100%;">
                                <template
                                    v-if="line.includes('.jpg') || line.includes('.png') || line.includes('.jpeg')">
                                    <div class="image-container">
                                        <img :src="`${$config.API_URL}/file/profile/${line}`" alt="detail image"
                                            width="150" height="150" />
                                    </div>
                                </template>
                                <template v-else-if="line.includes('รหัสผ่าน')">
                                    <div>
                                        <span v-html="isMasked ? maskNewData(line) : line"></span> &nbsp;
                                        <v-icon @click="toggleMask" class="icon-tab" color="#21ebbf"
                                            style="cursor: pointer; margin-right: 8px;">
                                            {{ isMasked ? 'mdi-eye-closed' : 'mdi-eye' }}
                                        </v-icon>
                                    </div>
                                </template>
                                <template v-else>
                                    <div v-html="highlightKeywords(line)"></div>
                                </template>
                            </div>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn color="#e50211" @click="history = false">ปิด</v-btn>
                            <v-spacer></v-spacer>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </v-card-text>
            <div class="text-center">
                <v-btn @click="dialog = false" class="mb-4" color="#e50211">ปิด</v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>

<script>
import moment from 'moment-timezone';
import 'moment/locale/th'

export default {
    middleware: 'auth',

    props: {
        stockNo: Number,
        value: Boolean
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

            isMasked: true,

            selectedItemDetail: '',

            dividends: [],
            stocks: [],
            employees: [],
            filteredDividends: [],

            currentAction: '',
            currentItem: null,
            modalConfirmOpen: false,

            createDividendOpen: false,

            editAllData: {},
            editDividend: false,

            headers: [
                {
                    text: 'วันที่',
                    value: 'created_date',
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'การกระทำ',
                    value: 'action',
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ทำรายการโดย',
                    value: 'employee_name',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'รายละเอียด',
                    value: 'detail',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },
            ],
            dialog: this.value,
            history: false,
        };
    },

    watch: {
        value(newValue) {
            this.dialog = newValue;
        },
        dialog(newValue) {
            this.$emit('input', newValue);
        },
        stockNo() {
            this.filterDividends();
        }
    },

    computed: {
        formattedDetailLines() {
            if (!this.selectedItemDetail || !this.selectedItemDetail.detail) {
                return [];
            }
            if (typeof this.selectedItemDetail.detail === 'string') {
                return this.selectedItemDetail.detail.split('\n');
            }
            return [];
        },
    },

    async mounted() {
        await this.fetchDividendData();
        await this.fetchStockData();
        await this.fetchEmployeeData();
        this.filterDividends();
    },

    methods: {
        toggleMask() {
            this.isMasked = !this.isMasked;
        },

        maskNewData(data) {
            if (!data) return '';

            const prefix = 'รหัสผ่าน :';
            if (!data.startsWith(prefix)) return data;

            const content = data.slice(prefix.length).trim();
            const length = content.length;

            if (length <= 4) return `${prefix} ${content}`;

            const firstPart = content.slice(0, 1);
            const lastPart = content.slice(-1);
            const maskedPart = '*'.repeat(length - 2);

            return `${prefix} ${firstPart}${maskedPart}${lastPart}`;
        },


        getActionColor(action) {
            if (action === 'แก้ไขข้อมูลสมาชิก') {
                return '#ff914d';
            } else if (action === 'เปลี่ยนรหัสผ่านสมาชิก') {
                return '#ffc800';
            } else if (action === 'เปลี่ยนรูปภาพสมาชิก') {
                return '#ff66c4';
            } else if (action === 'แก้ไขข้อมูลส่วนตัว') {
                return '#8c52ff';
            } else if (action === 'อัพโหลดรูปภาพ') {
                return '#c1ff72';
            } else if (action === 'เปลี่ยนรหัสผ่าน') {
                return '#22d0e3';
            } else {
                return 'inherit';
            }
        },

        highlightKeywords(text) {
            return text
                .replace(/จาก/g, '<span style="color: yellow;">จาก</span>')
                .replace(/เป็น/g, '<span style="color: #38b6ff;">เป็น</span>');
        },

        openDetail(item) {
            this.selectedItemDetail = item;
            this.history = true;
        },

        openEditStock(dividend) {
            this.editAllData = dividend;
            this.editDividend = true;
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
            if (this.currentAction === 'delete') {
                try {
                    await this.$store.dispatch('api/dividend/deleteDividend', this.currentItem.no);
                    this.recordLog();
                    this.modal.complete.message = 'ลบเงินปันผลนี้เรียบร้อยแล้ว';
                    this.modal.complete.open = true;
                } catch (error) {
                    this.modal.error.message = 'เกิดข้อผิดพลาดในการดำเนินการ';
                    this.modal.error.open = true;
                }
            }
            this.modalConfirmOpen = false;
        },

        async fetchDividendData() {
            const dividendsData = await this.$store.dispatch('api/log/getLogByType', '4');
            this.dividends = dividendsData;
        },

        filterDividends() {
            this.filteredDividends = this.dividends.filter(dividend => dividend.edit_no === this.stockNo);
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('YYYY-MM-DD HH:mm');
            }
            return 'Invalid Date';
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

        recordLog() {
            const Employee_Name = this.$auth.user.fname + ' ' + this.$auth.user.lname;
            const Employee_Email = this.$auth.user.email;
            const Employee_Picture = this.$auth.user.picture;
            const log = {
                action: 'ลบเงินปันผลหุ้น',
                name: this.getStockName(this.currentItem.stock_no),
                detail: 'วันที่จ่ายเงินปันผล : ' + this.formatDateTime(this.currentItem.created_date) + '\nเงินปันผล : ' + this.currentItem.dividend,
                type: 2,
                employee_name: Employee_Name,
                employee_email: Employee_Email,
                employee_picture: Employee_Picture,
                created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };
            this.$store.dispatch('api/log/addLog', log);
        },
    }
};
</script>

<style>
.custom-list-item {
    padding: 0.1px 8px;
}

.custom-list {
    padding: 0.4px 2px;
}

.icon-tab {
    font-size: 120% !important;
}
</style>