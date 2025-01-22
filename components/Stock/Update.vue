<template>
    <v-dialog v-model="dialog" max-width="800px">
        <v-card class="custom-card" flat>
            <div>
                <ModalConfirm :method="handleSaveUpdate" :open="modalConfirmOpen"
                    @update:confirm="modalConfirmOpen = false" />
                <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
                    :complete.sync="modal.complete.open" :method="goBack" />
                <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
                <StockClosePrice :open.sync="isLoadingClosePrice" @cancel-fetch="cancelFetchClosePriceData" />
                <StockDividendYield :open.sync="isLoadingDividendYield" @cancel-fetch="cancelFetchDividendYieldData" />
            </div>
            <v-card-title class="d-flex align-center justify-center">
                <v-icon color="#24b224" size="30">mdi-archive-arrow-up</v-icon>&nbsp;
                <span class="custom-title">อัพเดทหุ้น</span>
            </v-card-title>
            <v-card-text>
                <v-form ref="form" lazy-validation>
                    <v-row justify="end" align="center">
                        <v-col cols="auto">
                            <v-menu bottom right :offset-y="true" :nudge-top="8" :nudge-right="8" class="user-menu">
                                <template v-slot:activator="{ on, attrs }">
                                    <v-icon text v-bind="attrs" v-on="on" rounded class="icon-host"
                                        color="#ded30b">mdi-list-box</v-icon>
                                </template>

                                <v-list class="custom-list">
                                    <v-list-item @click="fetchClosePriceData"
                                        :disabled="isLoadingClosePrice || csvData.length > 0" class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 5px;">
                                            <v-icon class="icon-tab" color="#ffffff">mdi-cloud-download</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content>
                                            <v-list-item-title style="font-size: 0.8rem;">อัพเดทราคาปิด</v-list-item-title>
                                        </v-list-item-content>
                                    </v-list-item>

                                    <v-list-item @click="fetchDividendYieldData"
                                        :disabled="isLoadingDividendYield || csvData.length > 0"
                                        class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 5px;">
                                            <v-icon class="icon-tab" color="#38b6ff">mdi-briefcase-download</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content>
                                            <v-list-item-title style="font-size: 0.8rem;">อัพเดทเงินปันผล</v-list-item-title>
                                        </v-list-item-content>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col>
                            <v-data-table v-if="true" :headers="isDataLoaded ? headers : []" :items="csvData"
                                class="mt-4 elevation-1" :items-per-page="5"
                                no-data-text="ยังไม่มีข้อมูลในขณะนี้"></v-data-table>
                        </v-col>
                    </v-row>
                </v-form>

                <v-card-actions class="card-title-center pa-0">
                    <v-btn class="mt-3 mr-2" color="#24b224" @click="handleSaveUpdate"
                        :disabled="csvData.length === 0 || isLoadingClosePrice">
                        <v-icon>mdi-content-save</v-icon>บันทึก
                    </v-btn>
                    <v-btn class="mt-3" @click="dialog = false" color="#e50211">ปิด</v-btn>
                </v-card-actions>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import moment from 'moment-timezone';
