<template>

    <div>
        <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />
        <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen" @update:confirm="modalConfirmOpen = false" />
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <CommissionData v-model="CommissionDataOpen" />
        <TransactionCreate :open="TransactionCreateOpen" @update:open="TransactionCreateOpen = false" />
        <TransactionTotal v-model="TotalTransactionDataOpen" />
        <TransactionEdit :open="editAllDialog" :data="editAllData" @update:edit="editAllDialog = false" />

        <v-card flat>
            <v-container>
                <v-row justify="center" align="center">
                    <v-col cols="auto">
                        <v-card-title class="d-flex align-center justify-center">
                            <v-icon class="little-icon" color="#85d7df">mdi-cash</v-icon>&nbsp;
                            <h3 class="mb-0">ข้อมูลการซื้อขายหุ้นของลูกค้า</h3>
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

                            <v-autocomplete v-if="searchType === 'customer_no'" v-model="selectedCustomerIDs"
                                class="mx-2 search-size small-font" :items="getSearchItems('customer_no')"
                                label="ค้นหารหัสสมาชิก" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'customer_name'" v-model="selectedCustomerNames"
                                class="mx-2 search-size small-font" :items="getSearchItems('customer_name')"
                                label="ค้นหาชื่อเล่น" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'stock_no'" v-model="selectedStocks"
                                class="mx-2 search-size small-font" :items="getSearchItems('stock_no')"
                                label="ค้นหาชื่อหุ้น" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'employee_no'" v-model="selectedEmployees"
                                class="mx-2 search-size small-font" :items="getSearchItems('employee_no')"
                                label="ค้นหาผู้ทำรายการ" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'action'" v-model="selectedActions"
                                class="mx-2 search-size small-font" :items="getSearchItems('action')"
                                label="ค้นหาการซื้อ/ขาย" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'from_no'" v-model="selectedFroms"
                                class="mx-2 search-size small-font" :items="getSearchItems('from_no')"
                                label="ค้นหาที่มาที่ไป" dense outlined clearable multiple>
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
                        <v-list-item v-for="header in headers.filter(header => header.value !== 'detail')"
                            :key="header.value" class="header-item">
                            <v-list-item-content>
                                <v-checkbox v-model="visibleColumns" :value="header.value" :label="header.text" />
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>
                </v-menu>
                <div>
                    <v-btn @click="TotalTransactionDataOpen = true" class="tab-icon-three"
                        style="font-size: 1.5 rem; margin-left: auto;">
                        <v-icon left color="#85d7df">mdi-cash-register</v-icon> สรุปผลการซื้อขายหุ้นของลูกค้า
                    </v-btn>
                    <v-btn @click="CommissionDataOpen = true" class="tab-icon-three"
                        style="font-size: 1.5 rem; margin-left: auto;">
                        <v-icon left color="#85d7df">mdi-credit-card</v-icon> ค่าธรรมเนียม
                    </v-btn>
                    <v-btn @click="TransactionCreateOpen = true" class="tab-icon-two"
                        style="font-size: 1.5 rem; margin-left: auto;">
                        <v-icon left color="#24b224">mdi-cash-plus</v-icon> เพิ่มการซื้อขายหุ้น
                    </v-btn>
                </div>
            </div>

            <v-data-table :headers="filteredHeaders" :items="filtered" :sort-by.sync="sortBy" :sort-desc.sync="sortDesc"
                item-key="no" :items-per-page="5" style="overflow-x: auto; white-space: nowrap;">
                <template v-slot:item.employee_no="{ item }">
                    <div class="text-center">
                        <span v-if="getEmployeeByNo(item.employee_no)">
                            {{ getEmployeeByNo(item.employee_no).fname }} {{ getEmployeeByNo(item.employee_no).lname }}
                        </span>
                        <span v-else>ไม่ทราบ</span>
                    </div>
                </template>
                <template v-slot:item.customer_no="{ item }">
                    <div class="text-center">
                        {{ getCustomerByNo(item.customer_no)?.id || 'ยังไม่ระบุ' }}
                    </div>
                </template>


                <template v-slot:item.amount="{ item }">
                    <div class="text-center">
                        <span v-if="item.amount !== null && item.amount !== undefined">
                            {{ item.amount.toLocaleString() }}
                        </span>
                        <span v-else>
                        </span>
                    </div>
                </template>
                <template v-slot:item.price="{ item }">
                    <div class="text-center">
                        <span v-if="item.price !== null && item.price !== undefined">
                            {{ item.price.toLocaleString() }}
                        </span>
                        <span v-else>
                        </span>
                    </div>
                </template>
                <template v-slot:item.result="{ item }">
                    <div class="text-center">
                        <span v-if="item.result !== null && item.result !== undefined">
                            {{ item.result.toLocaleString() }}
                        </span>
                        <span v-else>
                        </span>
                    </div>
                </template>
                <template v-slot:item.comfee="{ item }">
                    <div class="text-center">
                        <span v-if="item.comfee !== null && item.comfee !== undefined">
                            {{ item.comfee.toLocaleString() }}
                        </span>
                        <span v-else>
                        </span>
                    </div>
                </template>
                <template v-slot:item.vat="{ item }">
                    <div class="text-center">
                        <span v-if="item.vat !== null && item.vat !== undefined">
                            {{ item.vat.toLocaleString() }}
                        </span>
                        <span v-else>
                        </span>
                    </div>
                </template>
                <template v-slot:item.total="{ item }">
                    <div class="text-center">
                        <span v-if="item.total !== null && item.total !== undefined">
                            {{ item.total.toLocaleString() }}
                        </span>
                        <span v-else>
                        </span>
                    </div>
                </template>

                <template v-slot:item.customer_name="{ item }">
                    <div class="text-center">
                        {{ getCustomerByNo(item.customer_no)?.nickname || 'ยังไม่ระบุ' }}
                    </div>
                </template>
                <template v-slot:item.detail_amount="{ item }">
                    <div class="text-center" style="color:#ff66c4">
                        {{ (item.resultamount || 0).toLocaleString() }}
                    </div>
                </template>
                <template v-slot:item.stock_no="{ item }">
                    <div class="text-center">
                        {{ getStockByNo(item.stock_no)?.stock || 'ยังไม่ระบุ' }}
                    </div>
                </template>
                <template v-slot:item.commission="{ item }">
                    <div class="text-center" style="color:#38b6ff">
                        {{ item.commission || 'ยังไม่ระบุ' }}
                    </div>
                </template>
                <template v-slot:item.from_no="{ item }">
                    <div class="text-center">
                        <span :style="{ color: getFromText(getFromByNo(item.from_no)?.from).color }">
                            {{ getFromByNo(item.from_no)?.from || 'ยังไม่ระบุ' }}
                        </span>
                    </div>
                </template>
                <template v-slot:item.type="{ item }">
                    <div class="text-center">
                        <span :style="{ color: getTypeText(item.type).color }">
                            {{ getTypeText(item.type).text }}
                        </span>
                    </div>
                </template>
                <template v-slot:item.updated_date="{ item }">
                    <div class="text-center">{{ formatDateTime(item.updated_date) }}</div>
                </template>
                <template v-slot:item.detail="{ item }">
                    <div class="text-center">
                        <v-menu offset-y>
                            <template v-slot:activator="{ on, attrs }">
                                <v-icon v-bind="attrs" v-on="on" color="#85d7df">mdi-dots-vertical</v-icon>
                            </template>
                            <v-list class="custom-list">
                                <v-list-item @click="openEditAllDialog(item)" class="custom-list-item">
                                    <v-list-item-icon style="margin-right: 4px;">
                                        <v-icon class="icon-tab" color="#ffc800">mdi-pencil</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content style="font-size: 0.8rem;">แก้ไข</v-list-item-content>
                                </v-list-item>

                                <v-list-item @click="showConfirmDialog('delete', item)" class="custom-list-item">
                                    <v-list-item-icon style="margin-right: 4px;">
                                        <v-icon class="icon-tab" color="#e50211">mdi-delete</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content style="font-size: 0.8rem;">ลบ</v-list-item-content>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </div>
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
        await this.fetchTransactionData();
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
            transactions: [],
            details: [],
            customers: [],
            stocks: [],
            froms: [],
            commissions: [],

            selectedCustomerIDs: [],
            selectedCustomerNames: [],
            selectedStocks: [],
            selectedEmployees: [],
            selectedActions: [],
            selectedFroms: [],

            TransactionCreateOpen: false,
            CommissionDataOpen: false,
            TotalTransactionDataOpen: false,

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
            editAllDialog: false,
            dialog: false,
            sortDesc: true,
            selectedEmployee: null,
            currentItem: null,
            employeeNo: null,
            actionType: null,
            savedSearches: [],
            editAllData: {},

            searchTypes: [
                { text: 'รหัสสมาชิก', value: 'customer_no' },
                { text: 'ชื่อเล่น', value: 'customer_name' },
                { text: 'ชื่อหุ้น', value: 'stock_no' },
                { text: 'ทำรายการโดย', value: 'employee_no' },
                { text: 'ซื้อ/ขาย', value: 'action' },
                { text: 'ที่มาที่ไป', value: 'from_no' },
                { text: 'ข้อมูลวันที่', value: 'updated_date' }
            ],

            visibleColumns: ['updated_date', 'customer_no', 'customer_name', 'stock_no', 'detail_amount', 'type', 'amount', 'price', 'result', 'comfee', 'vat', 'total', 'commission', 'from_no', 'employee_no', 'detail'],

            headers: [
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
                    text: 'ชื่อหุ้น',
                    value: 'stock_no',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'จำนวนคงเหลือ',
                    value: 'detail_amount',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'การกระทำ',
                    value: 'type',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'จำนวน',
                    value: 'amount',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ราคา',
                    value: 'price',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'มูลค่า',
                    value: 'result',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ค่าธรรมเนียม',
                    value: 'comfee',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ภาษี',
                    value: 'vat',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'รวมมูลค่า',
                    value: 'total',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ตัวคูณค่าธรรมเนียม',
                    value: 'commission',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ที่มาที่ไป',
                    value: 'from_no',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ทำรายการโดย',
                    value: 'employee_no',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: '',
                    value: 'detail',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },
            ],
        };
    },

    computed: {
        filtered() {
            let filteredDetails = this.transactions;
            this.savedSearches.forEach(search => {
                filteredDetails = filteredDetails.filter(transaction => {
                    return this.applySearchFilter(transaction, search);
                });
            });
            return filteredDetails;
        },

        formattedDetailLines() {
            return this.selectedItemDetail.split('\n');
        },

        filteredHeaders() {
            return this.headers.filter(header => this.visibleColumns.includes(header.value));
        },
    },

    methods: {
        async fetchDetailData() {
            this.details = await this.$store.dispatch('api/detail/getDetail');

            this.transactions.forEach(transaction => {
                const detail = this.details.find(detail => detail.no === transaction.stock_detail_no);

                if (detail) {
                    transaction.customer_no = detail.customer_no;
                    transaction.stock_no = detail.stock_no;

                    let amountType1 = 0;
                    let amountType2 = 0;

                    this.transactions.forEach(t => {
                        if (t.stock_detail_no === transaction.stock_detail_no && t.type === 1) {
                            amountType1 += t.amount || 0;
                        }
                    });

                    this.transactions.forEach(t => {
                        if (t.stock_detail_no === transaction.stock_detail_no && t.type === 2) {
                            amountType2 += t.amount || 0;
                        }
                    });

                    transaction.resultamount = (detail.amount || 0) + amountType1 - amountType2;
                } else {
                    transaction.resultamount = 0;
                }
            });
        },

        getDetailByNo(detailNo) {
            return this.details.find(detail => detail.no === detailNo);
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
            if (type === 'customer_no') {
                return this.transactions.map(transaction => this.getCustomerByNo(transaction.customer_no)?.id);
            } else if (type === 'customer_name') {
                return this.transactions.map(transaction => this.getCustomerByNo(transaction.customer_no)?.nickname);
            } else if (type === 'stock_no') {
                return this.transactions.map(transaction => this.getStockByNo(transaction.stock_no)?.stock);
            } else if (type === 'employee_no') {
                return this.transactions.map(transaction => this.getEmployeeByNo(transaction.employee_no).fname + ' ' + this.getEmployeeByNo(transaction.employee_no).lname);
            } else if (type === 'action') {
                return this.transactions.map(transaction => this.getTypeText(transaction.type).text);
            } else if (type === 'from_no') {
                return this.transactions.map(transaction => this.getFromByNo(transaction.from_no)?.from);
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
                    await this.$store.dispatch('api/transaction/deleteTransaction', this.currentItem.no);
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
                        this.$router.push('/app/data/transaction');
                    } else if (RankID === '2') {
                        this.$router.push('/app/data/transaction');
                    } else if (RankID === '3') {
                        this.$router.push('/app/data/transaction');
                    } else {
                        this.$router.push('/auth');
                    }
                }
            } else {
                this.$router.push('/');
            }
        },

        async fetchEmployeeData() {
            this.employees = await this.$store.dispatch('api/employee/getEmployee');
        },

        getEmployeeByNo(empNo) {
            return this.employees.find(employee => employee.no === empNo);
        },

        async fetchTransactionData() {
            this.transactions = await this.$store.dispatch('api/transaction/getTransaction');

            const commissionData = await this.fetchCommissionData();

            if (Array.isArray(commissionData)) {
                this.transactions.forEach(transaction => {
                    const matchingCommission = commissionData.find(c => c.no === transaction.commission_no);

                    if (matchingCommission) {
                        const result = transaction.price * transaction.amount;
                        const comfee = result * matchingCommission.commission;
                        const vat = comfee * 0.07;

                        transaction.commission = matchingCommission.commission;
                        transaction.result = result;
                        transaction.comfee = comfee;
                        transaction.vat = vat;

                        if (transaction.type === 1) {
                            transaction.total = result + comfee + vat;
                        } else if (transaction.type === 2) {
                            transaction.total = result - comfee - vat;
                        } else {
                            transaction.total = result;
                        }

                    } else {
                        transaction.comfee = 0;
                    }
                });
            } else {
                console.error("commissionData ไม่ได้เป็นอาเรย์", commissionData);
            }

            await this.fetchDetailData();
        },

        async fetchCustomerData() {
            this.customers = await this.$store.dispatch('api/customer/getCustomer');
        },

        getCustomerByNo(custNo) {
            return this.customers.find(customer => customer.no === custNo);
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock');
            await this.fetchDetailData();
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

        async fetchCommissionData() {
            try {
                const data = await this.$store.dispatch('api/commission/getCommission');
                return data || [];
            } catch (error) {
                console.error("Error fetching commission data:", error);
                return [];
            }
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

        getTypeText(value) {
            if (value === 1) {
                return { text: 'ซื้อ', color: '#24b224' };
            } else if (value === 2) {
                return { text: 'ขาย', color: '#e50211' };
            } else {
                return { text: '', color: 'inherit' };
            }
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('YYYY-MM-DD HH:mm');
            }
            return 'Invalid Date';
        },

        openDetail(item) {
            this.selectedItemDetail = item.transaction;
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

            if (this.searchType === 'customer_no' || this.searchType === 'customer_name' || this.searchType === 'stock_no'
                || this.searchType === 'employee_no' || this.searchType === 'action' || this.searchType === 'from_no') {
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
                    this.searchType === 'customer_name' ? this.selectedCustomerNames :
                        this.searchType === 'stock_no' ? this.selectedStocks :
                            this.searchType === 'employee_no' ? this.selectedEmployees :
                                this.searchType === 'action' ? this.selectedActions :
                                        this.searchType === 'from_no' ? this.selectedFroms : [];

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
                } else if (this.searchType === 'stock_no') {
                    this.selectedStocks = [];
                } else if (this.searchType === 'employee_no') {
                    this.selectedEmployees = [];
                } else if (this.searchType === 'action') {
                    this.selectedActions = [];
                } else if (this.searchType === 'from_no') {
                    this.selectedFroms = [];
                }

                this.startDateTime = '';
                this.endDateTime = '';
            }
        },

        applySearchFilter(transaction, search) {
            let queryMatched = true;

            let field;
            if (search.type === 'customer_no') {
                field = this.getCustomerByNo(transaction.customer_no).id;
            } else if (search.type === 'customer_name') {
                field = this.getCustomerByNo(transaction.customer_no).nickname || 'ยังไม่ระบุ';
            } else if (search.type === 'stock_no') {
                field = this.getStockByNo(transaction.stock_no).stock || 'ยังไม่ระบุ';
            } else if (search.type === 'employee_no') {
                field = this.getEmployeeByNo(transaction.employee_no)?.fname + ' ' + this.getEmployeeByNo(transaction.employee_no)?.lname || 'ยังไม่ระบุ';
            } else if (search.type === 'action') {
                field = this.getTypeText(transaction.type).text || 'ยังไม่ระบุ';
            } else if (search.type === 'from_no') {
                field = this.getFromByNo(transaction.from_no)?.from || 'ยังไม่ระบุ';
            } else {
                field = transaction[search.type];
            }

            if (search.type === 'customer_no' || search.type === 'customer_name' || search.type === 'stock_no'
                || search.type === 'employee_no' || search.type === 'action' || search.type === 'from_no') {
                queryMatched = search.query.some(query => {
                    const lowerCaseField = typeof field === 'string' ? field.toLowerCase() : '';
                    return lowerCaseField === query.toLowerCase();
                });
            } else if (search.type === 'updated_date') {
                return this.checkTimeRange(transaction, search);
            } else {
                const searchQuery = search.query.toLowerCase();
                queryMatched = typeof field === 'string' && field.toLowerCase() === searchQuery;
            }

            return queryMatched;
        },

        checkTimeRange(transaction, search) {
            const transactionTime = moment(transaction.updated_date);
            const startTime = moment(search.start);
            const endTime = moment(search.end);
            return (!startTime.isValid() || transactionTime.isSameOrAfter(startTime)) &&
                (!endTime.isValid() || transactionTime.isSameOrBefore(endTime));
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
                    } else if (header.value === 'type') {
                        rowData[header.value] = this.getTypeText(item.type).text;
                    } else if (header.value === 'from_no') {
                        rowData[header.value] = this.getFromByNo(item.from_no).from;
                    } else if (header.value === 'stock_no') {
                        rowData[header.value] = this.getStockByNo(item.stock_no).stock;
                    } else if (header.value === 'customer_no') {
                        rowData[header.value] = this.getCustomerByNo(item.customer_no).id;
                    } else if (header.value === 'customer_name') {
                        rowData[header.value] = this.getCustomerByNo(item.customer_no).nickname;
                    } else if (header.value === 'employee_no') {
                        rowData[header.value] = this.getEmployeeByNo(item.employee_no).fname + ' ' + this.getEmployeeByNo(item.employee_no).lname;
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
                link.setAttribute('download', `ข้อมูลการซื้อขายหุ้นของลูกค้า-${currentDate}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        },

        goBack() {
            window.location.reload();
        },

        recordLog() {
            const stock = this.getStockByNo(this.currentItem.stock_no);
            const from = this.getFromByNo(this.currentItem.from_no);
            const customer = this.getCustomerByNo(this.currentItem.customer_no)
            const log = {
                customer_no: `${customer ? customer.id : 'ไม่พบรหัสลูกค้า'}`,
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
            this.$store.dispatch('api/log/addLog', log);
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