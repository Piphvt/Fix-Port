<template>

    <div>
        <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />
        <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen" @update:confirm="modalConfirmOpen = false" />
        <ModalRecheck :method="Confirm" :open="modalRecheckOpen" @update:confirm="modalRecheckOpen = false" />
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <FollowCreate :open="FollowCreateOpen" @update:open="FollowCreateOpen = false" />
        <FollowEdit :open="editStock" :data="editAllData" @update:edit="editStock = false" />
        <FollowReach v-model="FollowReachDataOpen" />
        <FollowBot v-model="FollowBotDataOpen" />
        <FollowStock v-model="FollowStockDataOpen" />

        <v-card class="custom-card" flat>
            <v-container>
                <v-row justify="center" align="center">
                    <v-col cols="auto">
                        <v-card-title class="d-flex align-center justify-center">
                            <v-icon class="little-icon" color="#85d7df">mdi-archive-search</v-icon>&nbsp;
                            <h3 class="mb-0">หุ้นที่กำลังเฝ้า</h3>
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

                            <v-autocomplete v-if="searchType === 'stock_no'" v-model="selectedStocks"
                                class="mx-2 search-size small-font" :items="getSearchItems('stock_no')"
                                label="ค้นหาชื่อหุ้น" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'employee_no'" v-model="selectedEmployees"
                                class="mx-2 search-size small-font" :items="getSearchItems('employee_no')"
                                label="ค้นหาชื่อ" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-menu v-if="searchType === 'created_date'" v-model="datePickerMenu"
                                :close-on-content-click="false" transition="scale-transition" offset-y>
                                <template v-slot:activator="{ on, attrs }">
                                    <div v-bind="attrs" v-on="on" class="date-picker-activator">
                                        <v-icon class="small-label">mdi-calendar-start-outline</v-icon>
                                        <date-picker v-model="startDateTime" format="YYYY-MM-DD HH:mm"
                                            type="datetime" />
                                    </div>
                                </template>
                            </v-menu>

                            <v-menu v-if="searchType === 'created_date'" v-model="endDatePickerMenu"
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
                    <v-btn v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 4" @click="FollowStockDataOpen = true" class="tab-icon-three"
                        style="font-size: 1.5 rem; margin-left: auto;">
                        <v-icon left color="#ffc800">mdi-account-cowboy-hat</v-icon> สรุปหุ้น
                    </v-btn>
                    <v-btn @click="FollowBotDataOpen = true" class="tab-icon-three"
                        style="font-size: 1.5 rem; margin-left: auto;">
                        <v-icon left color="#85d7df">mdi-archive-edit</v-icon> รอการตรวจสอบ
                    </v-btn>
                    <v-btn @click="FollowReachDataOpen = true" class="tab-icon-three"
                        style="font-size: 1.5 rem; margin-left: auto;">
                        <v-icon left color="#85d7df">mdi-archive-alert</v-icon> ถึงเป้าแล้ว
                    </v-btn>
                    <v-btn v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3 || $auth.user.rank_no === 4" @click="FollowCreateOpen = true" class="tab-icon-two"
                        style="font-size: 1.5 rem; margin-left: auto;">
                        <v-icon left color="#24b224">mdi-archive-star</v-icon> เพิ่ม
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
                <template v-slot:item.type="{ item }">
                    <div class="text-center" :style="{ color: getTypeText(item.type).color }">
                        {{ getTypeText(item.type).text }}
                    </div>
                </template>
                <template v-slot:item.stock_no="{ item }">
                    <div class="text-center">{{ getStockName(item.stock_no) }}</div>
                </template>
                <template v-slot:item.employee_no="{ item }">
                    <div class="text-center" style="color:#38b6ff">{{ getEmployeeName(item.employee_no) }}</div>
                </template>
                <template v-slot:item.created_date="{ item }">
                    <div class="text-center">{{ formatDateTime(item.created_date) }}</div>
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

                                <v-list-item @click="showConfirmDialog('waiting', item)" class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 4px;">
                                            <v-icon class="icon-tab" color="#38b6ff">mdi-reply-circle</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content style="font-size: 0.8rem;">รอการตรวจสอบ</v-list-item-content>
                                    </v-list-item>

                                <v-list-item @click="toggleSelectItems" class="custom-list-item">
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
                    <v-spacer></v-spacer>
                    <v-btn color="#e50211" @click="dialog = false">ปิด</v-btn>
                    <v-spacer></v-spacer>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>

</template>

<script>

