<template>
    <v-dialog v-model="dialog" max-width="900px">
        <v-card>
            <div>
                <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen"
                    @update:confirm="modalConfirmOpen = false" />
                <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
                    :complete.sync="modal.complete.open" :method="goBack" />
                <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
            </div>
            <v-card-title class="d-flex justify-center mb-3">
                <v-icon justify="center" size="30" color="#24b224">mdi-home-plus</v-icon>&nbsp;
                <span class="custom-title">คำร้องขอสมัครสมาชิก</span>
            </v-card-title>
            <v-card-text>
                <v-data-table :headers="headers" :items="employees" item-value="no" item-key="no" :items-per-page="5">
                    <template v-slot:item.picture="{ item }">
                        <v-avatar size="40">
                            <img :src="`${$config.API_URL}/file/profile/${item.picture}`" 
                            @error="onImageError($event, item)" alt="picture" />
                        </v-avatar>
                    </template>
                    <template v-slot:item.email="{ item }">
                        <div class="text-center">{{ item.email }}</div>
                    </template>
                    <template v-slot:item.fname="{ item }">
                        <div class="text-center">{{ item.fname + ' ' + item.lname }}</div>
                    </template>
                    <template v-slot:item.phone="{ item }">
                        <div class="text-center">{{ item.phone }}</div>
                    </template>
                    <template v-slot:item.gender="{ item }">
                        <div class="text-center">{{ item.gender }}</div>
                    </template>
                    <template v-slot:item.status="{ item }">
                        <span :style="{ color: getStatusText(item.status).color }">
                            {{ getStatusText(item.status).text }}
                        </span>
                    </template>
                    <template v-slot:item.updated_date="{ item }">
                        <div class="text-center">{{ formatDateTime(item.updated_date) }}</div>
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

            employees: [],

            currentAction: '',
            currentItem: null,
            modalConfirmOpen: false,

            headers: [
                {
                    text: 'เวลา',
                    value: 'updated_date',
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'โปรไฟล์',
                    value: 'picture',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'สถานะ',
                    value: 'status',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'อีเมล',
                    value: 'email',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'เบอร์โทรศัพท์',
                    value: 'phone',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ชื่อ',
                    value: 'fname',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'เพศ',
                    value: 'gender',
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
        await this.fetchEmployeeData();
    },

    methods: {
        onImageError(event, item) {
            event.target.src = `${this.$config.API_URL}/file/default/${item.picture}`;
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

        async fetchEmployeeData() {
            try {
                const status2 = await this.$store.dispatch('api/employee/getEmployeeByStatus', '2');
                const statusMap = {
                    2: 'รอการยืนยันผู้ใช้งาน',
                };
                this.employees = [...status2].map(employee => {
                    return {
                        ...employee,
                        status: statusMap[employee.status] || 'สถานะไม่ทราบ'
                    };
                });
            } catch (error) {
            }
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
                    : 'ไม่อนุมัติสมาชิก',
                name: this.currentItem.fname + ' ' + this.currentItem.lname,
                detail: this.currentAction === 'approve'
                    ? `อีเมล : ${this.currentItem.email}\nเบอร์โทรศัพท์ : ${this.currentItem.phone}\nเพศ : ${this.currentItem.gender}`
                    : `อีเมล : ${this.currentItem.email}\nเบอร์โทรศัพท์ : ${this.currentItem.phone}\nเพศ : ${this.currentItem.gender}`,
                type: 3,
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

.icon-tab {
    font-size: 120% !important;
}

.v-card-title .custom-title {
    font-size: 1.5rem !important;
}
</style>
