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
                <v-card-title class="card-title-center mb-3">แก้ไขรายละเอียดการติดตามหุ้น</v-card-title>
                <v-card-text>
                    <v-form ref="form" v-model="valid" lazy-validation>
                        <v-row>
                            <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                                <v-autocomplete v-model="formData.stock_no" :items="stocks" item-text="name"
                                    item-value="no" label="ชื่อหุ้น" outlined dense
                                    :rules="[(v) => !!v || 'กรุณาเลือกชื่อหุ้น']" clearable>
                                </v-autocomplete>
                            </v-col>

                            <v-col cols="6" sm="5" class="pa-0">
                                <v-text-field v-model="formData.low_price" :rules="[
                                    (v) => !!v || 'โปรดกรอก low price',
                                    (v) => /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข'
                                ]" label="low price" outlined dense required />
                            </v-col>

                            <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                                <v-text-field v-model="formData.up_price" :rules="[
                                    (v) => !!v || 'โปรดกรอก up price',
                                    (v) => /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข'
                                ]" label="up price" outlined dense required />
                            </v-col>

                            <v-col cols="6" sm="5" class="pa-0">
                                <v-text-field v-model="formData.remark" :rules="[
                                    (v) => !!v || 'โปรดกรอกหมายเหตุ'
                                ]" label="หมายเหตุ" dense outlined required />
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
                    message: 'มีหุ้นชื่อนี้แล้ว',
                },
            },

            formData: {},
            valid: false,

            stocks: [],
            originalData: {},

        };
    },

    computed: {
        hasChanges() {
            const originalLowPrice = parseFloat(this.originalData.low_price) || 0;
            const originalUpPrice = parseFloat(this.originalData.up_price) || 0;
            const formLowPrice = parseFloat(this.formData.low_price) || 0;
            const formUpPrice = parseFloat(this.formData.up_price) || 0;

            const finalLowPrice = formLowPrice !== originalLowPrice ? formLowPrice : originalLowPrice;
            const finalUpPrice = formUpPrice !== originalUpPrice ? formUpPrice : originalUpPrice;

            const stockNoHasChanged = this.formData.stock_no !== this.originalData.stock_no;
            const remarkHasChanged = this.formData.remark !== this.originalData.remark;

            const lowPriceHasChanged = formLowPrice !== originalLowPrice;
            const upPriceHasChanged = formUpPrice !== originalUpPrice;
            const isPriceValid = finalUpPrice > finalLowPrice;

            if (!isPriceValid) {
                return false;
            }

            return (stockNoHasChanged || remarkHasChanged || lowPriceHasChanged || upPriceHasChanged) && isPriceValid;
        }
    },

    async mounted() {
        await Promise.all([
            this.fetchStockData(),
        ]);
    },

    mounted() {
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
                this.formData.result = 1;
                this.formData.reach = null;
                this.formData.created_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                this.formData.updated_date = null;
                const req = await this.$store.dispatch('api/follow/updateFollow', this.formData);
                this.modal.complete.open = true;
                this.recordLog();
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
            const changes = [];
            const formDataName = this.stocks.find(stock => stock.no === this.formData.stock_no)?.name || 'ยังไม่ระบุ';
            const originalDataName = this.stocks.find(stock => stock.no === this.originalData.stock_no)?.name || 'ยังไม่ระบุ';
            if (this.formData.stock_no !== this.originalData.stock_no) {
                changes.push('ชื่อหุ้น : ' + formDataName + '\n');
            }

            if (this.formData.low_price !== this.originalData.low_price) {
                changes.push('Low Price : ' + this.formData.low_price + '\n');
            }

            if (this.formData.up_price !== this.originalData.up_price) {
                changes.push('Up Price : ' + this.formData.up_price + '\n');
            }

            if (this.formData.remark !== this.originalData.remark) {
                changes.push('หมายเหตุ : ' + this.formData.remark + '\n');
            }
            const log = {
                action: 'แก้ไขข้อมูลการติดตามหุ้น',
                name: originalDataName,
                detail: changes.join(''),
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