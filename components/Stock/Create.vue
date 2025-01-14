<template>
    <v-dialog v-model="StockCreateOpen" @close="updateOpen(false)" max-width="700px">
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
        <StockResult :open="showModalResult" :stocks="withdrawalItems" :sets="sets" :employees="employees"
            @confirm="confirmAndAddCustomers" @cancel="showModalResult = false"
            @update:open="showModalResult = $event" />

        <v-card flat>
            <v-card-title class="d-flex align-center justify-center mb-3">
                <v-icon color="#24b224" size="30">mdi-archive-plus</v-icon>&nbsp;
                <h2 class="custom-title">เพิ่มหุ้น</h2>
            </v-card-title>
            <v-card-text>
                <v-form ref="form" lazy-validation>
                    <v-row v-for="(item, index) in withdrawalItems" :key="index" align="center">
                        <v-col v-if="stocks.length > 0" cols="3" class="ml-2">
                            <v-text-field v-model="item.stock" @input="setFullText(item)" label="ชื่อหุ้น" type="text"
                                dense outlined :rules="validateStockRules(item)" />
                        </v-col>

                        <v-col cols="3">
                            <v-select v-model="item.set_no" :items="sets" item-text="name" item-value="no"
                                label="ประเภท" clearable dense outlined>
                            </v-select>
                        </v-col>

                        <v-col cols="3">
                            <v-select v-model="item.staff_no" :items="employees" item-text="name" item-value="no"
                                label="ผู้ติดตามหุ้น" clearable dense outlined>
                            </v-select>
                        </v-col>

                        <v-col cols="2" class="d-flex align-center">
                            <v-btn icon color="#e50211" @click="removeProduct(index)" class="mb-6"
                                :disabled="withdrawalItems.length === 1">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                            <v-btn color="#24b224" @click="addProduct" text class="mb-6 ml-2">
                                <v-icon left>mdi-archive-plus</v-icon> เพิ่ม
                            </v-btn>
                        </v-col>

                    </v-row>
                </v-form>
                <v-card-actions class="card-title-center pa-0">
                    <v-btn color="#24b224" @click="showModalResult = true" :disabled="!isFormValid" class="mr-2">
                        ยืนยัน
                    </v-btn>
                    <v-btn @click="cancel" color="#e50211">
                        ยกเลิก
                    </v-btn>
                </v-card-actions>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import moment from 'moment';

export default {
    middleware: 'auth',
    async mounted() {
        await this.fetchSetData();
        await this.fetchEmployeeData();
        await this.fetchStockData();
    },

    props: {
        open: {
            type: Boolean,
            required: true,
        },
    },

    data() {
        return {
            StockCreateOpen: this.open,
            modal: {
                complete: { open: false, message: '' },
                error: { open: false, message: '' },
            },

            showModalResult: false,
            withdrawalItems: [{
                stock: '', set_no: null, staff_no: null
            }],
            sets: [],
            employees: [],
            stocks: []
        };
    },

    watch: {
        open(newVal) {
            this.StockCreateOpen = newVal;
        }
    },

    computed: {
        isFormValid() {
            return this.withdrawalItems.every(item => {
                const isStockValid = item.stock.trim() !== '';
                const isStockUnique = !this.stocks.some(stock => stock.name.toLowerCase() === item.stock.toLowerCase());
                const hasDuplicateStocks = this.findDuplicateIds(this.withdrawalItems).length === 0;
                return hasDuplicateStocks && isStockValid && isStockUnique;
            });
        },
    },

    mounted() {
        this.fetchSetData();
        this.fetchEmployeeData();
        this.fetchStockData();
        window.addEventListener('keydown', this.handleKeydown);
    },

    beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeydown);
    },

    methods: {
        setFullText(item) {
            item.stock = item.stock.toUpperCase();
        },

        findDuplicateIds() {
            const names = this.withdrawalItems.map(stock => stock.stock.toLowerCase());
            return names.filter((stock, index) => names.indexOf(stock) !== index && stock);
        },

        validateStockRules(item) {
            return [
                (v) => !!v || 'กรุณากรอกชื่อหุ้น',
                (v) => {
                    const duplicateStocks = this.findDuplicateIds();
                    if (duplicateStocks.includes(item.stock.toLowerCase())) {
                        return 'ชื่อหุ้นซ้ำกัน';
                    }
                    const stockExists = this.stocks.some(s => s.name.toLowerCase() === item.stock.toLowerCase());
                    if (stockExists) {
                        return 'มีชื่อหุ้นนี้อยู่แล้ว';
                    }
                    return true;
                },
            ];
        },

        async fetchEmployeeData() {
            try {
                const response = await this.$store.dispatch('api/employee/getEmployee');
                if (response) {
                    this.employees = response.map(item => ({ no: item.no, name: item.fname + ' ' + item.lname }));
                }
            } catch (error) {
            }
        },

        async fetchStockData() {
            try {
                const response = await this.$store.dispatch('api/stock/getStock');
                if (response) {
                    this.stocks = response.map(item => ({ no: item.no, name: item.stock }));
                }
            } catch (error) {
            }
        },

        openModal() {
            this.showModalResult = true;
        },

        handleKeydown(event) {
            if (event.key === 'Escape') {
                this.cancel();
            }
        },

        updateOpen(val) {
            this.StockCreateOpen = val;
            this.$emit('update:open', val);
        },

        goBack() {
            window.location.reload();
        },

        async confirmAndAddCustomers() {
            for (const stock of this.withdrawalItems) {
                try {
                    await this.$store.dispatch('api/stock/addStock', {
                        stock: stock.stock,
                        set_no: stock.set_no,
                        staff_no: stock.staff_no,
                        employee_no: this.$auth.user.no,
                        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                        updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    });
                } catch (error) {
                    console.error('Error adding stock:', error);
                    if (error.response && error.response.status === 400) {
                        this.modal.error.message = `มีชื่อหุ้นนี้ในระบบแล้ว : ${stock.stock}`;
                        this.modal.error.open = true;
                        return;
                    }
                }
            }
            this.modal.complete.message = 'เพิ่มหุ้นเรียบร้อยแล้ว!';
            this.modal.complete.open = true;
            this.recordLog();
            this.showModalResult = false;
        },

        async fetchSetData() {
            try {
                const response = await this.$store.dispatch('api/set/getSet');
                if (response) {
                    this.sets = response.map(item => ({
                        no: item.no,
                        name: item.set
                    }));
                }
            } catch (error) {
                console.error('Error fetching sets:', error);
            }
        },

        addProduct() {
            this.withdrawalItems.push({
                stock: '',
                set_no: null,
                staff_no: null
            });
        },

        removeProduct(index) {
            this.withdrawalItems.splice(index, 1);
        },

        cancel() {
            this.newStockType = '';
            this.$emit('update:open', false);
        },

        recordLog() {
            const Employee_Name = this.$auth.user.fname + ' ' + this.$auth.user.lname;
            const Employee_Email = this.$auth.user.email;
            const Employee_Picture = this.$auth.user.picture;
            const details = this.withdrawalItems.map((item, index) => {
                const setName = this.sets.find(set => set.no === item.set_no)?.name || 'ยังไม่ระบุ';
                return `หุ้นที่ ${index + 1}\n` + `ชื่อ : ${item.stock || 'ยังไม่ระบุ'}\n` + `ประเภท : ${setName}`;
            }).join('\n\n');
            const log = {
                action: 'เพิ่มหุ้นใหม่',
                detail: details.trim(),
                type: 2,
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
.card-title-center {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.custom-title {
    font-size: 1rem;
}
</style>
