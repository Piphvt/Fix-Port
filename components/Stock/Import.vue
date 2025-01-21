<template>
    <v-container>
        <!-- ปุ่มเพื่ออัปโหลดไฟล์ Excel -->
        <v-btn @click="uploadExcel" color="primary">Upload Excel</v-btn>
        <input ref="fileInput" type="file" accept=".xls,.xlsx" style="display: none" @change="onFileChange" />

        <!-- ปุ่มสำหรับส่งข้อมูลไปยัง API -->
        <v-btn @click="submitData" color="success" class="mt-2">Submit Data</v-btn>

        <!-- ตาราง v-data-table -->
        <v-data-table :headers="excelHeaders" :items="excelData" class="elevation-1 mt-4">
            <template v-slot:item="{ item }">
                <tr>
                    <td v-for="(value, key, index) in item" :key="index">
                        {{ value }}
                    </td>
                </tr>
            </template>
        </v-data-table>
    </v-container>
</template>

<script>
import * as XLSX from 'xlsx';
import moment from 'moment';
moment.locale('th');

export default {
    layout: 'developer',
    middleware: 'auth',
    data() {
        return {
            excelHeaders: [],  // headers สำหรับตาราง
            excelData: [],     // ข้อมูลจาก Excel
        };
    },
    methods: {
        // ฟังก์ชันสำหรับเปิดตัวเลือกไฟล์
        uploadExcel() {
            this.$refs.fileInput.click();
        },

        // ฟังก์ชันสำหรับอ่านไฟล์ Excel เมื่อผู้ใช้เลือกไฟล์
        onFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    // ตั้ง headers สำหรับ v-data-table
                    this.excelHeaders = [
                        { text: 'Symbol', value: 'Symbol' },
                        { text: 'Type', value: 'Type' },
                    ];

                    // เก็บข้อมูลจากแถวที่สองขึ้นไปใน excelData
                    this.excelData = jsonData.slice(1).map((row) => {
                        return {
                            'Symbol': (row[0] === true) ? 'TRUE' : (row[0] === false) ? 'FALSE' : row[0], // แทนที่ด้วยตัวอักษร
                            'Type': row[1],
                        };
                    });
                };
                reader.readAsArrayBuffer(file);
            }
        },

        async submitData() {
            if (!this.$auth.user || !this.$auth.user.no) {
                console.error('User is not authenticated or user ID is missing.');
                return; // Exit if not authenticated
            }
            const emp_id = this.$auth.user.no; // get emp_id from auth

            // ฟังก์ชันแมพ Type ไปเป็น set_id
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
                        return null; // คืนค่า null หากไม่ตรงกับประเภทที่กำหนด
                }
            };

            for (const row of this.excelData) {
                const data = {
                    name: row.Symbol || null,                 // Corresponds to 'Symbol'
                    set_id: getSetId(row.Type),               // ใช้ฟังก์ชันเพื่อกำหนด set_id
                    emp_id: emp_id,                            // Automatically set emp_id
                    created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                };

                try {
                    await this.$store.dispatch('api/stock/addStock', data);
                    console.log(`Data for ${row.Symbol} submitted successfully.`);
                } catch (error) {
                    console.error(`Error submitting data for ${row.Symbol}:`, error);
                }
            }
        }
    },
};
</script>
