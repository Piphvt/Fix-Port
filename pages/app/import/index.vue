<template>
    <div>
        <ModalConfirm :method="handleSaveUpdate" :open="modalConfirmOpen" @update:confirm="modalConfirmOpen = false" />
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
        <v-card class="custom-card" flat>
            <v-card-title class="d-flex align-center justify-center">
                <v-icon class="little-icon" color="#85d7df">mdi-file-import</v-icon>&nbsp;
                <h3 class="mb-0">นำเข้าไฟล์</h3>
            </v-card-title>
            <v-card-text>
                <v-form ref="form" lazy-validation>
                    <v-row justify="end" align="center">
                        <v-col cols="auto">
                            <v-menu bottom right :offset-y="true" :nudge-top="8" :nudge-right="8" class="user-menu">
                                <template v-slot:activator="{ on, attrs }">
                                    <v-icon text v-bind="attrs" v-on="on" rounded class="icon-host"
                                        style="font-size: 1.8rem;" color="#ded30b">mdi-list-box</v-icon>
                                </template>

                                <v-list class="custom-list">
                                    <v-list-item @click="uploadCSV" class="custom-list-item"
                                        v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3">
                                        <v-list-item-icon style="margin-right: 5px;">
                                            <v-icon class="icon-tab" color="#ffffff">mdi-cloud</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content>
                                            <v-list-item-title style="font-size: 0.8rem;">ราคาปิด</v-list-item-title>
                                        </v-list-item-content>
                                        <input ref="csvInput" type="file" accept=".csv" style="display: none"
                                            @change="onCSVFileChange" />
                                    </v-list-item>

                                    <v-list-item @click="uploadCSV" class="custom-list-item"
                                        v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3">
                                        <v-list-item-icon style="margin-right: 5px;">
                                            <v-icon class="icon-tab" color="#38b6ff">mdi-star</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content>
                                            <v-list-item-title style="font-size: 0.8rem;">เงินปันผล</v-list-item-title>
                                        </v-list-item-content>
                                        <input ref="csvInput" type="file" accept=".csv" style="display: none"
                                            @change="onCSVFileChange" />
                                    </v-list-item>

                                    <v-list-item @click="uploadExcel" class="custom-list-item"
                                        v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3 || $auth.user.rank_no === 4">
                                        <v-list-item-icon style="margin-right: 5px;">
                                            <v-icon class="icon-tab" color="#00bf63">mdi-archive</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content>
                                            <v-list-item-title style="font-size: 0.8rem;">หุ้น</v-list-item-title>
                                        </v-list-item-content>
                                        <input ref="fileInput" type="file" accept=".xls,.xlsx" style="display: none"
                                            @change="onExcelFileChange" />
                                    </v-list-item>

                                    <v-list-item @click="uploadExcel" class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 5px;">
                                            <v-icon class="icon-tab" color="#ffcc00">mdi-wallet</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content>
                                            <v-list-item-title
                                                style="font-size: 0.8rem;">หุ้นของลูกค้า</v-list-item-title>
                                        </v-list-item-content>
                                        <input ref="fileInput" type="file" accept=".xls,.xlsx" style="display: none"
                                            @change="onExcelFileChange" />
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col>
                            <v-data-table :headers="TableHeaders" :items="TableData" class="elevation-1 mt-4">
                                <template v-slot:item="{ item }">
                                    <tr class="text-center">
                                        <td v-for="(value, key, index) in item" :key="index" class="text-center">
                                            {{ value }}
                                        </td>
                                    </tr>
                                </template>
                            </v-data-table>
                        </v-col>
                    </v-row>
                </v-form>

                <v-card-actions class="card-title-center pa-0">
                    <v-btn class="mt-3 mr-2" color="#24b224" @click="handleSaveUpdate" :disabled="!TableData.length">
                        <v-icon>mdi-content-save</v-icon>บันทึก
                    </v-btn>
                    <v-btn class="mt-3" @click="dialog = false" color="#e50211">ปิด</v-btn>
                </v-card-actions>

            </v-card-text>
        </v-card>
    </div>

</template>

<script>

