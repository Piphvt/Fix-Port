<template>

    <div @keyup.enter="register" class="register-container">
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
        <ModalConfirm :open="modal.confirm.open" :confirm.sync="modal.confirm.open" :method="create" />

        <v-container fluid fill-height class="d-flex align-center justify-center">
            <v-row align="center" justify="center">
                <v-col cols="12" sm="8" md="6">
                    <v-card>
                        <v-card-title style="justify-content: center; display: flex;">
                            <span class="headline">สมัครสมาชิก</span>
                        </v-card-title>
                        <v-card-subtitle class="pa-0"
                            style="justify-content: center; display: flex;">กรอกข้อมูลให้ครบถ้วน</v-card-subtitle>
                        <v-form ref="form" v-model="valid" lazy-validation>
                            <v-card-text class="pa-8">

                                <v-row class="pa-0">
                                    <v-col cols="12" class="pa-1">
                                        <v-text-field ref="emailField" autocomplete="off" v-model="form.email"
                                            label="อีเมล" prepend-icon="mdi-email" type="email" outlined dense clearable
                                            class="small-text-field"
                                            :rules="[rules.required, rules.email, rules.emailExists]"
                                            :readonly="isReadonly" @focus="removeReadonly"
                                            @blur="setReadonly"></v-text-field>
                                    </v-col>
                                </v-row>

                                <v-row class="pa-0">
                                    <v-col cols="12" sm="6" class="pa-1">
                                        <v-text-field ref="passwordField" autocomplete="new-password"
                                            :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-closed'"
                                            :type="show1 ? 'text' : 'password'" v-model="form.password"
                                            prepend-icon="mdi-lock" :rules="validatePasswordRules()"
                                            :readonly="isReadonly" @focus="removeReadonly" @blur="setReadonly"
                                            @click:append="show1 = !show1" label="รหัสผ่าน" dense outlined required>
                                            <template v-slot:append>
                                                <v-icon tabindex="-1" @click="show1 = !show1">{{ show1 ? 'mdi-eye' :
                                                    'mdi-eye-closed' }}</v-icon>
                                            </template>
                                        </v-text-field>
                                    </v-col>
                                    <v-col cols="12" sm="6" class="pa-1">
                                        <v-text-field ref="confirmPasswordField" autocomplete="new-password"
                                            :append-icon="show2 ? 'mdi-eye' : 'mdi-eye-closed'"
                                            :type="show2 ? 'text' : 'password'" v-model="form.confirmPassword"
                                            prepend-icon="mdi-lock-check" :rules="[
                                                (v) => !!v || 'โปรดยืนยันรหัสผ่าน',
                                                (v) => v === form.password || 'รหัสผ่านไม่ตรงกัน'
                                            ]" :readonly="isReadonly" @focus="removeReadonly" @blur="setReadonly"
                                            @click:append="show2 = !show2" label="ยืนยันรหัสผ่าน" dense outlined
                                            required append-icon-props="{ tabindex: '-1' }">
                                            <template v-slot:append>
                                                <v-icon tabindex="-1" @click="show2 = !show2">{{ show2 ? 'mdi-eye' :
                                                    'mdi-eye-closed' }}</v-icon>
                                            </template>
                                        </v-text-field>
                                    </v-col>
                                </v-row>

                                <v-row class="pa-0">
                                    <v-col cols="12" sm="6" class="pa-1">
                                        <v-text-field v-model="form.fname" label="ชื่อเล่น" prepend-icon="mdi-pen"
                                            outlined dense clearable class="small-text-field"
                                            :rules="[rules.required, rules.thaiOnly]"></v-text-field>
                                    </v-col>
                                    <v-col cols="12" sm="6" class="pa-1">
                                        <v-text-field v-model="form.lname" label="ชื่อจริง"
                                            prepend-icon="mdi-home-group" outlined dense clearable
                                            class="small-text-field"
                                            :rules="[rules.required, rules.thaiOnly]"></v-text-field>
                                    </v-col>
                                </v-row>

                                <v-row class="pa-0">
                                    <v-col cols="12" sm="6" class="pa-1">
                                        <v-text-field v-model="form.phone" label="เบอร์โทรศัพท์"
                                            prepend-icon="mdi-phone" outlined dense clearable class="small-text-field"
                                            :rules="[rules.required, rules.phoneNumber]"></v-text-field>
                                    </v-col>
                                    <v-col cols="12" sm="6" class="pa-1">
                                        <v-select v-model="form.gender" :items="genderOptions" label="เพศ"
                                            prepend-icon="mdi-gender-male-female" outlined dense clearable
                                            class="last-text-field" :rules="[rules.required]" ref="genderSelect">
                                            <template v-slot:item="data">
                                                <v-list-item :value="data.item.value"
                                                    @click="selectGender(data.item.value)">
                                                    <v-list-item-icon>
                                                        <v-icon>{{ data.item.icon }}</v-icon>
                                                    </v-list-item-icon>
                                                    <v-list-item-content>
                                                        <v-list-item-title>{{ data.item.text }}</v-list-item-title>
                                                    </v-list-item-content>
                                                </v-list-item>
                                            </template>
                                        </v-select>
                                    </v-col>
                                </v-row>

                                <v-row align="center" justify="center" class="pa-0">
                                    <v-col cols="6" class="pa-1 last-text-field">
                                        <v-btn :disabled="!isFormValid" @click="confirm" color="#24b224" block>
                                            ลงทะเบียน
                                        </v-btn>
                                    </v-col>

                                    <v-col cols="6" class="pa-1 last-text-field">
                                        <v-btn color="#e50211" @click="goBack" block>
                                            ยกเลิก
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-form>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>