import ExcelJS from 'exceljs';
import moment from 'moment';
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
        await this.fetchFollowData();
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
                recheck: {
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
            follows: [],

            selectedStocks: [],
            selectedEmployees: [],

            FollowCreateOpen: false,
            FollowReachDataOpen: false,
            FollowBotDataOpen: false,
            FollowStockDataOpen: false,

            selectedItems: [],
            handleConfirm: null,
            isSelectingItems: false,

            sortBy: 'created_date',
            currentAction: '',
            searchQuery: '',
            searchType: 'stock_no',
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
            modalRecheckOpen: false,
            editStock: false,
            dialog: false,
            sortDesc: true,
            selectedStock: null,
            currentItem: null,
            stockNo: null,
            actionType: null,
            selectedTopics: [],
            savedSearches: [],
            editAllData: {},

            searchTypes: [
                { text: 'ชื่อหุ้น', value: 'stock_no' },
                { text: 'ทำรายการโดย', value: 'employee_no' },
                { text: 'เวลา', value: 'created_date' }
            ],

            visibleColumns: ['select', 'created_date', 'stock_no', 'low_price', 'up_price', 'type', 'remark', 'employee_no', 'detail'],

            headers: [
                {
                    text: '',
                    value: 'select',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'เวลาที่เฝ้าหุ้น',
                    value: 'created_date',
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
                    text: 'LOW PRICE',
                    value: 'low_price',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'UP PRICE',
                    value: 'up_price',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'หมายเหตุ',
                    value: 'remark',
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
            let filteredFollows = this.follows;
            this.savedSearches.forEach(search => {
                filteredFollows = filteredFollows.filter(follow => {
                    return this.applySearchFilter(follow, search);
                });
            });
            return filteredFollows;
        },

        filteredHeaders() {
            return this.headers.filter(header => this.visibleColumns.includes(header.value));
        },
    },

    methods: {
        async Confirm() {
            try {
                if (this.currentAction === 'waiting') {
                    await this.$store.dispatch('api/follow/updateFollow', {
                        no: this.currentItem.no,
                        stock_no: this.currentItem.stock_no,
                        low_price: this.currentItem.low_price,
                        up_price: this.currentItem.up_price,
                        remark: this.currentItem.remark,
                        result: 3,
                        reach: null,
                        employee_no: this.$auth.user.no,
                        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                        updated_date: null,
                    });
                    this.recordLog();
                    this.modal.complete.message = 'ส่งไปที่รอการตรวจสอบเรียบร้อยแล้ว';
                }

                this.modal.complete.open = true;
            } catch (error) {
                this.modal.complete.message = 'เกิดข้อผิดพลาดในการดำเนินการ';
                this.modal.complete.open = true;
            }

            this.modalRecheckOpen = false;
        },

        toggleSelectItems() {
            this.isSelectingItems = !this.isSelectingItems;
        },

        async deleteSelectedItems() {
            this.handleConfirm = async () => {
                const selectedIds = this.selectedItems;

                for (let i = 0; i < selectedIds.length; i++) {
                    try {
                        await this.$store.dispatch('api/follow/deleteFollow', selectedIds[i]);

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

        getCurrentItem(no) {
            return this.follows.find(item => item.no === no);
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
        },

        getStockName(stockId) {
            const stock = this.stocks.find(s => s.no === stockId);
            return stock ? stock.stock : '';
        },

        async fetchFollowData() {
            this.follows = await this.$store.dispatch('api/follow/getFollowByResult', '1');
        },

        async fetchEmployeeData() {
            this.employees = await this.$store.dispatch('api/employee/getEmployee');
        },

        getEmployeeName(empId) {
            const employee = this.employees.find(e => e.no === empId);
            return employee ? employee.fname + ' ' + employee.lname : 'ไม่ทราบ';
        },

        openEditStock(follow) {
            this.editAllData = follow;
            this.editStock = true;
        },

        showEditDialog(item) {
            this.selectedStock = item;
            this.editDialogOpen = true;
        },

        getSearchItems(type) {
            if (type === 'stock_no') {
                return this.follows.map(follow => this.getStockName(follow.stock_no));
            } else if (type === 'employee_no') {
                return this.follows.map(follow => this.getEmployeeName(follow.employee_no));
            }
            return [];
        },

        showConfirmDialog(action, item) {
            this.currentAction = action;
            this.currentItem = item;
            this.modalRecheckOpen = true;
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
                        this.$router.push('/app/data/follow');
                    } else if (RankID === '2') {
                        this.$router.push('/app/home');
                    } else if (RankID === '3') {
                        this.$router.push('/app/data/follow');
                    } else if (RankID === '4') {
                        this.$router.push('/app/data/follow');
                    } else {
                        this.$router.push('/auth');
                    }
                }
            } else {
                this.$router.push('/');
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
            this.isSearchFieldVisible = this.searchSet !== 'created_date';
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

            if (this.searchType === 'stock_no' || this.searchType === 'employee_no') {
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
                this.searchType === 'stock_no' ? this.selectedStocks :
                    this.searchType === 'employee_no' ? this.selectedEmployees : [];

            if (selectedItems.length > 0) {
                this.savedSearches.push({
                    query: selectedItems,
                    type: this.searchType,
                    start: this.startDateTime,
                    end: this.endDateTime
                });

                if (this.searchType === 'stock_no') {
                    this.selectedStocks = [];
                } else if (this.searchType === 'employee_no') {
                    this.selectedEmployees = [];
                }

                this.startDateTime = '';
                this.endDateTime = '';
            }
        },

        applySearchFilter(follow, search) {
            let queryMatched = true;

            let field;
            if (search.type === 'employee_no') {
                field = this.getEmployeeName(follow.employee_no);
            } else if (search.type === 'stock_no') {
                field = this.getStockName(follow.stock_no) || 'ยังไม่ระบุ';
            } else {
                field = follow[search.type];
            }

            if (search.type === 'stock_no' || search.type === 'employee_no') {
                queryMatched = search.query.some(query => {
                    const lowerCaseField = typeof field === 'string' ? field.toLowerCase() : '';
                    return lowerCaseField === query.toLowerCase();
                });
            } else if (search.type === 'created_date') {
                return this.checkTimeRange(follow, search);
            } else {
                const searchQuery = search.query.toLowerCase();
                queryMatched = typeof field === 'string' && field.toLowerCase() === searchQuery;
            }

            return queryMatched;
        },

        checkTimeRange(follow, search) {
            const followTime = moment(follow.created_date);
            const startTime = moment(search.start);
            const endTime = moment(search.end);
            return (!startTime.isValid() || followTime.isSameOrAfter(startTime)) &&
                (!endTime.isValid() || followTime.isSameOrBefore(endTime));
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
            const worksheet = workbook.addWorksheet('สรุปหุ้น');

            const headers = this.filteredHeaders
                .filter(header => header.value !== 'detail' && header.value !== 'action' && header.value !== 'select')
                .map(header => ({
                    header: header.text,
                    key: header.value,
                    style: { font: { name: 'Angsana New', size: 16 } }
                }));

            worksheet.columns = headers;

            this.filtered.forEach((item, index) => {
                const rowData = {};
                this.filteredHeaders.forEach(header => {
                    if (header.value === 'created_date') {
                        rowData[header.value] = moment(item[header.value]).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm');
                    } else if (header.value === 'low_price') {
                        rowData[header.value] = item.low_price.toLocaleString(2);
                    } else if (header.value === 'up_price') {
                        rowData[header.value] = item.up_price.toLocaleString(2);
                    } else if (header.value === 'stock_no') {
                        rowData[header.value] = this.getStockName(item.stock_no);
                    } else if (header.value !== 'detail' && header.value !== 'action' && header.value !== 'select') {
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
                link.setAttribute('download', `หุ้นของลูกค้า-${currentDate}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        },

        goBack() {
            window.location.reload();
        },

        recordLog() {
            const log = {
                stock_no: this.currentItem.name,
                emp_name: this.$auth.user.fname + ' ' + this.$auth.user.lname,
                emp_email: this.$auth.user.email,
                detail: this.currentAction === 'delete'
                    ? `ประเภท : ${this.getSetName(this.currentItem.set_id) || 'ยังไม่ระบุ'}\n` +
                    `จำนวนปันผล : ${this.currentItem.dividend_amount || 'ยังไม่ระบุ'}\n` +
                    `ราคาปิด : ${this.currentItem.closing_price || 'ยังไม่ระบุ'}\n` +
                    `หมายเหตุ : ${this.currentItem.remark || 'ยังไม่ระบุ'}`
                    : `ประเภท : ${this.getSetName(this.currentItem.set_id) || 'ยังไม่ระบุ'}\n` +
                    `จำนวนปันผล : ${this.currentItem.dividend_amount || 'ยังไม่ระบุ'}\n` +
                    `ราคาปิด : ${this.currentItem.closing_price || 'ยังไม่ระบุ'}\n` +
                    `หมายเหตุ : ${this.currentItem.remark || 'ยังไม่ระบุ'}`,
                type: 2,
                picture: this.$auth.user.picture || 'Unknown',
                action: this.currentAction === 'delete' ? 'ลบหุ้น' : 'ไม่ลบหุ้น',
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