import ExcelJS from 'exceljs';
import moment from 'moment-timezone';
import 'moment/locale/th'
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default {

    layout: 'user',
    middleware: 'auth',

    async mounted() {
        await this.checkRank();
        await this.fetchStockData();
        await this.fetchDividendData();
        await this.fetchPriceData();
        await this.fetchCustomerData();
        await this.fetchFromData();
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

            currentAction: '',
            currentItem: null,
            modalConfirmOpen: false,

            stocks: [],
            dividends: [],
            prices: [],
            customer: [],
            froms: [],

            TableHeaders: [],
            TableData: [],

            xhr: null,

            dialog: this.value,
        };
    },

    methods: {
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
                        this.$router.push('/app/import');
                    } else if (RankID === '2') {
                        this.$router.push('/app/import');
                    } else if (RankID === '3') {
                        this.$router.push('/app/import');
                    } else if (RankID === '4') {
                        this.$router.push('/app/import');
                    } else {
                        this.$router.push('/auth');
                    }
                }
            } else {
                this.$router.push('/auth');
            }
        },

        uploadExcel() {
            this.$refs.fileInput.click();
        },

        onExcelFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    let TableHeaders = [];
                    let TableData = [];

                    // Check the headers in the first row to decide the TableHeaders and data format
                    const headers = jsonData[0];

                    if (headers.includes('Symbol') && headers.includes('Type')) {
                        // Handle data with Symbol, Type
                        TableHeaders = [
                            { text: 'ชื่อหุ้น', value: 'Symbol', align: 'center', sortable: false },
                            { text: 'ประเภท', value: 'Type', align: 'center', sortable: false },
                        ];

                        await this.fetchStockData();
                        const existingStockSymbols = this.stocks.map(stock => stock.stock);
                        TableData = jsonData.slice(1).map((row) => {
                            return {
                                'Symbol': (row[0] === true) ? 'TRUE' : (row[0] === false) ? 'FALSE' : row[0],
                                'Type': row[1],
                            };
                        }).filter(row => !existingStockSymbols.includes(row.Symbol));

                    } else if (headers.includes('date') && headers.includes('id') && headers.includes('stock') && headers.includes('price') && headers.includes('amount') && headers.includes('type')) {
                        // Handle data with date, id, stock, price, amount, and type
                        TableHeaders = [
                            { text: 'วันที่ซื้อหุ้น', value: 'date', align: 'center', sortable: false },
                            { text: 'รหัสสมาชิก', value: 'id', align: 'center', sortable: false },
                            { text: 'ชื่อหุ้น', value: 'stock', align: 'center', sortable: false },
                            { text: 'ราคา', value: 'price', align: 'center', sortable: false },
                            { text: 'จำนวน', value: 'amount', align: 'center', sortable: false },
                            { text: 'ที่มาที่ไป', value: 'type', align: 'center', sortable: false },
                        ];

                        TableData = jsonData.slice(1).map((row) => {
                            const rawDate = row[0]; // Get the raw date value
                            console.log('Raw Date:', rawDate); // Check the raw value

                            let formattedDate = 'Invalid Date';

                            // หาก rawDate เป็นค่าว่าง (null, undefined หรือ '') ให้ใช้วันที่ปัจจุบัน
                            if (!rawDate) {
                                formattedDate = moment().format("YYYY-MM-DD"); // ใช้วันที่ปัจจุบัน
                            } else if (typeof rawDate === 'number') {
                                // แปลง Excel serial date เป็นวันที่
                                const excelStartDate = new Date(1900, 0, 1); // เริ่มนับจาก 1 มกราคม 1900
                                const date = new Date(excelStartDate.getTime() + (rawDate - 1) * 86400000); // 86400000 มิลลิวินาทีในหนึ่งวัน
                                formattedDate = date.toISOString().split('T')[0]; // แปลงเป็นรูปแบบ YYYY-MM-DD
                            } else if (moment(rawDate, "DD/MM/YYYY", true).isValid()) {
                                // ใช้ moment แปลงวันที่หากเป็นสตริงในรูปแบบ DD/MM/YYYY
                                formattedDate = moment(rawDate, "DD/MM/YYYY").format("YYYY-MM-DD");
                            }

                            return {
                                'date': formattedDate,  // แปลงวันที่
                                'id': row[1],           // รหัสสมาชิก
                                'stock': row[2],        // ชื่อหุ้น
                                'price': row[3],        // ราคา
                                'amount': row[4],       // จำนวน
                                'type': row[5],         // ที่มาที่ไป
                            };
                        });
                    }

                    // Set the TableHeaders and TableData
                    this.TableHeaders = TableHeaders;
                    this.TableData = TableData;
                };
                reader.readAsArrayBuffer(file);
            }
        }
        ,

        uploadCSV() {
            this.$refs.csvInput.click();
        },

        async onCSVFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const csvContent = e.target.result;
                    const parsedData = Papa.parse(csvContent, {
                        header: true,
                        skipEmptyLines: true,
                    });

                    const headers = parsedData.meta.fields;

                    let TableHeaders;
                    let csvData;

                    if (headers.includes('xdate') && headers.includes('symbol') && headers.includes('dividend')) {
                        TableHeaders = [
                            { text: 'วันที่ปันผล', value: 'created_date', align: 'center', sortable: false },
                            { text: 'ชื่อหุ้น', value: 'stock_no', align: 'center', sortable: false },
                            { text: 'เงินปันผล', value: 'dividend', align: 'center', sortable: false },
                        ];
                        csvData = parsedData.data.map(row => ({
                            created_date: moment(row.xdate, "DD/MM/YYYY").format('YYYY-MM-DD'),
                            stock_no: row.symbol || null,
                            dividend: parseFloat(row.dividend) || 0,
                        })).filter(row => row.created_date && row.stock_no && row.dividend);
                    } else if (headers.includes('datetime') && headers.includes('symbol') && headers.includes('close')) {
                        TableHeaders = [
                            { text: 'วันที่', value: 'created_date', align: 'center', sortable: false },
                            { text: 'ชื่อหุ้น', value: 'stock_no', align: 'center', sortable: false },
                            { text: 'ราคา', value: 'price', align: 'center', sortable: false },
                        ];
                        csvData = parsedData.data.map(row => ({
                            created_date: moment(row.datetime, "DD/MM/YYYY HH:mm").format('YYYY-MM-DD HH:mm'),
                            stock_no: row.symbol || null,
                            price: parseFloat(row.close) || 0,
                        })).filter(row => row.created_date && row.stock_no && row.price);
                    }

                    await this.fetchDividendData();
                    await this.fetchPriceData();

                    this.TableData = csvData.filter(csvRow => {
                        const stock_no = this.getStockByName(csvRow.stock_no)?.no;
                        const isDuplicateDividend = this.dividends.some(dbRow => {
                            const dbCreatedDate = moment(dbRow.created_date).format('YYYY-MM-DD');
                            const isMatch = dbCreatedDate === csvRow.created_date &&
                                dbRow.stock_no === stock_no &&
                                dbRow.dividend === csvRow.dividend;
                            return isMatch;
                        });

                        const isDuplicatePirce = this.prices.some(dbRow => {
                            const dbCreatedDate = moment(dbRow.created_date).format('YYYY-MM-DD HH:mm');
                            const isMatch = dbCreatedDate === csvRow.created_date &&
                                dbRow.stock_no === stock_no &&
                                dbRow.price === csvRow.price;
                            return isMatch;
                        });

                        return !isDuplicateDividend && !isDuplicatePirce;
                    });

                    this.TableHeaders = TableHeaders;
                };
                reader.readAsText(file);
            }
        },


        async submitData() {
            if (!this.$auth.user || !this.$auth.user.no) {
                console.error('User is not authenticated or user ID is missing.');
                return;
            }
            const emp_id = this.$auth.user.no;

            const getSetId = (type) => {
                switch (type) {
                    case 'SET':
                        return 1;
                    case 'SET50':
                        return 2;
                    case 'SET100':
                        return 3;
                    case 'ETF':
                        return 4;
                    case 'MAI':
                        return 5;
                    case 'Warrants':
                        return 6;
                    case 'DR':
                        return 7;
                    default:
                        return null;
                }
            };

            for (const row of this.TableData) {
                let data;

                if (row.Symbol && row.Type) {
                    data = {
                        stock: row.Symbol || null,
                        set_no: getSetId(row.Type),
                        employee_no: emp_id,
                        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                        updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    };

                    try {
                        await this.$store.dispatch('api/stock/addStock', data);
                        this.modal.complete.message = 'อัพโหลดข้อมูลสำเร็จ';
                        this.modal.complete.open = true;
                    } catch (error) {
                        console.error(`Error submitting stock data for ${row.Symbol}:`, error);
                    }
                } else if (row.date && row.id && row.stock && row.price && row.amount && row.type) {
                    const stock_no = this.getStockByName(row.stock)?.no;
                    const customer_no = this.getCustomerByID(row.id)?.no;
                    const from_no = this.getFromByName(row.type)?.no;
                    data = {
                        customer_no: customer_no || null,
                        stock_no: stock_no || null,
                        price: parseFloat(row.price),
                        amount: parseFloat(row.amount),
                        from_no: from_no || null,
                        employee_no: emp_id,
                        created_date: row.date,
                        updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    };

                    try {
                        await this.$store.dispatch('api/detail/addDetail', data);
                        this.modal.complete.message = 'อัพโหลดข้อมูลสำเร็จ';
                        this.modal.complete.open = true;
                    } catch (error) {
                        console.error(`Error submitting detail data for ${row.symbol}:`, error);
                    }
                } else if (row.stock_no && row.dividend && row.created_date) {
                    const stock_no = this.getStockByName(row.stock_no)?.no;
                    data = {
                        stock_no: stock_no || null,
                        dividend: parseFloat(row.dividend),
                        employee_no: emp_id,
                        created_date: moment(row.created_date).format('YYYY-MM-DD'),
                        updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    };

                    try {
                        await this.$store.dispatch('api/dividend/addDividend', data);
                        this.modal.complete.message = 'อัพโหลดข้อมูลสำเร็จ';
                        this.modal.complete.open = true;
                    } catch (error) {
                        console.error(`Error submitting dividend data for ${row.symbol}:`, error);
                    }
                } else if (row.stock_no && row.price && row.created_date) {
                    const stock_no = this.getStockByName(row.stock_no)?.no;
                    data = {
                        stock_no: stock_no || null,
                        price: parseFloat(row.price),
                        employee_no: emp_id,
                        created_date: moment(row.created_date).format('YYYY-MM-DD HH:mm'),
                        updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    };

                    try {
                        await this.$store.dispatch('api/price/addPrice', data);
                        this.modal.complete.message = 'อัพโหลดข้อมูลสำเร็จ';
                        this.modal.complete.open = true;
                    } catch (error) {
                        console.error(`Error submitting price data for ${row.symbol}:`, error);
                    }
                } else {
                    console.error('Invalid data row:', row);
                }
            }

            this.modalConfirmOpen = false;
        },


        handleSaveUpdate() {
            if (this.modalConfirmOpen) {
                this.submitData();
            } else {
                this.showConfirmDialog('save', null);
            }
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock')
        },

        async fetchCustomerData() {
            this.customers = await this.$store.dispatch('api/customer/getCustomer')
        },

        async fetchFromData() {
            this.froms = await this.$store.dispatch('api/from/getFrom')
        },

        async fetchDividendData() {
            this.dividends = await this.$store.dispatch('api/dividend/getDividend')
        },

        async fetchPriceData() {
            this.prices = await this.$store.dispatch('api/price/getPrice')
        },

        getStockByName(stockName) {
            return this.stocks.find(stock => stock.stock === stockName);
        },

        getCustomerByID(CustomerID) {
            return this.customers.find(customer => customer.id === CustomerID);
        },

        getFromByName(FromName) {
            return this.froms.find(from => from.from === FromName);
        },

        goBack() {
            window.location.reload();
        },

        showConfirmDialog(action, item) {
            this.currentAction = action;
            this.currentItem = item;
            this.modalConfirmOpen = true;
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('DD/MM/YYYY');
            }
            return 'Invalid Date';
        },
    },
};

</script>

<style scoped>
.little-icon {
    font-size: 2.5rem;
    margin-right: 8px;
    margin-left: 8px;
}

.custom-list-item {
    padding: 0.1px 8px;
}

.custom-list {
    padding: 0.4px 2px;
}

.card-title-center {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.v-card-title .custom-title {
    font-size: 1.5rem !important;
}
</style>