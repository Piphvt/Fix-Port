<template>
    <v-dialog v-model="DetailCreateOpen" @close="updateOpen(false)" max-width="1000px">
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
        <DetailResult :open="showModalResult" :details="withdrawalItems" :froms="froms" :stocks="stocks"
            :customers="customers" :customer_no="customer_no" :customer_name="customer_name"
            :created_date="created_date" @confirm="confirmAndAddDetails" @cancel="showModalResult = false"
            @update:open="showModalResult = $event" />

        <v-card flat>
            <v-card-title class="d-flex align-center justify-center mb-3">
                <v-icon color="#24b224">mdi-cash-plus</v-icon>&nbsp;
                <h2 class="custom-title">เพิ่มหุ้นของลูกค้า</h2>
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
                    <v-row class="mb-0 mt-0 pa-0" v-for="(item, index) in withdrawalItems" :key="index" align="center">
                        <v-col cols="2" class="ml-3">
                            <v-autocomplete v-model="item.stock_no" :items="stocks" item-text="name" item-value="no"
                                label="ชื่อหุ้นที่ติด" dense outlined :disabled="!isSearchValid" :rules="[(v) => !!v || 'กรุณากรอกชื่อหุ้น']" clearable>
                            </v-autocomplete>
                        </v-col>

                        <v-col cols="2">
                            <v-text-field v-model="item.price" label="ราคาที่ติด" type="text" dense outlined
                                :disabled="!canEditItem(item)"
                                :rules="[(v) => !v || /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข']">
                            </v-text-field>
                        </v-col>

                        <v-col cols="2">
                            <v-text-field v-model="item.amount" label="จำนวนที่ติด" type="text" dense outlined
                                :disabled="!canEditItem(item)"
                                :rules="[(v) => !v || /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข']">
                            </v-text-field>
                        </v-col>

                        <v-col cols="2">
                            <v-menu v-model="datePickerMenus[index]" :close-on-content-click="false"
                                transition="scale-transition" offset-y min-width="auto">
                                <template v-slot:activator="{ on, attrs }">
                                    <v-text-field v-model="item.created_date" label="วันที่ซื้อหุ้น" readonly
                                        v-bind="attrs" v-on="on" outlined dense
                                        :disabled="!canEditItem(item)"></v-text-field>
                                </template>
                                <v-date-picker v-model="item.created_date" @input="datePickerMenus[index] = false"
                                    locale="th"></v-date-picker>
                            </v-menu>
                        </v-col>

                        <v-col cols="2">
                            <v-select v-model="item.from_no" :items="froms" item-text="name" item-value="no"
                                label="ที่มาที่ไป" dense outlined :disabled="!canEditItem(item)">
                            </v-select>
                        </v-col>

                        <v-col cols="1" class="d-flex align-center">
                            <v-btn icon color="#e50211" @click="removeProduct(index)" class="mb-6"
                                :disabled="withdrawalItems.length === 1">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                            <v-btn color="#24b224" @click="addProduct" text class="mb-6 ml-2">
                                <v-icon left>mdi-bank-plus</v-icon> เพิ่ม
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-form>
                <v-card-actions class="card-title-center pa-0">
                    <v-btn color="#24b224" @click="showModalResult = true" :disabled="!isFormValid || !isSearchValid"
                        class="mr-2">
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
        await this.fetchCustomerData()
        await this.fetchStockData()
        await this.fetchFromData()
    },

    props: {
        open: {
            type: Boolean,
            required: true,
        },
    },

    data() {
        return {
            DetailCreateOpen: this.open,

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

            created_date: '',
            datePickerMenus: [],
            datePickerMenu: false,

            showModalResult: false,
            withdrawalItems: [{
                stock_no: null, price: null, amount: null, from_no: 1, comment: null, created_date: null
            }],

            customers: [],
            stocks: [],
            froms: [],
        };
    },

    watch: {
        open(newVal) {
            this.DetailCreateOpen = newVal;
        },
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
                    this.isFromValid(item.from_no)
                )
            );
        },

        isSearchValid() {
            return (
                this.searchBy &&
                (this.searchBy === 'customer_name' ? this.customer_name : this.customer_no)
            );
        },

        canEditItem() {
            return (item) => this.isSearchValid && !!item.stock_no;
        },
    },

    mounted() {
        this.fetchCustomerData()
        this.fetchStockData()
        this.fetchFromData()
        window.addEventListener('keydown', this.handleKeydown);
    },

    beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeydown);
    },

    methods: {
        async fetchFromData() {
            try {
                const response = await this.$store.dispatch('api/from/getFrom');
                if (response) {
                    this.froms = response.map(item => ({ no: item.no, name: item.from }));
                }
            } catch (error) {
            }
        },

        async fetchStockData() {
            try {
                const response = await this.$store.dispatch('api/stock/getStock');
                if (response) {
                    this.stocks = response.map(item => ({ no: item.no, name: item.stock }));
                }
            } catch (error) {
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

        getCustomerID(customerId) {
            const customer = this.customers.find(c => c.no === customerId);
            return customer ? customer.id : 'ไม่ทราบ';
        },

        isFromValid(from_no) {
            return from_no !== null && from_no !== '';
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
            this.DetailCreateOpen = val;
            this.$emit('update:open', val);
        },

        goBack() {
            window.location.reload();
        },

        async confirmAndAddDetails() {
            for (const item of this.withdrawalItems) {
                const stock = this.stocks.find(stock => stock.no === item.stock_no);
                const customerIdentifier = this.customer_no || this.customer_name;

                try {
                    await this.$store.dispatch('api/detail/addDetail', {
                        customer_no: customerIdentifier,
                        stock_no: item.stock_no,
                        price: item.price,
                        amount: item.amount,
                        from_no: item.from_no,
                        employee_no: this.$auth.user.no,
                        created_date: item.created_date || moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                        updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    });
                } catch (error) {
                    this.modal.error.message = `เกิดข้อผิดพลาดบางอย่าง : ${error}`;
                    this.modal.error.open = true;
                }
            }
            this.modal.complete.message = 'เพิ่มข้อมูลเรียบร้อย!';
            this.modal.complete.open = true;
            this.showModalResult = false;
        },


        findDuplicateIds(stocks) {
            const names = stocks.map(stock => stock.stock);
            return names.filter((stock, index) => names.indexOf(stock) !== index && stock);
        },

        addProduct() {
            this.withdrawalItems.push({
                stock_no: null,
                price: null,
                amount: null,
                from_no: 1,
                comment: null,
                created_date: null
            });
            this.datePickerMenus.push(false);
        },

        removeProduct(index) {
            this.withdrawalItems.splice(index, 1);
            this.datePickerMenus.splice(index, 1);
        },

        cancel() {
            this.newStockType = '';
            this.$emit('update:open', false);
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
