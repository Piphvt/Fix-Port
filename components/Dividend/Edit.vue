<template>

    <div>
        <ModalConfirm :open="modal.confirm.open" :message="modal.confirm.message" :confirm.sync="modal.confirm.open"
            :method="handleConfirmMethod" />
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />

        <v-dialog persistent :retain-focus="false" v-model="open" v-if="data" max-width="400" max-height="300"
            content-class="rounded-xl">
            <v-card class="rounded-xl">
                <v-card-title class="card-title-center mb-7">แก้ไขรายละเอียดเงินปันผล</v-card-title>
                <v-card-text>
                    <v-form ref="form" v-model="valid" lazy-validation>
                        <v-row>
                            <v-col cols="5" sm="11" class="pa-0 ml-4">
                                <v-menu ref="menu" v-model="menu" :close-on-content-click="false" :nudge-right="40"
                                    :return-value.sync="formData.created_date" transition="scale-transition" offset-y
                                    min-width="290px">
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-text-field v-model="formattedCreatedDate" label="วันที่" outlined dense readonly
                                            v-bind="attrs" v-on="on"
                                            :rules="[(v) => !!v || 'โปรดเลือกวันที่']"></v-text-field>
                                    </template>
                                    <v-date-picker v-model="formData.created_date" no-title scrollable
                                        @input="onDateSelected" :locale="'th'" :first-day-of-week="1"></v-date-picker>
                                </v-menu>
                            </v-col>

                            <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                                <v-autocomplete v-model="formData.stock_no" :items="stocks" item-text="name" item-value="no"
                                label="ชื่อหุ้น" outlined dense :rules="[(v) => !!v || 'กรุณากรอกชื่อหุ้น']" clearable>
                            </v-autocomplete>
                            </v-col>

                            <v-col cols="6" sm="5" class="pa-0">
                                <v-text-field v-model="formData.dividend" :rules="[
                                    (v) => !!v || 'โปรดกรอกเงินปันผล',
                                    (v) => /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข'
                                ]" label="เงินปันผล" outlined dense required />
                            </v-col>
                        </v-row>
                    </v-form>
                </v-card-text>

                <v-card-actions class="card-title-center pa-0">
                    <v-btn @click="confirm" :disabled="!valid || !hasChanges || !formData.stock_no" depressed
                        color="#24b224" class="font-weight-medium mr-2 mb-5">
                        บันทึก
                    </v-btn>
                    <v-btn color="#e50211" @click="cancel" class="font-weight-medium mb-5">ยกเลิก
                    </v-btn>
                </v-card-actions>
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
                    message: 'มีหุ้นชื่อนี้แล้ว',
                },
            },

            formData: { ...this.data },
            valid: false,
            setOptions: [],
            details: [],
            stocks: [],
            originalData: {},

        };
    },

    computed: {
        hasChanges() {
            return JSON.stringify(this.formData) !== JSON.stringify(this.originalData);
        }
    },

    async mounted() {
        await this.fetchStockData();
    },

    mounted() {
        this.fetchStockData();
        this.formData = JSON.parse(JSON.stringify(this.data));
        this.originalData = JSON.parse(JSON.stringify(this.data));
        if (moment(this.formData.created_date).isValid()) {
            this.formattedCreatedDate = moment(this.formData.created_date).format('YYYY-MM-DD');
        } else {
            this.formattedCreatedDate = '';
        }
        document.addEventListener('keydown', this.handleKeydown);
    },

    watch: {
        data: {
            handler(newData) {
                this.formData = JSON.parse(JSON.stringify(newData));
                this.originalData = JSON.parse(JSON.stringify(newData));
                if (moment(this.formData.created_date).isValid()) {
                    this.formattedCreatedDate = moment(this.formData.created_date).format('YYYY-MM-DD');
                } else {
                    this.formattedCreatedDate = '';
                }
            },
            deep: true,
            immediate: true
        },
    },

    beforeDestroy() {
        document.removeEventListener('keydown', this.handleKeydown);
    },

    methods: {
        onDateSelected(date) {
            if (moment(date).isValid()) {
                this.formData.created_date = date;
                this.formattedCreatedDate = moment(date).format('YYYY-MM-DD');
            } else {
                this.formData.created_date = null;
                this.formattedCreatedDate = '';
            }
            this.menu = false;
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
                this.formData.emp_id = this.$auth.user.no;
                const req = await this.$store.dispatch('api/stock/updateStock', this.formData);
                this.modal.complete.open = true;
                this.data = { ...this.formData };
                this.recordLogUpdate();
            } catch (warning) {
                this.modal.warning.open = true;
            }
        },

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

        getStockNameByNo(stockNo) {
            const stock = this.stocks.find(item => item.no === stockNo);
            return stock ? stock.stock : "ไม่พบข้อมูลหุ้น";
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

        recordLogUpdate() {
            const changes = [];
            if (this.formData.name !== this.originalData.name) {
                changes.push('ชื่อ : ' + this.formData.name + '\n');
            }

            if (this.formData.closing_price !== this.originalData.closing_price) {
                changes.push('ราคาปิด : ' + this.formData.closing_price + '\n');
            }

            if (this.formData.dividend_amount !== this.originalData.dividend_amount) {
                changes.push('จำนวนปันผล : ' + this.formData.dividend_amount + '\n');
            }

            if (this.formData.comment !== this.originalData.comment) {
                changes.push('หมายเหตุ : ' + this.formData.comment + '\n');
            }
            const log = {
                stock_id: this.originalData.name,
                emp_name: this.$auth.user.fname + ' ' + this.$auth.user.lname,
                emp_email: this.$auth.user.email,
                detail: changes.join(''),
                type: 2,
                picture: this.$auth.user.picture || 'ไม่รู้จัก',
                action: 'แก้ไขข้อมูลหุ้น',
                time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };
            this.$store.dispatch('api/log/addLogs', log);
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