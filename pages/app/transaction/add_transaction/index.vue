<template>
    <div>
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
        <ResultTransaction :open="showModalResult" :detail_amount="withdrawalItems"
            :stocks="withdrawalItems.map(item => ({ stock_id: item.stock_id }))" :customers="customers"
            :customer_id="customer_id" :customer_name="customer_name" :type="type" @confirm="confirmAndAddDetails"
            @cancel="showModalResult = false" @update:open="showModalResult = $event" />

        <v-card class="custom-card" flat>
            <v-card-title class="d-flex align-center justify-center">
                <v-icon class="little-icon" color="#24b224">mdi-cash-plus</v-icon> &nbsp;
                <h3 class="mb-0">ข้อมูลการซื้อขายหุ้นของลูกค้าใหม่</h3>
            </v-card-title>

            <v-row class="mb-0 mt-0 pa-0 justify-center">
                <v-col cols="2" class="ml-2">
                    <v-select v-model="searchBy" :items="searchOptions" label="ค้นหาจาก" dense outlined>
                    </v-select>
                </v-col>
                <v-col cols="3">
                    <v-autocomplete v-if="searchBy === 'customer_name'" v-model="customer_name" :items="customers"
                        item-text="name" item-value="no" label="ชื่อลูกค้า" dense outlined clearable
                        :rules="[(v) => !!v || 'กรุณากรอกชื่อลูกค้า']">
                    </v-autocomplete>
                    <v-autocomplete v-else-if="searchBy === 'customer_id'" v-model="customer_id" :items="customers"
                        item-text="id" item-value="no" label="รหัสลูกค้า" dense outlined clearable
                        :rules="[(v) => !!v || 'กรุณากรอกรหัสลูกค้า']">
                    </v-autocomplete>
                </v-col>
            </v-row>


            <v-card-text class="mb-0 mt-0 pa-0">
                <v-form>
                    <v-row class="mb-0 mt-0 pa-0" v-for="(item, index) in withdrawalItems" :key="index" align="center">
                        <v-col cols="2" class="ml-6">
                            <v-autocomplete v-model="item.stock_id" :items="detail_amount" item-text="name"
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
                            <v-autocomplete v-model="item.commission_id" :items="commissions" item-text="name"
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
                            <v-btn icon color="#e50211" @click="removeProduct(index)" class="mb-6">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                            <v-btn color="#24b224" @click="addProduct" text class="mb-6 ml-2">
                                <v-icon left>mdi-cash-plus</v-icon> เพิ่ม
                            </v-btn>
                        </v-col>
                    </v-row>

                    <div class="text-center">
                        <v-btn color="#24b224" @click="showModalResult = true" :disabled="!isFormValid"
                            class="mr-2 mb-3">
                            บันทึก
                        </v-btn>
                        <v-btn color="#e50211" @click="goToStocksTransaction" class="mb-3">
                            ย้อนกลับ
                        </v-btn>
                    </div>
                </v-form>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
import moment from 'moment'
moment.locale('th')