import 'moment/locale/th';
import Papa from 'papaparse';

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

            currentAction: '',
            currentItem: null,
            modalConfirmOpen: false,

            stocks: [],
            csvData: [],
            headers: [],
            isLoadingClosePrice: false,
            isLoadingDividendYield: false,
            isDataLoaded: false,
            xhr: null,

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
        await this.fetchStockData();
    },

    methods: {
        handleSaveUpdate() {
            if (this.modalConfirmOpen) {
                this.saveUpdate();
            } else {
                this.showConfirmDialog('save', null);
            }
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock')
        },

        getStockByName(stockName) {
            return this.stocks.find(stock => stock.stock === stockName);
        },

        goBack() {
            window.location.reload();
        },

        showConfirmDialog(action, item) {
            this.currentAction = action;
            this.currentItem = item;
            this.modalConfirmOpen = true;
        },

        fetchClosePriceData() {
            this.isLoadingClosePrice = true;
            this.headers = [
                { text: 'เวลา', value: 'datetime' },
                { text: 'ชื่อหุ้น', value: 'symbol' },
                { text: 'ราคาปิด', value: 'close' }
            ];

            this.xhr = new XMLHttpRequest();
            this.xhr.open('GET', `${this.$config.API_URL}/run-close-price`, true);
            this.xhr.responseType = 'blob';

            this.xhr.onload = () => {
                if (this.xhr.status === 200) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const text = event.target.result;
                        this.parseClosePriceData(text);
                        this.isLoadingClosePrice = false;
                        this.isDataLoaded = true;
                    };
                    reader.readAsText(this.xhr.response);
                } else {
                    this.isLoadingClosePrice = false;
                    alert('เกิดข้อผิดพลาดในการดึงไฟล์ กรุณาลองใหม่อีกครั้ง');
                }
            };

            this.xhr.onerror = () => {
                this.isLoadingClosePrice = false;
                alert('เกิดข้อผิดพลาดทางเครือข่าย กรุณาลองใหม่อีกครั้ง');
            };

            this.xhr.send();
        },

        cancelFetchClosePriceData() {
            if (this.xhr) {
                this.xhr.abort();
                this.xhr = null;
            }
            this.isLoadingClosePrice = false;

            fetch(`${this.$config.API_URL}/cancel-close-price`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(message => console.log(message))
                .catch(error => console.error('Error canceling operation:', error));
        },

        fetchDividendYieldData() {
            this.isLoadingDividendYield = true;
            this.headers = [
                { text: 'วันที่', value: 'xdate' },
                { text: 'ชื่อหุ้น', value: 'symbol' },
                { text: 'จำนวนปันผล', value: 'dividend' },
            ];

            this.xhr = new XMLHttpRequest();
            this.xhr.open('GET', `${this.$config.API_URL}/run-dividend-yield`, true);
            this.xhr.responseType = 'blob';

            this.xhr.onload = () => {
                if (this.xhr.status === 200) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const text = event.target.result;
                        this.parseDividendYieldData(text);
                        this.isLoadingDividendYield = false;
                        this.isDataLoaded = true;
                    };
                    reader.readAsText(this.xhr.response);
                } else {
                    this.isLoadingDividendYield = false;
                    alert('เกิดข้อผิดพลาดในการดึงไฟล์ กรุณาลองใหม่อีกครั้ง');
                }
            };

            this.xhr.onerror = () => {
                this.isLoadingDividendYield = false;
                alert('เกิดข้อผิดพลาดทางเครือข่าย กรุณาลองใหม่อีกครั้ง');
            };

            this.xhr.send();
        },

        cancelFetchDividendYieldData() {
            if (this.xhr) {
                this.xhr.abort();
                this.xhr = null;
            }
            this.isLoadingDividendYield = false;

            fetch(`${this.$config.API_URL}/cancel-dividend-yield`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(message => console.log(message))
                .catch(error => console.error('Error canceling operation:', error));
        },

        parseClosePriceData(data) {
            Papa.parse(data, {
                header: true,
                complete: (results) => {
                    this.csvData = results.data
                        .filter(item => item.datetime && item.symbol && item.close)
                        .map(item => ({
                            datetime: item.datetime || '',
                            symbol: item.symbol || '',
                            close: item.close || ''
                        }));
                },
            });
        },

        async parseDividendYieldData(data) {
            try {
                const existingDividends = await this.$store.dispatch('api/dividend/getDividend', {
                    x_date: moment().tz('Asia/Bangkok').format('YYYY-MM-DD'),
                    stock_no: null
                });

                if (!existingDividends) {
                    throw new Error('ไม่สามารถดึงข้อมูลปันผลที่มีอยู่จากฐานข้อมูลได้');
                }

                const existingDividendSet = new Set(existingDividends.map(item =>
                    `${item.stock_no}-${moment(item.created_date).tz('Asia/Bangkok').format('YYYY-MM-DD')}`
                ));

                Papa.parse(data, {
                    header: true,
                    complete: (results) => {

                        this.csvData = results.data
                            .filter(item => {
                                const dividend = parseFloat(item.dividend);
                                const createdDate = moment(item.xdate).tz('Asia/Bangkok').format('YYYY-MM-DD');
                                const stockId = this.getStockByName(item.symbol)?.no;

                                return !isNaN(dividend) && !existingDividendSet.has(`${stockId}-${createdDate}`);
                            })
                            .map(item => ({
                                xdate: item.xdate,
                                symbol: item.symbol,
                                dividend: parseFloat(item.dividend),
                                remark: item.remark
                            }));

                        this.isLoadingDividendYield = false;
                        this.isDataLoaded = true;
                    },
                });
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการประมวลผลข้อมูล:', error);
                alert('ไม่สามารถประมวลผลข้อมูลได้: ' + error.message);
            }
        },

        async saveUpdate() {
            if (this.csvData.length === 0) {
                alert('ไม่พบข้อมูลเพื่อบันทึก');
                return;
            }

            try {
                for (const stock of this.csvData) {
                    const stockData = JSON.parse(JSON.stringify(stock));
                    const symbol = stockData.symbol;

                    if (!symbol) {
                        continue;
                    }

                    const stockId = this.getStockByName(symbol).no;

                    if (stockData.close !== undefined) {
                        const closePrice = stockData.close;
                        const price_created_date = stockData.datetime;
                        await this.$store.dispatch('api/price/addPrice', {
                            updated_date: moment.tz(new Date(), 'Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'),
                            created_date: moment(price_created_date).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'),
                            employee_no: this.$auth.user.no,
                            stock_no: stockId,
                            price: closePrice,
                        });
                    }

                    if (stockData.dividend !== undefined) {
                        const dividend = stockData.dividend;
                        const created_date = stockData.xdate;

                        const newCreatedDate = moment.tz(created_date, 'Asia/Bangkok').toDate();

                        const existingDividend = await this.$store.dispatch('api/dividend/getDividend', {
                            x_date: moment(created_date).tz('Asia/Bangkok').format('YYYY-MM-DD'),
                            stock_no: stockId
                        });

                        const isDuplicate = existingDividend.some(item => {
                            const existingCreatedDate = moment.tz(item.created_date, 'Asia/Bangkok').toDate();
                            return item.stock_no === stockId && existingCreatedDate.toDateString() === newCreatedDate.toDateString();
                        });

                        if (isDuplicate) {
                            console.log(`ข้อมูลปันผลสำหรับ ${symbol} วันที่ ${moment(created_date).tz('Asia/Bangkok').format('YYYY-MM-DD')} มีอยู่แล้วในฐานข้อมูล`);
                            continue;
                        }

                        await this.$store.dispatch('api/dividend/addDividend', {
                            updated_date: moment.tz(new Date(), 'Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'),
                            created_date: moment(created_date).tz('Asia/Bangkok').format('YYYY-MM-DD'),
                            employee_no: this.$auth.user.no,
                            stock_no: stockId,
                            dividend: dividend,
                        });
                    }
                }

                this.modal.complete.open = true;
                this.modal.complete.message = 'บันทึกข้อมูลเรียบร้อยแล้ว';
            } catch (error) {
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
            }

            this.modalConfirmOpen = false;
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('DD/MM/YYYY HH:mm');
            }
            return 'Invalid Date';
        }
    },
};
</script>

<style>
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
