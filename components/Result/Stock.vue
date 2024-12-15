<template>
    <v-dialog v-model="showModalResult" max-width="500px" @keydown="handleKeydown">
        <v-card>
            <v-card-title class="d-flex justify-center">
                <v-icon justify="center" class="mr-3" size="40" color="#24b224">mdi-archive-check</v-icon>
                <span class="headline">ตรวจสอบข้อมูลหุ้น</span>
            </v-card-title>
            <v-card-text>
                <v-data-table :headers="headers" :items="formattedStocks" class="elevation-1" hide-default-footer>
                    <template v-slot:top>
                    </template>
                </v-data-table>
            </v-card-text>
            <v-card-actions class="d-flex justify-center">
                <v-btn color="#24b224" @click="confirm" class="mb-4">ยืนยัน</v-btn>
                <v-btn color="#e50211" @click="cancel" class="ml-2 mb-4">ยกเลิก</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    props: {
        open: Boolean,
        stocks: Array,
        sets: Array,
    },
    data() {
        return {
            showModalResult: this.open,
            headers: [
                { text: 'ชื่อหุ้น', value: 'name' },
                { text: 'ประเภท', value: 'set_name' },
                { text: 'ราคาปิด', value: 'closing_price' },
            ],
        };
    },
    computed: {
        formattedStocks() {
            const sets = this.sets || [];
            return this.stocks.map(stock => {
                const set = sets.find(s => s.id === stock.set_no);
                return {
                    ...stock,
                    set_name: set ? set.name : 'ยังไม่ระบุ',
                    closing_price: stock.closing_price || 'ยังไม่ระบุ',
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
