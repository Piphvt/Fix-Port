<template flat>
    <v-dialog v-model="dialogOpen" persistent max-width="1000px">
        <v-card>
            <v-card-title class="d-flex justify-center">
                <v-icon justify="center" class="mr-3" size="40" color="#24b224">mdi-cash-register</v-icon>
                <span class="headline">หุ้นที่ซื้อขายหุ้นของลูกค้า</span></v-card-title>
            <v-card-text class="text-center">
                <span v-if="stockData.length > 0 && stockData[0] && stockData[0][0]">
                    รหัสสมาชิก : {{ getCustomerByNo(stockData[0][0].customer_id)?.id }}
                </span>
                <span v-if="stockData.length > 0 && stockData[0] && stockData[0][0]"> |
                    <span v-if="stockData[0][0].date && stockData[0][0].date.includes('-')">
                        ข้อมูลเดือน {{ getMonthName(stockData[0][0].date.split('-')[1]) }} ปี {{
                            stockData[0][0].date.split('-')[0] }}
                    </span>
                    <span v-else-if="stockData[0][0].date">
                        ข้อมูลปี {{ stockData[0][0].date }}
                    </span>
                    <span v-else>
                        ข้อมูลทั้งหมด
                    </span>
                </span>
            </v-card-text>

            <v-card-text>
                <v-data-table :headers="stockHeaders" :items="transformData(stockData)" item-value="stock_id"
                    item-key="stock_id" :items-per-page="5" style="border-spacing: 0 10px;">
                    <template v-slot:body="{ items }">
                        <template v-for="(stock, index) in items" :key="stock.stock_id + '-' + index">
                            <tr v-if="index > 0 && items[index - 1].stock_id !== stock.stock_id">
                                <td colspan="6" style="border-top: 1px solid #ccc;"></td>
                            </tr>

                            <tr>
                                <td class="text-center" :style="{ padding: '10px' }">{{
                                    formatDateTime(stock.updated_date) }}</td>
                                <td class="text-center">{{ getStockByNo(stock.stock_id)?.name || 'ยังไม่ระบุ' }}</td>
                                <td class="text-center" style="color:#00bf63">{{ stock.buy.toLocaleString() }}</td>
                                <td class="text-center" style="color:#ff66c4">{{ stock.sale.toLocaleString() }}</td>
                                <td class="text-center" :style="{ color: getColor(stock.total) }">{{
                                    stock.total.toLocaleString() }}</td>
                                <td class="text-center">
                                    <v-icon style="color:#85d7df" @click="stock.isOpen = !stock.isOpen">
                                        {{ stock.isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                                    </v-icon>
                                </td>
                            </tr>

                            <tr v-if="stock.isOpen" v-for="(grouped, subIndex) in stock.groupedTransactions"
                                :key="(grouped.from_id || 'unknown') + '-' + stock.stock_id + '-' + subIndex">
                                <td colspan="1"></td>
                                <td class="text-center"
                                    :style="{ color: getFromText(getFromByNo(grouped.from_id)?.from).color }">
                                    {{ getFromByNo(grouped.from_id)?.from || 'ยังไม่ระบุ' }}
                                </td>
                                <td class="text-center" :style="{ padding: '10px', color: '#00bf63' }">
                                    {{ grouped.transactions.reduce((sum, tx) => sum + (tx.buy || 0), 0).toLocaleString()
                                    }}
                                </td>
                                <td class="text-center" style="color:#ff66c4">
                                    {{ grouped.transactions.reduce((sum, tx) => sum + (tx.sale || 0),
                                        0).toLocaleString() }}
                                </td>
                                <td class="text-center"
                                    :style="{ color: getColor(grouped.transactions.reduce((sum, tx) => sum + (tx.sale || 0), 0) - grouped.transactions.reduce((sum, tx) => sum + (tx.buy || 0), 0)) }">
                                    {{ (grouped.transactions.reduce((sum, tx) => sum + (tx.sale || 0), 0) -
                                        grouped.transactions.reduce((sum, tx) => sum + (tx.buy || 0), 0)).toLocaleString()
                                    }}
                                </td>
                            </tr>
                        </template>

                    </template>
                </v-data-table>
            </v-card-text>
            <div class="text-center">
                <v-btn class="mb-4" color="#e50211" @click="closeDialog">
                    ปิด
                </v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>

<script>

import moment from 'moment-timezone';
import 'moment/locale/th'
export default {
    props: {
        stockData: {
            type: Array,
            required: true
        },
        dataType: {
            type: String,
            default: ''
        },
        dialogOpen: {
            type: Boolean,
            required: true
        },
    },
    data() {
        return {
            stockHeaders: [
                { text: 'ข้อมูลวันที่', value: 'updated_date', sortable: true, align: 'center' },
                { text: 'ชื่อหุ้น', value: 'stock_id', sortable: false, align: 'center' },
                { text: 'มูลค่าซื้อ', value: 'buy', sortable: false, align: 'center' },
                { text: 'มูลค่าขาย', value: 'sale', sortable: false, align: 'center' },
                { text: 'กำไร/ขาดทุน', value: 'total', sortable: false, align: 'center' },
                { text: 'รายละเอียด', value: 'actions', sortable: false, align: 'center' },
            ],
            groupedHeaders: [
                { text: 'แหล่งที่มา', value: 'from_id', sortable: false, align: 'center' },
                { text: 'มูลค่าซื้อ', value: 'buy', sortable: false, align: 'center' },
                { text: 'มูลค่าขาย', value: 'sale', sortable: false, align: 'center' },
                { text: 'กำไร/ขาดทุน', value: 'total', sortable: false, align: 'center' }
            ],

            customers: [],
            stocks: [],
            froms: [],

        };
    },

    async mounted() {
        await this.fetchCustomerData();
        await this.fetchStockData();
        await this.fetchFromData();
        window.addEventListener('keydown', this.handleEscKey);
    },

    beforeDestroy() {
        window.removeEventListener('keydown', this.handleEscKey);
    },

    methods: {
        getMonthName(monthNumber) {
            const months = [
                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
            ];
            return months[parseInt(monthNumber) - 1];
        },

        toggleOpen(item) {
            item.isOpen = !item.isOpen;
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('YYYY/MM/DD HH:mm');
            }
            return 'ยังไม่ระบุวัน';
        },

        formatValue(value) {
            if (typeof value !== 'number') return 'ยังไม่ระบุ';
            return value.toLocaleString();
        },

        getTotalDifference(item) {
            return (item.from1TotalDifference || 0) +
                (item.from2TotalDifference || 0) +
                (item.from3TotalDifference || 0);
        },

        transformData(rawData) {
            return rawData
                .filter(entry => entry && entry[0])
                .map((entry) => {
                    const { customer_id, stocks } = entry[0];
                    return stocks.map((stock) => ({
                        customer_id,
                        stock_id: stock.stock_id,
                        price: stock.price,
                        amount: stock.amount,
                        buy: stock.Buy,
                        sale: stock.Sale,
                        total: stock.Total,
                        updated_date: stock.updated_date,
                        groupedTransactions: stock.groupedTransactions,
                        isOpen: false,
                    }));
                })
                .flat()
                .sort((a, b) => {
                    const dateA = moment(a.updated_date, 'YYYY-MM-DD HH:mm').toDate();
                    const dateB = moment(b.updated_date, 'YYYY-MM-DD HH:mm').toDate();
                    return dateB - dateA;
                });
        },

        handleEscKey(event) {
            if (event.key === 'Escape') {
                this.closeDialog();
            }
        },

        closeDialog() {
            this.$emit('update:dialogOpen', false);
        },

        async fetchCustomerData() {
            this.customers = await this.$store.dispatch('api/customer/getCustomers');
        },

        getCustomerByNo(custNo) {
            return this.customers.find(customer => customer.no === custNo);
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStocks');
        },

        getStockByNo(stockNo) {
            return this.stocks.find(stock => stock.no === stockNo);
        },

        getColor(value) {
            const numericValue = parseFloat(value);
            if (numericValue < 0) {
                return '#e50211';
            } else if (numericValue >= 0) {
                return '#24b224';
            } else {
                return 'inherit';
            }
        },

        async fetchFromData() {
            this.froms = await this.$store.dispatch('api/from/getFroms');
        },

        getFromByNo(fromNo) {
            return this.froms.find(from => from.no === fromNo);
        },

        getFromText(from) {
            if (from === 'หุ้นเก่า') {
                return { text: 'หุ้นเก่า', color: '#ffc800' };
            } else if (from === 'หุ้นใหม่') {
                return { text: 'หุ้นใหม่', color: '#38b6ff' };
            } else if (from === 'หุ้นแก้เกม') {
                return { text: 'หุ้นแก้เกม', color: '#ff914d' };
            } else {
                return { text: '', color: 'inherit' };
            }
        },
    }
};
</script>
