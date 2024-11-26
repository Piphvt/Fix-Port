<template>
    <div>
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
        <ResultFollow :open="showModalResult" :stocks="withdrawalItems" @confirm="confirmAndAddCustomers"
            @cancel="showModalResult = false" />

        <v-card class="custom-card" flat>
            <v-card-title class="d-flex align-center justify-center">
                <v-icon class="little-icon" color="#24b224">mdi-archive-star</v-icon> &nbsp;
                <h3 class="mb-0">การติดตามหุ้นใหม่</h3>
            </v-card-title>

            <v-card-text>
                <v-form>
                    <v-row class="mb-0 mt-0 pa-0" v-for="(item, index) in withdrawalItems" :key="index" align="center">
                        <v-col cols="2">
                            <v-autocomplete v-model="item.stock_id" :items="stocks" item-text="name" item-value="no"
                                label="ชื่อหุ้น" dense outlined :rules="[(v) => !!v || 'กรุณาเลือกชื่อหุ้น']" clearable>
                            </v-autocomplete>
                        </v-col>

                        <v-col cols="2">
                            <v-text-field v-model="item.low_price" label="Low Price" type="text" dense outlined
                                :rules="[(v) => !v || /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข']">
                            </v-text-field>
                        </v-col>

                        <v-col cols="2">
                            <v-text-field v-model="item.up_price" label="Up Price" type="text" dense outlined
                                :rules="[(v) => !v || /^[0-9]*\.?[0-9]+$/.test(v) || 'กรุณากรอกตัวเลข']">
                            </v-text-field>
                        </v-col>

                        <v-col cols="2">
                            <v-select v-model="item.type" :items="types" item-text="name" item-value="id" label="ประเภท"
                                dense outlined>
                            </v-select>
                        </v-col>

                        <v-col cols="2">
                            <v-text-field v-model="item.remark" label="หมายเหตุ" type="text" dense
                                outlined></v-text-field>
                        </v-col>

                        <v-col cols="2" class="d-flex align-center">
                            <v-btn icon color="#e50211" @click="removeProduct(index)" class="mb-6">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                            <v-btn color="#24b224" @click="addProduct" text class="mb-6 ml-2">
                                <v-icon left>mdi-archive-star</v-icon> เพิ่ม
                            </v-btn>
                        </v-col>
                    </v-row>

                    <div class="text-center">
                        <v-btn color="#24b224" @click="showModalResult = true" :disabled="!isFormValid" class="mr-2">
                            บันทึก
                        </v-btn>
                        <v-btn color="#e50211" @click="goToStocksManagement">
                            ย้อนกลับ
                        </v-btn>
                    </div>
                </v-form>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
import moment from 'moment'
moment.locale('th')

export default {
    layout: 'user',
    middleware: 'auth',

    async mounted() {
        await this.checkRank()
        await this.fetchStocksData()
    },

    data() {
        return {
            modal: {
                complete: {
                    open: false,
                    message: ''
                },
                error: {
                    open: false,
                    message: ''
                },
            },
            valid: false,
            showModalResult: false,
            withdrawalItems: [{
                stock_id: null, low_price: null, up_price: null,
                type: null, remark: null
            }],
            types: [
                { name: "กรอบเล็ก", id: 1 },
                { name: "กรอบใหญ่", id: 2 },
            ],
            stocks: [],

        }
    },

    computed: {
        isFormValid() {
            return this.withdrawalItems.every(item =>
                this.isNicknameValid(item.name)
            );
        },
    },

    methods: {
        isFloatValid(value) {
            return !!value && /^[0-9]*\.?[0-9]+$/.test(value);
        },

        isNicknameValid(name) {
            return name !== null && name !== '';
        },

        async checkRank() {
            if (this.$auth.loggedIn) {
                const Status = this.$auth.user.status.toString();
                const RankID = this.$auth.user.ranks_id.toString();
                if (Status === '2') {
                    this.$router.push('/');
                    await this.$auth.logout();
                }
                else {
                    if (RankID === '1') {
                        this.$router.push('/app/stock/new_follow');
                    } else if (RankID === '2') {
                        this.$router.push('/app/home');
                    } else if (RankID === '3') {
                        this.$router.push('/app/stock/new_follow');
                    } else {
                        this.$router.push('/auth');
                    }
                }
            } else {
                this.$router.push('/');
            }
        },

        openModal() {
            this.showModalResult = true;
        },

        async confirmAndAddCustomers() {
            for (const stock of this.withdrawalItems) {
                try {
                    await this.$store.dispatch('api/follow/addFollow', {
                        stock_id: stock.stock_id,
                        low_price: stock.low_price,
                        up_price: stock.up_price,
                        type: stock.type,
                        remark: stock.remark,
                        result: 1,
                        emp_id: this.$auth.user.no,
                        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                        updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    });
                } catch (error) {
                    console.error('Error adding stock:', error);
                    if (error.response && error.response.status === 400) {
                        this.modal.error.message = `มีชื่อหุ้นนี้ในระบบแล้ว : ${stock.name}`;
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

        async fetchStocksData() {
            try {
                const response = await this.$store.dispatch('api/stock/getStocks');
                if (response) {
                    this.stocks = response.map(item => ({ no: item.no, name: item.name }));
                }
            } catch (error) {
                console.error('Error fetching stocks:', error);
            }
        },

        addProduct() {
            this.withdrawalItems.push({
                stock_id: null,
                low_price: null,
                up_price: null,
                type: null,
                remark: null
            });
        },

        removeProduct(index) {
            this.withdrawalItems.splice(index, 1);
        },

        goBack() {
            this.$router.push('/app/stock/stock_follow');
        },

        recordLog() {
            const details = this.withdrawalItems.map((item, index) => {
                const setName = this.stocks.find(set => set.id === item.set_id)?.name || 'ยังไม่ระบุ';
                return `หุ้นที่ ${index + 1}\n` +
                    `ชื่อ : ${item.name || 'ยังไม่ระบุ'}\n` +
                    `ประเภท : ${setName}\n` +
                    `จำนวนปันผล : ${item.dividend_amount || 'ยังไม่ระบุ'}\n` +
                    `ราคาปิด : ${item.closing_price || 'ยังไม่ระบุ'}`;
            }).join('\n\n');

            const log = {
                emp_name: this.$auth.user.fname + ' ' + this.$auth.user.lname,
                emp_email: this.$auth.user.email,
                detail: details.trim(),
                type: 2,
                picture: this.$auth.user.picture || 'ไม่รู้จัก',
                action: 'เพิ่มหุ้นใหม่',
                time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };

            this.$store.dispatch('api/log/addLogs', log);
        },

        goToStocksManagement() {
            this.$router.push('/app/stock/management');
        },
    },
};
</script>

<style scoped>
.little-icon {
    font-size: 3rem;
    margin-right: 8px;
    margin-left: 8px;
}

.custom-card {
    max-width: 800px;
    width: 100%;
    margin: auto;
}
</style>
