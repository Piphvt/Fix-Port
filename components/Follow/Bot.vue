<template>
    <v-dialog v-model="dialog" max-width="1000px">
        <v-card>
            <div>
                <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen"
                    @update:confirm="modalConfirmOpen = false" />
                <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
                    :complete.sync="modal.complete.open" :method="goBack" />
                <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
                <FollowChange :open="editStock" :data="editAllData" @update:edit="editStock = false" />
            </div>
            <v-card-title class="d-flex justify-center">
                <v-icon justify="center" class="mr-3" size="40" color="#85d7df">mdi-archive-edit</v-icon>
                <span class="headline">หุ้นที่รอการตรวจสอบ</span>
            </v-card-title>
            <v-container>
                <v-row justify="center" align="center">
                    <v-col cols="auto">
                        <div class="d-flex align-center justify-center">
                            <div class="d-flex align-center justify-center">
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
                                class="mx-2 search-size small-font"></v-select>

                            <v-autocomplete v-if="searchType === 'stock_no'" v-model="selectedStocks"
                                class="mx-2 search-size small-font" :items="getSearchItems('stock_no')"
                                label="ค้นหาชื่อหุ้น" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'employee_no'" v-model="selectedEmployees"
                                class="mx-2 search-size small-font" :items="getSearchItems('employee_no')"
                                label="ค้นหาที่มาของหุ้น" dense outlined clearable multiple>
                            </v-autocomplete>

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

            <v-card-text>
                <v-data-table :headers="headers" :items="filteredFollows" item-value="no" item-key="no" :items-per-page="5">
                    <template v-slot:item.stock_no="{ item }">
                        <div class="text-center">{{ getStockName(item.stock_no) }}</div>
                    </template>
                    <template v-slot:item.employee_no="{ item }">
                        <div class="text-center" :style="{
                            color: getEmployeeName(item.employee_no) ? '#38b6ff' : '#ffc800'
                        }">
                            {{ getEmployeeName(item.employee_no) || 'บอท' }}
                        </div>
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
                                    <v-list-item @click="showConfirmDialog('approve', item)" class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 4px;">
                                            <v-icon class="icon-tab" color="#24b224">mdi-plus-circle</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content style="font-size: 0.8rem;">เฝ้าหุ้น</v-list-item-content>
                                    </v-list-item>

                                    <v-list-item @click="openEditStock(item)" class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 4px;">
                                            <v-icon class="icon-tab" color="#ffc800">mdi-pencil-circle</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content
                                            style="font-size: 0.8rem;">แก้ไขและเฝ้าหุ้น</v-list-item-content>
                                    </v-list-item>

                                    <v-list-item @click="showConfirmDialog('reject', item)" class="custom-list-item">
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
            </v-card-text>
            <div class="text-center">
                <v-btn @click="dialog = false" class="mb-4" color="#e50211">ปิด</v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>

<script>
import moment from 'moment-timezone';
import 'moment/locale/th';
import ExcelJS from 'exceljs';

