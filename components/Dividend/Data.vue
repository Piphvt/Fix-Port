<template>
    <v-dialog v-model="dialog" max-width="500px">
        <v-card>
            <div>
                <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen"
                    @update:confirm="modalConfirmOpen = false" />
                <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen"
                    @update:confirm="modalConfirmOpen = false" />
                <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
                    :complete.sync="modal.complete.open" :method="goBack" />
                <DividendCreate :open="createDividendOpen" @update:open="createDividendOpen = false" />
                <DividendEdit :open="editDividend" :data="editAllData" @update:edit="editDividend = false" />
            </div>
            <v-card-title class="d-flex justify-center">
                <v-icon justify="center" class="mr-3" size="40" color="#85d7df">mdi-basket</v-icon>
                <span class="headline">ข้อมูลเงินปันผล</span></v-card-title>
            <v-card-text>
                <v-data-table v-if="filteredDividends.length > 0" :headers="headers" :items="filteredDividends"
                    item-value="no" item-key="no" :items-per-page="5">
                    <template v-slot:item.stock_no="{ item }">
                        <td class="text-center">{{ getStockName(item.stock_no) }}</td>
                    </template>
                    <template v-slot:item.dividend="{ item }">
                        <td class="text-center">{{ item.dividend }}</td>
                    </template>
                    <template v-slot:item.created_date="{ item }">
                        <td class="text-center">{{ formatDateTime(item.created_date) }}</td>
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
                <p class="text-center" v-else>ไม่พบการจ่ายเงินปันผลของหุ้นนี้</p>
            </v-card-text>
            <div class="text-center">
                <v-btn @click="createDividendOpen = true" class="mb-4 mr-4" style="font-size: 1.5 rem;" color="#24b224">
                    <v-icon left>mdi-basket-plus</v-icon> เพิ่ม
                </v-btn>
                <v-btn @click="dialog = false" class="mb-4" color="#e50211">ปิด</v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>

<script>
import moment from 'moment-timezone';
import 'moment/locale/th'

export default {
    props: {
        stockNo: Number,
        value: Boolean
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

            dividends: [],
            stocks: [],
            filteredDividends: [],

            currentAction: '',
            currentItem: null,
            modalConfirmOpen: false,

            createDividendOpen: false,

            editAllData: {},
            editDividend: false,

            headers: [
                {
                    text: 'วันที่จ่ายเงินปันผล',
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
                    text: 'เงินปันผล',
                    value: 'dividend',
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
            dialog: this.value
        };
    },

    watch: {
        value(newValue) {
            this.dialog = newValue;
        },
        dialog(newValue) {
            this.$emit('input', newValue);
        },
        stockNo() {
            this.filterDividends();
        }
    },

    async mounted() {
        await this.fetchDividendData();
        await this.fetchStockData();
        this.filterDividends();
    },

    methods: {
        openEditStock(dividend) {
            this.editAllData = dividend;
            this.editDividend = true;
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
            if (this.currentAction === 'delete') {
                try {
                    await this.$store.dispatch('api/dividend/deleteDividend', this.currentItem.no);
                    this.modal.complete.message = 'ลบเงินปันผลนี้เรียบร้อยแล้ว';
                    this.recordLog();
                    this.modal.complete.open = true;
                } catch (warning) {
                    this.modal.complete.message = 'เกิดข้อผิดพลาดในการดำเนินการ';
                    this.modal.complete.open = true;
                }
            }
            this.modalConfirmOpen = false;
        },

        async fetchDividendData() {
            const dividendsData = await this.$store.dispatch('api/dividend/getDividend');
            this.dividends = dividendsData;
        },

        filterDividends() {
            this.filteredDividends = this.dividends.filter(dividend => dividend.stock_no === this.stockNo);
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('DD/MM/YYYY');
            }
            return 'Invalid Date';
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock')
        },

        getStockName(stockNo) {
            const stock = this.stocks.find(s => s.no === stockNo);
            return stock ? stock.stock : '';
        },
    }
};
</script>

<style>
.custom-list-item {
    padding: 0.1px 8px;
}

.custom-list {
    padding: 0.4px 2px;
}
</style>