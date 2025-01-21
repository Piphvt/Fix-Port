<template>

    <div>
        <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />
        <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen" @update:confirm="modalConfirmOpen = false" />
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <StockCreate :open="StockCreateOpen" @update:open="StockCreateOpen = false" />
        <StockEdit :open="editStock" :data="editAllData" @update:edit="editStock = false" />
        <StockUpdate v-model="StockUpdateOpen" />
        <DividendData :stockNo="selectedStockNo" v-model="DividendDataOpen" />
        <PriceData :stockNo="selectedStockNo" v-model="PriceDataOpen" />
        <SetData v-model="SetDataOpen" />
        <StockHistory :No="selectedNo" v-model="HistoryDataOpen" />

        <v-card class="custom-card" flat>
            <v-container>
                <v-row justify="center" align="center">
                    <v-col cols="auto">
                        <v-card-title class="d-flex align-center justify-center">
                            <v-icon class="little-icon" color="#85d7df">mdi-archive</v-icon>&nbsp;
                            <h3 class="mb-0">หุ้น</h3>
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

                            <v-autocomplete v-if="searchType === 'stock'" v-model="selectedStocks"
                                class="mx-2 search-size small-font" :items="getSearchItems('stock')"
                                label="ค้นหาชื่อหุ้น" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'employee_no'" v-model="selectedEmployees"
                                class="mx-2 search-size small-font" :items="getSearchItems('employee_no')"
                                label="ค้นหาชื่อ" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'staff_no'" v-model="selectedStaffs"
                                class="mx-2 search-size small-font" :items="getSearchItems('staff_no')"
                                label="ค้นหาชื่อ" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'set_no'" v-model="selectedSets"
                                class="mx-2 search-size small-font" :items="getSearchItems('set_no')"
                                label="ค้นหาประเภท" dense outlined clearable multiple>
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

                            <v-btn color="success" v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3" @click="exportExcel" icon>
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
                            v-for="header in headers.filter(header => header.value !== 'detail' && header.value !== 'select')"
                            :key="header.value" class="header-item">
                            <v-list-item-content>
                                <v-checkbox v-model="visibleColumns" :value="header.value" :label="header.text" />
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>
                </v-menu>
                <div>
                    <v-btn v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3" @click="StockUpdateOpen = true" class="tab-icon-three"
                        style="font-size: 1.5 rem; margin-left: auto;">
                        <v-icon left color="#85d7df">mdi-archive-arrow-up</v-icon> อัพเดท
                    </v-btn>
                    <v-btn v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3" @click="SetDataOpen = true" class="tab-icon-three"
                        style="font-size: 1.5 rem; margin-left: auto;">
                        <v-icon left color="#85d7df">mdi-archive-settings</v-icon> ประเภท
                    </v-btn>
                    <v-btn @click="StockCreateOpen = true" class="tab-icon-two"
                        style="font-size: 1.5 rem; margin-left: auto;">
                        <v-icon left color="#24b224">mdi-archive-plus</v-icon> เพิ่ม
                    </v-btn>
                </div>
            </div>

            <v-data-table :headers="filteredHeaders" :items="filtered" :sort-by.sync="sortBy" :sort-desc.sync="sortDesc"
                item-key="no" :items-per-page="5">
                <template v-slot:item.select="{ item }">
                    <div class="text-center"
                        style="display: flex; justify-content: center; align-items: center; height: 100%;">
                        <v-checkbox v-if="isSelectingItems" v-model="selectedItems" :value="item.no"
                            style="transform: scale(1);" />
                    </div>
                </template>
                <template v-slot:item.set_no="{ item }">
                    <div class="text-center" :style="{ color: getFromText(getSetName(item.set_no)).color }">
                        {{ getSetName(item.set_no) || 'ยังไม่ระบุ' }}
                    </div>
                </template>
                <template v-slot:item.employee_no="{ item }">
                    <div class="text-center">{{ getEmployeeName(item.employee_no) }}</div>
                </template>
                <template v-slot:item.staff_no="{ item }">
                    <div :style="{ 'color': item.staff_no ? '#38b6ff' : '#ffc800' }" class="text-center">
                        {{ getEmployeeName(item.staff_no) }}
                    </div>
                </template>

                <template v-slot:item.updated_date="{ item }">
                    <div class="text-center">{{ formatDateTime(item.updated_date) }}</div>
                </template>
                <template v-slot:item.dividend_amount="{ item }">
                    <div class="text-center">
                        {{ item.dividend + ' ' }}
                        <v-icon color="#85d7df" @click="OpenDividendData(item.no)">mdi-eye</v-icon>
                    </div>
                </template>
                <template v-slot:item.closing_price="{ item }">
                    <div class="text-center">
                        {{ item.price + ' ' }}
                        <v-icon color="#85d7df" @click="OpenPriceData(item.no)">mdi-eye</v-icon>
                    </div>
                </template>
                <template v-slot:item.detail="{ item }">
                    <div class="text-center">
                        <v-menu offset-y>
                            <template v-slot:activator="{ on, attrs }">
                                <v-icon v-bind="attrs" v-on="on" color="#85d7df">mdi-dots-vertical</v-icon>
                            </template>
                            <v-list class="custom-list">
                                <v-list-item @click="openEditStock(item)" class="custom-list-item">
                                    <v-list-item-icon style="margin-right: 4px;">
                                        <v-icon class="icon-tab" color="#ffc800">mdi-pencil-circle</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content style="font-size: 0.8rem;">แก้ไข</v-list-item-content>
                                </v-list-item>

                                <v-list-item v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3" @click="toggleSelectItems" class="custom-list-item">
                                    <v-list-item-icon style="margin-right: 4px;">
                                        <v-icon class="icon-tab" color="#e50211">mdi-delete-circle</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content style="font-size: 0.8rem;">ลบ</v-list-item-content>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </div>
                </template>
            </v-data-table>
            <div class="text-center">
                <v-btn v-if="isSelectingItems && selectedItems.length > 0" color="red" @click="deleteSelectedItems"
                    class="mb-4" style="font-size: 1.5 rem; margin-left: auto;">
                    <v-icon left color="white">mdi-delete</v-icon> ลบ
                </v-btn>
            </div>
        </v-card>

        <v-dialog v-model="dialog" max-width="300px">
            <v-card>
                <v-card-title class="headline"
                    style="justify-content: center; display: flex;">รายละเอียดเพิ่มเติม</v-card-title>
                <v-card-text>
                </v-card-text>
                <v-card-actions>
                    <div class="text-center">
                        <v-btn color="#e50211" @click="dialog = false">ปิด</v-btn>
                    </div>
                </v-card-actions>
            </v-card>
        </v-dialog>
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
        await this.fetchStockData();
        await this.fetchEmployeeData();
        await this.fetchSetData();
        await this.fetchSetTopic();
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
                confirm: {
                    open: false,
                },
                complete: {
                    open: false,
                    message: '',
                },
            },

            stocks: [],
            sets: [],
            employees: [],

            selectedStocks: [],
            selectedEmployees: [],
            selectedStaffs: [],
            selectedSets: [],

            selectedItems: [],
            handleConfirm: null,
            isSelectingItems: false,

            selectedNo: null,
            HistoryDataOpen: false,
            selectedStockNo: null,
            DividendDataOpen: false,
            PriceDataOpen: false,
            SetDataOpen: false,
            StockUpdateOpen: false,
            StockCreateOpen: false,

            sortBy: 'updated_date',
            currentAction: '',
            searchQuery: '',
            searchType: 'stock',
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
            editStock: false,
            dialog: false,
            sortDesc: true,
            selectedStock: null,
            currentItem: null,
            stockNo: null,
            actionType: null,
            savedSearches: [],
            editAllData: {},

            searchTypes: [
                { text: 'ชื่อหุ้น', value: 'stock' },
                { text: 'ทำรายการโดย', value: 'employee_no' },
                { text: 'ผู้ติดตามหุ้น', value: 'staff_no' },
                { text: 'ประเภท', value: 'set_no' },
                { text: 'เวลา', value: 'updated_date' }
            ],

            visibleColumns: ['select', 'updated_date', 'set_no', 'stock', 'dividend_amount', 'closing_price', 'comment', 'staff_no', 'employee_no', 'detail'],

            headers: [
                {
                    text: '',
                    value: 'select',
                    sortable: false,
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
                    text: 'ประเภท',
                    value: 'set_no',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ชื่อหุ้น',
                    value: 'stock',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'จำนวนปันผลปีนี้',
                    value: 'dividend_amount',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ราคาปิด',
                    value: 'closing_price',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'หมายเหตุ',
                    value: 'comment',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ผู้ติดตามหุ้น',
                    value: 'staff_no',
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
            let filteredStocks = this.stocks;
            this.savedSearches.forEach(search => {
                filteredStocks = filteredStocks.filter(stock => {
                    return this.applySearchFilter(stock, search);
                });
            });
            return filteredStocks;
        },

        filteredHeaders() {
            return this.headers.filter(header => this.visibleColumns.includes(header.value));
        },
    },

    methods: {
        OpenLogData(No) {
            this.selectedNo = No;
            this.HistoryDataOpen = true;
        },

        OpenDividendData(stockNo) {
            this.selectedStockNo = stockNo;
            this.DividendDataOpen = true;
        },

        OpenPriceData(stockNo) {
            this.selectedStockNo = stockNo;
            this.PriceDataOpen = true;
        },

        toggleSelectItems() {
            this.isSelectingItems = !this.isSelectingItems;
        },

        getCurrentItem(no) {
            return this.stocks.find(item => item.no === no);
        },

        async deleteSelectedItems() {
            this.handleConfirm = async () => {
                const selectedIds = this.selectedItems;

                for (let i = 0; i < selectedIds.length; i++) {
                    try {
                        await this.$store.dispatch('api/stock/deleteStock', selectedIds[i]);

                        this.currentItem = this.getCurrentItem(selectedIds[i]);

                        this.recordLog();
                    } catch (error) {
                        console.error(`Error deleting item with id ${selectedIds[i]}:`, error);
                    }
                }

                this.$emit('updateItems');
                this.selectedItems = [];
                this.isSelectingItems = false;

                this.modal.complete.message = 'ลบรายการที่เลือกสำเร็จ';
                this.modal.complete.open = true;
                this.modalConfirmOpen = false;
            };

            this.modalConfirmOpen = true;
        },

        async fetchSetTopic() {
            try {
                const settopics = await this.$store.dispatch('api/set/getSet');
                this.actionTopics = settopics.map(set => ({
                    text: set.set,
                    value: set.set
                }));
            } catch (error) {
                console.error('Failed to fetch stocks:', error);
            }
        },

        async fetchSetData() {
            this.sets = await this.$store.dispatch('api/set/getSet')
        },

        getSetName(setId) {
            const set = this.sets.find(t => t.no === setId);
            return set ? set.set : '';
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock');
            this.dividends = await this.$store.dispatch('api/dividend/getDividend');
            this.prices = await this.$store.dispatch('api/price/getPrice');

            const currentYear = new Date().getFullYear();

            for (let stock of this.stocks) {
                const filteredPrices = this.prices.filter(price => price.stock_no === stock.no);

                if (filteredPrices.length > 0) {
                    const latestPrice = filteredPrices.reduce((latest, current) => {
                        const latestDate = new Date(latest.created_date);
                        const currentDate = new Date(current.created_date);

                        return currentDate > latestDate ? current : latest;
                    });

                    stock.price = latestPrice.price;
                } else {
                    stock.price = 0;
                }

                const totalDividend = this.dividends
                    .filter(dividend => dividend.stock_no === stock.no &&
                        new Date(dividend.created_date).getFullYear() === currentYear)
                    .reduce((total, dividend) => {
                        return total.add(new Decimal(dividend.dividend));
                    }, new Decimal(0));

                stock.dividend = totalDividend.toString();

                const relatedDates = [
                    stock.created_date,
                    ...filteredPrices.map(price => price.created_date),
                    ...this.dividends
                        .filter(dividend => dividend.stock_no === stock.no)
                        .map(dividend => dividend.created_date)
                ];

                const latestUpdatedDate = relatedDates
                    .map(date => new Date(date))
                    .reduce((latest, current) => (current > latest ? current : latest), new Date(0));

                stock.updated_date = latestUpdatedDate.toISOString();
            }
        },

        async fetchEmployeeData() {
            this.employees = await this.$store.dispatch('api/employee/getEmployee');
        },

        getEmployeeName(empId) {
            const employee = this.employees.find(e => e.no === empId);
            return employee ? employee.fname + ' ' + employee.lname : 'ยังไม่ระบุ';
        },

        openEditStock(stock) {
            this.editAllData = stock;
            this.editStock = true;
        },

        showEditDialog(item) {
            this.selectedStock = item;
            this.editDialogOpen = true;
        },

        getSearchItems(type) {
            if (type === 'stock') {
                return this.stocks.map(stock => stock.stock);
            } else if (type === 'employee_no') {
                return this.stocks.map(stock => this.getEmployeeName(stock.employee_no));
            } else if (type === 'staff_no') {
                return this.stocks.map(stock => this.getEmployeeName(stock.staff_no));
            } else if (type === 'set_no') {
                return this.stocks.map(stock => this.getSetName(stock.set_no) || 'ยังไม่ระบุ');
            }
            return [];
        },

        showConfirmDialog(action, item) {
            this.currentAction = action;
            this.currentItem = item;
            this.modalConfirmOpen = true;
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
                        this.$router.push('/app/data/stock');
                    } else if (RankID === '2') {
                        this.$router.push('/app/data/stock');
                    } else if (RankID === '3') {
                        this.$router.push('/app/data/stock');
                    } else if (RankID === '4') {
                        this.$router.push('/app/data/stock');
                    } else {
                        this.$router.push('/auth');
                    }
                }
            } else {
                this.$router.push('/');
            }
        },

        getFromText(set) {
            if (set === 'SET') {
                return { text: 'SET', color: '#24b224' };
            } else if (set === 'SET50') {
                return { text: 'SET50', color: '#ffc800' };
            } else if (set === 'SET100') {
                return { text: 'SET100', color: '#38b6ff' };
            } else if (set === 'ETF') {
                return { text: 'ETF', color: '#8c52ff' };
            } else if (set === 'MAI') {
                return { text: 'MAI', color: '#ff914d' };
            } else if (set === 'Warrants') {
                return { text: 'Warrants', color: '#c1ff72' };
            } else if (set === 'DR') {
                return { text: 'DR', color: '#ff5757' };
            } else if (set === 'Preferred Stock') {
                return { text: 'Preferred Stock', color: '#ff66c4' };
            } else if (set === '') {
                return { text: 'ยังไม่ระบุ', color: '#e50211' };
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
            this.selectedItemDetail = item.detail;
            this.dialog = true;
        },

        onSearchTypeChange() {
            this.isSearchFieldVisible = this.searchSet !== 'updated_date';
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

            if (this.searchType === 'stock' || this.searchType === 'employee_no' || this.searchType === 'staff_no' || this.searchType === 'set_no') {
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
                this.searchType === 'stock' ? this.selectedStocks :
                    this.searchType === 'staff_no' ? this.selectedStaffs :
                        this.searchType === 'employee_no' ? this.selectedEmployees :
                            this.searchType === 'set_no' ? this.selectedSets : [];

            if (selectedItems.length > 0) {
                this.savedSearches.push({
                    query: selectedItems,
                    type: this.searchType,
                    start: this.startDateTime,
                    end: this.endDateTime
                });

                if (this.searchType === 'stock') {
                    this.selectedStocks = [];
                } else if (this.searchType === 'staff_no') {
                    this.selectedStaffs = [];
                } else if (this.searchType === 'employee_no') {
                    this.selectedEmployees = [];
                } else if (this.searchType === 'set_no') {
                    this.selectedSets = [];
                }

                this.startDateTime = '';
                this.endDateTime = '';
            }
        },

        applySearchFilter(stock, search) {
            let queryMatched = true;

            let field;
            if (search.type === 'employee_no') {
                field = this.getEmployeeName(stock.employee_no);
            } else if (search.type === 'staff_no') {
                field = this.getEmployeeName(stock.staff_no) || 'ยังไม่ระบุ';
            } else if (search.type === 'set_no') {
                field = this.getSetName(stock.set_no) || 'ยังไม่ระบุ';
            } else {
                field = stock[search.type];
            }

            if (search.type === 'stock' || search.type === 'employee_no' || search.type === 'staff_no' || search.type === 'set_no') {
                queryMatched = search.query.some(query => {
                    const lowerCaseField = typeof field === 'string' ? field.toLowerCase() : '';
                    return lowerCaseField === query.toLowerCase();
                });
            } else if (search.type === 'updated_date') {
                return this.checkTimeRange(stock, search);
            } else {
                const searchQuery = search.query.toLowerCase();
                queryMatched = typeof field === 'string' && field.toLowerCase() === searchQuery;
            }

            return queryMatched;
        },

        checkTimeRange(stock, search) {
            const stockTime = moment(stock.updated_date);
            const startTime = moment(search.start);
            const endTime = moment(search.end);
            return (!startTime.isValid() || stockTime.isSameOrAfter(startTime)) &&
                (!endTime.isValid() || stockTime.isSameOrBefore(endTime));
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
                .filter(header => header.value !== 'picture' && header.value !== 'detail')
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
                    } else if (header.value === 'set_no') {
                        rowData[header.value] = this.getSetName(item.set_no);
                    } else if (header.value === 'employee_no') {
                        rowData[header.value] = this.getEmployeeName(item.employee_no);
                    } else if (header.value === 'dividend_amount') {
                        rowData[header.value] = this.getTotalDividends(item.no);
                    } else if (header.value !== 'picture' && header.value !== 'detail') {
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
                link.setAttribute('download', `ข้อมูลหุ้น-${currentDate}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        },

        goBack() {
            window.location.reload();
        },

        recordLog() {
            const Employee_Name = this.$auth.user.fname + ' ' + this.$auth.user.lname;
            const Employee_Email = this.$auth.user.email;
            const Employee_Picture = this.$auth.user.picture;
            const log = {
                action: 'หุ้น',
                name: this.currentItem.stock,
                detail: `ประเภท : ${this.getSetName(this.currentItem.set_no) || 'ยังไม่ระบุ'}\n` +
                    `หมายเหตุ : ${this.currentItem.comment}'}\n`+
                    `ผู้ติดตามหุ้น : ${this.getEmployeeName(this.currentItem.staff_no)}\n`,
                type: 1,
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
    flex: 1 0 0%;
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

.custom-card {
    max-width: 1200px;
    width: 100%;
    margin: auto;
}
</style>