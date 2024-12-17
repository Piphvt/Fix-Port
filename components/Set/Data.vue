<template>
    <v-dialog v-model="dialog" max-width="500px">
        <v-card>
            <div>
                <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen"
                    @update:confirm="modalConfirmOpen = false" />
                <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
                    :complete.sync="modal.complete.open" :method="goBack" />
                <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
                <SetCreate :open="createSetOpen" @update:open="createSetOpen = false" />
                <SetEdit :open="editSet" :data="editAllData" @update:edit="editSet = false" />
            </div>
            <v-card-title class="d-flex justify-center">
                <v-icon justify="center" class="mr-3" size="40" color="#85d7df">mdi-archive-settings</v-icon>
                <span class="headline">ข้อมูลประเภทหุ้น</span>
            </v-card-title>
            <v-card-text>
                <v-data-table :headers="headers" :items="sets" item-value="no" item-key="no" :items-per-page="5">
                    <template v-slot:item.set="{ item }">
                        <div class="text-center" :style="{ color: getSetText(item.set).color }">{{ item.set }}</div>
                    </template>
                    <template v-slot:item.employee_no="{ item }">
                        <td class="text-center">{{ getEmployeeName(item.employee_no) }}</td>
                    </template>
                    <template v-slot:item.created_date="{ item }">
                        <td class="text-center">{{ formatDateTime(item.created_date) }}</td>
                    </template>
                    <template v-slot:item.detail="{ item }">
                        <div class="text-center">
                            <v-menu offset-y>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-icon v-bind="attrs" v-on="on" color="#85d7df">mdi-dots-vertical</v-icon>
                                </template>
                                <v-list class="custom-list">
                                    <v-list-item @click="openEditStock(item)" class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 4px;">
                                            <v-icon class="icon-tab" color="#ffc800">mdi-pencil</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content style="font-size: 0.8rem;">แก้ไข</v-list-item-content>
                                    </v-list-item>
                                    <v-list-item @click="showConfirmDialog('delete', item)" class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 4px;">
                                            <v-icon class="icon-tab" color="#e50211">mdi-delete</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content style="font-size: 0.8rem;">ลบ</v-list-item-content>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </div>
                    </template>
                </v-data-table>
            </v-card-text>
            <div class="text-center">
                <v-btn @click="createSetOpen = true" class="mb-4 mr-4" style="font-size: 1.5 rem;" color="#24b224">
                    <v-icon left>mdi-archive-plus</v-icon> เพิ่ม
                </v-btn>
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

            sets: [],
            employees: [],

            currentAction: '',
            currentItem: null,
            modalConfirmOpen: false,

            createSetOpen: false,

            editAllData: {},
            editSet: false,

            headers: [
                { text: 'ข้อมูลวันที่', value: 'created_date', align: 'center', cellClass: 'text-center' },
                { text: 'ชื่อประเภทหุ้น', value: 'set', sortable: false, align: 'center', cellClass: 'text-center' },
                { text: 'ทำรายการโดย', value: 'employee_no', sortable: false, align: 'center', cellClass: 'text-center' },
                { text: '', value: 'detail', sortable: false, align: 'center', cellClass: 'text-center' },
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
        await this.fetchSetData();
        await this.fetchEmployeeData();
    },

    methods: {
        openEditStock(dividend) {
            this.editAllData = dividend;
            this.editSet = true;
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
                    await this.$store.dispatch('api/set/deleteSet', this.currentItem.no);
                    this.modal.complete.message = 'ลบประเภทหุ้นนี้เรียบร้อยแล้ว';
                    this.modal.complete.open = true;
                    this.recordLog();
                } catch (error) {
                    this.modal.error.message = 'เกิดข้อผิดพลาดในการดำเนินการ';
                    this.modal.error.open = true;
                }
            }
            this.modalConfirmOpen = false;
        },

        async fetchSetData() {
            this.sets = await this.$store.dispatch('api/set/getSet');
        },

        async fetchEmployeeData() {
            this.employees = await this.$store.dispatch('api/employee/getEmployee');
        },

        getEmployeeName(empId) {
            const employee = this.employees.find(e => e.no === empId);
            return employee ? employee.fname + ' ' + employee.lname : 'ไม่ทราบ';
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('DD/MM/YYYY HH:mm');
            }
            return 'Invalid Date';
        },

        getSetText(set) {
            if (set === 'SET') {
                return { text: 'SET', color: '#24b224' };
            } else if (set === 'SET50') {
                return { text: 'SET50', color: '#ffc800' };
            } else if (set === 'SET100') {
                return { text: 'SET100', color: '#38b6ff' };
            } else if (set === 'ETF') {
                return { text: 'ETF', color: '#8c52ff' };
            } else if (set === 'MAI') {
                return { text: 'MAI', color: '#ff914d' };
            } else if (set === 'Warrants') {
                return { text: 'Warrants', color: '#c1ff72' };
            } else if (set === 'DR') {
                return { text: 'DR', color: '#ff5757' };
            } else if (set === 'Preferred Stock') {
                return { text: 'Preferred Stock', color: '#ff66c4' };
            } else {
                return { text: '', color: 'inherit' };
            }
        },
        recordLog() {
            const Employee_Name = this.$auth.user.fname + ' ' + this.$auth.user.lname;
            const Employee_Email = this.$auth.user.email;
            const Employee_Picture = this.$auth.user.picture;
            const log = {
                action: 'ลบประเภทหุ้น',
                name: this.currentItem.set,
                detail: 'ไม่มีข้อมูลเพิ่มเติม',
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

<style>
.custom-list-item {
    padding: 0.1px 8px;
}

.custom-list {
    padding: 0.4px 2px;
}
</style>