export default {
    layout: 'user',
    middleware: 'auth',

    async mounted() {
        await this.checkRank()
        await this.fetchCustomerData()
        await this.fetchStockData()
        await this.fetchCommissionData()
        await this.fetchDetailAmountData()
        await this.fetchTransactionData();
        await this.fetchDetailData();
    },

    watch: {
        customer_id: {
            handler: 'fetchDetailAmountData',
            immediate: true
        },
        customer_name: {
            handler: 'fetchDetailAmountData',
            immediate: true
        }
    },

    data() {
        return {
            modal: {
                complete: {
                    open: false,
                    message: ''
                },
                error: {
                    open: false,
                    message: ''
                },
            },
            searchBy: 'customer_id',
            searchOptions: [
                { text: 'รหัสลูกค้า', value: 'customer_id' },
                { text: 'ชื่อลูกค้า', value: 'customer_name' }
            ],
            customer_id: null,
            customer_name: null,

            valid: false,
            showModalResult: false,
            withdrawalItems: [{
                stock_id: null, dividend_amount: null, price: null, amount: null,
                closing_price: null, type: 2, commission_id: 2,
            }],

            customers: [],
            commissions: [],
            stocks: [],
            detail_amount: [],
            transactions: [],
            details: []

        }
    },

    computed: {
        isFormValid() {
            const isCustomerNameValid = this.searchBy === 'customer_name' ? this.customer_name : true;
            const isCustomerIdValid = this.searchBy === 'customer_id' ? this.customer_id : true;

            return (
                isCustomerNameValid &&
                isCustomerIdValid &&
                this.withdrawalItems.every(item =>
                    this.isStockValid(item.stock_id) &&
                    this.isPriceValid(item.price) &&
                    this.isAmountValid(item.amount) &&
                    this.isAmountValid(item.type)
                )
            );
        },
    },

    methods: {
        async fetchTransactionData() {
            this.transactions = await this.$store.dispatch('api/transaction/getTransactions');
        },

        async fetchDetailData() {
            this.details = await this.$store.dispatch('api/detail/getDetails');
        },

        async fetchStockData() {
            const stockData = await this.$store.dispatch('api/stock/getStocks');
            this.stocks = stockData;

            this.withdrawalItems.forEach((item) => {
                if (item.stock_id) {
                    const stock = stockData.find(stock => stock.no === item.stock_id);
                    if (stock) {
                        item.dividend_amount = stock.dividend_amount;
                        item.closing_price = stock.closing_price;
                    } else {
                        item.dividend_amount = null;
                        item.closing_price = null;
                    }
                }
            });
        },

        async fetchDetailAmountData() {
            this.detail_amount = [];
            const customerIdentifier = this.customer_id || this.customer_name;
            if (!customerIdentifier) return;

            try {
                const response = await this.$store.dispatch('api/detail/getDetails', { customer_id: customerIdentifier });
                this.detail_amount = response.filter(detail =>
                    detail.customer_id === customerIdentifier || detail.customer_name === customerIdentifier
                );

                await this.fetchStockData();
                await this.fetchTransactionData();

                this.detail_amount = this.detail_amount.map(detail => {
                    const stock = this.stocks.find(stock => stock.no === detail.stock_id);

                    const relatedTransactions = this.transactions.filter(
                        transaction => transaction.stock_detail_id === detail.no
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
                        name: stock ? `${stock.name} (${remainingAmount.toLocaleString(2)})` : 'ไม่พบหุ้น',
                        remainingAmount,
                    };
                }).filter(detail => detail !== null);

            } catch (error) {
                this.detail_amount = [];
            }
        },


        updateStockData(item) {
            const stockDetail = this.detail_amount.find(d => d.no === item.stock_id);
            if (stockDetail) {
                item.stock_detail_id = stockDetail.no;
            } else {
                item.stock_detail_id = null;
            }
        },

        isStockValid(stock_id) {
            return stock_id !== null && stock_id !== '';
        },

        isPriceValid(price) {
            return price !== null && price !== '';
        },

        isAmountValid(amount) {
            return amount !== null && amount !== '';
        },

        async checkRank() {
            if (this.$auth.loggedIn) {
                const Status = this.$auth.user.status.toString();
                const RankID = this.$auth.user.ranks_id.toString();
                if (Status === '2') {
                    this.$router.push('/');
                    await this.$auth.logout();
                }
                else {
                    if (RankID === '1') {
                        this.$router.push('/app/transaction/add_transaction');
                    } else if (RankID === '2') {
                        this.$router.push('/app/transaction/add_transaction');
                    } else if (RankID === '3') {
                        this.$router.push('/app/transaction/add_transaction');
                    } else {
                        this.$router.push('/auth');
                    }
                }
            } else {
                this.$router.push('/');
            }
        },

        openModal() {
            this.showModalResult = true;
        },

        async confirmAndAddDetails() {
            await this.fetchDetailData();
            await this.fetchTransactionData();

            let isTransactionAdded = false;

            for (const transaction of this.withdrawalItems) {
                const stock = this.stocks.find(stock => stock.no === transaction.stock_id);
                const stockDetailId = transaction.stock_detail_id;

                let from_id = 3;
                if (transaction.type === 2) {
                    const matchingDetail = this.details.find(d => d.no === stockDetailId);
                    const matchingTransactions = this.transactions.filter(t => t.stock_detail_id === stockDetailId);

                    const totalBuyAmount = matchingTransactions
                        .filter(t => t.type === 1)
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                    const totalSellAmount = matchingTransactions
                        .filter(t => t.type === 2)
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                    const remainingAmount = totalBuyAmount + parseFloat(matchingDetail?.amount || 0) - totalSellAmount;

                    if (transaction.amount > remainingAmount) {
                        continue;
                    }

                    if (matchingDetail) {
                        from_id = matchingDetail.from_id;
                    }
                }

                try {
                    await this.$store.dispatch('api/transaction/addTransaction', {
                        stock_detail_id: stockDetailId,
                        type: transaction.type,
                        price: parseFloat(transaction.price),
                        amount: parseFloat(transaction.amount),
                        commission_id: transaction.commission_id,
                        from_id: from_id,
                        emp_id: this.$auth.user.no,
                        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                        updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    });

                    isTransactionAdded = true;
                } catch (error) {
                    this.modal.error.message = `เกิดข้อผิดพลาด`;
                    this.modal.error.open = true;
                }
            }

            if (isTransactionAdded) {
                this.modal.complete.message = 'เพิ่มการซื้อขายหุ้นเรียบร้อยแล้ว!';
                this.modal.complete.open = true;
            } else {
                this.modal.error.message = `จำนวนหุ้นที่ขายมากกว่าจำนวนหุ้นที่มี`;
                this.modal.error.open = true;
            }

            this.showModalResult = false;
        },


        findDuplicateIds(stocks) {
            const names = stocks.map(stock => stock.name);
            return names.filter((name, index) => names.indexOf(name) !== index && name);
        },

        async fetchCustomerData() {
            try {
                const response = await this.$store.dispatch('api/customer/getCustomers');
                if (response) {
                    this.customers = response.map(item => ({ no: item.no, id: item.id, name: item.nickname }));
                }
            } catch (error) {
            }
        },

        async fetchCommissionData() {
            try {
                const response = await this.$store.dispatch('api/commission/getCommissions');
                if (response) {
                    this.commissions = response.map(item => ({ no: item.no, name: item.commission }));
                }
            } catch (error) {
            }
        },

        addProduct() {
            this.withdrawalItems.push({
                stock_id: null,
                name: '',
                commission_id: 2,
                dividend_amount: null,
                closing_price: null,
                type: 2,
            });
        },

        removeProduct(index) {
            this.withdrawalItems.splice(index, 1);
        },

        goBack() {
            this.$router.push('/app/transaction/customer_trade');
        },

        recordLog() {
            const detail_amount = this.withdrawalItems.map((item, index) => {
                return `TRANSACTION ${index + 1}\nNAME ${item.name}\nTYPE ${setName}\nDIVIDEND ${item.dividend_amount}\nCLOSE ${item.closing_price}}`;
            }).join('\n\n');

            const log = {
                emp_name: this.$auth.user.fname + ' ' + this.$auth.user.lname,
                emp_email: this.$auth.user.email,
                detail: detail_amount.trim(),
                type: 1,
                picture: this.$auth.user.picture || 'Unknown',
                action: 'เพิ่มหุ้นของลูกค้า',
                time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };

            this.$store.dispatch('api/log/addLogs', log);
        },

        goToStocksTransaction() {
            this.$router.push('/app/transaction/customer_trade');
        },
    },
};
</script>

<style scoped>
.little-icon {
    font-size: 3rem;
    margin-right: 8px;
    margin-left: 8px;
}

.custom-card {
    max-width: 1200px;
    width: 100%;
    margin: auto;
}
</style>
