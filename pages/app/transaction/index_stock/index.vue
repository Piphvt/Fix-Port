<template>

    <div>
        <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />
        <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen" @update:confirm="modalConfirmOpen = false" />
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <EditStockDetail :open="editAllDialog" :data="editAllData" @update:edit="editAllDialog = false" />

        <v-card flat>
            <v-container>
                <v-row justify="center" align="center">
                    <v-col cols="auto">
                        <v-card-title class="d-flex align-center justify-center">
                            <v-icon class="little-icon" color="#85d7df">mdi-cash-register</v-icon>&nbsp;
                            <h3 class="mb-0">สรุปผลการซื้อขายหุ้นของลูกค้า</h3>
                        </v-card-title>
                        <div class="d-flex align-center mt-2 justify-center">
                            <div class="d-flex align-center mt-2 justify-center">
                                <v-icon class="small-icon" @click="toggleSavedSearchesDialog">
                                    mdi-format-list-bulleted-type
                                </v-icon>
                                <span>{{ savedSearches.length }}</span>
                            </div>

                            <v-dialog v-model="showSavedSearchesDialog" max-width="400px">
                                <v-card>
                                    <v-card-title class="headline"
                                        style="justify-content: center; display: flex;">บันทึกการค้นหา</v-card-title>
                                    <v-card-text>
                                        <v-list>
                                            <v-list-item-group v-if="savedSearches.length > 0">
                                                <v-list-item v-for="(search, index) in savedSearches" :key="index">
                                                    <v-list-item-content>
                                                        <v-list-item-title>
                                                            <strong>ประเภท :</strong>
                                                            {{ getSearchTypeText(search.type) }}
                                                        </v-list-item-title>
                                                        <v-list-item-subtitle v-if="search.query">
                                                            <strong>รายละเอียด :</strong> {{ search.query }}
                                                        </v-list-item-subtitle>
                                                        <v-list-item-subtitle v-if="search.start && search.end">
                                                            <strong>ระยะเวลา :</strong> {{
                                                                formatDateTime(search.start)
                                                            }} - {{ formatDateTime(search.end) }}
                                                        </v-list-item-subtitle>
                                                        <v-list-item-subtitle v-if="search.topics">
                                                            <strong>หัวข้อ :</strong> {{ search.topics.join(', ') }}
                                                        </v-list-item-subtitle>
                                                    </v-list-item-content>
                                                    <v-list-item-action>
                                                        <v-btn icon @click="deleteSearch(index)">
                                                            <v-icon color=#e50211>mdi-delete</v-icon>
                                                        </v-btn>
                                                    </v-list-item-action>
                                                </v-list-item>
                                            </v-list-item-group>
                                            <v-list-item v-else>
                                                <v-list-item-content style="justify-content: center; display: flex;">
                                                    <v-icon color=#e50211>mdi-alert-circle</v-icon>
                                                    ไม่มีข้อมูลการค้นหา</v-list-item-content>
                                            </v-list-item>
                                        </v-list>
                                    </v-card-text>
                                    <v-card-actions>
                                        <v-spacer></v-spacer>
                                        <v-btn color="#e50211" @click="showSavedSearchesDialog = false">ปิด</v-btn>
                                        <v-spacer></v-spacer>
                                    </v-card-actions>
                                </v-card>
                            </v-dialog>

                            <v-select v-model="searchType" :items="searchTypes" dense outlined
                                class="mx-2 search-size small-font" @change="onSearchTypeChange"></v-select>

                            <v-autocomplete v-if="searchType !== 'port' && searchType !== 'updated_date'"
                                v-model="searchQuery" :items="getSearchItems(searchType)" label="ค้นหา" dense outlined
                                append-icon="mdi-magnify" class="mx-2 same-size small-font" hide-no-data hide-details
                                clearable></v-autocomplete>

                            <v-select v-if="searchType === 'port'" v-model="selectedTopics" :items="actionTopics" dense
                                outlined multiple class="mx-2 search-size small-font"></v-select>

                            <v-menu v-if="searchType === 'updated_date'" v-model="datePickerMenu"
                                :close-on-content-click="false" transition="scale-transition" offset-y>
                                <template v-slot:activator="{ on, attrs }">
                                    <div v-bind="attrs" v-on="on" class="date-picker-activator">
                                        <v-icon class="small-label">mdi-calendar-start-outline</v-icon>
                                        <date-picker v-model="startDateTime" format="YYYY-MM-DD HH:mm"
                                            type="datetime" />
                                    </div>
                                </template>
                            </v-menu>

                            <v-menu v-if="searchType === 'updated_date'" v-model="endDatePickerMenu"
                                :close-on-content-click="false" transition="scale-transition" offset-y>
                                <template v-slot:activator="{ on, attrs }">
                                    <div v-bind="attrs" v-on="on" class="date-picker-activator ml-2">
                                        <v-icon class="small-label">mdi-calendar-end-outline</v-icon>
                                        <date-picker v-model="endDateTime" format="YYYY-MM-DD HH:mm" type="datetime" />
                                    </div>
                                </template>
                            </v-menu>

                            <v-btn icon @click="addSearch">
                                <v-icon class="small-icon ">mdi-plus</v-icon>
                            </v-btn>

                            <v-btn color="success" v-if="$auth.user.rank_no === 1" @click="exportExcel" icon>
                                <v-icon>mdi-file-excel</v-icon>
                            </v-btn>
                        </div>
                    </v-col>
                </v-row>
            </v-container>

            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <v-menu v-model="showColumnSelector" offset-y offset-x :close-on-content-click="false">
                    <template v-slot:activator="{ on }">
                        <v-icon v-on="on" class="tab-icon" style="font-size: 2rem;"
                            color="#85d7df">mdi-playlist-check</v-icon>
                    </template>
                    <v-list class="header-list">
                        <v-list-item
                            v-for="header in headers.filter(header => header.value !== 'detail' && header.value !== 'action')"
                            :key="header.value" class="header-item">
                            <v-list-item-content>
                                <v-checkbox v-model="visibleColumns" :value="header.value" :label="header.text" />
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </div>

            <v-data-table :headers="filteredHeaders" :items="details" :item-value="customer_id" item-key="customer_id">
                <template v-slot:body="{ items }">
                    <template v-for="(group, index) in items" :key="group.customer_id + '-' + index">
                        <tr>
                            <td class="text-center">
                                <v-icon style="color:#85d7df" @click="group.isOpen = !group.isOpen">
                                    {{ group.isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                                </v-icon>
                            </td>
                            <td class="text-center">{{ formatDateTime(group.updated_date) }}</td>
                            <td class="text-center">{{ getCustomerByNo(group.customer_id)?.id || 'ยังไม่ระบุ' }}</td>
                            <td class="text-center">{{ getCustomerByNo(group.customer_id)?.nickname || 'ยังไม่ระบุ' }}
                            </td>
                            <td class="text-center" style="color:#ffc800">
                                {{ (group.from1TotalDifference || 0).toLocaleString() }}</td>
                            <td class="text-center" style="color:#38b6ff">
                                {{ (group.from2TotalDifference || 0).toLocaleString() }}</td>
                            <td class="text-center" style="color:#ff914d">
                                {{ (group.from3TotalDifference || 0).toLocaleString() }}</td>
                            <td class="text-center" :style="{ color: getColorForNumber((group.from1TotalDifference + group.from2TotalDifference +
                                    group.from3TotalDifference) || 0) }">
                                {{ ((group.from1TotalDifference + group.from2TotalDifference +
                                    group.from3TotalDifference) || 0).toLocaleString() }}</td>
                            <td colspan="5"></td>
                        </tr>

                        <template v-if="group.isOpen">
                            <template v-for="(stock, index) in group.stocks" :key="stock.no + '-' + index">
                                <tr>
                                    <td></td>
                                    <td class="text-center">
                                        <v-icon style="color:#85d7df" @click="stock.isOpen = !stock.isOpen">
                                            {{ stock.isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                                        </v-icon>
                                    </td>
                                    <td class="text-center">{{ formatDateTime(stock.updated_date) || 'ยังไม่ระบุ' }}
                                    </td>
                                    <td class="text-center">{{ getStockByNo(stock.stock_id)?.name || 'ยังไม่ระบุ' }}
                                    </td>
                                    <td class="text-center" style="color:#00bf63">{{ stock.Buy.toLocaleString() }}</td>
                                    <td class="text-center" style="color:#ff66c4">{{ stock.Sale.toLocaleString() }}</td>
                                    <td class="text-center" :style="{ color: getColorForNumber(stock.Total) }">
                                        {{ stock.Total.toLocaleString() }}</td>
                                    <td colspan="3"></td>
                                </tr>

                                <tr v-if="stock.isOpen" v-for="(grouped, index) in stock.groupedTransactions"
                                    :key="grouped.from_id + '-' + stock.no + '-' + index">
                                    <td colspan="3"></td>
                                    <td class="text-center"
                                        :style="{ color: getFromText(getFromByNo(grouped.from_id)?.from).color }">
                                        {{ getFromByNo(grouped.from_id)?.from || 'ยังไม่ระบุ' }}
                                    </td>
                                    <td class="text-center" style="color:#00bf63">
                                        {{ grouped.transactions.reduce((sum, tx) => sum + (tx.buy || 0),
                                            0).toLocaleString() }}
                                    </td>
                                    <td class="text-center" style="color:#ff66c4">
                                        {{ grouped.transactions.reduce((sum, tx) => sum + (tx.sale || 0),
                                            0).toLocaleString() }}
                                    </td>
                                    <td class="text-center" :style="{ color: getColorForFrom((grouped.transactions.reduce((sum, tx) => sum + (tx.sale || 0), 0) -
                                            grouped.transactions.reduce((sum, tx) => sum + (tx.buy || 0),
                                                0))) }">
                                        {{ (grouped.transactions.reduce((sum, tx) => sum + (tx.sale || 0), 0) -
                                            grouped.transactions.reduce((sum, tx) => sum + (tx.buy || 0),
                                                0)).toLocaleString() }}
                                    </td>
                                    <td colspan="2"></td>
                                </tr>
                            </template>
                        </template>
                    </template>
                </template>
            </v-data-table>

            <div class="text-center">
                <v-btn class="mb-4" color="#e50211" @click="goToHome">
                    <v-icon>mdi-home</v-icon>กลับไปหน้าหลัก
                </v-btn>
            </div>
        </v-card>
    </div>

