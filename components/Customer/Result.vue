<template>
    <v-dialog v-model="showModalResult" max-width="500px">
        <v-card>
            <v-card-title class="d-flex align-center justify-center">
                <v-icon color="#24b224" size="30">mdi-alert-circle</v-icon>&nbsp;
                <span class="custom-title">ตรวจสอบความถูกต้อง</span>
            </v-card-title>
            <v-card-text>
                <v-data-table :headers="headers" :items="formattedCustomers" class="elevation-1" hide-default-footer>
                    <template v-slot:top>
                    </template>
                </v-data-table>
                <v-card-actions class="card-title-center pa-0">
                    <v-btn color="#24b224" @click="confirm" class="mt-4 mr-2">ยืนยัน</v-btn>
                    <v-btn color="#e50211" @click="cancel" class="mt-4">ยกเลิก</v-btn>
                </v-card-actions>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    props: {
        open: Boolean,
        customers: Array,
        types: Array,
        bases: Array,
    },
    data() {
        return {
            showModalResult: this.open,
            headers: [
                { text: 'ไอดีลูกค้า', value: 'id', sortable: false, align: 'center' },
                { text: 'ชื่อเล่น', value: 'nickname', sortable: false, align: 'center' },
                { text: 'ประเภท', value: 'type_name', sortable: false, align: 'center' },
                { text: 'ฐานทุน', value: 'base_name', sortable: false, align: 'center' },
            ],
        };
    },
    computed: {
        formattedCustomers() {
            const types = this.types || [];
            const bases = this.bases || [];

            return this.customers.map(customer => {
                const type = types.find(t => t.id === customer.type_no);
                const base = bases.find(b => b.id === customer.base_no);
                return {
                    ...customer,
                    type_name: type ? type.name : 'ยังไม่ระบุ',
                    base_name: base ? base.name : 'ยังไม่ระบุ',
                };
            });
        },
    },
    async mounted() {
        document.addEventListener('keydown', this.handleKeydown);
    },
    beforeDestroy() {
        document.removeEventListener('keydown', this.handleKeydown);
    },
    methods: {
        confirm() {
            this.$emit('confirm');
        },
        cancel() {
            this.$emit('cancel');
            this.showModalResult = false;
        },
        handleKeydown(event) {
            if (this.showModalResult) {
                if (event.key === 'Escape') {
                    this.cancel();
                } else if (event.key === 'Enter') {
                    this.confirm();
                }
            }
        },
    },
    watch: {
        open(newValue) {
            this.showModalResult = newValue;
        },
        showModalResult(newValue) {
            this.$emit('update:open', newValue);
        }
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
