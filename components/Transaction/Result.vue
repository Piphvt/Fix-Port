<template>
    <v-dialog v-model="showModalResult" max-width="800px">
        <v-card>
            <v-card-title class="d-flex align-center justify-center">
                <v-icon justify="center" class="mr-3" size="30" color="#24b224">mdi-alert-circle</v-icon>
                <span class="custom-title">ตรวจสอบความถูกต้อง</span>
            </v-card-title>
            <v-card-text>
                <v-data-table :headers="headers" :items="formattedStocks" class="elevation-1" hide-default-footer>
                    <template v-slot:top>
                    </template>
                    
                </v-data-table>
            </v-card-text>
            <v-card-actions class="d-flex justify-center">
                <v-btn color="#24b224" @click="confirm" class="mb-4">ยืนยัน</v-btn>
                <v-btn color="#e50211" @click="cancel" class="ml-2 mb-4">ยกเลิก</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import moment from 'moment';

export default {
    props: {
        open: Boolean,
        detail_amount: Array,
        type: Number,
        stocks: Array,
        customers: Array,
        customer_no: Number,
        customer_name: Number,
        commission_no: Number
    },
    data() {
        return {
            fetchstocks: [],
            fetchdetails: [],
            fetchcommissions: [],
            showModalResult: this.open,
            headers: [
                { text: 'รหัสลูกค้า', value: 'customer_no', sortable: false, align: 'center', cellClass: 'text-center' },
                { text: 'ชื่อเล่น', value: 'customer_name', sortable: false, align: 'center', cellClass: 'text-center' },
                { text: 'ชื่อหุ้น', value: 'stock_name', sortable: false, align: 'center', cellClass: 'text-center' },
                { text: 'จำนวน', value: 'price', sortable: false, align: 'center', cellClass: 'text-center' },
                { text: 'ราคา', value: 'amount', sortable: false, align: 'center', cellClass: 'text-center' },
                { text: 'ค่าธรรมเนียม', value: 'commission', sortable: false, align: 'center', cellClass: 'text-center' },
                { text: 'การกระทำ', value: 'action', sortable: false, align: 'center', cellClass: 'text-center' },
                { text: 'วันที่ซื้อ/ขาย', value: 'created_date', sortable: false, align: 'center', cellClass: 'text-center' },
            ],
        };
    },
    computed: {
        formattedStocks() {
            const customers = this.customers || [];

            return this.detail_amount.map(detail => {
                const detailName = this.getStockByDetail(detail.stock_no);
                const stockName = this.getStockName(detailName)
                const commissionAmount = this.getCommissionAmount(this.commission_no)

                const customer = customers.find(c => c.no === this.customer_no) ||
                    customers.find(c => c.no === this.customer_name) ||
                    { name: '', id: '' };

                return {
                    ...detail,
                    stock_name: stockName,
                    customer_no: customer.id,
                    customer_name: customer.name,
                    action: this.getTypeText(detail.type),
                    commission: commissionAmount,
                    created_date: detail.created_date || moment().format('YYYY-MM-DD'),
                };
            });
        },
    },

    async mounted() {
        await this.fetchStockData();
        await this.fetchDetailData();
        await this.fetchCommissionData();
        document.addEventListener('keydown', this.handleKeydown);
    },

    beforeDestroy() {
        document.removeEventListener('keydown', this.handleKeydown);
    },

    methods: {
        async fetchStockData() {
            this.fetchstocks = await this.$store.dispatch('api/stock/getStock');
        },

        getStockName(stockId) {
            const stock = this.fetchstocks.find(s => s.no === stockId);
            return stock ? stock.stock : 'ยังไม่ระบุ';
        },

        async fetchCommissionData() {
            this.fetchcommissions = await this.$store.dispatch('api/commission/getCommission');
        },

        getCommissionAmount(commissionId) {
            const commission = this.fetchcommissions.find(c => c.no === commissionId);
            return commission ? commission.commission : 'ยังไม่ระบุ';
        },

        async fetchDetailData() {
            this.fetchdetails = await this.$store.dispatch('api/detail/getDetail');
        },

        getStockByDetail(DetailId) {
            const detail = this.fetchdetails.find(d => d.no === DetailId);
            return detail ? detail.stock_no : 'ยังไม่ระบุ';
        },

        getTypeText(value) {
            if (value === 1) return 'ซื้อ';
            if (value === 2) return 'ขาย';
            return '';
        },

        confirm() {
            this.$emit('confirm');
        },

        cancel() {
            this.$emit('cancel');
            this.showModalResult = false;
        },

        handleKeydown(event) {
            if (this.showModalResult) {
                if (event.key === 'Escape') {
                    this.cancel();
                } else if (event.key === 'Enter') {
                    this.confirm();
                }
            }
        },
    },
    watch: {
        open(newValue) {
            this.showModalResult = newValue;
        },
        showModalResult(newValue) {
            this.$emit('update:open', newValue);
        }
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

.v-card-title .custom-title {
    font-size: 1.5rem !important;
}
</style>
