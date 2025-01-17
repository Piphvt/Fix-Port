<template>

    <div>
        <ModalError :open="modal.error.open" :message="modal.error.message" :error.sync="modal.error.open" />
        <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />
        <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen" @update:confirm="modalConfirmOpen = false" />
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />

        <v-card flat>
            <v-container>
                <v-row justify="center" align="center">
                    <v-col cols="auto">
                        <v-card-title class="d-flex align-center justify-center">
                            <v-icon class="little-icon" color="#85d7df">mdi-home-clock</v-icon>&nbsp;
                            <h3 class="mb-0">ประวัติสมาชิก</h3>
                        </v-card-title>
                        <div class="d-flex align-center mt-2 justify-center">
                            <div class="d-flex align-center mt-2 justify-center">
                                <v-icon class="small-icon" @click="toggleSavedSearchesDialog">
                                    mdi-format-list-bulleted-type
                                </v-icon>
                                <span>{{ savedSearches.length }}</span>
                            </div>

                            <v-dialog v-model="showSavedSearchesDialog" max-width="400px">
                                <v-card>
                                    <v-card-title class="headline"
                                        style="justify-content: center; display: flex;">บันทึกการค้นหา</v-card-title>
                                    <v-card-text>
                                        <v-list>
                                            <v-list-item-group v-if="savedSearches.length > 0">
                                                <v-list-item v-for="(search, index) in savedSearches" :key="index">
                                                    <v-list-item-content>
                                                        <v-list-item-title>
                                                            <strong>ประเภท :</strong>
                                                            {{ getSearchTypeText(search.type) }}
                                                        </v-list-item-title>
                                                        <v-list-item-subtitle v-if="search.query">
                                                            <strong>รายละเอียด :</strong> {{ search.query }}
                                                        </v-list-item-subtitle>
                                                        <v-list-item-subtitle v-if="search.start && search.end">
                                                            <strong>ระยะเวลา :</strong> {{
                                                                formatDateTime(search.start)
                                                            }} - {{ formatDateTime(search.end) }}
                                                        </v-list-item-subtitle>
                                                        <v-list-item-subtitle v-if="search.topics">
                                                            <strong>หัวข้อ :</strong> {{ search.topics.join(', ') }}
                                                        </v-list-item-subtitle>
                                                    </v-list-item-content>
                                                    <v-list-item-action>
                                                        <v-btn icon @click="deleteSearch(index)">
                                                            <v-icon color=#e50211>mdi-delete</v-icon>
                                                        </v-btn>
                                                    </v-list-item-action>
                                                </v-list-item>
                                            </v-list-item-group>
                                            <v-list-item v-else>
                                                <v-list-item-content style="justify-content: center; display: flex;">
                                                    <v-icon color=#e50211>mdi-alert-circle</v-icon>
                                                    ไม่มีข้อมูลการค้นหา</v-list-item-content>
                                            </v-list-item>
                                        </v-list>
                                    </v-card-text>
                                    <v-card-actions>
                                        <v-spacer></v-spacer>
                                        <v-btn color="#e50211" @click="showSavedSearchesDialog = false">ปิด</v-btn>
                                        <v-spacer></v-spacer>
                                    </v-card-actions>
                                </v-card>
                            </v-dialog>

                            <v-select v-model="searchType" :items="searchTypes" dense outlined
                                class="mx-2 search-size small-font" @change="onSearchTypeChange"></v-select>

                            <v-autocomplete v-if="searchType === 'employee_name'" v-model="selectedName"
                                class="mx-2 search-size small-font" :items="getSearchItems('employee_name')"
                                label="ค้นหาชื่อเล่น" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'employee_email'" v-model="selectedEmail"
                                class="mx-2 search-size small-font" :items="getSearchItems('employee_email')"
                                label="ค้นหารหัสสมาชิก" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'action'" v-model="selectedAction"
                                class="mx-2 search-size small-font" :items="getSearchItems('action')"
                                label="ค้นหาประเภท" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-menu v-if="searchType === 'created_date'" v-model="datePickerMenu"
                                :close-on-content-click="false" transition="scale-transition" offset-y>
                                <template v-slot:activator="{ on, attrs }">
                                    <div v-bind="attrs" v-on="on" class="date-picker-activator">
                                        <v-icon class="small-label">mdi-calendar-start-outline</v-icon>
                                        <date-picker v-model="startDateTime" format="YYYY-MM-DD HH:mm"
                                            type="datetime" />
                                    </div>
                                </template>
                            </v-menu>

                            <v-menu v-if="searchType === 'created_date'" v-model="endDatePickerMenu"
                                :close-on-content-click="false" transition="scale-transition" offset-y>
                                <template v-slot:activator="{ on, attrs }">
                                    <div v-bind="attrs" v-on="on" class="date-picker-activator ml-2">
                                        <v-icon class="small-label">mdi-calendar-end-outline</v-icon>
                                        <date-picker v-model="endDateTime" format="YYYY-MM-DD HH:mm" type="datetime" />
                                    </div>
                                </template>
                            </v-menu>

                            <v-btn icon @click="addSearch">
                                <v-icon class="small-icon ">mdi-plus</v-icon>
                            </v-btn>

                            <v-btn color="success" @click="exportExcel" icon>
                                <v-icon>mdi-file-excel</v-icon>
                            </v-btn>
                        </div>
                    </v-col>
                </v-row>
            </v-container>

            <v-menu v-model="showColumnSelector" offset-y offset-x :close-on-content-click="false">
                <template v-slot:activator="{ on }">
                    <v-icon v-on="on" class="tab-icon" style="font-size: 2rem;"
                        color="#85d7df">mdi-playlist-check</v-icon>
                </template>
                <v-list class="header-list">
                    <v-list-item
                        v-for="header in headers.filter(header => header.value !== 'edit' && header.value !== 'select')"
                        :key="header.value" class="header-item">
                        <v-list-item-content>
                            <v-checkbox v-model="visibleColumns" :value="header.value" :label="header.text" />
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </v-menu>

            <v-data-table :headers="filteredHeaders" :items="filtered" :sort-by.sync="sortBy" :sort-desc.sync="sortDesc"
                item-key="no" :items-per-page="5">
                <template v-slot:item.employee_picture="{ item }">
                    <v-avatar size="40">
                        <img :src="item.employee_picture
                            ? `${$config.API_URL}/file/profile/${item.employee_picture}`
                            : `${$config.API_URL}/file/default/${item.employee_picture}`" alt="picture" />
                    </v-avatar>
                </template>
                <template v-slot:item.select="{ item }">
                    <div class="text-center"
                        style="display: flex; justify-content: center; align-items: center; height: 100%;">
                        <v-checkbox v-if="isSelectingItems" v-model="selectedItems" :value="item.no"
                            style="transform: scale(1);" />
                    </div>
                </template>
                <template v-slot:item.employee_email="{ item }">
                    <div class="text-center">{{ item.employee_email }}</div>
                </template>
                <template v-slot:item.employee_name="{ item }">
                    <div class="text-center">{{ item.employee_name }}</div>
                </template>
                <template v-slot:item.name="{ item }">
                    <div class="text-center">{{ item.name || '' }}</div>
                </template>
                <template v-slot:item.action="{ item }">
                    <div class="text-center" :style="{ color: getActionColor(item.action) }">
                        {{ item.action }}
                    </div>
                </template>
                <template v-slot:item.detail="{ item }">
                    <div class="text-center">
                        <v-icon @click="openDetail(item)" color="#85d7df">mdi-eye</v-icon>
                    </div>
                </template>
                <template v-slot:item.created_date="{ item }">
                    <div class="text-center">{{ formatDateTime(item.created_date) }}</div>
                </template>
                <template v-if="$auth.user.rank_no === 1 || $auth.user.rank_no === 3" v-slot:item.edit="{ item }">
                    <div class="text-center">
                        <v-menu offset-y>
                            <template v-slot:activator="{ on, attrs }">
                                <v-icon v-bind="attrs" v-on="on" color="#85d7df">mdi-dots-vertical</v-icon>
                            </template>
                            <v-list class="custom-list">
                                <v-list-item @click="toggleSelectItems" class="custom-list-item">
                                    <v-list-item-icon style="margin-right: 4px;">
                                        <v-icon class="icon-tab" color="#e50211">mdi-delete-circle</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content style="font-size: 0.8rem;">ลบ</v-list-item-content>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </div>
                </template>
            </v-data-table>
            <div class="text-center">
                <v-btn v-if="isSelectingItems && selectedItems.length > 0" color="red" @click="deleteSelectedItems"
                    class="mb-4" style="font-size: 1.5 rem; margin-left: auto;">
                    <v-icon left color="white">mdi-delete</v-icon> ลบ
                </v-btn>
            </div>
        </v-card>

        <v-dialog v-model="dialog" max-width="300px">
            <v-card>
                <v-card-title class="headline" style="justify-content: center; display: flex;">
                    {{ getDetailTitle(selectedItemDetail.action) }}
                </v-card-title>
                <v-card-text>
                    <div v-for="line in formattedDetailLines" :key="line">
                        <template v-if="line.includes('.jpg') || line.includes('.png') || line.includes('.jpeg')">
                            <div class="image-container">
                                <img :src="`${$config.API_URL}/file/profile/${line}`" alt="detail image" width="100"
                                    height="100" />
                            </div>
                        </template>
                        <template v-else-if="line.includes('เบอร์โทรศัพท์')">
                            <span style="color: green">เบอร์โทรศัพท์ </span>{{ line.replace('เบอร์โทรศัพท์', '').trim()
                            }}
                        </template>
                        <template v-else-if="line.includes('ผู้อนุมัติ')">
                            <span style="color: white">ผู้อนุมัติ </span>{{ line.replace('ผู้อนุมัติ', '').trim()
                            }}
                        </template>
                        <template v-else-if="line.includes('รหัสผ่าน')">
                            <span style="color: white">รหัสผ่าน </span>{{ maskNewData(line.replace('รหัสผ่าน ',
                                '').trim()) }}
                        </template>
                        <template v-else-if="line.includes('เพศ')">
                            <span style="color: blue">เพศ </span>{{ line.replace('เพศ', '').trim()
                            }}
                        </template>
                        <template v-else-if="line.includes('ชื่อเล่น')">
                            <span style="color: white">ชื่อเล่น </span>{{ line.replace('ชื่อเล่น', '').trim()
                            }}
                        </template>
                        <template v-else-if="line.includes('ชื่อ')">
                            <span style="color: yellow">ชื่อ </span>{{ line.replace('ชื่อ', '').trim()
                            }}
                        </template>
                        <template v-else-if="line.includes('อีเมล')">
                            <span style="color: red">อีเมล </span>{{ line.replace('อีเมล', '').trim()
                            }}
                        </template>
                        <template v-else-if="line.includes('สถานะ')">
                            <span style="color: orange">สถานะ </span>{{ line.replace('สถานะ', '').trim()
                            }}
                        </template>
                        <template v-else-if="line.includes('ตำแหน่ง')">
                            <span style="color: purple">ตำแหน่ง </span>{{ line.replace('ตำแหน่ง', '').trim()
                            }}
                        </template>
                        <template v-else-if="line.includes('ที่อยู่')">
                            <span style="color: green">ที่อยู่ </span>{{ line.replace('ที่อยู่', '').trim()
                            }}
                        </template>
                        <template v-else-if="line.includes('ไอพี')">
                            <span style="color: blue">ไอพี </span>{{ line.replace('ไอพี', '').trim()
                            }}
                        </template>
                        <template v-else>
                            {{ line }}
                        </template>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="#e50211" @click="dialog = false">ปิด</v-btn>
                    <v-spacer></v-spacer>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>

