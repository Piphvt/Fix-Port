<template>
    <v-dialog v-model="dialog" max-width="1000px">
        <v-card>
            <div>
                <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen"
                    @update:confirm="modalConfirmOpen = false" />
                <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
                    :complete.sync="modal.complete.open" :method="goBack" />
                <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
                <ModalWarning :open="modal.warning.open" :message="modal.warning.message"
                    :warning.sync="modal.warning.open" />
                <TransactionSummarize :stockData="[selectedStockData]" :dataType="selectedDataType"
                    :dialogOpen.sync="dialogOpen" :date="date" />
            </div>
            <v-card-title class="d-flex justify-center">
                <v-icon justify="center" class="mr-3" size="40" color="#85d7df">mdi-cash-register</v-icon>
                <span class="headline">สรุปผลการซื้อขายหุ้นของลูกค้า</span>
            </v-card-title>

            <v-card-text>
                <v-container>
                    <v-row justify="center" align="center">
                        <v-col cols="auto">
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
                                                    <v-list-item-content
                                                        style="justify-content: center; display: flex;">
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

                                <v-autocomplete v-if="searchType === 'customer_no'" v-model="selectedCustomerIDs"
                                    class="mx-2 search-size small-font" :items="getSearchItems('customer_no')"
                                    label="ค้นหารหัสสมาชิก" dense outlined clearable multiple>
                                </v-autocomplete>

                                <v-autocomplete v-if="searchType === 'customer_name'" v-model="selectedCustomerNames"
                                    class="mx-2 search-size small-font" :items="getSearchItems('customer_name')"
                                    label="ค้นหาชื่อเล่น" dense outlined clearable multiple>
                                </v-autocomplete>

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
                                            <date-picker v-model="endDateTime" format="YYYY-MM-DD HH:mm"
                                                type="datetime" />
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
                                v-for="header in headers.filter(header => header.value !== 'detail' && header.value !== 'action' && header.value !== 'export')"
                                :key="header.value" class="header-item">
                                <v-list-item-content>
                                    <v-checkbox v-model="visibleColumns" :value="header.value" :label="header.text" />
                                </v-list-item-content>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                    <div>
                        <v-btn v-if="isSelectingItems && selectedItems.length > 0" color="red"
                            @click="deleteSelectedItems" class="mb-4" style="font-size: 1.5 rem; margin-left: auto;">
                            <v-icon left color="white">mdi-delete</v-icon> ลบ
                        </v-btn>
                    </div>
                </div>
                <v-data-table :headers="filteredHeaders" :items="details" :item-value="customer_no"
                    item-key="customer_no">
                    <template v-slot:body="{ items }">
                        <template v-for="(group, index) in items" :key="group.customer_no + '-' + index">
                            <tr>
                                <td class="text-center" v-if="visibleColumns.includes('action')">
                                    <v-icon style="color:#85d7df" @click="group.isOpen = !group.isOpen">
                                        {{ group.isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                                    </v-icon>
                                </td>
                                <td class="text-center" v-if="visibleColumns.includes('updated_date')">
                                    {{ formatDateTime(group.updated_date) }}</td>
                                <td class="text-center" v-if="visibleColumns.includes('customer_no')">
                                    {{ getCustomerByNo(group.customer_no)?.id || 'ยังไม่ระบุ' }}</td>
                                <td class="text-center" v-if="visibleColumns.includes('customer_name')">
                                    {{ getCustomerByNo(group.customer_no)?.nickname || 'ยังไม่ระบุ' }}
                                </td>
                                <td class="text-center" v-if="visibleColumns.includes('base_stock')">
                                    {{ (group.from1TotalDifference || 0).toLocaleString() }}</td>
                                <td class="text-center" v-if="visibleColumns.includes('new_stock')">
                                    {{ (group.from2TotalDifference || 0).toLocaleString() }}</td>
                                <td class="text-center" v-if="visibleColumns.includes('tactic_stock')">
                                    {{ (group.from3TotalDifference || 0).toLocaleString() }}</td>
                                <td class="text-center" v-if="visibleColumns.includes('total')" :style="{
                                    color: getColorForNumber((group.from1TotalDifference + group.from2TotalDifference +
                                        group.from3TotalDifference) || 0)
                                }">
                                    {{ ((group.from1TotalDifference + group.from2TotalDifference +
                                        group.from3TotalDifference) || 0).toLocaleString() }}</td>
                                <td class="text-center" v-if="visibleColumns.includes('detail')"><v-btn color="#5271ff"
                                        @click="openStockPopup(group, 'group')" icon>
                                        <v-icon>mdi-eye</v-icon></v-btn></td>
                                <td class="text-center" v-if="visibleColumns.includes('export')"><v-btn color="#00bf63"
                                        @click="exportForPerson(group.customer_no, 'group', group)" icon>
                                        <v-icon>mdi-file-excel</v-icon></v-btn></td>
                            </tr>

                            <template v-if="group.isOpen">
                                <template v-for="(yearlyData, year) in group.yearlyDifferences" :key="year">
                                    <tr>
                                        <td class="text-center" v-if="visibleColumns.includes('action')"></td>
                                        <td class="text-center">
                                            <v-icon style="color:#85d7df"
                                                @click="yearlyData.isOpen = !yearlyData.isOpen">
                                                {{ yearlyData.isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                                            </v-icon>
                                        </td>
                                        <td class="text-center">-</td>
                                        <td class="text-center">{{ year }}</td>
                                        <td class="text-center">
                                            {{ yearlyData.from1TotalDifference.toLocaleString() }}</td>
                                        <td class="text-center">
                                            {{ yearlyData.from2TotalDifference.toLocaleString() }}</td>
                                        <td class="text-center">
                                            {{ yearlyData.from3TotalDifference.toLocaleString() }}</td>
                                        <td class="text-center" :style="{
                                            color: getColorForNumber((yearlyData.from1TotalDifference + yearlyData.from2TotalDifference +
                                                yearlyData.from3TotalDifference) || 0)
                                        }">
                                            {{ (yearlyData.from1TotalDifference + yearlyData.from2TotalDifference +
                                                yearlyData.from3TotalDifference).toLocaleString() }}</td>
                                        <td class="text-center"><v-btn color="#5271ff"
                                                @click="openStockPopup(group, 'year', year)" icon>
                                                <v-icon>mdi-eye</v-icon>
                                            </v-btn></td>
                                        <td class="text-center"><v-btn color="#00bf63"
                                                @click="exportForPerson(group.customer_no, 'year', year)" icon>
                                                <v-icon>mdi-file-excel</v-icon></v-btn></td>
                                    </tr>

                                    <tr v-if="yearlyData.isOpen"
                                        v-for="(monthlyData, month) in yearlyData.monthlyDifferences" :key="month">
                                        <td class="text-center" v-if="visibleColumns.includes('action')"></td>
                                        <td class="text-center"></td>
                                        <td class="text-center">-</td>
                                        <td class="text-center" :style="{ color: formatMonthName(month).color }">
                                            {{ formatMonthName(month).name }}
                                        </td>
                                        <td class="text-center">{{
                                            monthlyData.from1TotalDifference.toLocaleString() }}</td>
                                        <td class="text-center">{{
                                            monthlyData.from2TotalDifference.toLocaleString() }}</td>
                                        <td class="text-center">
                                            {{ monthlyData.from3TotalDifference.toLocaleString() }}</td>
                                        <td class="text-center" :style="{
                                            color: getColorForNumber((monthlyData.from1TotalDifference + monthlyData.from2TotalDifference +
                                                monthlyData.from3TotalDifference) || 0)
                                        }">
                                            {{ (monthlyData.from1TotalDifference + monthlyData.from2TotalDifference +
                                                monthlyData.from3TotalDifference).toLocaleString() }}</td>
                                        <td class="text-center"><v-btn color="#5271ff"
                                                @click="openStockPopup(group, 'month', month)" icon>
                                                <v-icon>mdi-eye</v-icon></v-btn></td>
                                        <td class="text-center"><v-btn color="#00bf63"
                                                @click="exportForPerson(group.customer_no, 'month', month)" icon>
                                                <v-icon>mdi-file-excel</v-icon></v-btn></td>
                                    </tr>
                                </template>
                            </template>
                        </template>
                    </template>
                </v-data-table>
            </v-card-text>
            <div class="text-center">
                <v-btn @click="dialog = false" class="mb-4" color="#e50211">ปิด</v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>

<script>
import ExcelJS from 'exceljs';
import moment from 'moment-timezone';
import 'moment/locale/th'
import DatePicker from 'vue2-datepicker';
import 'vue2-datepicker/index.css';

export default {
    props: {
        value: Boolean,
    },

    components: {
        DatePicker,
    },

    data() {
        return {
            modal: {
                warning: {
                    open: false,
                    message: '',
                },
                error: {
                    open: false,
                    message: '',
                },
                confirm: {
                    open: false,
                },
                complete: {
                    open: false,
                    message: '',
                },
            },

            employees: [],
            details: [],
            customers: [],
            stocks: [],
            froms: [],
            commissions: [],
            transactions: [],

            selectedCustomerIDs: [],
            selectedCustomerNames: [],

            searchTypes: [
                { text: 'รหัสสมาชิก', value: 'customer_no' },
                { text: 'ชื่อเล่น', value: 'customer_name' },
                { text: 'ข้อมูลวันที่', value: 'updated_date' }
            ],

            visibleColumns: ['action', 'updated_date', 'customer_no', 'customer_name', 'base_stock', 'new_stock', 'tactic_stock', 'total', 'detail', 'export'],

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
                    value: 'customer_no',
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
                    value: 'base_stock',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'หุ้นใหม่',
                    value: 'new_stock',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'หุ้นแก้เกม',
                    value: 'tactic_stock',
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

                {
                    text: 'รายละเอียด',
                    value: 'detail',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: '',
                    value: 'export',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },
            ],

            filtered: [],

            showAllDialog: false,
            showAllData: {},
            selectedStockData: null,
            dialogOpen: false,

            showModalResult: false,
            ResultDetailData: {},
            sortBy: 'updated_date',
            currentAction: '',
            searchQuery: '',
            searchType: 'customer_no',
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
            dialog: false,
            sortDesc: true,
            currentItem: null,
            employeeNo: null,
            actionType: null,
            savedSearches: [],

            dialog: this.value,
        };
    },

    watch: {
        value(newValue) {
            this.dialog = newValue;
        },
        dialog(newValue) {
            this.$emit('input', newValue);
        },
    },

    async mounted() {
        await Promise.all([
            this.fetchEmployeeData(),
            this.fetchCustomerData(),
            this.fetchStockData(),
            this.fetchFromData(),
            this.fetchCommissionData(),
            this.fetchTransactionData(),
            this.fetchDetailData()
        ]);

        this.filtered = this.details;
    },

    computed: {
        filteredHeaders() {
            return this.headers.filter(header => this.visibleColumns.includes(header.value));
        },
    },

    methods: {
        filterData() {
            this.filtered = this.details.filter(item => item.someCondition === true);
        },

        openStockPopup(data, type, date = null) {
            this.selectedStockData = [];
            let filteredData = [];

            if (type === 'group') {
                filteredData = Array.isArray(data) ? JSON.parse(JSON.stringify(data)) : [JSON.parse(JSON.stringify(data))];
            } else if (type === 'year' && date) {
                const targetYear = parseInt(date, 10);
                filteredData = Array.isArray(data) ? JSON.parse(JSON.stringify(data)) : [JSON.parse(JSON.stringify(data))];
                filteredData = filteredData.map(entry => {
                    if (entry.stocks) {
                        entry.stocks = entry.stocks.filter(stock => {
                            const stockDate = new Date(stock.updated_date);
                            return stockDate.getFullYear() === targetYear;
                        });
                    }
                    return entry;
                });
            } else if (type === 'month' && date) {
                const [targetYear, targetMonth] = date.split('-').map(val => parseInt(val, 10));
                filteredData = Array.isArray(data) ? JSON.parse(JSON.stringify(data)) : [JSON.parse(JSON.stringify(data))];
                filteredData = filteredData.map(entry => {
                    if (entry.stocks) {
                        entry.stocks = entry.stocks.filter(stock => {
                            const stockDate = new Date(stock.updated_date);
                            return stockDate.getFullYear() === targetYear && (stockDate.getMonth() + 1) === targetMonth;
                        });
                    }
                    return entry;
                });
            }

            this.selectedStockData = filteredData.map(entry => ({
                ...entry,
                date,
            }));

            this.selectedDataType = type || '';
            this.dialogOpen = true;
        },

        toggleOpen(item) {
            item.isOpen = !item.isOpen;
        },

        getSearchItems(type) {
            if (type === 'customer_no') {
                return this.details.map(detail => this.getCustomerByNo(detail.customer_no)?.id);
            }
            else if (type === 'customer_name') {
                return this.details.map(detail => this.getCustomerByNo(detail.customer_no)?.nickname);
            }
            return [];
        },

        showConfirmDialog(action, item) {
            this.currentAction = action;
            this.currentItem = item;
            this.modalConfirmOpen = true;
        },

        async fetchEmployeeData() {
            this.employees = await this.$store.dispatch('api/employee/getEmployee');
        },

        getEmployeeByNo(empNo) {
            return this.employees.find(employee => employee.no === empNo);
        },

        async fetchCommissionData() {
            this.commissions = await this.$store.dispatch('api/commission/getCommission');
        },

        async fetchTransactionData() {
            this.transactions = await this.$store.dispatch('api/transaction/getTransaction');
        },

        async fetchDetailData() {
            try {
                await this.fetchStockData();
                await this.fetchTransactionData();
                this.details = await this.$store.dispatch('api/detail/getDetail');

                if (Array.isArray(this.details) && this.details.length > 0) {
                    await this.fetchCommissionData();

                    const groupedDetails = this.details.reduce((acc, detail) => {
                        const stockTransactions = this.transactions.filter(t => t.stock_detail_no === detail.no);

                        if (stockTransactions.length > 0) {
                            const customerId = detail.customer_no;

                            if (!acc[customerId]) {
                                acc[customerId] = {
                                    customer_no: customerId,
                                    isOpen: false,
                                    stocks: [],
                                    updated_date: null,
                                    Buy: 0,
                                    Sale: 0,
                                    Total: 0,
                                    from1TotalDifference: 0,
                                    from2TotalDifference: 0,
                                    from3TotalDifference: 0,
                                    yearlyDifferences: {},
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
                                if (!grouped[transaction.from_no]) {
                                    grouped[transaction.from_no] = {
                                        from_no: transaction.from_no,
                                        transactions: [],
                                    };
                                }

                                const detail = this.details.find(d => d.no === transaction.stock_detail_no);

                                if (detail && (transaction.from_no === 1 || transaction.from_no === 2) && !lastBuyValues[transaction.from_no]) {
                                    const money = detail.amount * detail.price;
                                    transaction.buy = money;
                                    lastBuyValues[transaction.from_no] = money;
                                } else if (transaction.type === 1 && !transaction.hasOwnProperty('buy')) {
                                    const commission = this.commissions.find(c => c.no === transaction.commission_no);
                                    const commission_no = commission ? commission.commission : 0;
                                    const money = transaction.amount * transaction.price;
                                    const comfee = money * commission_no;
                                    const vat = comfee * 0.07;
                                    const total = money + comfee + vat;
                                    transaction.buy = total;
                                }

                                if (transaction.type === 2 && !transaction.hasOwnProperty('sale')) {
                                    const commission = this.commissions.find(c => c.no === transaction.commission_no);
                                    const commission_no = commission ? commission.commission : 0;
                                    const money = transaction.amount * transaction.price;
                                    const comfee = money * commission_no;
                                    const vat = comfee * 0.07;
                                    const total = money - (comfee + vat);
                                    transaction.sale = total;
                                }

                                grouped[transaction.from_no].transactions.push(transaction);

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

                                if (group.from_no === 1) {
                                    acc[customerId].from1TotalDifference += totalDifference;
                                } else if (group.from_no === 2) {
                                    acc[customerId].from2TotalDifference += totalDifference;
                                } else if (group.from_no === 3) {
                                    acc[customerId].from3TotalDifference += totalDifference;
                                }

                                const transactionMonth = latestDate.format('YYYY-MM');
                                const transactionYear = latestDate.format('YYYY');

                                if (!acc[customerId].yearlyDifferences[transactionYear]) {
                                    acc[customerId].yearlyDifferences[transactionYear] = {
                                        from1TotalDifference: 0,
                                        from2TotalDifference: 0,
                                        from3TotalDifference: 0,
                                        monthlyDifferences: {},
                                        isOpen: false,
                                    };
                                }

                                const yearlyData = acc[customerId].yearlyDifferences[transactionYear];

                                if (!yearlyData.monthlyDifferences[transactionMonth]) {
                                    yearlyData.monthlyDifferences[transactionMonth] = {
                                        from1TotalDifference: 0,
                                        from2TotalDifference: 0,
                                        from3TotalDifference: 0,
                                    };
                                }

                                if (group.from_no === 1) {
                                    yearlyData.from1TotalDifference += totalDifference;
                                    yearlyData.monthlyDifferences[transactionMonth].from1TotalDifference += totalDifference;
                                } else if (group.from_no === 2) {
                                    yearlyData.from2TotalDifference += totalDifference;
                                    yearlyData.monthlyDifferences[transactionMonth].from2TotalDifference += totalDifference;
                                } else if (group.from_no === 3) {
                                    yearlyData.from3TotalDifference += totalDifference;
                                    yearlyData.monthlyDifferences[transactionMonth].from3TotalDifference += totalDifference;
                                }
                            });

                            acc[customerId].stocks.push({
                                ...detail,
                                Buy: Buy,
                                Sale: Sale,
                                Total: Total,
                                isOpen: false,
                                groupedTransactions: stockGroupedByFromId,
                                updated_date: latestDate.format('YYYY-MM-DD HH:mm:ss'),
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

        formatMonthName(month) {
            const months = [
                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
            ];

            const colors = [
                '#FF5733',
                '#33FF57',
                '#3357FF',
                '#FF33A5',
                '#FFD133',
                '#33FFF5',
                '#7D33FF',
                '#FF8C33',
                '#33FFA5',
                '#FF3333',
                '#333FFF',
                '#33FF33',
            ];

            const [year, monthIndex] = month.split('-');
            const monthName = months[parseInt(monthIndex, 10) - 1];
            const color = colors[parseInt(monthIndex, 10) - 1];

            return { name: `${monthName}`, color };
        },

        formatMonthYearName(month) {
            const months = [
                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
            ];

            const colors = [
                '#FF5733',
                '#33FF57',
                '#3357FF',
                '#FF33A5',
                '#FFD133',
                '#33FFF5',
                '#7D33FF',
                '#FF8C33',
                '#33FFA5',
                '#FF3333',
                '#333FFF',
                '#33FF33',
            ];

            const [year, monthIndex] = month.split('-');
            const monthName = months[parseInt(monthIndex, 10) - 1];
            const color = colors[parseInt(monthIndex, 10) - 1];

            return { name: `${monthName}, ${year}`, color };
        },

        getDetailsByNo(detailNo) {
            return this.details.find(detail => detail.no === detailNo);
        },

        async fetchCustomerData() {
            this.customers = await this.$store.dispatch('api/customer/getCustomer');
        },

        getCustomerByNo(custNo) {
            return this.customers.find(customer => customer.no === custNo);
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock');
        },

        getStockByNo(stockNo) {
            return this.stocks.find(stock => stock.no === stockNo);
        },

        async fetchFromData() {
            this.froms = await this.$store.dispatch('api/from/getFrom');
        },

        getFromByNo(fromNo) {
            return this.froms.find(from => from.no === fromNo);
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

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('YYYY-MM-DD HH:mm');
            }
            return 'ยังไม่ระบุวัน';
        },

        getDateColor(date) {
            if (moment(date).isValid()) {
                return '#ffcc64';
            }
            return '#f5464c';
        },

        openDetail(item) {
            this.selectedItemDetail = item.detail;
            this.dialog = true;
        },

        onSearchTypeChange() {
            this.isSearchFieldVisible = this.searchType !== 'updated_date';
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

            if (this.searchType === 'customer_no' || this.searchType === 'customer_name') {
                this.addSearchItemsToSearch();
            } else {
                this.savedSearches.push({
                    query: this.searchQuery,
                    type: this.searchType,
                    start: this.startDateTime,
                    end: this.endDateTime
                });
                this.searchQuery = '';
                this.startDateTime = '';
                this.endDateTime = '';
            }
        },

        addSearchItemsToSearch() {
            const selectedItems =
                this.searchType === 'customer_no' ? this.selectedCustomerIDs :
                    this.searchType === 'customer_name' ? this.selectedCustomerNames : [];

            if (selectedItems.length > 0) {
                this.savedSearches.push({
                    query: selectedItems,
                    type: this.searchType,
                    start: this.startDateTime,
                    end: this.endDateTime
                });

                if (this.searchType === 'customer_no') {
                    this.selectedCustomerIDs = [];
                } else if (this.searchType === 'customer_name') {
                    this.selectedCustomerNames = [];
                }

                this.startDateTime = '';
                this.endDateTime = '';
            }
        },

        applySearchFilter(detail, search) {
            let queryMatched = true;

            let field;
            if (search.type === 'customer_no') {
                field = this.getCustomerByNo(detail.customer_no).id;
            } else if (search.type === 'customer_name') {
                field = this.getCustomerByNo(detail.customer_no).nickname || 'ยังไม่ระบุ';
            } else {
                field = detail[search.type];
            }

            if (search.type === 'customer_no' || search.type === 'customer_name') {
                queryMatched = search.query.some(query => {
                    const lowerCaseField = typeof field === 'string' ? field.toLowerCase() : '';
                    return lowerCaseField === query.toLowerCase();
                });
            } else if (search.type === 'updated_date') {
                return this.checkTimeRange(detail, search);
            } else {
                const searchQuery = search.query.toLowerCase();
                queryMatched = typeof field === 'string' && field.toLowerCase() === searchQuery;
            }

            return queryMatched;
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

            const worksheet = workbook.addWorksheet('สรุปโดยรวม');
            const headers = this.filteredHeaders
                .filter(header => header.value !== 'export' && header.value !== 'action' && header.value !== 'detail')
                .map(header => ({
                    header: header.text,
                    key: header.value,
                    style: { font: { name: 'Angsana New', size: 16 } }
                }));

            worksheet.columns = headers;

            this.filtered.forEach((group) => {
                const rowData = {};
                this.filteredHeaders.forEach(header => {
                    if (header.value === 'updated_date') {
                        rowData[header.value] = moment(group.updated_date).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm');
                    } else if (header.value === 'from_no') {
                        rowData[header.value] = this.getFromByNo(group.from_no)?.from || '';
                    } else if (header.value === 'stock_no') {
                        rowData[header.value] = this.getStockByNo(group.stock_no)?.stock || '';
                    } else if (header.value === 'customer_no') {
                        rowData[header.value] = this.getCustomerByNo(group.customer_no)?.id || 'ยังไม่ระบุ';
                    } else if (header.value === 'customer_name') {
                        rowData[header.value] = this.getCustomerByNo(group.customer_no)?.nickname || 'ยังไม่ระบุ';
                    } else if (header.value === 'base_stock') {
                        rowData[header.value] = (group.from1TotalDifference || 0).toLocaleString();
                    } else if (header.value === 'new_stock') {
                        rowData[header.value] = (group.from2TotalDifference || 0).toLocaleString();
                    } else if (header.value === 'tactic_stock') {
                        rowData[header.value] = (group.from3TotalDifference || 0).toLocaleString();
                    } else if (header.value === 'total') {
                        rowData[header.value] = ((group.from1TotalDifference + group.from2TotalDifference + group.from3TotalDifference) || 0).toLocaleString();
                    } else if (header.value !== 'export' && header.value !== 'action' && header.value !== 'detail') {
                        rowData[header.value] = group[header.value] || '';
                    }
                });

                worksheet.addRow(rowData);
            });

            const styleWorksheet = (worksheet) => {
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
            };

            styleWorksheet(worksheet);

            const currentDate = moment().tz('Asia/Bangkok').format('YYYY-MM-DD');
            workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `สรุปการซื้อขายหุ้นของลูกค้า-${currentDate}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        },

        exportForPerson(customerId, level, date = null) {
            const workbook = new ExcelJS.Workbook();

            const styleWorksheet = (worksheet) => {
                worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.font = { bold: true, name: 'Angsana New', size: 18 };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });

                worksheet.eachRow((row, rowIndex) => {
                    if (rowIndex !== 1 && rowIndex !== 4) {
                        row.eachCell({ includeEmpty: true }, (cell) => {
                            cell.font = { name: 'Angsana New', size: 16 };
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' },
                            };
                        });
                    }
                });
            };

            //All
            const createOverallSheet = () => {
                const allWorksheet = workbook.addWorksheet('สรุปโดยรวม');

                const headers = this.filteredHeaders
                    .filter(header => header.value !== 'detail' && header.value !== 'action' && header.value !== 'export')
                    .map(header => ({
                        header: header.text,
                        key: header.value,
                        style: { font: { name: 'Angsana New', size: 16 } }
                    }));

                allWorksheet.columns = headers;

                let filteredData = this.filtered.filter(group => group.customer_no === customerId);

                filteredData.forEach(group => {
                    const rowData = {};
                    this.filteredHeaders.forEach(header => {
                        if (header.value === 'updated_date') {
                            rowData[header.value] = this.formatDateTime(group.updated_date);
                        } else if (header.value === 'customer_no') {
                            rowData[header.value] = this.getCustomerByNo(group.customer_no)?.id || 'ยังไม่ระบุ';
                        } else if (header.value === 'customer_name') {
                            rowData[header.value] = this.getCustomerByNo(group.customer_no)?.nickname || 'ยังไม่ระบุ';
                        } else if (header.value === 'base_stock') {
                            rowData[header.value] = (group.from1TotalDifference || 0).toLocaleString();
                        } else if (header.value === 'new_stock') {
                            rowData[header.value] = (group.from2TotalDifference || 0).toLocaleString();
                        } else if (header.value === 'tactic_stock') {
                            rowData[header.value] = (group.from3TotalDifference || 0).toLocaleString();
                        } else if (header.value === 'total') {
                            rowData[header.value] = ((group.from1TotalDifference + group.from2TotalDifference + group.from3TotalDifference) || 0).toLocaleString();
                        } else {
                            rowData[header.value] = group[header.value] || '';
                        }
                    });
                    allWorksheet.addRow(rowData);
                });

                styleWorksheet(allWorksheet);

                allWorksheet.addRow([]);

                const newHeaders = [
                    { header: 'ข้อมูลวันที่', key: 'updated_date' },
                    { header: 'รหัสสมาชิก', key: 'customer_no' },
                    { header: 'ชื่อหุ้น', key: 'customer_name' },
                    { header: 'มูลค่าซื้อ', key: 'base_stock' },
                    { header: 'มูลค่าขาย', key: 'new_stock' },
                    { header: 'กำไร/ขาดทุน', key: 'tactic_stock' },
                    { header: 'ที่มาที่ไป', key: 'total' }
                ];
                const headerRow = allWorksheet.addRow(newHeaders.map(h => h.header));

                headerRow.eachCell((cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.font = { bold: true, name: 'Angsana New', size: 18 };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });

                filteredData.forEach((group) => {
                    if (group.stocks && Array.isArray(group.stocks)) {
                        group.stocks.forEach((stock) => {
                            const rowData = {
                                updated_date: this.formatDateTime(stock.updated_date),
                                customer_no: this.getCustomerByNo(group.customer_no)?.id || 'ยังไม่ระบุ',
                                customer_name: this.getStockByNo(stock.stock_no)?.stock || 'ยังไม่ระบุ',
                                base_stock: (stock.Buy || 0).toLocaleString(),
                                new_stock: (stock.Sale || 0).toLocaleString(),
                                tactic_stock: (stock.Total || 0).toLocaleString(),
                                total: this.getFromByNo(stock.from_no)?.from || 'ยังไม่ระบุ',
                            };
                            allWorksheet.addRow(rowData);
                        });
                    }
                });

                styleWorksheet(allWorksheet);
            };

            //Yearly
            const createYearlySheet = () => {
                const yearlyWorksheet = workbook.addWorksheet('สรุปรายปี');

                yearlyWorksheet.columns = [
                    { header: 'ปี', key: 'updated_date', style: { font: { name: 'Angsana New', size: 16 } } },
                    { header: 'รหัสสมาชิก', key: 'customer_no', style: { font: { name: 'Angsana New', size: 16 } } },
                    { header: 'ชื่อเล่น', key: 'customer_name', style: { font: { name: 'Angsana New', size: 16 } } },
                    { header: 'หุ้นเก่า', key: 'base_stock', style: { font: { name: 'Angsana New', size: 16 } } },
                    { header: 'หุ้นใหม่', key: 'new_stock', style: { font: { name: 'Angsana New', size: 16 } } },
                    { header: 'หุ้นแก้เกม', key: 'tactic_stock', style: { font: { name: 'Angsana New', size: 16 } } },
                    { header: 'รวม', key: 'total', style: { font: { name: 'Angsana New', size: 16 } } }
                ];

                let filteredData = this.filtered.filter(group => {
                    if (!date) {
                        return false;
                    }

                    return group.customer_no === customerId &&
                        Object.keys(group.yearlyDifferences).some(year => {
                            return parseInt(year) === parseInt(date);
                        });
                }).map(group => {
                    let filteredYearlyDifferences = {};
                    if (typeof group.yearlyDifferences === 'object') {
                        Object.keys(group.yearlyDifferences).forEach(year => {
                            if (parseInt(year) === parseInt(date)) {
                                filteredYearlyDifferences[year] = group.yearlyDifferences[year];
                            }
                        });
                    }

                    return {
                        ...group,
                        yearlyDifferences: filteredYearlyDifferences
                    };
                });

                filteredData.forEach((group) => {
                    if (group.yearlyDifferences) {
                        Object.values(group.yearlyDifferences).forEach((yearlyData) => {
                            const rowData = {
                                updated_date: date,
                                customer_no: this.getCustomerByNo(group.customer_no)?.id || 'ยังไม่ระบุ',
                                customer_name: this.getCustomerByNo(group.customer_no)?.nickname || 'ยังไม่ระบุ',
                                base_stock: (yearlyData.from1TotalDifference || 0).toLocaleString(),
                                new_stock: (yearlyData.from2TotalDifference || 0).toLocaleString(),
                                tactic_stock: (yearlyData.from3TotalDifference || 0).toLocaleString(),
                                total: ((yearlyData.from1TotalDifference + yearlyData.from2TotalDifference + yearlyData.from3TotalDifference) || 0).toLocaleString()
                            };
                            yearlyWorksheet.addRow(rowData);

                            yearlyWorksheet.addRow([]);

                            const newHeaders = [
                                { header: 'ข้อมูลวันที่', key: 'updated_date' },
                                { header: 'รหัสสมาชิก', key: 'customer_no' },
                                { header: 'ชื่อหุ้น', key: 'customer_name' },
                                { header: 'มูลค่าซื้อ', key: 'base_stock' },
                                { header: 'มูลค่าขาย', key: 'new_stock' },
                                { header: 'กำไร/ขาดทุน', key: 'tactic_stock' },
                                { header: 'ที่มาที่ไป', key: 'total' }
                            ];
                            const headerRow = yearlyWorksheet.addRow(newHeaders.map(h => h.header));

                            headerRow.eachCell((cell) => {
                                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                                cell.font = { bold: true, name: 'Angsana New', size: 18 };
                                cell.border = {
                                    top: { style: 'thin' },
                                    left: { style: 'thin' },
                                    bottom: { style: 'thin' },
                                    right: { style: 'thin' },
                                };
                            });

                            filteredData.forEach((group) => {
                                if (group.stocks && Array.isArray(group.stocks)) {
                                    group.stocks.forEach((stock) => {
                                        const stockYear = new Date(stock.updated_date).getFullYear();

                                        if (stockYear === parseInt(date)) {
                                            const rowData = {
                                                updated_date: this.formatDateTime(stock.updated_date),
                                                customer_no: this.getCustomerByNo(group.customer_no)?.id || 'ยังไม่ระบุ',
                                                customer_name: this.getStockByNo(stock.stock_no)?.stock || 'ยังไม่ระบุ',
                                                base_stock: (stock.Buy || 0).toLocaleString(),
                                                new_stock: (stock.Sale || 0).toLocaleString(),
                                                tactic_stock: (stock.Total || 0).toLocaleString(),
                                                total: this.getFromByNo(stock.from_no)?.from || 'ยังไม่ระบุ',
                                            };
                                            yearlyWorksheet.addRow(rowData);
                                        }
                                    });
                                }
                            });

                            styleWorksheet(yearlyWorksheet);
                        });
                    }
                });
            };

            //Monthly
            const createMonthlySheet = () => {

                const monthlyWorksheet = workbook.addWorksheet('สรุปรายเดือน');
                monthlyWorksheet.columns = [
                    { header: 'เดือน', key: 'updated_date', style: { font: { name: 'Angsana New', size: 16 } } },
                    { header: 'รหัสสมาชิก', key: 'customer_no', style: { font: { name: 'Angsana New', size: 16 } } },
                    { header: 'ชื่อเล่น', key: 'customer_name', style: { font: { name: 'Angsana New', size: 16 } } },
                    { header: 'หุ้นเก่า', key: 'base_stock', style: { font: { name: 'Angsana New', size: 16 } } },
                    { header: 'หุ้นใหม่', key: 'new_stock', style: { font: { name: 'Angsana New', size: 16 } } },
                    { header: 'หุ้นแก้เกม', key: 'tactic_stock', style: { font: { name: 'Angsana New', size: 16 } } },
                    { header: 'รวม', key: 'total', style: { font: { name: 'Angsana New', size: 16 } } }
                ];

                let filteredData = this.filtered.filter(group => {
                    if (!date) {
                        return false;
                    }

                    return group.customer_no === customerId &&
                        Object.keys(group.yearlyDifferences).some(year => {
                            return parseInt(year) === parseInt(date);
                        });
                }).map(group => {
                    let filteredYearlyDifferences = {};

                    if (typeof group.yearlyDifferences === 'object') {
                        Object.entries(group.yearlyDifferences).forEach(([year, yearlyData]) => {
                            if (parseInt(year) === parseInt(date)) {
                                let filteredMonthlyDifferences = {};

                                Object.keys(yearlyData.monthlyDifferences).forEach(month => {
                                    if (month === date) {
                                        filteredMonthlyDifferences[month] = yearlyData.monthlyDifferences[month];
                                    }
                                });

                                if (Object.keys(filteredMonthlyDifferences).length > 0) {
                                    filteredYearlyDifferences[year] = {
                                        ...yearlyData,
                                        monthlyDifferences: filteredMonthlyDifferences
                                    };
                                }
                            }
                        });
                    }

                    return {
                        ...group,
                        yearlyDifferences: filteredYearlyDifferences
                    };
                });

                filteredData.forEach((group) => {
                    if (group.yearlyDifferences) {
                        Object.keys(group.yearlyDifferences).forEach((year) => {
                            const yearlyData = group.yearlyDifferences[year];
                            if (yearlyData.monthlyDifferences) {
                                Object.keys(yearlyData.monthlyDifferences).forEach((month) => {
                                    const monthlyData = yearlyData.monthlyDifferences[month];

                                    const rowData = {
                                        updated_date: this.formatMonthYearName(month).name,
                                        customer_no: this.getCustomerByNo(group.customer_no)?.id || 'ยังไม่ระบุ',
                                        customer_name: this.getCustomerByNo(group.customer_no)?.nickname || 'ยังไม่ระบุ',
                                        base_stock: (monthlyData.from1TotalDifference || 0).toLocaleString(),
                                        new_stock: (monthlyData.from2TotalDifference || 0).toLocaleString(),
                                        tactic_stock: (monthlyData.from3TotalDifference || 0).toLocaleString(),
                                        total: ((monthlyData.from1TotalDifference + monthlyData.from2TotalDifference + monthlyData.from3TotalDifference) || 0).toLocaleString() // Total
                                    };

                                    monthlyWorksheet.addRow(rowData);

                                    monthlyWorksheet.addRow([]);

                                    const newHeaders = [
                                        { header: 'ข้อมูลวันที่', key: 'updated_date' },
                                        { header: 'รหัสสมาชิก', key: 'customer_no' },
                                        { header: 'ชื่อหุ้น', key: 'customer_name' },
                                        { header: 'มูลค่าซื้อ', key: 'base_stock' },
                                        { header: 'มูลค่าขาย', key: 'new_stock' },
                                        { header: 'กำไร/ขาดทุน', key: 'tactic_stock' },
                                        { header: 'ที่มาที่ไป', key: 'total' }
                                    ];
                                    const headerRow = monthlyWorksheet.addRow(newHeaders.map(h => h.header));

                                    headerRow.eachCell((cell) => {
                                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                                        cell.font = { bold: true, name: 'Angsana New', size: 18 };
                                        cell.border = {
                                            top: { style: 'thin' },
                                            left: { style: 'thin' },
                                            bottom: { style: 'thin' },
                                            right: { style: 'thin' },
                                        };
                                    });

                                    filteredData.forEach((group) => {
                                        if (group.stocks && Array.isArray(group.stocks)) {
                                            group.stocks.forEach((stock) => {
                                                const stockYear = new Date(stock.updated_date);
                                                const stockYearMonth = stockYear.getFullYear() + '-' + (stockYear.getMonth() + 1).toString().padStart(2, '0');

                                                if (stockYearMonth === date) {
                                                    const rowData = {
                                                        updated_date: this.formatDateTime(stock.updated_date),
                                                        customer_no: this.getCustomerByNo(group.customer_no)?.id || 'ยังไม่ระบุ',
                                                        customer_name: this.getStockByNo(stock.stock_no)?.stock || 'ยังไม่ระบุ',
                                                        base_stock: (stock.Buy || 0).toLocaleString(),
                                                        new_stock: (stock.Sale || 0).toLocaleString(),
                                                        tactic_stock: (stock.Total || 0).toLocaleString(),
                                                        total: this.getFromByNo(stock.from_no)?.from || 'ยังไม่ระบุ',
                                                    };
                                                    monthlyWorksheet.addRow(rowData);
                                                }
                                            });
                                        }
                                    });

                                    styleWorksheet(monthlyWorksheet);
                                });
                            }
                        });
                    }
                });
            };

            let levelLabel = '';
            if (level === 'group') {
                createOverallSheet();
                levelLabel = 'โดยรวม';
            } else if (level === 'year') {
                createYearlySheet();
                levelLabel = 'ปี ' + date + ' ';
            } else if (level === 'month') {
                createMonthlySheet();
                levelLabel = 'เดือน' + this.formatMonthYearName(date).name + ' ';
            }

            workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `สรุปผลการซื้อขายหุ้นของลูกค้า${levelLabel}ของลูกค้ารหัส ${this.getCustomerByNo(customerId)?.id}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        },

        goBack() {
            window.location.reload();
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
    flex: 1 0 14%;
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