</template>

<script>

import ExcelJS from 'exceljs';
import moment from 'moment-timezone';
import 'moment/locale/th'
import DatePicker from 'vue2-datepicker';
import 'vue2-datepicker/index.css';
import Decimal from 'decimal.js';

export default {

    layout: 'user',
    middleware: 'auth',

    async mounted() {
        await this.checkRank();
        await this.fetchEmployeeData();
        await this.fetchDetailData();
        await this.fetchCustomerData();
        await this.fetchStockData();
        await this.fetchFromData();
        await this.fetchCommissionData();
    },

    components: {
        DatePicker,
    },

    data() {
        return {
            modal: {
                warning: {
                    open: false,
                    message: 'การป้อนข้อมูลเวลาไม่ถูกต้อง',
                },
                confirm: {
                    open: false,
                },
                complete: {
                    open: false,
                    message: 'สำเร็จ',
                },
            },

            employees: [],
            details: [],
            customers: [],
            stocks: [],
            froms: [],
            commissions: [],

            showModalResult: false,
            ResultDetailData: {},
            sortBy: 'updated_date',
            currentAction: '',
            searchQuery: '',
            searchType: 'customer_id',
            selectedItemDetail: '',
            startDateTime: '',
            endDateTime: '',
            editDialogOpen: false,
            isSearchFieldVisible: false,
            datePickerMenu: false,
            endDatePickerMenu: false,
            showSavedSearchesDialog: false,
            showColumnSelector: false,
            modalConfirmOpen: false,
            editAllDialog: false,
            dialog: false,
            sortDesc: true,
            selectedEmployee: null,
            currentItem: null,
            employeeNo: null,
            actionType: null,
            selectedTopics: [],
            savedSearches: [],
            editAllData: {},

            searchQueries: {
                'customer_id': [],
                'customer_name': [],
                'stock_id': [],
                'emp_id': [],
            },

            searchTypes: [
                { text: 'รหัสสมาชิก', value: 'customer_id' },
                { text: 'ชื่อเล่น', value: 'customer_name' },
                { text: 'ชื่อหุ้นที่ติด', value: 'stock_id' },
                { text: 'ประเภทพอร์ต', value: 'port' },
                { text: 'ข้อมูลวันที่', value: 'updated_date' }
            ],

            actionTopics: [
                { text: 'ถือ', value: 'ถือ' },
                { text: 'แก้เกมได้', value: 'แก้เกมได้' },
                { text: 'ระวัง', value: 'ระวัง' },
                { text: 'กำไร', value: 'กำไร' },
            ],

            visibleColumns: ['action', 'updated_date', 'customer_id', 'customer_name', 'price', 'amount', 'money', 'total'],

            headers: [

                {
                    text: '',
                    value: 'action',
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ข้อมูลวันที่',
                    value: 'updated_date',
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'รหัสสมาชิก',
                    value: 'customer_id',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ชื่อเล่น',
                    value: 'customer_name',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'หุ้นเก่า',
                    value: 'price',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'หุ้นใหม่',
                    value: 'amount',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'หุ้นแก้เกม',
                    value: 'money',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'รวม',
                    value: 'total',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },
            ],
        };
    },

    computed: {
        filtered() {
            let filteredDetails = this.details.map(detail => {
                const transactions = detail.transactions || [];
                const type1Transactions = transactions.filter(t => t.stock_detail_id === detail.no);

                return {
                    ...detail,
                    type1Transactions: type1Transactions
                };
            });

            this.savedSearches.forEach(search => {
                filteredDetails = filteredDetails.filter(detail => {
                    return this.applySearchFilter(detail, search);
                });
            });

            return filteredDetails;
        },

        filteredHeaders() {
            return this.headers.filter(header => this.visibleColumns.includes(header.value));
        },
    },

    methods: {
        toggleOpen(item) {
            item.isOpen = !item.isOpen;
        },

        goToHome() {
            this.$router.push('/app/home');
        },

        openEditAllDialog(employee) {
            this.editAllData = employee;
            this.editAllDialog = true;
        },

        showEditDialog(item) {
            this.selectedEmployee = item;
            this.editDialogOpen = true;
        },

        getSearchItems(type) {
            if (type === 'stock_id') {
                return this.details.map(detail => this.getStockByNo(detail.stock_id)?.name);
            } else if (type === 'customer_name') {
                return this.details.map(detail => this.getCustomerByNo(detail.customer_id)?.nickname);
            } else if (type === 'customer_id') {
                return this.details.map(detail => this.getCustomerByNo(detail.customer_id)?.id);
            } else if (type === 'emp_id') {
                return this.details.map(detail => this.getEmployeeByNo(detail.emp_id)?.fname + ' ' + this.getEmployeeByNo(detail.emp_id)?.lname);
            }
            return [];
        },

        showConfirmDialog(action, item) {
            this.currentAction = action;
            this.currentItem = item;
            this.modalConfirmOpen = true;
        },

        async handleConfirm() {
            if (this.currentAction === 'delete') {
                try {
                    await this.$store.dispatch('api/detail/deleteDetail', this.currentItem.no);
                    this.modal.complete.message = 'ลบผู้ใช้งานนี้เรียบร้อยแล้ว';
                    this.recordLog();
                    this.modal.complete.open = true;
                } catch (warning) {
                    this.modal.complete.message = 'เกิดข้อผิดพลาดในการดำเนินการ';
                    this.modal.complete.open = true;
                }
            }
            this.modalConfirmOpen = false;
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
                        this.$router.push('/app/transaction/index_stock');
                    } else if (RankID === '2') {
                        this.$router.push('/app/transaction/index_stock');
                    } else if (RankID === '3') {
                        this.$router.push('/app/transaction/index_stock');
                    } else {
                        this.$router.push('/auth');
                    }
                }
            } else {
                this.$router.push('/');
            }
        },

        async fetchEmployeeData() {
            this.employees = await this.$store.dispatch('api/employee/getEmployees');
        },

        getEmployeeByNo(empNo) {
            return this.employees.find(employee => employee.no === empNo);
        },

        async fetchCommissionData() {
            this.commissions = await this.$store.dispatch('api/commission/getCommissions');
        },

        async fetchDetailData() {
            try {
                await this.fetchStockData();
                this.details = await this.$store.dispatch('api/detail/getDetails');

                if (Array.isArray(this.details) && this.details.length > 0) {
                    const transactions = await this.$store.dispatch('api/transaction/getTransactions');
                    await this.fetchCommissionData();

                    const groupedDetails = this.details.reduce((acc, detail) => {
                        const stockTransactions = transactions.filter(t => t.stock_detail_id === detail.no);

                        if (stockTransactions.length > 0) {
                            const customerId = detail.customer_id;

                            if (!acc[customerId]) {
                                acc[customerId] = {
                                    customer_id: customerId,
                                    isOpen: false,
                                    stocks: [],
                                    updated_date: null,
                                    Buy: 0,
                                    Sale: 0,
                                    Total: 0,
                                    from1TotalDifference: 0,
                                    from2TotalDifference: 0,
                                    from3TotalDifference: 0,
                                };
                            }

                            const detailUpdatedDate = moment.tz(detail.updated_date, 'Asia/Bangkok');
                            const transactionUpdatedDates = stockTransactions.map(t =>
                                moment.tz(t.updated_date, 'Asia/Bangkok')
                            );
                            const latestTransactionDate = transactionUpdatedDates.length > 0
                                ? moment.max(transactionUpdatedDates)
                                : null;

                            const latestDate = latestTransactionDate
                                ? moment.max(detailUpdatedDate, latestTransactionDate)
                                : detailUpdatedDate;

                            acc[customerId].updated_date = acc[customerId].updated_date
                                ? moment.max(acc[customerId].updated_date, latestDate)
                                : latestDate;

                            const lastBuyValues = {};

                            const groupedStockTransactions = stockTransactions.reduce((grouped, transaction) => {
                                if (!grouped[transaction.from_id]) {
                                    grouped[transaction.from_id] = {
                                        from_id: transaction.from_id,
                                        transactions: [],
                                    };
                                }

                                const detail = this.details.find(d => d.no === transaction.stock_detail_id);

                                if (detail && (transaction.from_id === 1 || transaction.from_id === 2) && !lastBuyValues[transaction.from_id]) {
                                    const money = detail.amount * detail.price;
                                    transaction.buy = money;
                                    lastBuyValues[transaction.from_id] = money;
                                } else if (transaction.type === 1 && !transaction.hasOwnProperty('buy')) {
                                    const commission = this.commissions.find(c => c.no === transaction.commission_id);
                                    const commission_id = commission ? commission.commission : 0;
                                    const money = transaction.amount * transaction.price;
                                    const comfee = money * commission_id;
                                    const vat = comfee * 0.07;
                                    const total = money + comfee + vat;
                                    transaction.buy = total;
                                }

                                if (transaction.type === 2 && !transaction.hasOwnProperty('sale')) {
                                    const commission = this.commissions.find(c => c.no === transaction.commission_id);
                                    const commission_id = commission ? commission.commission : 0;
                                    const money = transaction.amount * transaction.price;
                                    const comfee = money * commission_id;
                                    const vat = comfee * 0.07;
                                    const total = money - (comfee + vat);
                                    transaction.sale = total;
                                }

                                grouped[transaction.from_id].transactions.push(transaction);

                                return grouped;
                            }, {});

                            const stockGroupedByFromId = Object.values(groupedStockTransactions);

                            const Buy = stockGroupedByFromId.reduce((sum, group) =>
                                sum + group.transactions.reduce((subSum, tx) => subSum + (tx.buy || 0), 0), 0);
                            const Sale = stockGroupedByFromId.reduce((sum, group) =>
                                sum + group.transactions.reduce((subSum, tx) => subSum + (tx.sale || 0), 0), 0);
                            const Total = Sale - Buy;

                            stockGroupedByFromId.forEach(group => {
                                const totalBuy = group.transactions.reduce((sum, tx) => sum + (tx.buy || 0), 0);
                                const totalSale = group.transactions.reduce((sum, tx) => sum + (tx.sale || 0), 0);
                                const totalDifference = totalSale - totalBuy;

                                if (group.from_id === 1) {
                                    acc[customerId].from1TotalDifference += totalDifference;
                                } else if (group.from_id === 2) {
                                    acc[customerId].from2TotalDifference += totalDifference;
                                } else if (group.from_id === 3) {
                                    acc[customerId].from3TotalDifference += totalDifference;
                                }
                            });

                            acc[customerId].stocks.push({
                                ...detail,
                                isOpen: false,
                                groupedTransactions: stockGroupedByFromId,
                                updated_date: latestDate.format('YYYY-MM-DD HH:mm:ss'),
                                Buy: Buy,
                                Sale: Sale,
                                Total: Total
                            });
                        }

                        return acc;
                    }, {});


                    this.details = Object.values(groupedDetails).map(group => ({
                        ...group,
                        updated_date: group.updated_date ? group.updated_date.format('YYYY-MM-DD HH:mm:ss') : null,
                    }));

                    if (this.details.length === 0) {
                        console.warn("ไม่มี detail ที่มี transaction");
                    }
                } else {
                    console.error("ไม่มีข้อมูลใน details หรือข้อมูลไม่ใช่อาร์เรย์");
                }
            } catch (error) {
                console.error("Error fetching detail data:", error);
                this.modal.warning.message = 'ไม่สามารถดึงข้อมูลได้';
                this.modal.warning.open = true;
            }
        },

        getDetailsByNo(detailNo) {
            return this.details.find(detail => detail.no === detailNo);
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

        getColorForNumber(value) {
            const numericValue = parseFloat(value);
            if (numericValue < 0) {
                return '#e50211';
            } else if (numericValue >= 0) {
                return '#24b224';
            } else {
                return 'inherit';
            }
        },

        getColorForFrom(value) {
            const numericValue = parseFloat(value);
            if (numericValue < 0) {
                return '#ff5757';
            } else if (numericValue >= 0) {
                return '#c1ff72';
            } else {
                return 'inherit';
            }
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('YYYY-MM-DD HH:mm');
            }
            return 'ยังไม่ระบุวัน';
        },

        openDetail(item) {
            this.selectedItemDetail = item.detail;
            this.dialog = true;
        },

        onSearchTypeChange() {
            this.isSearchFieldVisible = this.searchType !== 'updated_date' && this.searchType !== 'port';
        },

        validateDateRange() {
            const start = moment(this.startDateTime);
            const end = moment(this.endDateTime);

            if (start.isValid() && end.isValid() && start.isAfter(end)) {
                this.modal.warning.open = true;
                return false;
            }
            return true;
        },

        addSearch() {
            if (!this.validateDateRange()) {
                return;
            }

            if (this.searchType === 'port') {
                this.addTopicToSearch();
            } else if (this.searchType === 'stock_id' || this.searchType === 'customer_name' || this.searchType === 'customer_id' || this.searchType === 'emp_id') {
                this.addTextToSearch();
            } else {
                this.savedSearches.push({
                    query: this.searchQuery,
                    type: this.searchType,
                    topic: this.selectedTopic,
                    start: this.startDateTime,
                    end: this.endDateTime
                });
                this.searchQuery = '';
                this.selectedTopic = '';
                this.startDateTime = '';
                this.endDateTime = '';
            }
        },

        addTextToSearch() {
            const trimmedQuery = this.searchQuery.trim();
            if (trimmedQuery) {
                this.searchQueries[this.searchType].push(trimmedQuery);
                this.savedSearches.push({
                    query: this.searchQueries[this.searchType],
                    type: this.searchType,
                    start: this.startDateTime,
                    end: this.endDateTime
                });
                this.searchQuery = '';
            }
        },

        addTopicToSearch() {
            this.savedSearches.push({
                query: '',
                type: 'port',
                topics: [...this.selectedTopics],
                start: this.startDateTime,
                end: this.endDateTime
            });
            this.selectedTopics = [];
            this.startDateTime = '';
            this.endDateTime = '';
        },

        applySearchFilter(detail, search) {
            const field = detail[search.type];
            let queryMatched = true;
            const lowerCaseField = typeof field === 'string' ? field.toLowerCase() : '';
            if (search.type === 'customer_name') {
                queryMatched = this.searchQueries[search.type].some(query => {
                    const cust = this.getCustomerByNo(detail.customer_id);
                    return cust.nickname.toLowerCase().includes(query.toLowerCase());
                });
            } else if (search.type === 'customer_id') {
                queryMatched = this.searchQueries[search.type].some(query => {
                    const cust = this.getCustomerByNo(detail.customer_id);
                    return cust.id.toLowerCase().includes(query.toLowerCase());
                });
            } else if (search.type === 'stock_id') {
                queryMatched = this.searchQueries[search.type].some(query => {
                    const st = this.getStockByNo(detail.stock_id);
                    return st.name.toLowerCase().includes(query.toLowerCase());
                });
            } else if (search.type === 'emp_id') {
                queryMatched = this.searchQueries[search.type].some(query => {
                    const emp = this.getEmployeeByNo(detail.emp_id);
                    return emp.fname.toLowerCase().includes(query.toLowerCase()) + ' ' + emp.lname.toLowerCase().includes(query.toLowerCase());
                });
            } else {
                const searchQuery = search.query.toLowerCase();
                queryMatched = lowerCaseField.includes(searchQuery);
            }
            const timeMatched = search.type === 'updated_date' ? this.checkTimeRange(detail, search) : true;
            const topicMatched = search.topics ? search.topics.some(topic => topic === this.getPortText(detail.total_percent).text) : true;
            return queryMatched && timeMatched && topicMatched;
        },

        checkTimeRange(detail, search) {
            const detailTime = moment(detail.updated_date);
            const startTime = moment(search.start);
            const endTime = moment(search.end);
            return (!startTime.isValid() || detailTime.isSameOrAfter(startTime)) &&
                (!endTime.isValid() || detailTime.isSameOrBefore(endTime));
        },

        toggleSavedSearchesDialog() {
            this.showSavedSearchesDialog = !this.showSavedSearchesDialog;
        },

        deleteSearch(index) {
            this.savedSearches.splice(index, 1);
        },

        getSearchTypeText(type) {
            const found = this.searchTypes.find(item => item.value === type);
            return found ? found.text : type;
        },

        exportExcel() {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet1');

            const headers = this.filteredHeaders
                .filter(header => header.value !== 'detail' && header.value !== 'action')
                .map(header => ({
                    header: header.text,
                    key: header.value,
                    style: { font: { name: 'Angsana New', size: 16 } }
                }));

            worksheet.columns = headers;

            this.filtered.forEach((item, index) => {
                const rowData = {};
                this.filteredHeaders.forEach(header => {
                    if (header.value === 'updated_date') {
                        rowData[header.value] = moment(item[header.value]).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm');
                    } else if (header.value === 'created_date') {
                        rowData[header.value] = moment(item[header.value]).tz('Asia/Bangkok').format('YYYY-MM-DD');
                    } else if (header.value === 'price') {
                        rowData[header.value] = item.price.toLocaleString(2);
                    } else if (header.value === 'amount') {
                        rowData[header.value] = item.amount.toLocaleString(2);
                    } else if (header.value === 'money') {
                        rowData[header.value] = item.money;
                    } else if (header.value === 'from_id') {
                        rowData[header.value] = this.getFromByNo(item.from_id).from;
                    } else if (header.value === 'stock_id') {
                        rowData[header.value] = this.getStockByNo(item.stock_id).name;
                    } else if (header.value === 'customer_id') {
                        rowData[header.value] = this.getCustomerByNo(item.customer_id).id;
                    } else if (header.value === 'customer_name') {
                        rowData[header.value] = this.getCustomerByNo(item.customer_id).nickname;
                    } else if (header.value === 'port') {
                        rowData[header.value] = this.getPortText(item.total_percent).text;
                    } else if (header.value === 'emp_id') {
                        rowData[header.value] = this.getEmployeeByNo(item.emp_id).fname + ' ' + this.getEmployeeByNo(item.emp_id).lname;
                    } else if (header.value !== 'detail' && header.value !== 'action') {
                        rowData[header.value] = item[header.value];
                    }
                });
                worksheet.addRow(rowData);
            });

            worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { bold: true, name: 'Angsana New', size: 18 };
            });

            worksheet.eachRow((row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
            });

            const currentDate = moment().tz('Asia/Bangkok').format('YYYY-MM-DD');
            workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `ข้อมูลลูกค้า-${currentDate}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        },

        goBack() {
            window.location.reload();
        },

        recordLog() {
            const stock = this.getStockByNo(this.currentItem.stock_id);
            const from = this.getFromByNo(this.currentItem.from_id);
            const customer = this.getCustomerByNo(this.currentItem.customer_id)
            const log = {
                customer_id: `${customer ? customer.id : 'ไม่พบรหัสลูกค้า'}`,
                emp_name: this.$auth.user.fname + ' ' + this.$auth.user.lname,
                emp_email: this.$auth.user.email,
                detail: this.currentAction === 'delete'
                    ? `ชื่อหุ้น : ${stock ? stock.name : 'ไม่พบชื่อหุ้น'}\nที่มาที่ไป : ${from ? from.from : 'ไม่พบที่มาที่ไป'}\nราคาที่ติด : ${this.currentItem.price}\nจำนวนที่ติด : ${this.currentItem.amount}`
                    : `ชื่อหุ้น : ${stock ? stock.name : 'ไม่พบชื่อหุ้น'}\nที่มาที่ไป : ${from ? from.from : 'ไม่พบที่มาที่ไป'}\nราคาที่ติด : ${this.currentItem.price}\nจำนวนที่ติด : ${this.currentItem.amount}`,
                type: 1,
                picture: this.$auth.user.picture || 'Unknown',
                action: this.currentAction === 'delete'
                    ? 'ลบข้อมูลหุ้นของลูกค้า'
                    : 'ไม่ลบข้อมูลหุ้นของลูกค้า',
                time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };
            this.$store.dispatch('api/log/addLogs', log);
        },

        goToAddStock() {
            this.$router.push('/app/transaction/add_stock');
        },
    },
};

</script>

<style scoped>
.small-font {
    font-size: 0.8rem;
}

::v-deep .v-select-list .v-list-item__title {
    font-size: 0.8rem;
}

::v-deep .v-label {
    font-size: 0.8rem;
}

.small-label {
    margin-right: 8px;
}

.small-icon {
    font-size: 1.5rem;
    margin-right: 6px;
    margin-left: 6px;
}

.tab-icon {
    cursor: pointer;
    margin-right: 6px;
    margin-left: 24px;
}

.tab-icon-two {
    cursor: pointer;
    margin-right: 24px;
    margin-left: 0px;
}

.tab-icon-three {
    cursor: pointer;
    margin-right: 8px;
    margin-left: 0px;
}

.little-icon {
    font-size: 3rem;
    margin-right: 8px;
    margin-left: 8px;
}

.date-picker-activator {
    display: flex;
    align-items: center;
}

.ml-2 {
    margin-left: 8px;
}

.mx-2 {
    margin-left: 8px;
    margin-right: 8px;
}


.mt-2 {
    margin-top: 1px;
}

.d-flex {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
}

.same-size {
    max-width: 200px;
    max-height: 40px;
}

.search-size {
    max-width: 200px;
    max-height: 40px;
}

.v-data-table th,
.v-data-table td {
    padding: 8px;
    text-align: center;
}

.v-card-title {
    display: flex;
    align-items: center;
}

::v-deep .v-text-field.small-font .v-input__control .v-input__label {
    font-size: 0.8rem !important;
}

.v-menu__content {
    top: 100%;
    left: 0;
    margin-top: 0px;
    margin-bottom: 0px;
}

.custom-list-item {
    padding: 0 0;
}

.v-list-item__content {
    padding: 0;
}

.header-list {
    display: flex;
    flex-wrap: wrap;
    padding: 0;
    gap: 0px;
}

.header-item {
    flex: 1 0 12%;
    box-sizing: border-box;
}

.v-list-item__content {
    display: flex;
    align-items: center;
}

.image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 10px 0;
}

.image-container img {
    max-width: 100%;
    max-height: 60px;
}

.icon-tab {
    font-size: 120% !important;
}

.custom-list-item {
    padding: 0.1px 8px;
}

.custom-list {
    padding: 0.4px 2px;
}
</style>