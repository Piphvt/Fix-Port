<template>
    <v-dialog v-model="CustomerCreateOpen" @close="updateOpen(false)" max-width="800px">
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
        <CustomerResult :open="showModalResult" :customers="withdrawalItems" :types="types" :bases="bases"
            @confirm="confirmAndAddCustomers" @cancel="showModalResult = false"
            @update:open="showModalResult = $event" />

        <v-card flat>
            <v-card-title class="d-flex align-center justify-center mb-3">
                <v-icon color="#24b224" size="30">mdi-account-plus</v-icon>&nbsp;
                <h2 class="custom-title">เพิ่มลูกค้าใหม่</h2>
            </v-card-title>
            <v-card-text>
                <v-form ref="form" lazy-validation>
                    <v-row v-for="(item, index) in withdrawalItems" :key="index" align="center">
                        <v-col v-if="customers.length > 0" cols="3" class="ml-2">
                            <v-text-field v-model="item.numericId" @input="setFullId(item)" label="ไอดีลูกค้า"
                                type="text" dense outlined prepend="AQT" maxlength="12"
                                :rules="validateStockRules(item)" />
                        </v-col>

                        <v-col cols="2">
                            <v-text-field v-model="item.nickname" label="ชื่อเล่น" type="text" dense outlined
                                :rules="[(v) => !!v || 'กรุณากรอกชื่อเล่น', (v) => /^[\u0E00-\u0E7F]+$/.test(v) || 'กรุณากรอกเฉพาะภาษาไทย']"></v-text-field>
                        </v-col>

                        <v-col cols="2">
                            <v-select v-model="item.type_no" :items="types" item-text="name" item-value="id"
                                label="ประเภท" dense outlined></v-select>
                        </v-col>

                        <v-col cols="2">
                            <v-select v-model="item.base_no" :items="bases" item-text="name" item-value="id"
                                label="ฐานทุน" dense outlined></v-select>
                        </v-col>

                        <v-col cols="2" class="d-flex align-center">
                            <v-btn icon color="#e50211" @click="removeProduct(index)" class="mb-6"
                                :disabled="withdrawalItems.length === 1">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                            <v-btn color="#24b224" @click="addProduct" text class="mb-6 ml-2">
                                <v-icon left>mdi-account-plus</v-icon> เพิ่ม
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
        await this.fetchTypesData()
        await this.fetchBasesData()
        await this.fetchCustomerData()
    },

    props: {
        open: {
            type: Boolean,
            required: true,
        },
    },

    data() {
        return {
            CustomerCreateOpen: this.open,
            modal: {
                complete: { open: false, message: '' },
                error: { open: false, message: '' },
            },

            showModalResult: false,
            withdrawalItems: [{ id: 'AQT', nickname: '', type_no: null, base_no: 3 }],

            types: [],
            bases: [],
            customers: []
        };
    },

    watch: {
        open(newVal) {
            this.CustomerCreateOpen = newVal;
        }
    },

    computed: {
        isFormValid() {
            return this.withdrawalItems.every((item) => {
                const isnumericIdValid = typeof item.numericId === 'string' && (/^\d{9}$/.test(item.numericId.trim()) || /^[aA][qQ][tT]\d{9}$/.test(item.numericId.trim()));
                const isNicknameValid = typeof item.nickname === 'string' && /^[\u0E00-\u0E7F]+$/.test(item.nickname.trim());
                const isStockUnique = !this.customers.some(
                    (customer) =>
                        customer.id &&
                        item.id &&
                        customer.id.toLowerCase() === item.id.toLowerCase()
                );
                const hasDuplicateStocks = this.findDuplicateIds(this.withdrawalItems).length === 0;
                return isnumericIdValid && isNicknameValid && isStockUnique && hasDuplicateStocks;
            });
        },

    },

    mounted() {
        this.fetchTypesData();
        this.fetchBasesData();
        this.fetchCustomerData();
        window.addEventListener('keydown', this.handleKeydown);
    },

    beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeydown);
    },

    methods: {
        findDuplicateIds() {
            const names = this.withdrawalItems
                .map((customer) => (customer.id ? customer.id.toLowerCase() : ''))
                .filter((id) => id);
            return names.filter((id, index) => names.indexOf(id) !== index);
        },

        validateStockRules(item) {
            return [
                (v) => !!v || 'กรุณากรอกข้อมูลให้ถูกต้อง',
                (v) => /^(AQT)?\d{9}$/i.test(v) || 'กรุณากรอกรหัสสมาชิกในรูปแบบที่ถูกต้อง',
                (v) => {
                    const duplicateCustomers = this.findDuplicateIds();
                    if (
                        item.id &&
                        this.customers.some(
                            (s) => s.id && s.id.toLowerCase() === item.id.toLowerCase()
                        )
                    ) {
                        return 'มีรหัสสมาชิกนี้อยู่แล้ว';
                    }
                    if (item.id && duplicateCustomers.includes(item.id.toLowerCase())) {
                        return 'รหัสสมาชิกซ้ำกัน';
                    }
                    return true;
                },
            ];
        },

        async fetchCustomerData() {
            try {
                const response = await this.$store.dispatch('api/customer/getCustomer');
                if (response) {
                    this.customers = response
                        .map((item) => ({
                            no: item.no,
                            id: item.id ? item.id.trim().toLowerCase() : null,
                        }))
                        .filter((customer) => customer.id);
                }
            } catch (error) {
                console.error('Error fetching customers:', error);
            }
        },

        setFullId(item) {
            const prefix = 'AQT';
            if (!item.numericId.toUpperCase().startsWith(prefix)) {
                item.id = prefix + item.numericId;
            } else {
                item.id = item.numericId.toUpperCase();
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
            this.CustomerCreateOpen = val;
            this.$emit('update:open', val);
        },

        goBack() {
            window.location.reload();
        },

        async confirmAndAddCustomers() {
            for (const customer of this.withdrawalItems) {
                try {
                    await this.$store.dispatch('api/customer/addCustomer', {
                        id: customer.id,
                        nickname: customer.nickname,
                        type_no: customer.type_no,
                        base_no: customer.base_no,
                        employee_no: this.$auth.user.no,
                        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                        updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    });
                } catch (error) {
                    console.error('Error adding customer:', error);
                    if (error.response && error.response.status === 400) {
                        this.modal.error.message = `มีไอดีนี้ในระบบแล้ว : ${customer.id}`;
                        this.modal.error.open = true;
                        return;
                    }
                }
            }

            this.modal.complete.message = 'เพิ่มข้อมูลเรียบร้อย!';
            this.modal.complete.open = true;
            this.showModalResult = false;
        },

        async fetchTypesData() {
            try {
                const response = await this.$store.dispatch('api/type/getType');
                if (response) {
                    this.types = response.map(item => ({ id: item.no, name: item.type }));
                }
            } catch (error) {
                console.error('Error fetching types:', error);
            }
        },

        async fetchBasesData() {
            try {
                const response = await this.$store.dispatch('api/base/getBase');
                if (response) {
                    this.bases = response.map(item => ({ id: item.no, name: item.base }));
                }
            } catch (error) {
                console.error('Error fetching types:', error);
            }
        },

        addProduct() {
            this.withdrawalItems.push({
                id: null,
                nickname: '',
                type_no: null,
                base_no: 3,
            });
        },

        removeProduct(index) {
            this.withdrawalItems.splice(index, 1);
        },

        cancel() {
            this.newStockType = '';
            this.$emit('update:open', false);
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

.v-card-title .custom-title {
    font-size: 1.5rem !important;
}
</style>