export default {
    props: {
        value: Boolean,
    },

    data() {
        return {
            modal: {
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

            filteredFollows: [],

            selectedStocks: [],
            selectedEmployees: [],
            showSavedSearchesDialog: false,
            searchType: 'stock_no',
            searchTypes: [
                { text: 'ชื่อหุ้น', value: 'stock_no' },
                { text: 'ข้อมูลจาก', value: 'employee_no' },
            ],
            searchQuery: '',
            savedSearches: [],

            follows: [],
            stocks: [],
            employee: [],

            editStock: false,
            editAllData: {},

            currentAction: '',
            currentItem: null,
            modalConfirmOpen: false,

            headers: [
                {
                    text: 'ข้อมูลวันที่',
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
                    text: 'ข้อมูลจาก',
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
        savedSearches() {
            this.applyFilters();
        },
        follows() {
            this.applyFilters();
        }
    },

    async mounted() {
        await Promise.all([
            this.fetchFollowData(),
            this.fetchStockData(),
            this.fetchEmployeeData()
        ]);
    },

    methods: {
        applyFilters() {
            this.filteredFollows = this.follows.filter(follow => {
                return this.savedSearches.every(search => this.applySearchFilter(follow, search));
            });
        },

        getSearchItems(type) {
            if (type === 'stock_no') {
                return this.follows
                    .filter(follow => this.getStockName(follow.stock_no))
                    .map(follow => this.getStockName(follow.stock_no));
            } else if (type === 'employee_no') {
                return this.follows
                    .filter(follow => this.getEmployeeName(follow.employee_no) || 'บอท')
                    .map(follow => this.getEmployeeName(follow.employee_no) || 'บอท');
            }
            return [];
        },

        addSearch() {
            if (this.searchType === 'stock_no' || this.searchType === 'employee_no') {
                this.addSearchItemsToSearch();
            } else {
                if (this.searchQuery.trim()) {
                    const savedSearch = {
                        query: this.searchQuery,
                        type: this.searchType,
                    };
                    this.savedSearches.push(JSON.parse(JSON.stringify(savedSearch)));
                    this.searchQuery = '';
                }
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
                });

                if (this.searchType === 'stock_no') {
                    this.selectedStocks = [];
                }
                if (this.searchType === 'employee_no') {
                    this.selectedEmployees = [];
                }

            }
        },

        applySearchFilter(follow, search) {
            let field;
            if (search.type === 'stock_no') {
                field = this.getStockName(follow.stock_no) || 'ยังไม่ระบุ';
            } else if (search.type === 'employee_no'){
                field = this.getEmployeeName(follow.employee_no) || 'บอท';
            } else {
                field = follow[search.type];
            }

            if (Array.isArray(search.query)) {
                return search.query.some(query => {
                    const lowerCaseField = typeof field === 'string' ? field.toLowerCase() : '';
                    return lowerCaseField === query.toLowerCase();
                });
            } else {
                const searchQuery = search.query.toLowerCase();
                return typeof field === 'string' && field.toLowerCase() === searchQuery;
            }
        }
        ,

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

        getReachText(reach) {
            if (reach === 1) {
                return 'Low Price';
            } else if (reach === 2) {
                return 'Up Price';
            } else {
                return '-';
            }
        },

        goBack() {
            window.location.reload();
        },

        showConfirmDialog(action, item) {
            this.currentAction = action;
            this.currentItem = item;
            this.modalConfirmOpen = true;
        },

        async handleConfirm() {
            try {
                if (this.currentAction === 'approve') {
                    await this.$store.dispatch('api/follow/updateFollow', {
                        no: this.currentItem.no,
                        stock_no: this.currentItem.stock_no,
                        low_price: this.currentItem.low_price,
                        up_price: this.currentItem.up_price,
                        remark: this.currentItem.remark,
                        result: 1,
                        reach: null,
                        employee_no: this.$auth.user.no,
                        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                        updated_date: null,
                    });
                    this.recordLog();
                    this.modal.complete.message = 'เพิ่มการเฝ้าหุ้นเรียบร้อยแล้ว';
                } else if (this.currentAction === 'reject') {
                    await this.$store.dispatch('api/follow/deleteFollow', this.currentItem.no);
                    this.modal.complete.message = 'ลบเรียบร้อยแล้ว';
                    this.recordLog();
                }

                this.modal.complete.open = true;
            } catch (error) {
                this.modal.complete.message = 'เกิดข้อผิดพลาดในการดำเนินการ';
                this.modal.complete.open = true;
            }

            this.modalConfirmOpen = false;
        },

        async fetchFollowData() {
            this.follows = await this.$store.dispatch('api/follow/getFollowByResult', '3');
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock')
        },

        getStockName(stockNo) {
            const stock = this.stocks.find(s => s.no === stockNo);
            return stock ? stock.stock : '';
        },

        async fetchEmployeeData() {
            this.employees = await this.$store.dispatch('api/employee/getEmployee')
        },

        getEmployeeName(employeeNo) {
            const employee = this.employees.find(e => e.no === employeeNo);
            return employee ? employee.fname + ' ' + employee.lname : '';
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('DD/MM/YYYY HH:mm');
            }
            return 'Invalid Date';
        },

        getStatusText(status) {
            if (status === 'รอการยืนยันผู้ใช้งาน') {
                return { text: 'รอการยืนยันผู้ใช้งาน', color: '#e50211' };
            } else {
                return { text: 'สถานะไม่ทราบ', color: 'inherit' };
            }
        },

        openEditStock(follow) {
            this.editAllData = follow;
            this.editStock = true;
        },

        exportExcel() {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('สรุปหุ้นที่รอการตรวจสอบ');

            const headers = this.headers.filter(header => header.value !== 'detail')
                .map(header => ({
                    header: header.text,
                    key: header.value,
                    style: { font: { name: 'Angsana New', size: 16 } }
                }));

            worksheet.columns = headers;

            this.filteredFollows.forEach((item, index) => {
                const rowData = {};
                this.headers.forEach(header => {
                    if (header.value === 'created_date') {
                        rowData[header.value] = moment(item[header.value]).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm');
                    } else if (header.value === 'stock_no') {
                        rowData[header.value] = this.getStockName(item.stock_no);
                    } else if (header.value === 'low_price') {
                        rowData[header.value] = item.low_price.toLocaleString(2);
                    } else if (header.value === 'up_price') {
                        rowData[header.value] = item.up_price.toLocaleString(2);
                    } else if (header.value === 'employee_no') {
                        rowData[header.value] = this.getEmployeeName(item.employee_no) || 'บอท';
                    } else if (header.value !== 'detail') {
                        rowData[header.value] = item[header.value];
                    } else {
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
                link.setAttribute('download', `สรุปหุ้นที่รอการตรวจสอบ-${currentDate}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        },

        recordLog() {
            const Employee_Name = this.$auth.user.fname + ' ' + this.$auth.user.lname;
            const Employee_Email = this.$auth.user.email;
            const Employee_Picture = this.$auth.user.picture;
            const log = {
                action: this.currentAction === 'approve'
                    ? 'อนุมัติผู้ใช้งาน'
                    : 'ไม่อนุมัติผู้ใช้งาน',
                name: this.currentItem.fname + ' ' + this.currentItem.lname,
                follow: this.currentAction === 'approve'
                    ? `อีเมล : ${this.currentItem.email}\nเบอร์โทรศัพท์ : ${this.currentItem.phone}\nเพศ : ${this.currentItem.gender}`
                    : `อีเมล : ${this.currentItem.email}\nเบอร์โทรศัพท์ : ${this.currentItem.phone}\nเพศ : ${this.currentItem.gender}`,
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
    flex: 1 0 20%;
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