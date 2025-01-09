<template>
    <v-dialog v-model="TransactionCreateOpen" @close="updateOpen(false)" max-width="1000px">
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
        <TransactionResult :open="showModalResult" :detail_amount="withdrawalItems"
            :stocks="withdrawalItems.map(item => ({ stock_no: item.stock_no }))" :customers="customers"
            :customer_no="customer_no" :customer_name="customer_name" :type="type" @confirm="confirmAndAddDetails"
            @cancel="showModalResult = false" @update:open="showModalResult = $event" />

        <v-card flat>
            <v-card-title class="d-flex align-center justify-center mb-3">
                <v-icon color="#24b224">mdi-cash-plus</v-icon>&nbsp;
                <h2 class="custom-title">เพิ่มการซื้อขายหุ้นของลูกค้า</h2>
            </v-card-title>
            <v-card-text>
                <v-form ref="form" lazy-validation>
                    <v-row class="mb-0 mt-0 pa-0 justify-center">
                        <v-col cols="2" class="ml-2">
                            <v-select v-model="searchBy" :items="searchOptions" label="ค้นหาจาก" dense outlined>
                            </v-select>
                        </v-col>
                        <v-col cols="3">
                            <v-autocomplete v-if="searchBy === 'customer_name'" v-model="customer_name"
                                :items="customers" item-text="name" item-value="no" label="ชื่อลูกค้า" dense outlined
                                clearable :rules="[(v) => !!v || 'กรุณากรอกชื่อลูกค้า']">
                            </v-autocomplete>
                            <v-autocomplete v-else-if="searchBy === 'customer_no'" v-model="customer_no"
                                :items="customers" item-text="id" item-value="no" label="รหัสลูกค้า" dense outlined
                                clearable :rules="[(v) => !!v || 'กรุณากรอกรหัสลูกค้า']">
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-row v-for="(item, index) in withdrawalItems" :key="index" align="center">
                        <v-col cols="2" class="ml-6">
                            <v-autocomplete v-model="item.stock_no" :items="detail_amount" item-text="name"
                                item-value="no" label="ชื่อหุ้น" dense outlined
                                :rules="[(v) => !!v || 'กรุณากรอกชื่อหุ้น']" clearable @change="updateStockData(item)">
                            </v-autocomplete>
                        </v-col>

                        <v-col cols="2">
                            <v-text-field v-model="item.price" label="ราคา" type="text" dense outlined
                                :rules="[(v) => !v || /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข']">
                            </v-text-field>
                        </v-col>

                        <v-col cols="2">
                            <v-text-field v-model="item.amount" label="จำนวน" type="text" dense outlined
                                :rules="[(v) => !v || /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข']">
                            </v-text-field>
                        </v-col>

                        <v-col cols="2">
                            <v-autocomplete v-model="item.commission_no" :items="commissions" item-text="name"
                                item-value="no" label="ค่าธรรมเนียม" dense outlined clearable
                                :rules="[(v) => !!v || 'กรุณากรอกค่าธรรมเนียม']">
                            </v-autocomplete>
                        </v-col>

                        <v-col cols="2">
                            <v-select v-model="item.type"
                                :items="[{ value: 1, text: 'ซื้อ' }, { value: 2, text: 'ขาย' }]" item-text="text"
                                item-value="value" label="ซื้อ/ขาย" dense outlined clearable
                                :rules="[(v) => !!v || 'กรุณาเลือกซื้อหรือขาย']">
                            </v-select>
                        </v-col>

                        <v-col cols="1" class="d-flex align-center">
                            <v-btn icon color="#e50211" @click="removeProduct(index)" class="mb-6"
                                :disabled="withdrawalItems.length === 1">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                            <v-btn color="#24b224" @click="addProduct" text class="mb-6 ml-2">
                                <v-icon left>mdi-cash-plus</v-icon> เพิ่ม
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
    async fetch() {
        await this.fetchCustomerData()
        await this.fetchStockData()
        await this.fetchCommissionData()
        await this.fetchDetailAmountData()
        await this.fetchTransactionData();
        await this.fetchDetailData();
    },

    props: {
        open: {
            type: Boolean,
            required: true,
        },
    },

    data() {
        return {
            TransactionCreateOpen: this.open,

            modal: {
                complete: { open: false, message: '' },
                error: { open: false, message: '' },
            },

            searchBy: 'customer_no',
            searchOptions: [
                { text: 'รหัสลูกค้า', value: 'customer_no' },
                { text: 'ชื่อลูกค้า', value: 'customer_name' }
            ],
            customer_no: null,
            customer_name: null,

            showModalResult: false,
            withdrawalItems: [{
                stock_no: null, price: null, amount: null, type: 2, commission_no: 2,
            }],

            customers: [],
            commissions: [],
            stocks: [],
            detail_amount: [],
            transactions: [],
            details: []
        };
    },

    watch: {
        open(newVal) {
            this.TransactionCreateOpen = newVal;
        },
        customer_no: {
            handler: 'fetchDetailAmountData',
            immediate: true
        },
        customer_name: {
            handler: 'fetchDetailAmountData',
            immediate: true
        }
    },

    computed: {
        isFormValid() {
            const isCustomerNameValid = this.searchBy === 'customer_name' ? this.customer_name : true;
            const isCustomerIdValid = this.searchBy === 'customer_no' ? this.customer_no : true;

            return (
                isCustomerNameValid &&
                isCustomerIdValid &&
                this.withdrawalItems.every(item =>
                    this.isStockValid(item.stock_no) &&
                    this.isPriceValid(item.price) &&
                    this.isAmountValid(item.amount) &&
                    this.isAmountValid(item.type)
                )
            );
        },
    },

    mounted() {
        this.fetchCustomerData()
        this.fetchStockData()
        this.fetchCommissionData()
        this.fetchDetailAmountData()
        this.fetchTransactionData();
        this.fetchDetailData();
        window.addEventListener('keydown', this.handleKeydown);
    },

    beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeydown);
    },

    methods: {
        async fetchTransactionData() {
            this.transactions = await this.$store.dispatch('api/transaction/getTransaction');
        },

        async fetchDetailData() {
            this.details = await this.$store.dispatch('api/detail/getDetail');
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock');
        },

        async fetchDetailAmountData() {
            this.detail_amount = [];
            const customerIdentifier = this.customer_no || this.customer_name;
            if (!customerIdentifier) return;

            try {
                const response = await this.$store.dispatch('api/detail/getDetail', { customer_no: customerIdentifier });
                this.detail_amount = response.filter(detail =>
                    detail.customer_no === customerIdentifier || detail.customer_name === customerIdentifier
                );

                await this.fetchStockData();
                await this.fetchTransactionData();

                this.detail_amount = this.detail_amount.map(detail => {
                    const stock = this.stocks.find(stock => stock.no === detail.stock_no);

                    const relatedTransactions = this.transactions.filter(
                        transaction => transaction.stock_detail_no === detail.no
                    );

                    const remainingAmount = relatedTransactions.reduce((total, transaction) => {
                        if (transaction.type === 1) {
                            return total + parseFloat(transaction.amount || 0);
                        } else if (transaction.type === 2) {
                            return total - parseFloat(transaction.amount || 0);
                        }
                        return total;
                    }, parseFloat(detail.amount || 0));

                    if (remainingAmount === 0) {
                        return null;
                    }

                    return {
                        ...detail,
                        name: stock ? `${stock.stock} (${remainingAmount.toLocaleString(2)})` : 'ไม่พบหุ้น',
                        remainingAmount,
                    };
                }).filter(detail => detail !== null);

            } catch (error) {
                this.detail_amount = [];
            }
        },

        async fetchCustomerData() {
            try {
                const response = await this.$store.dispatch('api/customer/getCustomer');
                if (response) {
                    this.customers = response.map(item => ({ no: item.no, id: item.id, name: item.nickname }));
                }
            } catch (error) {
            }
        },

        async fetchCommissionData() {
            try {
                const response = await this.$store.dispatch('api/commission/getCommission');
                if (response) {
                    this.commissions = response.map(item => ({ no: item.no, name: item.commission }));
                }
            } catch (error) {
            }
        },

        updateStockData(item) {
            const stockDetail = this.detail_amount.find(d => d.no === item.stock_no);
            if (stockDetail) {
                item.stock_detail_no = stockDetail.no;
            } else {
                item.stock_detail_no = null;
            }
        },

        isStockValid(stock_no) {
            return stock_no !== null && stock_no !== '';
        },

        isPriceValid(price) {
            return price !== null && price !== '';
        },

        isAmountValid(amount) {
            return amount !== null && amount !== '';
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
            this.TransactionCreateOpen = val;
            this.$emit('update:open', val);
        },

        goBack() {
            window.location.reload();
        },

        async confirmAndAddDetails() {
            await this.fetchDetailData();
            await this.fetchTransactionData();

            let isTransactionAdded = false;

            for (const transaction of this.withdrawalItems) {
                const stockDetailId = transaction.stock_detail_no;

                const matchingDetail = this.details.find(detail => detail.no === stockDetailId);

                const relatedTransactions = this.transactions
                    .filter(t => t.stock_detail_no === stockDetailId)
                    .sort((a, b) => new Date(a.updated_date) - new Date(b.updated_date));

                let totalBuyAmount = relatedTransactions
                    .filter(t => t.type === 1)
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                let totalSellAmount = relatedTransactions
                    .filter(t => t.type === 2)
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                let remainingBuyAmount = totalBuyAmount - totalSellAmount;

                let sellAmount = parseFloat(transaction.amount);

                while (sellAmount > 0) {
                    if (remainingBuyAmount > 0) {
                        const deductionAmount = Math.min(sellAmount, remainingBuyAmount);

                        try {
                            await this.$store.dispatch('api/transaction/addTransaction', {
                                stock_detail_no: stockDetailId,
                                type: transaction.type,
                                price: parseFloat(transaction.price),
                                amount: deductionAmount,
                                commission_no: transaction.commission_no,
                                from_no: 3,
                                employee_no: this.$auth.user.no,
                                created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                                updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                            });

                            isTransactionAdded = true;
                        } catch (error) {
                            this.modal.error.message = `เกิดข้อผิดพลาด`;
                            this.modal.error.open = true;
                        }

                        sellAmount -= deductionAmount;
                        remainingBuyAmount -= deductionAmount;
                    } else if (matchingDetail && matchingDetail.amount > 0) {
                        const deductionAmount = Math.min(sellAmount, parseFloat(matchingDetail.amount));

                        try {
                            await this.$store.dispatch('api/transaction/addTransaction', {
                                stock_detail_no: stockDetailId,
                                type: transaction.type,
                                price: parseFloat(transaction.price),
                                amount: deductionAmount,
                                commission_no: transaction.commission_no,
                                from_no: matchingDetail.from_no || 3,
                                employee_no: this.$auth.user.no,
                                created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                                updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                            });

                            isTransactionAdded = true;
                        } catch (error) {
                            this.modal.error.message = `เกิดข้อผิดพลาด`;
                            this.modal.error.open = true;
                        }

                        sellAmount -= deductionAmount;

                        if (matchingDetail) {
                            matchingDetail.amount = parseFloat(matchingDetail.amount) - deductionAmount;
                        }
                    } else {
                        this.modal.error.message = `จำนวนหุ้นที่ขายมากกว่าจำนวนหุ้นที่มี`;
                        this.modal.error.open = true;
                        break;
                    }
                }
            }

            if (isTransactionAdded) {
                this.modal.complete.message = 'เพิ่มการซื้อขายหุ้นเรียบร้อยแล้ว!';
                this.modal.complete.open = true;
            }

            this.showModalResult = false;
        },


        findDuplicateIds(stocks) {
            const names = stocks.map(stock => stock.name);
            return names.filter((name, index) => names.indexOf(name) !== index && name);
        },

        addProduct() {
            this.withdrawalItems.push({
                stock_no: null,
                name: '',
                commission_no: 2,
                type: 2,
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
