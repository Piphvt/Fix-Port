<template>
    <v-dialog v-model="FollowCreateOpen" @close="updateOpen(false)" max-width="800px">
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
        <FollowResult :open="showModalResult" :stocks="withdrawalItems" @confirm="confirmAndAddCustomers"
            @cancel="showModalResult = false" @update:open="showModalResult = $event" />

        <v-card flat>
            <v-card-title class="d-flex align-center justify-center mb-3">
                <v-icon color="#24b224">mdi-archive-star</v-icon>&nbsp;
                <h2 class="custom-title">การเฝ้าหุ้นใหม่</h2>
            </v-card-title>
            <v-card-text>
                <v-form ref="form" lazy-validation>
                    <v-row v-for="(item, index) in withdrawalItems" :key="index" align="center">
                        <v-col cols="3">
                            <v-autocomplete v-model="item.stock_no" :items="stocks" item-text="name" item-value="no"
                                label="ชื่อหุ้น" dense outlined :rules="[(v) => !!v || 'กรุณาเลือกชื่อหุ้น']" clearable>
                            </v-autocomplete>
                        </v-col>

                        <v-col cols="2">
                            <v-text-field v-model="item.low_price" label="Low Price" type="text" dense outlined :rules="[
                                (v) => !v || /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข'
                            ]">
                            </v-text-field>
                        </v-col>

                        <v-col cols="2">
                            <v-text-field v-model="item.up_price" label="Up Price" type="text" dense outlined :rules="[
                                (v) => !v || /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข',
                                (v) => !v || parseFloat(v) > parseFloat(item.low_price) || 'Up Price ต้องมากกว่า Low Price'
                            ]">
                            </v-text-field>
                        </v-col>

                        <v-col cols="3">
                            <v-text-field v-model="item.remark" label="หมายเหตุ" type="text" clearable dense
                                outlined></v-text-field>
                        </v-col>

                        <v-col cols="2" class="d-flex align-center">
                            <v-btn icon color="#e50211" @click="removeProduct(index)" class="mb-6"
                                :disabled="withdrawalItems.length === 1">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                            <v-btn color="#24b224" @click="addProduct" text class="mb-6 ml-2">
                                <v-icon left>mdi-archive-star</v-icon> เพิ่ม
                            </v-btn>
                        </v-col>

                    </v-row>
                </v-form>
                <v-card-actions class="card-title-center pa-0">
                    <v-btn color="#24b224" @click="showModalResult = true" :disabled="!isFormValid" class="mr-2">
                        ยืนยัน
                    </v-btn>
                    <v-btn @click="cancel" color="#e50211">
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
    middleware: 'auth',
    async mounted() {
        await this.fetchStockData();
    },

    props: {
        open: {
            type: Boolean,
            required: true,
        },
    },

    data() {
        return {
            FollowCreateOpen: this.open,
            modal: {
                complete: { open: false, message: '' },
                error: { open: false, message: '' },
            },

            showModalResult: false,
            withdrawalItems: [{
                stock_no: null, low_price: null, up_price: null, remark: null
            }],
            stocks: [],
        };
    },

    watch: {
        open(newVal) {
            this.FollowCreateOpen = newVal;
        }
    },

    computed: {
        isFormValid() {
            return this.withdrawalItems.every(item =>
                this.isFloatValid(item.stock_no) &&
                this.isFloatValid(item.low_price) &&
                this.isFloatValid(item.up_price) &&
                this.isValid(item.remark)
            );
        },
    },

    mounted() {
        this.fetchStockData();
        window.addEventListener('keydown', this.handleKeydown);
    },

    beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeydown);
    },

    methods: {
        isFloatValid(value) {
            return !!value && /^[0-9]*\.?[0-9]+$/.test(value);
        },

        isValid(stock_no) {
            return stock_no !== null && stock_no !== '';
        },

        openModal() {
            this.showModalResult = true;
        },

        handleKeydown(event) {
            if (event.key === 'Escape') {
                this.cancel();
            }
        },

        updateOpen(val) {
            this.FollowCreateOpen = val;
            this.$emit('update:open', val);
        },

        goBack() {
            window.location.reload();
        },

        findDuplicateIds(stocks) {
            const names = stocks.map(stock => stock.stock);
            return names.filter((stock, index) => names.indexOf(stock) !== index && stock);
        },

        async confirmAndAddCustomers() {
            for (const stock of this.withdrawalItems) {
                try {
                    await this.$store.dispatch('api/follow/addFollow', {
                        stock_no: stock.stock_no,
                        low_price: stock.low_price,
                        up_price: stock.up_price,
                        remark: stock.remark,
                        result: 1,
                        employee_no: this.$auth.user.no,
                        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                        updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    });
                } catch (error) {
                    console.error('Error adding stock:', error);
                }
            }
            this.modal.complete.message = 'เพิ่มการติดตามหุ้นเรียบร้อยแล้ว!';
            this.modal.complete.open = true;
            this.recordLog();
            this.showModalResult = false;
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

        addProduct() {
            this.withdrawalItems.push({
                stock_no: '',
                low_price: '',
                up_price: '',
                remark: ''
            });
        },

        removeProduct(index) {
            this.withdrawalItems.splice(index, 1);
        },

        cancel() {
            this.newStockType = '';
            this.$emit('update:open', false);
        },

        recordLog() {
            const Employee_Name = this.$auth.user.fname + ' ' + this.$auth.user.lname;
            const Employee_Email = this.$auth.user.email;
            const Employee_Picture = this.$auth.user.picture;
            const details = this.withdrawalItems.map((item, index) => {
                const stockName = this.stocks.find(stock => stock.no === item.stock_no)?.name || 'ยังไม่ระบุ';
                return `หุ้นที่ ${index + 1}\n` +
                    `ชื่อหุ้น : ${stockName || 'ยังไม่ระบุ'}\n` +
                    `Up Price : ${item.low_price}\n` +
                    `Low Price : ${item.up_price}\n` +
                    `หมายเหตุ : ${item.remark || 'ยังไม่ระบุ'}`;
            }).join('\n\n');
            const log = {
                action: 'เพิ่มการติดตามหุ้นใหม่',
                detail: details.trim(),
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

.custom-title {
    font-size: 1rem;
}
</style>
