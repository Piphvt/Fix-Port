<template>
    <v-dialog v-model="dialog" max-width="650px">
        <v-card>
            <v-card-title class="d-flex justify-center">
                <v-icon justify="center" class="mr-3" size="40" color="#85d7df">mdi-bank-check</v-icon>
                <span class="headline">สรุปหุ้น</span>
            </v-card-title>

            <v-card-text>
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
                                    class="mx-2 search-size small-font"></v-select>

                                <v-autocomplete v-if="searchType === 'stock_no'" v-model="selectedStocks"
                                    class="mx-2 search-size small-font" :items="getSearchItems('stock_no')"
                                    label="ค้นหาชื่อหุ้น" dense outlined clearable multiple>
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
                <v-data-table :headers="headers" :items="filteredDetails" item-value="no" item-key="no"
                    :items-per-page="5">
                    <template v-slot:item.stock_no="{ item }">
                        <div class="text-center">{{ getStockName(item.stock_no) }}</div>
                    </template>
                    <template v-slot:item.updated_date="{ item }">
                        <div class="text-center">{{ formatDateTime(item.updated_date) }}</div>
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
        ]);
    },

    methods: {
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
                    // แปลงข้อมูลก่อนเก็บ
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

            // ตรวจสอบว่า query เป็น array และแปลงข้อมูลถ้าจำเป็น
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

        async fetchDetailData() {
            this.details = await this.$store.dispatch('api/detail/getDetail');

            const stockCount = this.details.reduce((acc, detail) => {
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

            const uniqueDetails = [];
            this.details.forEach(detail => {
                if (!uniqueDetails.some(item => item.stock_no === detail.stock_no)) {
                    detail.stock_amount = stockCount[detail.stock_no].count;
                    detail.latest_updated_date = stockCount[detail.stock_no].latestUpdatedDate;
                    uniqueDetails.push(detail);
                }
            });

            this.details = uniqueDetails;
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock')
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

            const headers = this.headers
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
</style>
