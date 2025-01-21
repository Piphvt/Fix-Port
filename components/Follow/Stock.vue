<template>
    <v-dialog v-model="dialog" max-width="650px">
        <v-card>
            <div>
                <FollowBuild :open="DetailDataOpen" :data="DetailData" @update:edit="DetailDataOpen = false" />
            </div>
            <v-card-title class="d-flex justify-center">
                <v-icon justify="center" class="mr-3" size="30" color="#e81e51">mdi-account-cowboy-hat</v-icon>
                <span class="custom-title">สรุปหุ้น</span>
            </v-card-title>

            <v-card-text>
                <v-data-table :headers="headers" :items="filteredDetails" item-value="no" item-key="no"
                    :items-per-page="5">
                    <template v-slot:item.stock_no="{ item }">
                        <div class="text-center">{{ getStockName(item.stock_no) }}</div>
                    </template>
                    <template v-slot:item.updated_date="{ item }">
                        <div class="text-center">{{ formatDateTime(item.updated_date) }}</div>
                    </template>
                    <template v-slot:item.detail="{ item }">
                        <div class="text-center">
                            <v-icon @click="openDetailData(item)" color="#24b224">mdi-archive-star</v-icon>
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
            filteredDetails: [],
            selectedStocks: [],
            showSavedSearchesDialog: false,
            searchType: 'stock_no',
            searchTypes: [
                { text: 'ชื่อหุ้น', value: 'stock_no' },
            ],
            searchQuery: '',
            savedSearches: [],

            details: [],
            stocks: [],
            employees: [],

            DetailDataOpen: false,
            DetailData: {},

            dialog: this.value,

            headers: [
                {
                    text: 'ข้อมูลวันที่',
                    value: 'updated_date',
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
                    text: 'จำนวน',
                    value: 'stock_amount',
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
        details() {
            this.applyFilters();
        }
    },

    async mounted() {
        await Promise.all([
            this.fetchDetailData(),
            this.fetchStockData(),
            this.fetchEmployeeData()
        ]);
    },

    methods: {
        openDetailData(item) {
            this.DetailData = item;
            this.DetailDataOpen = true;
        },

        applyFilters() {
            this.filteredDetails = this.details.filter(detail => {
                return this.savedSearches.every(search => this.applySearchFilter(detail, search));
            });
        },

        getSearchItems(type) {
            if (type === 'stock_no') {
                return this.details
                    .filter(detail => this.getStockName(detail.stock_no))
                    .map(detail => this.getStockName(detail.stock_no));
            }
            return [];
        },

        addSearch() {
            if (this.searchType === 'stock_no') {
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
                this.searchType === 'stock_no' ? this.selectedStocks : [];

            if (selectedItems.length > 0) {
                this.savedSearches.push({
                    query: selectedItems,
                    type: this.searchType,
                });

                if (this.searchType === 'stock_no') {
                    this.selectedStocks = [];
                }

            }
        },

        applySearchFilter(detail, search) {
            let field;
            if (search.type === 'stock_no') {
                field = this.getStockName(detail.stock_no) || 'ยังไม่ระบุ';
            } else {
                field = detail[search.type];
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

        async fetchDetailData() {
            this.details = await this.$store.dispatch('api/detail/getDetail');
            const transactions = await this.$store.dispatch('api/transaction/getTransaction');
            const stocks = await this.$store.dispatch('api/stock/getStock');
            const follows = await this.$store.dispatch('api/follow/getFollow');

            const filteredFollows = (follows || []).filter(item => item.result === 1 || item.result === 2);

            const validTransactions = Array.isArray(transactions) ? transactions : [];
            const validStocks = Array.isArray(stocks) ? stocks : [];

            const filteredDetails = this.details.filter(detail => {
                const relatedTransactions = validTransactions.filter(
                    transaction => transaction.stock_detail_no === detail.no
                );

                const buy = (detail.amount || 0) +
                    relatedTransactions
                        .filter(transaction => transaction.type === 1)
                        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

                const sale = relatedTransactions
                    .filter(transaction => transaction.type === 2)
                    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

                const remainingStock = buy - sale;
                return remainingStock > 0;
            });

            const stockCount = filteredDetails.reduce((acc, detail) => {
                const stockNo = detail.stock_no;

                if (!acc[stockNo]) {
                    acc[stockNo] = { count: 0, latestUpdatedDate: null };
                }

                acc[stockNo].count += 1;

                if (!acc[stockNo].latestUpdatedDate || new Date(detail.updated_date) > new Date(acc[stockNo].latestUpdatedDate)) {
                    acc[stockNo].latestUpdatedDate = detail.updated_date;
                }

                return acc;
            }, {});

            let uniqueDetails = [];
            filteredDetails.forEach(detail => {
                const stockNo = detail.stock_no;

                if (!uniqueDetails.some(item => item.stock_no === stockNo)) {
                    const matchingStock = validStocks.find(stock => stock.no === stockNo);
                    const staffNo = matchingStock ? matchingStock.staff_no : null;

                    if (staffNo === this.$auth.user.no) {
                        detail.staff_no = staffNo;
                        detail.stock_amount = stockCount[stockNo].count;
                        detail.latest_updated_date = stockCount[stockNo].latestUpdatedDate;

                        uniqueDetails.push(detail);
                    }
                }
            });

            uniqueDetails = uniqueDetails.filter(detail => {
                return !filteredFollows.some(follow => follow.stock_no === detail.stock_no);
            });

            this.details = uniqueDetails;
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock')
        },

        async fetchEmployeeData() {
            this.employees = await this.$store.dispatch('api/employee/getEmployee')
        },

        getEmployeeName(employeeNo) {
            const employee = this.employees.find(e => e.no === employeeNo);
            return employee ? employee.fname + ' ' + employee.lname : '';
        },

        getStockName(stockNo) {
            const stock = this.stocks.find(s => s.no === stockNo);
            return stock ? stock.stock : '';
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('DD/MM/YYYY HH:mm');
            }
            return 'Invalid Date';
        },

        exportExcel() {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('สรุปหุ้น');

            const headers = this.headers.filter(header => header.value !== 'detail')
                .map(header => ({
                    header: header.text,
                    key: header.value,
                    style: { font: { name: 'Angsana New', size: 16 } }
                }));

            worksheet.columns = headers;

            this.filteredDetails.forEach((item, index) => {
                const rowData = {};
                this.headers.forEach(header => {
                    if (header.value === 'updated_date') {
                        rowData[header.value] = moment(item[header.value]).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm');
                    } else if (header.value === 'stock_no') {
                        rowData[header.value] = this.getStockName(item.stock_no);
                    } else if (header.value === 'stock_amount') {
                        rowData[header.value] = item.stock_amount.toLocaleString(2);
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
                link.setAttribute('download', `สรุปหุ้น-${currentDate}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
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

.v-card-title .custom-title {
    font-size: 1.5rem !important;
}
</style>