</template>

<script>

import moment from 'moment';
moment.locale('th');

export default {

    layout: 'default',

    async mounted() {
        await this.checkRank();
        await this.fetchEmployeeData();
        this.$nextTick(() => {
            const emailField = this.$refs.emailField.$el;
            const passwordField = this.$refs.passwordField.$el;
            const confirmPasswordField = this.$refs.confirmPasswordField.$el;

            if (passwordField && passwordField.$el) {
                passwordField.$el.setAttribute('autocomplete', 'off');
            }

            if (confirmPasswordField && confirmPasswordField.$el) {
                confirmPasswordField.$el.setAttribute('autocomplete', 'off');
            }

            if (emailField) {
                emailField.setAttribute('autocomplete', 'off');
            }
        });
    },

    data() {
        return {
            show1: false,
            show2: false,
            valid: false,
            isReadonly: true,

            employees: [],

            form: {
                email: null,
                password: null,
                confirmPassword: null,
                fname: null,
                lname: null,
                phone: null,
                gender: null,
                picture: 'unknown.jpg',
                status: 2,
                rank_no: 2,
                created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            },

            modal: {
                confirm: { open: false, },
                complete: { open: false, message: 'การลงทะเบียนสมาชิกเสร็จสมบูรณ์ กรุณารอการอนุมัติผู้ใช้งาน' },
                error: { open: false, message: 'มีบางอย่างผิดปกติ' }
            },

            rules: {
                required: value => !!value || 'กรุณากรอกข้อมูล',
                email: value => /.+@.+\..+/.test(value) || 'กรุณากรอกอีเมลให้ถูกต้อง',
                emailExists: value => !this.employees.some(emp => emp.email === value) || 'มีอีเมลนี้อยู่แล้ว',
                phoneNumber: value => /^0[0-9]{9}$/.test(value) || 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง',
                thaiOnly: value => /^[ก-๙]+$/.test(value) || 'กรุณาใช้ชื่อเป็นภาษาไทย'
            },

            genderOptions: [
                { text: 'ชาย', value: 'ชาย', icon: 'mdi-face-man' },
                { text: 'หญิง', value: 'หญิง', icon: 'mdi-face-woman' },
                { text: 'ไม่ระบุ', value: 'ไม่ระบุ', icon: 'mdi-not-equal-variant' },
            ]
        };
    },

    computed: {
        isFormValid() {
            return (
                this.form.email &&
                this.rules.email(this.form.email) === true &&
                this.form.password &&
                this.rules.required(this.form.password) === true &&
                this.form.confirmPassword &&
                this.form.confirmPassword === this.form.password &&
                this.form.fname &&
                this.rules.thaiOnly(this.form.fname) === true &&
                this.form.lname &&
                this.rules.thaiOnly(this.form.lname) === true &&
                this.form.phone &&
                this.rules.phoneNumber(this.form.phone) === true &&
                this.form.gender &&
                !this.employees.some(emp => emp.email === this.form.email)
            );
        }
    },

    methods: {
        removeReadonly() {
            this.isReadonly = false;
        },

        setReadonly() {
            this.isReadonly = true;
        },

        async fetchEmployeeData() {
            this.employees = await this.$store.dispatch('api/employee/getEmployee');
        },

        validatePasswordRules() {
            return [
                (v) => !!v || 'โปรดกรอกรหัสผ่านใหม่',
                (v) => (v && v.length >= 8) || 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
            ];
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
                        this.$router.push('/auth');
                    } else if (RankID === '2') {
                        this.$router.push('/auth');
                    } else if (RankID === '3') {
                        this.$router.push('/auth');
                    } else {
                        this.$router.push('/');
                    }
                }
            } else {
                this.$router.push('/auth/register');
            }
        },

        async confirm() {
            if (this.$refs.form.validate()) {
                try {
                    this.modal.confirm.open = true
                } catch (error) {
                    this.modal.error.open = true
                }
            } else {
                this.modal.error.open = true;
                this.modal.error.message = "กรุณากรอกข้อมูลให้ครบถ้วน";
            }
        },

        async create() {
            try {
                const req = await this.$store.dispatch('api/employee/register', this.form)
                this.modal.complete.open = true
            } catch (error) {
                this.modal.error.open = true
                this.modal.error.message = "มีอีเมลนี้อยู่แล้ว";
            }
        },

        goBack() {
            this.$router.push('/auth')
        },

        resetForm() {
            this.form.email = null;
            this.form.password = null;
            this.form.confirmPassword = null;
            this.form.fname = null;
            this.form.lname = null;
            this.form.phone = null;
            this.form.gender = null;
            this.$refs.form.resetValidation();
        },

        selectGender(gender) {
            this.form.gender = gender;
            if (gender === 'หญิง') {
                this.form.picture = 'woman.png';
            } else if (gender === 'ชาย') {
                this.form.picture = 'man.png';
            } else {
                this.form.picture = 'unknown.jpg';
            }
            this.$nextTick(() => {
                this.$refs.genderSelect.blur();
            });
        },
    }
};

</script>

<style scoped>
.register-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80vh;
}

.v-card {
    max-width: 600px;
    max-height: 800px;
    margin: auto;
}

.last-text-field {
    margin-bottom: 2px;
}
</style>
