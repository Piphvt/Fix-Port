<template>
    <div>
        <v-dialog v-model="dialog" max-width="500px" v-for="employee in employees" :key="employee.no">
            <v-card flat class="no-scroll">
                <div>
                    <EmployeeEditDialog :open="editDialog" :edit.sync="editDialog" :data="editData" />
                    <EmployeeEditPassword :open="editPasswordDialog" :edit.sync="editPasswordDialog"
                        :data="editPasswordData" />
                    <EmployeeEditUpload :open="editUploadDialog" :edit.sync="editUploadDialog" :data="editUploadData" />
                </div>
                <v-card-text>
                    <v-row cols="12" class="d-flex justify-center">
                        <v-col cols="5" class="d-flex flex-column align-center pa-4 mt-3">
                            <v-img :src="profileImage" @error="onImageError" height="150" width="150" class="mb-3">
                            </v-img>
                            <v-img :src="employee.picture
                                ? `${$config.API_URL}/file/profile/${employee.picture}`
                                : `${$config.API_URL}/file/default/${employee.picture}`">
                            </v-img>
                            <v-menu offset-y>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-btn v-bind="attrs" v-on="on" color="#ded30b">
                                        <v-icon style="font-size: 1.5rem;">mdi-pencil</v-icon>แก้ไข
                                    </v-btn>
                                </template>
                                <v-list class="custom-list">
                                    <v-list-item @click="() => { editDialog = true; editData = employee }"
                                        class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 5px;">
                                            <v-icon class="icon-tab" color="#ffc800">mdi-pencil-circle</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content>
                                            <v-list-item-title
                                                style="font-size: 0.8rem;">ข้อมูลส่วนตัว</v-list-item-title>
                                        </v-list-item-content>
                                    </v-list-item>
                                    <v-list-item
                                        @click="() => { editPasswordDialog = true; editPasswordData = employee }"
                                        class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 5px;">
                                            <v-icon class="icon-tab" color="#24b224">mdi-sync-circle</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content>
                                            <v-list-item-title style="font-size: 0.8rem;">รหัสผ่าน</v-list-item-title>
                                        </v-list-item-content>
                                    </v-list-item>
                                    <v-list-item @click="() => { editUploadDialog = true; editUploadData = employee }"
                                        class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 5px;">
                                            <v-icon class="icon-tab" color="#38b6ff">mdi-upload-circle</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content>
                                            <v-list-item-title style="font-size: 0.8rem;">รูปภาพ</v-list-item-title>
                                        </v-list-item-content>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </v-col>
                        <v-col cols="7" class="mt-6">
                            <v-card-text>
                                <v-icon>mdi-pen</v-icon> ชื่อ : {{ employee.fname + ' ' + employee.lname }}<br />
                                <v-icon>mdi-email</v-icon> อีเมล: {{ employee.email }}<br />
                                <v-icon>mdi-phone</v-icon> เบอร์โทรศัพท์: {{ employee.phone }}<br />
                                <v-icon>mdi-chair-rolling</v-icon> ตำแหน่ง: {{ getRankName(employee.rank_no) }}<br />
                                <v-icon>mdi-gender-male-female</v-icon> เพศ: {{ employee.gender }}<br />
                                <v-icon>mdi-calendar</v-icon> วันที่สร้าง: {{ formatDateTime(employee.created_date)
                                }}<br />
                                <v-icon>mdi-calendar-clock</v-icon> อัพเดทล่าสุด: {{
                                    formatDateTime(employee.updated_date) }}
                            </v-card-text>
                        </v-col>
                    </v-row>
                </v-card-text>
                <div class="text-center">
                    <div class="mb-3">
                        <v-btn @click="dialog = false" color="#e50211" class="ml-2">ปิด</v-btn>
                    </div>
                </div>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import moment from 'moment-timezone';
import 'moment/locale/th';

export default {
    middleware: 'auth',
    props: {
        value: Boolean,
    },

    data() {
        return {
            modal: {
                confirm: {
                    open: false,
                    message: '',
                },
                complete: {
                    open: false,
                    message: '',
                },
                error: {
                    open: false,
                    message: '',
                },
            },

            profileImage: `${this.$config.API_URL}/file/profile/${this.$auth.user.picture}`,

            editDialog: false,
            editPasswordDialog: false,
            editUploadDialog: false,
            editData: null,
            editPasswordData: null,
            editUploadData: null,
            employees: [],
            ranks: [],
            files: [],

            dialog: this.value,
        }
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
        await this.checkRank()
        await this.fetchEmployeeData()
        await this.fetchRankData()
    },

    methods: {
        onImageError() {
            this.profileImage = `${this.$config.API_URL}/file/default/${this.$auth.user.picture}`;
        },

        async checkRank() {
            if (this.$auth.loggedIn) {
                const Status = this.$auth.user.status.toString();
                const RankID = this.$auth.user.rank_no.toString();
                if (Status === '2') {
                    this.$router.push('/');
                    await this.$auth.logout();
                }
                else {
                    if (RankID === '1') {
                        this.$router.push('/app/profile');
                    } else if (RankID === '2') {
                        this.$router.push('/app/profile');
                    } else if (RankID === '3') {
                        this.$router.push('/app/profile');
                    } else if (RankID === '4') {
                        this.$router.push('/app/profile');
                    } else {
                        this.$router.push('/auth');
                    }
                }
            } else {
                this.$router.push('/');
            }
        },

        async fetchEmployeeData() {
            const empID = this.$auth.user.no;
            const allEmployees = await this.$store.dispatch('api/employee/getEmployee');
            this.employees = allEmployees.filter(employee => employee.no === empID);
        },

        async fetchRankData() {
            this.ranks = await this.$store.dispatch('api/rank/getRank')
        },

        async fetchFileData() {
            this.files = await this.$store.dispatch('api/file/viewProfile')
        },

        getRankName(rankId) {
            const rank = this.ranks.find(r => r.no === rankId);
            return rank ? rank.rank : 'ไม่รู้จัก';
        },

        formatDateTime(date) {
            return moment(date).format('YYYY-MM-DD HH:mm');
        },

    },
}
</script>

<style scoped>
.no-scroll {
    max-height: 90vh;
    overflow: hidden;
    box-sizing: border-box;
}

.custom-list-item {
    padding: 0.1px 8px;
}

.custom-list {
    padding: 0.4px 2px;
}

.card-title-center {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.v-card-title .custom-title {
    font-size: 1.5rem !important;
}
</style>