</template>

<script>

import ExcelJS from 'exceljs';
import moment from 'moment-timezone';
import 'moment/locale/th'
import DatePicker from 'vue2-datepicker';
import 'vue2-datepicker/index.css';

export default {

    layout: 'user',
    middleware: 'auth',

    async mounted() {
        await this.checkRank();
        await this.fetchLogData();
    },

    components: {
        DatePicker,
    },

    data() {
        return {
            modal: {
                error: {
                    open: false,
                    message: '',
                },
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

            logs: [],

            selectedName: [],
            selectedEmail: [],
            selectedAction: [],

            selectedItems: [],
            handleConfirm: null,
            isSelectingItems: false,
            modalConfirmOpen: false,

            startDateTime: '',
            endDateTime: '',
            selectedItemDetail: '',
            searchQuery: '',
            searchType: 'employee_name',
            sortBy: 'created_date',
            sortDesc: true,
            dialog: false,
            isSearchFieldVisible: false,
            datePickerMenu: false,
            endDatePickerMenu: false,
            showSavedSearchesDialog: false,
            showColumnSelector: false,
            savedSearches: [],

            searchTypes: [
                { text: 'ทำรายการโดย', value: 'employee_name' },
                { text: 'อีเมล', value: 'employee_email' },
                { text: 'การกระทำ', value: 'action' },
                { text: 'เวลา', value: 'created_date' }
            ],

            visibleColumns: ['select', 'created_date', 'employee_picture', 'action', 'employee_email', 'name', 'employee_name', 'detail', 'edit'],

            headers: [
                {
                    text: '',
                    value: 'select',
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'เวลา',
                    value: 'created_date',
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'โปรไฟล์',
                    value: 'employee_picture',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ทำรายการโดย',
                    value: 'employee_name',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'อีเมล',
                    value: 'employee_email',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'การกระทำ',
                    value: 'action',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ผู้ใช้งาน',
                    value: 'name',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'รายละเอียด',
                    value: 'detail',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: '',
                    value: 'edit',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },
            ],
        };
    },

    computed: {
        filtered() {
            let filteredLogs = this.logs;
            this.savedSearches.forEach(search => {
                filteredLogs = filteredLogs.filter(log => {
                    return this.applySearchFilter(log, search);
                });
            });
            return filteredLogs;
        },

        formattedDetailLines() {
            if (!this.selectedItemDetail || !this.selectedItemDetail.detail) {
                return [];
            }
            if (typeof this.selectedItemDetail.detail === 'string') {
                return this.selectedItemDetail.detail.split('\n');
            }
            return [];
        },

        filteredHeaders() {
            return this.headers.filter(header => this.visibleColumns.includes(header.value));
        },
    },

    methods: {
        goBack() {
            window.location.reload();
        },

        toggleSelectItems() {
            this.isSelectingItems = !this.isSelectingItems;
        },

        async deleteSelectedItems() {

            this.handleConfirm = async () => {
                const selectedIds = this.selectedItems;

                for (let i = 0; i < selectedIds.length; i++) {
                    try {
                        await this.$store.dispatch('api/log/deleteLog', selectedIds[i]);
                    } catch (error) {
                        console.error(`Error deleting customer with id ${selectedIds[i]}:`, error);
                    }
                }

                this.$emit('updateItems');
                this.selectedItems = [];
                this.isSelectingItems = false;

                this.modal.complete.message = 'ลบรายการที่เลือกสำเร็จ';
                this.modal.complete.open = true;
                this.modalConfirmOpen = false;
            };

            this.modalConfirmOpen = true;
        },

        getDetailTitle(action) {
            // เพิ่มฟังก์ชันเพื่อคืนค่าชื่อหัวเรื่องตาม action
            if (['เข้าสู่ระบบ', 'ออกจากระบบ', 'อนุมัติผู้ใช้งาน', 'ไม่อนุมัติผู้ใช้งาน', 'ลบผู้ใช้งาน'].includes(action)) {
                return 'ข้อมูลเพิ่มเติม';
            } else if (['เปลี่ยนรหัสผ่าน', 'อัพโหลดรูปภาพ', 'แก้ไขข้อมูลส่วนตัว', 'แก้ไขข้อมูลผู้ใช้งาน'].includes(action)) {
                return 'ข้อมูลที่ถูกแก้ไข';
            }
            return 'ข้อมูลทั่วไป';
        },

        getSearchItems(type) {
            if (type === 'employee_name') {
                return this.logs.map(log => log.employee_name);
            } else if (type === 'employee_email') {
                return this.logs.map(log => log.employee_email);
            } else if (type === 'action') {
                return this.logs.map(log => log.action);
            }
            return [];
        },

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
                        this.$router.push('/app/history/employee');
                    } else if (RankID === '2') {
                        this.$router.push('/app/home');
                    } else if (RankID === '3') {
                        this.$router.push('/app/home');
                    } else if (RankID === '4') {
                        this.$router.push('/app/home');
                    } else {
                        this.$router.push('/auth');
                    }
                }
            } else {
                this.$router.push('/');
            }
        },

        async fetchLogData() {
            this.logs = await this.$store.dispatch('api/log/getLogByType', '4');
        },

        getActionColor(action) {
            if (action === 'ออกจากระบบ') {
                return '#e50211';
            } else if (action === 'เข้าสู่ระบบ') {
                return '#24b224';
            } else if (action === 'เปลี่ยนรหัสผ่าน') {
                return '#ffc800';
            } else if (action === 'อัพโหลดรูปภาพ') {
                return '#38b6ff';
            } else if (action === 'แก้ไขข้อมูลส่วนตัว') {
                return '#8c52ff';
            } else if (action === 'แก้ไขข้อมูลผู้ใช้งาน') {
                return '#ff914d';
            } else if (action === 'อนุมัติผู้ใช้งาน') {
                return '#c1ff72';
            } else if (action === 'ไม่อนุมัติผู้ใช้งาน') {
                return '#ff5757';
            } else if (action === 'ลบผู้ใช้งาน') {
                return '#ff66c4';
            }
            else {
                return 'inherit';
            }
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('YYYY-MM-DD HH:mm');
            }
            return 'Invalid Date';
        },

        openDetail(item) {
            this.selectedItemDetail = item;
            this.dialog = true;
        },

        onSearchTypeChange() {
            this.isSearchFieldVisible = this.searchType !== 'created_date' && this.searchType !== 'action';
        },

        validateDateRange() {
            const start = moment(this.startDateTime);
            const end = moment(this.endDateTime);

            if (start.isValid() && end.isValid() && start.isAfter(end)) {
                this.modal.error.open = true;
                return false;
            }
            return true;
        },

        addSearch() {
            if (!this.validateDateRange()) {
                return;
            }

            if (this.searchType === 'employee_name' || this.searchType === 'employee_email' || this.searchType === 'action') {
                this.addSearchItemsToSearch();
            } else {
                this.savedSearches.push({
                    query: this.searchQuery,
                    type: this.searchType,
                    start: this.startDateTime,
                    end: this.endDateTime
                });
                this.searchQuery = '';
                this.startDateTime = '';
                this.endDateTime = '';
            }
        },

        addSearchItemsToSearch() {
            const selectedItems =
                this.searchType === 'employee_name' ? this.selectedName :
                    this.searchType === 'employee_email' ? this.selectedEmail :
                        this.searchType === 'action' ? this.selectedAction : [];

            if (selectedItems.length > 0) {
                this.savedSearches.push({
                    query: selectedItems,
                    type: this.searchType,
                    start: this.startDateTime,
                    end: this.endDateTime
                });

                if (this.searchType === 'employee_name') {
                    this.selectedName = [];
                } else if (this.searchType === 'employee_email') {
                    this.selectedEmail = [];
                } else if (this.searchType === 'action') {
                    this.selectedAction = [];
                }

                this.startDateTime = '';
                this.endDateTime = '';
            }
        },

        applySearchFilter(log, search) {
            let queryMatched = true;
            let field = log[search.type];

            if (search.type === 'employee_name' || search.type === 'employee_email' || search.type === 'action') {
                queryMatched = search.query.some(query => {
                    const lowerCaseField = typeof field === 'string' ? field.toLowerCase() : '';
                    return lowerCaseField === query.toLowerCase();
                });
            } else if (search.type === 'created_date') {
                return this.checkTimeRange(log, search);
            } else {
                const searchQuery = search.query.toLowerCase();
                queryMatched = typeof field === 'string' && field.toLowerCase() === searchQuery;
            }
            
            return queryMatched;
        },

        checkTimeRange(log, search) {
            const logTime = moment(log.created_date);
            const startTime = moment(search.start);
            const endTime = moment(search.end);
            return (!startTime.isValid() || logTime.isSameOrAfter(startTime)) &&
                (!endTime.isValid() || logTime.isSameOrBefore(endTime));
        },

        toggleSavedSearchesDialog() {
            this.showSavedSearchesDialog = !this.showSavedSearchesDialog;
        },

        deleteSearch(index) {
            this.savedSearches.splice(index, 1);
        },

        getSearchTypeText(type) {
            const found = this.searchTypes.find(item => item.value === type);
            return found ? found.text : type;
        },

        exportExcel() {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('ประวัติพนักงาน');

            const headers = this.filteredHeaders
                .filter(header => header.value !== 'employee_picture' && header.value !== 'select' && header.value !== 'edit')
                .map(header => ({
                    header: header.text,
                    key: header.value,
                    style: { font: { name: 'Angsana New', size: 16 } }
                }));

            worksheet.columns = headers;

            this.filtered.forEach((item, index) => {
                const rowData = {};
                this.filteredHeaders.forEach(header => {
                    if (header.value === 'created_date') {
                        rowData[header.value] = moment(item[header.value]).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm');
                    } else if (header.value !== 'employee_picture' && header.value !== 'select' && header.value !== 'edit') {
                        rowData[header.value] = item[header.value];
                    }
                });
                worksheet.addRow(rowData);
            });

            worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { bold: true, name: 'Angsana New', size: 18 };
            });

            worksheet.eachRow((row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
            });

            const currentDate = moment().tz('Asia/Bangkok').format('YYYY-MM-DD');
            workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `ประวัติพนักงาน-${currentDate}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        },

        maskNewData(data) {
            if (!data) return '';

            const length = data.length;
            if (length <= 4) return data;

            const firstPart = data.slice(0, 1);
            const lastPart = data.slice(-1);
            const maskedPart = '*'.repeat(length - 4)

            return `${firstPart}${maskedPart}${lastPart}`;
        },
    },
};
</script>

<style scoped>
.small-font {
    font-size: 0.8rem;
}

::v-deep .v-select-list .v-list-item__title {
    font-size: 0.8rem;
}

::v-deep .v-label {
    font-size: 0.8rem;
}

.small-label {
    margin-right: 8px;
}

.small-icon {
    font-size: 1.5rem;
    margin-right: 6px;
    margin-left: 6px;
}

.tab-icon {
    cursor: pointer;
    margin-right: 6px;
    margin-left: 24px;
}

.little-icon {
    font-size: 3rem;
    margin-right: 8px;
    margin-left: 8px;
}

.date-picker-activator {
    display: flex;
    align-items: center;
}

.ml-2 {
    margin-left: 8px;
}

.mx-2 {
    margin-left: 8px;
    margin-right: 8px;
}


.mt-2 {
    margin-top: 1px;
}

.d-flex {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
}

.same-size {
    max-width: 200px;
    max-height: 40px;
}

.search-size {
    max-width: 200px;
    max-height: 40px;
}

.v-data-table th,
.v-data-table td {
    padding: 8px;
    text-align: center;
}

.v-card-title {
    display: flex;
    align-items: center;
}

::v-deep .v-text-field.small-font .v-input__control .v-input__label {
    font-size: 0.8rem !important;
}

.v-menu__content {
    top: 100%;
    left: 0;
    margin-top: 0px;
    margin-bottom: 0px;
}

.custom-list-item {
    padding: 0.1px 8px;
}

.custom-list {
    padding: 0.4px 2px;
}

.v-list-item__content {
    padding: 0;
}

.header-list {
    display: flex;
    flex-wrap: wrap;
    padding: 0;
    gap: 0px;
}

.header-item {
    flex: 1 0 0%;
    box-sizing: border-box;
}

.v-list-item__content {
    display: flex;
    align-items: center;
}

.image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 10px 0;
}

.image-container img {
    max-width: 100%;
    max-height: 60px;
}
</style>