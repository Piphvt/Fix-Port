<template>

    <div>
        <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />
        <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen" @update:confirm="modalConfirmOpen = false" />
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <EmployeeEditAllDialog :open="editAllDialog" :data="editAllData" @update:edit="editAllDialog = false" />
        <EmployeeNew v-model="EmployeeDataOpen" />

        <v-card flat>
            <v-container>
                <v-row justify="center" align="center">
                    <v-col cols="auto">
                        <v-card-title class="d-flex align-center justify-center">
                            <v-icon class="little-icon" color="#85d7df">mdi-home-account</v-icon>&nbsp;
                            <h3 class="mb-0">ข้อมูลสมาชิก</h3>
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

                            <v-autocomplete v-if="searchType === 'fname'" v-model="selectedFname"
                                class="mx-2 search-size small-font" :items="getSearchItems('fname')" label="ค้นหาชื่อ"
                                dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'email'" v-model="selectedEmail"
                                class="mx-2 search-size small-font" :items="getSearchItems('email')" label="ค้นหาอีเมล"
                                dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'phone'" v-model="selectedPhone"
                                class="mx-2 search-size small-font" :items="getSearchItems('phone')"
                                label="ค้นหาเบอร์โทรศัพท์" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'rank_no'" v-model="selectedRank"
                                class="mx-2 search-size small-font" :items="getSearchItems('rank_no')"
                                label="ค้นหาตำแหน่ง" dense outlined clearable multiple>
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
                <v-btn @click="EmployeeDataOpen = true" class="tab-icon-two" style="font-size: 1.5 rem; margin-left: auto;">
                    <v-icon left color="#24b224">mdi-home-plus</v-icon> คำร้องขอสมัครสมาชิก
                </v-btn>
            </div>

            <v-data-table :headers="filteredHeaders" :items="filtered" :sort-by.sync="sortBy" :sort-desc.sync="sortDesc"
                item-key="no" :items-per-page="5">
                <template v-slot:item.picture="{ item }">
                    <v-avatar size="40">
                        <img :src="`${$config.API_URL}/file/profile/${item.picture}`"
                            @error="onImageError($event, item)" alt="picture" />
                    </v-avatar>
                </template>
                <template v-slot:item.email="{ item }">
                    <div class="text-center">{{ item.email }}</div>
                </template>
                <template v-slot:item.employee_no="{ item }">
                    <div class="text-center">
                        <span v-if="getEmployeeById(item.employee_no)">{{ getEmployeeById(item.employee_no).fname }} {{
                            getEmployeeById(item.employee_no).lname }}</span>
                        <span v-else>ไม่ทราบ</span>
                    </div>
                </template>
                <template v-slot:item.fname="{ item }">
                    <div class="text-center">{{ item.fname + ' ' + item.lname }}</div>
                </template>
                <template v-slot:item.phone="{ item }">
                    <div class="text-center">{{ item.phone }}</div>
                </template>
                <template v-slot:item.gender="{ item }">
                    <div class="text-center">{{ item.gender }}</div>
                </template>
                <template v-slot:item.rank_no="{ item }">
                    <div class="text-center" :style="{ color: getRankText(getRankName(item.rank_no)).color }">
                        {{ getRankName(item.rank_no) }}
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
                                        <v-icon class="icon-tab" color="#ffc800">mdi-pencil-circle</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content style="font-size: 0.8rem;">แก้ไข</v-list-item-content>
                                </v-list-item>

                                <v-list-item @click="showConfirmDialog('delete', item)" class="custom-list-item">
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
import moment from 'moment-timezone';
import 'moment/locale/th'
import DatePicker from 'vue2-datepicker';
import 'vue2-datepicker/index.css';

