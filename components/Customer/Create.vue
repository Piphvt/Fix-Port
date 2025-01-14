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
                        <v-col cols="3" class="ml-2">
                            <v-text-field v-model="item.numericId" @input="setFullId(item)" label="ไอดีลูกค้า"
                                type="text" dense outlined prepend="AQT" :rules="[
                                    (v) => !!v || 'กรุณากรอกตัวเลขเท่านั้น',
                                    (v) => /^(AQT)?[0-9]{9}$/.test(v) || 'กรุณากรอกข้อมูลให้ถูกต้อง'
                                ]" maxlength="12" />
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
        };
    },

    watch: {
        open(newVal) {
            this.CustomerCreateOpen = newVal;
        }
    },

    computed: {
        isFormValid() {
        return this.withdrawalItems.every(item => 
            (item.numericId && item.numericId.trim() !== '') && 
            (item.nickname && item.nickname.trim() !== '')
        );
    }
    },

    mounted() {
        this.fetchTypesData();
        this.fetchBasesData();
        window.addEventListener('keydown', this.handleKeydown);
    },

    beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeydown);
    },

    methods: {

        setFullId(item) {
            if (!item.numericId.startsWith('AQT')) {
                item.id = 'AQT' + item.numericId;
            } else {
                item.id = item.numericId;
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
            const duplicateIds = this.findDuplicateIds(this.withdrawalItems);
            if (duplicateIds.length > 0) {
                this.modal.error.message = `มีไอดีซ้ำ : ${duplicateIds.join(', ')}`;
                this.modal.error.open = true;
                return;
            }

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

            this.modal.complete.message = 'เพิ่มลูกค้าเรียบร้อยแล้ว!';
            this.modal.complete.open = true;
            this.recordLog();
            this.showModalResult = false;
        },

        findDuplicateIds(customers) {
            const ids = customers.map(customer => customer.id);
            return ids.filter((id, index) => ids.indexOf(id) !== index && id);
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

        recordLog() {
            const Employee_Name = this.$auth.user.fname + ' ' + this.$auth.user.lname;
            const Employee_Email = this.$auth.user.email;
            const Employee_Picture = this.$auth.user.picture;
            const details = this.withdrawalItems.map((item, index) => {
                const typeName = this.types.find(type => type.id === item.type_no)?.name || 'ยังไม่ระบุ';
                const baseName = this.bases.find(base => base.id === item.base_no)?.name || 'ยังไม่ระบุ';
                return `ลูกค้าคนที่ ${index + 1}\nรหัส : ${item.id}\nชื่อเล่น : ${item.nickname}\nประเภท : ${typeName}\nฐานทุน : ${baseName}`;
            }).join('\n\n');
            const log = {
                action: 'เพิ่มลูกค้าใหม่',
                detail: details.trim(),
                type: 3,
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