export default {

    layout: 'user',
    middleware: 'auth',

    async fetch(){
        await this.checkRank();
        await this.fetchEmployeeData();
        await this.fetchRanks();
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
            ranks: [],

            selectedFname: [],
            selectedEmail: [],
            selectedPhone: [],
            selectedRank: [],

            EmployeeDataOpen: false,

            sortBy: 'updated_date',
            currentAction: '',
            searchQuery: '',
            searchType: 'fname',
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

            searchTypes: [
                { text: 'ชื่อ', value: 'fname' },
                { text: 'อีเมล', value: 'email' },
                { text: 'เบอร์โทรศัพท์', value: 'phone' },
                { text: 'ตำแหน่ง', value: 'rank_no' },
                { text: 'ข้อมูลวันที่', value: 'updated_date' }
            ],

            visibleColumns: ['updated_date', 'picture', 'rank_no', 'email', 'fname', 'lname', 'phone', 'gender', 'employee_no', 'detail'],

            headers: [
                {
                    text: 'ข้อมูลวันที่',
                    value: 'updated_date',
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'โปรไฟล์',
                    value: 'picture',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ตำแหน่ง',
                    value: 'rank_no',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'อีเมล',
                    value: 'email',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'เบอร์โทรศัพท์',
                    value: 'phone',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ชื่อ',
                    value: 'fname',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'เพศ',
                    value: 'gender',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ผู้อนุมัติ',
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
            let filteredEmployees = this.employees;
            this.savedSearches.forEach(search => {
                filteredEmployees = filteredEmployees.filter(employee => {
                    return this.applySearchFilter(employee, search);
                });
            });
            return filteredEmployees;
        },

        formattedDetailLines() {
            return this.selectedItemDetail.split('\n');
        },

        filteredHeaders() {
            return this.headers.filter(header => this.visibleColumns.includes(header.value));
        },
    },

    methods: {
        onImageError(event, item) {
            event.target.src = `${this.$config.API_URL}/file/default/${item.picture}`;
        },

        getEmployeeById(empId) {
            return this.employees.find(employee => employee.no === empId);
        },

        openEditAllDialog(employee) {
            this.editAllData = employee;
            this.editAllDialog = true;
        },

        showEditDialog(item) {
            this.selectedEmployee = item;
            this.editDialogOpen = true;
        },

        async fetchRanks() {
            this.ranks = await this.$store.dispatch('api/rank/getRank')
        },

        getRankName(rankNo) {
            const rank = this.ranks.find(r => r.no === rankNo);
            return rank ? rank.rank : 'ไม่ทราบ';
        },

        getEmployeeName(employeeId) {
            const employee = this.employees.find(e => e.no === employeeId);
            return employee ? employee.fname + ' ' + employee.lname : 'ไม่ทราบ';
        },

        getSearchItems(type) {
            if (type === 'fname') {
                return this.employees.map(emp => `${emp.fname} ${emp.lname}`);
            } else if (type === 'email') {
                return this.employees.map(emp => emp.email);
            } else if (type === 'phone') {
                return this.employees.map(emp => emp.phone);
            } else if (type === 'rank_no') {
                return this.employees.map(emp => this.getRankName(emp.rank_no));
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
                const currentRank = this.getRankName(this.$auth.user.rank_no);
                const targetRank = this.getRankName(this.currentItem.rank_no);
                if (currentRank === 'ผู้พัฒนา' && targetRank === 'ผู้พัฒนา') {
                    this.modal.warning.open = true;
                    this.modal.warning.message = 'ไม่สามารถลบผู้ใช้งานที่มีตำแหน่งผู้พัฒนาได้';
                    return;
                }
                if (currentRank === 'แอดมิน' && (targetRank === 'ผู้พัฒนา' || targetRank === 'แอดมิน')) {
                    this.modal.warning.open = true;
                    this.modal.warning.message = 'ไม่สามารถลบผู้ใช้งานที่มีตำแหน่งผู้พัฒนาหรือแอดมินได้';
                    return;
                }
                try {
                    await this.$store.dispatch('api/employee/deleteEmployee', this.currentItem.no);
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
                        this.$router.push('/app/data/employee');
                    } else if (RankID === '2') {
                        this.$router.push('/app/home');
                    } else if (RankID === '3') {
                        this.$router.push('/app/data/employee');
                    } else if (RankID === '4') {
                        this.$router.push('/app/home');
                    } else {
                        this.$router.push('/auth');
                    }
                }
            } else {
                this.$router.push('/');
            }
        },

        getRankText(rank) {
            if (rank === 'ผู้พัฒนา') {
                return { text: 'ผู้พัฒนา', color: '#24b224' };
            } else if (rank === 'โค้ช') {
                return { text: 'โค้ช', color: '#ffc800' };
            } else if (rank === 'แอดมิน') {
                return { text: 'แอดมิน', color: '#85d7df' };
            } else {
                return { text: 'ไม่ระบุตำแหน่ง', color: 'inherit' };
            }
        },

        async fetchEmployeeData() {
            this.employees = await this.$store.dispatch('api/employee/getEmployeeByStatus', '1');
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('YYYY/MM/DD HH:mm');
            }
            return 'Invalid Date';
        },

        openDetail(item) {
            this.selectedItemDetail = item.detail;
            this.dialog = true;
        },

        onSearchTypeChange() {
            this.isSearchFieldVisible = this.searchType !== 'updated_date' && this.searchType !== 'rank_no';
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

            if (this.searchType === 'fname' || this.searchType === 'email' || this.searchType === 'phone' || this.searchType === 'rank_no') {
                this.addSearchItemsToSearch();
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

        addSearchItemsToSearch() {
            const selectedItems =
                this.searchType === 'phone' ? this.selectedPhone :
                    this.searchType === 'email' ? this.selectedEmail :
                        this.searchType === 'fname' ? this.selectedFname :
                            this.searchType === 'rank_no' ? this.selectedRank : [];

            if (selectedItems.length > 0) {
                this.savedSearches.push({
                    query: selectedItems,
                    type: this.searchType,
                    start: this.startDateTime,
                    end: this.endDateTime
                });

                if (this.searchType === 'phone') {
                    this.selectedPhone = [];
                } else if (this.searchType === 'email') {
                    this.selectedEmail = [];
                } else if (this.searchType === 'fname') {
                    this.selectedFname = [];
                } else if (this.searchType === 'rank_no') {
                    this.selectedRank = [];
                }

                this.startDateTime = '';
                this.endDateTime = '';
            }
        },

        applySearchFilter(employee, search) {
            let queryMatched = true;

            let field;
            if (search.type === 'rank_no') {
                field = this.getRankName(employee.rank_no);
            } else if (search.type === 'fname') {
                field = this.getEmployeeName(employee.no);
            } else {
                field = employee[search.type];
            }

            if (search.type === 'phone' || search.type === 'email' || search.type === 'fname' || search.type === 'rank_no') {
                queryMatched = search.query.some(query => {
                    const lowerCaseField = typeof field === 'string' ? field.toLowerCase() : '';
                    return lowerCaseField === query.toLowerCase();
                });
            } else if (search.type === 'created_date') {
                return this.checkTimeRange(employee, search);
            } else {
                const searchQuery = search.query.toLowerCase();
                queryMatched = typeof field === 'string' && field.toLowerCase() === searchQuery;
            }

            return queryMatched;
        },

        checkTimeRange(employee, search) {
            const employeeTime = moment(employee.updated_date);
            const startTime = moment(search.start);
            const endTime = moment(search.end);
            return (!startTime.isValid() || employeeTime.isSameOrAfter(startTime)) &&
                (!endTime.isValid() || employeeTime.isSameOrBefore(endTime));
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
            const worksheet = workbook.addWorksheet('พนักงานทั้งหมด');

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
                        rowData[header.value] = this.formatDateTime(item.updated_date);
                    } else if (header.value === 'rank_no') {
                        rowData[header.value] = this.getRankName(item.rank_no);
                    } else if (header.value === 'employee_no') {
                        rowData[header.value] = this.getEmployeeName(item.employee_no);
                    } else if (header.value === 'fname') {
                        rowData[header.value] = this.getEmployeeName(item.no);
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
                link.setAttribute('download', `ข้อมูลผู้ใช้งาน-${currentDate}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        },

        goBack() {
            window.location.reload();
        },

        recordLog() {
            const Employee_No = this.$auth.user.no;
            const employee = this.employees.find(employee => employee.no === Employee_No);
            const Employee_Name = employee ? employee.fname + ' ' + employee.lname : 'ไม่รู้จัก';
            const Employee_Email = employee ? employee.email : 'ยังไม่ระบุ';
            const Employee_Picture = employee ? employee.picture : 'ยังไม่ระบุ';
            const log = {
                action: this.currentAction === 'delete'
                    ? 'ลบผู้ใช้งาน'
                    : 'ไม่ลบผู้ใช้งาน',
                name: this.currentItem.fname + ' ' + this.currentItem.lname,
                detail: this.currentAction === 'delete'
                    ? `อีเมล : ${this.currentItem.email}\nเบอร์โทรศัพท์ : ${this.currentItem.phone}\nเพศ : ${this.currentItem.gender}\nผู้อนุมัติ : ${this.getEmployeeById(this.currentItem.employee_no)?.fname + ' '+this.getEmployeeById(this.currentItem.employee_no)?.lname}`
                    : `อีเมล : ${this.currentItem.email}\nเบอร์โทรศัพท์ : ${this.currentItem.phone}\nเพศ : ${this.currentItem.gender}\nผู้อนุมัติ : ${this.getEmployeeById(this.currentItem.employee_no)?.fname + ' '+this.getEmployeeById(this.currentItem.employee_no)?.lname}`,
                type: 4,
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
</style>