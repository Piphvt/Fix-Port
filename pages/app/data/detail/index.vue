<template>

    <div>
        <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />
        <ModalConfirm :method="handleConfirm" :open="modalConfirmOpen" @update:confirm="modalConfirmOpen = false" />
        <ModalComplete :open="modal.complete.open" :message="modal.complete.message"
            :complete.sync="modal.complete.open" :method="goBack" />
        <DetailCreate :open="DetailCreateOpen" @update:open="DetailCreateOpen = false" />
        <DetailEdit :open="editAllDialog" :data="editAllData" @update:edit="editAllDialog = false" />
        <DetailSoldOut v-model="SoldOutStockDataOpen" />

        <v-card class="custom-card" flat>
            <v-container>
                <v-row justify="center" align="center">
                    <v-col cols="auto">
                        <v-card-title class="d-flex align-center justify-center">
                            <v-icon class="little-icon" color="#85d7df">mdi-bank</v-icon>&nbsp;
                            <h3 class="mb-0">ข้อมูลหุ้นของลูกค้า</h3>
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

                            <v-autocomplete v-if="searchType === 'customer_no'" v-model="selectedCustomerIDs"
                                class="mx-2 search-size small-font" :items="getSearchItems('customer_no')"
                                label="ค้นหารหัสสมาชิก" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'customer_name'" v-model="selectedCustomerNames"
                                class="mx-2 search-size small-font" :items="getSearchItems('customer_name')"
                                label="ค้นหาชื่อเล่น" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'stock_no'" v-model="selectedStocks"
                                class="mx-2 search-size small-font" :items="getSearchItems('stock_no')"
                                label="ค้นหาชื่อหุ้น" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'employee_no'" v-model="selectedEmployees"
                                class="mx-2 search-size small-font" :items="getSearchItems('employee_no')"
                                label="ค้นหาผู้ทำรายการ" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'port'" v-model="selectedPorts"
                                class="mx-2 search-size small-font" :items="getSearchItems('port')"
                                label="ค้นหาประเภทพอร์ต" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'customer_base'" v-model="selectedBases"
                                class="mx-2 search-size small-font" :items="getSearchItems('customer_base')"
                                label="ค้นหาฐานทุน" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'customer_type'" v-model="selectedTypes"
                                class="mx-2 search-size small-font" :items="getSearchItems('customer_type')"
                                label="ค้นหาประเภทลูกค้า" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-autocomplete v-if="searchType === 'stock_from'" v-model="selectedFroms"
                                class="mx-2 search-size small-font" :items="getSearchItems('stock_from')"
                                label="ค้นหาประเภทลูกค้า" dense outlined clearable multiple>
                            </v-autocomplete>

                            <v-menu v-if="searchType === 'updated_date'" v-model="datePickerMenu"
                                :close-on-content-click="false" transition="scale-transition" offset-y>
                                <template v-slot:activator="{ on, attrs }">
                                    <div v-bind="attrs" v-on="on" class="date-picker-activator">
                                        <v-icon class="small-label">mdi-calendar-start-outline</v-icon>
                                        <date-picker v-model="startDateTime" format="YYYY-MM-DD HH:mm"
                                            type="datetime" />
                                    </div>
                                </template>
                            </v-menu>

                            <v-menu v-if="searchType === 'updated_date'" v-model="endDatePickerMenu"
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

                            <v-btn color="success" v-if="$auth.user.rank_no === 1" @click="exportExcel" icon>
                                <v-icon>mdi-file-excel</v-icon>
                            </v-btn>
                        </div>
                    </v-col>
                </v-row>
            </v-container>

            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <v-menu v-model="showColumnSelector" offset-y offset-x :close-on-content-click="false">
                    <template v-slot:activator="{ on }">
                        <v-icon v-on="on" class="tab-icon" style="font-size: 2rem;"
                            color="#85d7df">mdi-playlist-check</v-icon>
                    </template>
                    <v-list class="header-list">
                        <v-list-item
                            v-for="header in headers.filter(header => header.value !== 'detail' && header.value !== 'select')"
                            :key="header.value" class="header-item">
                            <v-list-item-content>
                                <v-checkbox v-model="visibleColumns" :value="header.value" :label="header.text" />
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>
                </v-menu>
                <div>
                    <v-btn @click="SoldOutStockDataOpen = true" class="tab-icon-three"
                        style="font-size: 1.5 rem; margin-left: auto;">
                        <v-icon left color="#85d7df">mdi-piggy-bank</v-icon> หุ้นที่ขายหมดแล้ว
                    </v-btn>

                    <v-btn @click="DetailCreateOpen = true" class="tab-icon-two"
                        style="font-size: 1.5 rem; margin-left: auto;">
                        <v-icon left color="#24b224">mdi-bank-plus</v-icon> เพิ่มข้อมูลหุ้น
                    </v-btn>
                </div>
            </div>

            <v-data-table :headers="filteredHeaders" :items="filtered" :sort-by.sync="sortBy" :sort-desc.sync="sortDesc"
                item-key="no" :items-per-page="5" style="overflow-x: auto; white-space: nowrap;">
                <template v-slot:item="{ item }">
                    <tr>
                        <td v-if="visibleColumns.includes('select')" class="text-center"
                            style="display: flex; justify-content: center; align-items: center; height: 100%;">
                            <v-checkbox v-if="isSelectingItems" v-model="selectedItems" :value="item.no"
                                style="transform: scale(1);" />
                        </td>
                        <td class="text-center">
                            <v-icon style="color:#85d7df" @click="toggleOpen(item)">
                                {{ item.isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                            </v-icon>
                        </td>
                        <td v-if="visibleColumns.includes('updated_date')" class="text-center">
                            {{ formatDateTime(item.updated_date) }}</td>
                        <td v-if="visibleColumns.includes('customer_no')" class="text-center">
                            {{ getCustomerByNo(item.customer_no)?.id || 'ยังไม่ระบุ' }}</td>
                        <td v-if="visibleColumns.includes('customer_name')" class="text-center">
                            {{ getCustomerByNo(item.customer_no)?.nickname || 'ยังไม่ระบุ' }}</td>
                        <td v-if="visibleColumns.includes('stock_no')" class="text-center">
                            {{ getStockByNo(item.stock_no)?.stock || 'ยังไม่ระบุ' }}</td>
                        <td v-if="visibleColumns.includes('from_no')" class="text-center"
                            :style="{ color: getFromText(getFromByNo(item.from_no)?.from).color }">
                            {{ getFromByNo(item.from_no)?.from || 'ยังไม่ระบุ' }}</td>
                        <td v-if="visibleColumns.includes('created_date')" class="text-center"
                            :style="{ color: getDateColor(item.created_date) }">
                            {{ formatDate(item.created_date) }}</td>
                        <td v-if="visibleColumns.includes('price')" class="text-center" style="color:#00bf63">
                            {{ item.price.toLocaleString(2) }}</td>
                        <td v-if="visibleColumns.includes('amount')" class="text-center" style="color:#ff66c4">
                            {{ item.amount.toLocaleString(2) }}</td>
                        <td v-if="visibleColumns.includes('money')" class="text-center">
                            {{ item.money }}</td>
                        <td v-if="visibleColumns.includes('dividend_amount')" class="text-center" style="color:#8c52ff">
                            {{ item.dividend_amount }}</td>
                        <td v-if="visibleColumns.includes('balance_dividend')" class="text-center">
                            {{ item.balance_dividend }}</td>
                        <td v-if="visibleColumns.includes('closing_price')" class="text-center" style="color:#ff914d">
                            {{ item.closing_price }}</td>
                        <td v-if="visibleColumns.includes('present_price')" class="text-center">
                            {{ item.present_price }}</td>
                        <td v-if="visibleColumns.includes('total')" class="text-center">
                            {{ item.total }}</td>
                        <td v-if="visibleColumns.includes('present_profit')" class="text-center"
                            :style="{ color: getColorForNumber(item.present_profit) }">
                            {{ item.present_profit }}</td>
                        <td v-if="visibleColumns.includes('total_percent')" class="text-center"
                            :style="{ color: getColorForPercent(item.total_percent) }">
                            {{ item.total_percent }}%</td>
                        <td v-if="visibleColumns.includes('port')" class="text-center"
                            :style="{ color: getPortText(item.total_percent).color }">
                            {{ getPortText(item.total_percent).text }}</td>
                        <td v-if="visibleColumns.includes('employee_no')" class="text-center">
                            {{ getEmployeeByNo(item.employee_no)?.fname + ' ' + getEmployeeByNo(item.employee_no)?.lname
                                ||
                                'ยังไม่ระบุ' }}</td>
                        <td v-if="visibleColumns.includes('comment')" class="text-center">
                            {{ item.comment || '-' }}</td>
                        <td v-if="visibleColumns.includes('type_no')" class="text-center">
                            {{ getTypeByNo(getCustomerByNo(item.customer_no)?.type_no)?.type || 'ยังไม่ระบุ' }}</td>
                        <td v-if="visibleColumns.includes('base_no')" class="text-center">
                            {{ getBaseByNo(getCustomerByNo(item.customer_no)?.base_no)?.base || 'ยังไม่ระบุ' }}</td>
                        <td class="text-center">
                            <v-menu offset-y>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-icon v-bind="attrs" v-on="on" color="#85d7df">mdi-dots-vertical</v-icon>
                                </template>
                                <v-list class="custom-list">
                                    <v-list-item @click="openEditAllDialog(item)" class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 4px;">
                                            <v-icon class="icon-tab" color="#ffc800">mdi-pencil-circle</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content style="font-size: 0.8rem;">แก้ไข</v-list-item-content>
                                    </v-list-item>

                                    <v-list-item @click="toggleSelectItems" class="custom-list-item">
                                        <v-list-item-icon style="margin-right: 4px;">
                                            <v-icon class="icon-tab" color="#e50211">mdi-delete-circle</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content style="font-size: 0.8rem;">ลบ</v-list-item-content>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </td>
                    </tr>

                    <tr v-if="item.isOpen">
                        <td v-if="visibleColumns.includes('select')" class="text-center"></td>
                        <td class="text-center" style="color:#e6c56c">หุ้นเดิม</td>
                        <td v-if="visibleColumns.includes('updated_date')" class="text-center">
                            {{ formatDateTime(item.detailupdated_date) }}</td>
                        <td v-if="visibleColumns.includes('customer_no')" class="text-center">
                            {{ getCustomerByNo(item.customer_no)?.id || 'N/A' }}</td>
                        <td v-if="visibleColumns.includes('customer_name')" class="text-center">
                            {{ getCustomerByNo(item.customer_no)?.nickname || 'N/A' }}</td>
                        <td v-if="visibleColumns.includes('stock_no')" class="text-center">
                            {{ getStockByNo(item.stock_no)?.stock || 'N/A' }}</td>
                        <td v-if="visibleColumns.includes('from_no')" class="text-center"
                            :style="{ color: getFromText(getFromByNo(item.from_no)?.from).color }">
                            {{ getFromByNo(item.from_no)?.from || 'N/A' }}</td>
                        <td v-if="visibleColumns.includes('created_date')" class="text-center"
                            :style="{ color: getDateColor(item.created_date) }">
                            {{ formatDate(item.created_date) }}</td>
                        <td v-if="visibleColumns.includes('price')" class="text-center" style="color:#00bf63">
                            {{ item.detailprice.toLocaleString(2) }}</td>
                        <td v-if="visibleColumns.includes('amount')" class="text-center" style="color:#ff66c4">
                            {{ item.detailamount.toLocaleString(2) }}</td>
                        <td v-if="visibleColumns.includes('money')" class="text-center">
                            {{ item.detailmoney }}</td>
                        <td v-if="visibleColumns.includes('dividend_amount')" class="text-center" style="color:#8c52ff">
                            {{ item.detaildividend_amount }}</td>
                        <td v-if="visibleColumns.includes('balance_dividend')" class="text-center">
                            {{ item.detailbalance_dividend }}</td>
                        <td v-if="visibleColumns.includes('closing_price')" class="text-center" style="color:#ff914d">
                            {{ item.closing_price }}</td>
                        <td v-if="visibleColumns.includes('present_price')" class="text-center">
                            {{ item.detailpresent_price }}</td>
                        <td v-if="visibleColumns.includes('total')" class="text-center">
                            {{ item.detailtotal }}</td>
                        <td v-if="visibleColumns.includes('present_profit')" class="text-center"
                            :style="{ color: getColorForNumber(item.detailpresent_profit) }">
                            {{ item.detailpresent_profit }}</td>
                        <td v-if="visibleColumns.includes('total_percent')" class="text-center"
                            :style="{ color: getColorForPercent(item.detailtotal_percent) }">
                            {{ item.detailtotal_percent }}%</td>
                        <td v-if="visibleColumns.includes('port')" class="text-center"
                            :style="{ color: getPortText(item.detailtotal_percent).color }">
                            {{ getPortText(item.detailtotal_percent).text }}</td>
                        <td v-if="visibleColumns.includes('employee_no')" class="text-center">
                            {{ getEmployeeByNo(item.detailemployee_no)?.fname + ' ' +
                                getEmployeeByNo(item.detailemployee_no)?.lname || 'ไม่ทราบ'
                            }}</td>
                        <td v-if="visibleColumns.includes('comment')" class="text-center">
                            {{ item.comment || '-' }}</td>
                        <td v-if="visibleColumns.includes('type_no')" class="text-center"></td>
                        <td v-if="visibleColumns.includes('base_no')" class="text-center"></td>
                        <td class="text-center"></td>
                    </tr>

                    <tr v-if="item.transactions && item.isOpen" v-for="transaction in item.transactions"
                        :key="transaction.id">
                        <td v-if="visibleColumns.includes('select')" class="text-center"></td>
                        <td class="text-center" style="color:#6ce69f">ซื้อเพิ่ม</td>
                        <td v-if="visibleColumns.includes('updated_date')" class="text-center">
                            {{ formatDateTime(transaction.updated_date) }}</td>
                        <td v-if="visibleColumns.includes('customer_no')" class="text-center">
                            {{ getCustomerByNo(item.customer_no)?.id || 'N/A' }}</td>
                        <td v-if="visibleColumns.includes('customer_name')" class="text-center">
                            {{ getCustomerByNo(item.customer_no)?.nickname || 'N/A' }}</td>
                        <td v-if="visibleColumns.includes('stock_no')" class="text-center">
                            {{ getStockByNo(item.stock_no)?.stock || 'N/A' }}</td>
                        <td v-if="visibleColumns.includes('from_no')" class="text-center"
                            :style="{ color: getFromText(getFromByNo(transaction.from_no)?.from).color }">
                            {{ getFromByNo(transaction.from_no)?.from || 'N/A' }}</td>
                        <td v-if="visibleColumns.includes('created_date')" class="text-center"
                            :style="{ color: getDateColor(transaction.created_date) }">
                            {{ formatDate(transaction.created_date) }}</td>
                        <td v-if="visibleColumns.includes('price')" class="text-center" style="color:#00bf63">
                            {{ transaction.price.toLocaleString(2) }}</td>
                        <td v-if="visibleColumns.includes('amount')" class="text-center" style="color:#ff66c4">
                            {{ transaction.amount.toLocaleString(2) }}</td>
                        <td v-if="visibleColumns.includes('money')" class="text-center">
                            {{ transaction.money }}</td>
                        <td v-if="visibleColumns.includes('dividend_amount')" class="text-center" style="color:#8c52ff">
                            {{ transaction.dividend_amount }}</td>
                        <td v-if="visibleColumns.includes('balance_dividend')" class="text-center">
                            {{ transaction.balance_dividend }}</td>
                        <td v-if="visibleColumns.includes('closing_price')" class="text-center" style="color:#ff914d">
                            {{ item.closing_price }}</td>
                        <td v-if="visibleColumns.includes('present_price')" class="text-center">
                            {{ transaction.present_price }}</td>
                        <td v-if="visibleColumns.includes('total')" class="text-center">
                            {{ transaction.total }}</td>
                        <td v-if="visibleColumns.includes('present_profit')" class="text-center"
                            :style="{ color: getColorForNumber(transaction.present_profit) }">
                            {{ transaction.present_profit }}</td>
                        <td v-if="visibleColumns.includes('total_percent')" class="text-center"
                            :style="{ color: getColorForPercent(transaction.total_percent) }">
                            {{ transaction.total_percent }}%</td>
                        <td v-if="visibleColumns.includes('port')" class="text-center"
                            :style="{ color: getPortText(transaction.total_percent).color }">
                            {{ getPortText(transaction.total_percent).text }}</td>
                        <td v-if="visibleColumns.includes('employee_no')" class="text-center">
                            {{ getEmployeeByNo(transaction.employee_no)?.fname + ' ' +
                                getEmployeeByNo(transaction.employee_no)?.lname ||
                                'ไม่ทราบ' }}</td>
                        <td v-if="visibleColumns.includes('comment')" class="text-center">
                            {{ item.comment || '-' }}</td>
                        <td v-if="visibleColumns.includes('type_no')" class="text-center"></td>
                        <td v-if="visibleColumns.includes('base_no')" class="text-center"></td>
                        <td class="text-center"></td>
                    </tr>

                    <tr v-if="item.isOpen">
                        <td v-if="visibleColumns.includes('select')" class="text-center"></td>
                        <td class="text-center" style="color:#cb6ce6">รวมหักปันผล</td>
                        <td v-if="visibleColumns.includes('updated_date')" class="text-center">
                            {{ formatDateTime(item.updated_date) }}</td>
                        <td v-if="visibleColumns.includes('customer_no')" class="text-center">
                            {{ getCustomerByNo(item.customer_no)?.id || 'N/A' }}</td>
                        <td v-if="visibleColumns.includes('customer_name')" class="text-center">
                            {{ getCustomerByNo(item.customer_no)?.nickname || 'N/A' }}</td>
                        <td v-if="visibleColumns.includes('stock_no')" class="text-center">
                            {{ getStockByNo(item.stock_no)?.stock || 'N/A' }}</td>
                        <td v-if="visibleColumns.includes('from_no')" class="text-center"
                            :style="{ color: getFromText(getFromByNo(item.from_no)?.from).color }">
                            {{ getFromByNo(item.from_no)?.from || 'N/A' }}</td>
                        <td v-if="visibleColumns.includes('created_date')" class="text-center"
                            :style="{ color: getDateColor(item.created_date) }">
                            {{ formatDate(item.created_date) }}</td>
                        <td v-if="visibleColumns.includes('price')" class="text-center" style="color:#00bf63">
                            {{ item.dividendprice.toLocaleString(2) }}</td>
                        <td v-if="visibleColumns.includes('amount')" class="text-center" style="color:#ff66c4">
                            {{ item.amount.toLocaleString(2) }}</td>
                        <td v-if="visibleColumns.includes('money')" class="text-center">
                            {{ item.dividendmoney }}</td>
                        <td v-if="visibleColumns.includes('dividend_amount')" class="text-center" style="color:#8c52ff">
                            {{ item.dividend_amount }}</td>
                        <td v-if="visibleColumns.includes('balance_dividend')" class="text-center">
                            {{ item.balance_dividend }}</td>
                        <td v-if="visibleColumns.includes('closing_price')" class="text-center" style="color:#ff914d">
                            {{ item.closing_price }}</td>
                        <td v-if="visibleColumns.includes('base_no')" class="text-center">
                            {{ item.present_price }}</td>
                        <td v-if="visibleColumns.includes('total')" class="text-center">
                            {{ item.total }}</td>
                        <td v-if="visibleColumns.includes('present_profit')" class="text-center"
                            :style="{ color: getColorForNumber(item.present_profit) }">
                            {{ item.present_profit }}</td>
                        <td v-if="visibleColumns.includes('total_percent')" class="text-center"
                            :style="{ color: getColorForPercent(item.total_percent) }">
                            {{ item.total_percent }}%</td>
                        <td v-if="visibleColumns.includes('port')" class="text-center"
                            :style="{ color: getPortText(item.total_percent).color }">
                            {{ getPortText(item.total_percent).text }}</td>
                        <td v-if="visibleColumns.includes('employee_no')" class="text-center">
                            {{ getEmployeeByNo(item.employee_no)?.fname + ' ' + getEmployeeByNo(item.employee_no)?.lname
                                ||
                                'ไม่ทราบ' }}</td>
                        <td v-if="visibleColumns.includes('comment')" class="text-center">
                            {{ item.comment || '-' }}</td>
                        <td v-if="visibleColumns.includes('type_no')" class="text-center"></td>
                        <td v-if="visibleColumns.includes('base_no')" class="text-center"></td>
                        <td class="text-center"></td>
                    </tr>
                </template>
            </v-data-table>
            <div class="text-center">
                <v-btn v-if="isSelectingItems && selectedItems.length > 0" color="red" @click="deleteSelectedItems"
                    class="mb-4" style="font-size: 1.5 rem; margin-left: auto;">
                    <v-icon left color="white">mdi-delete</v-icon> ลบ
                </v-btn>
            </div>
        </v-card>
    </div>

</template>

<script>

import ExcelJS from 'exceljs';
import moment from 'moment-timezone';
import 'moment/locale/th'
import DatePicker from 'vue2-datepicker';
import 'vue2-datepicker/index.css';
import Decimal from 'decimal.js';

export default {

    layout: 'user',
    middleware: 'auth',

    async mounted() {
        await Promise.all([
            this.checkRank(),
            this.fetchEmployeeData(),
            this.fetchDetailData(),
            this.fetchCustomerData(),
            this.fetchStockData(),
            this.fetchFromData(),
            this.fetchBaseData(),
            this.fetchTypeData(),
        ]);
    },

    components: {
        DatePicker,
    },

    data() {
        return {
            modal: {
                warning: {
                    open: false,
                    message: 'การป้อนข้อมูลเวลาไม่ถูกต้อง',
                },
                confirm: {
                    open: false,
                },
                complete: {
                    open: false,
                    message: 'สำเร็จ',
                },
            },

            employees: [],
            details: [],
            customers: [],
            stocks: [],
            froms: [],
            bases: [],
            types: [],

            DetailCreateOpen: false,
            SoldOutStockDataOpen: false,

            selectedCustomerIDs: [],
            selectedCustomerNames: [],
            selectedStocks: [],
            selectedEmployees: [],
            selectedPorts: [],
            selectedBases: [],
            selectedTypes: [],
            selectedFroms: [],

            selectedItems: [],
            handleConfirm: null,
            isSelectingItems: false,

            showModalResult: false,
            ResultDetailData: {},
            sortBy: 'updated_date',
            currentAction: '',
            searchQuery: '',
            searchType: 'customer_no',
            selectedItemDetail: '',
            startDateTime: '',
            endDateTime: '',
            editDialogOpen: false,
            isSearchFieldVisible: false,
            datePickerMenu: false,
            endDatePickerMenu: false,
            showSavedSearchesDialog: false,
            showColumnSelector: false,
            modalConfirmOpen: false,
            editAllDialog: false,
            dialog: false,
            sortDesc: true,
            selectedEmployee: null,
            currentItem: null,
            employeeNo: null,
            actionType: null,
            savedSearches: [],
            editAllData: {},

            searchTypes: [
                { text: 'รหัสสมาชิก', value: 'customer_no' },
                { text: 'ชื่อเล่น', value: 'customer_name' },
                { text: 'ชื่อหุ้น', value: 'stock_no' },
                { text: 'ที่มาที่ไป', value: 'stock_from' },
                { text: 'ประเภทพอร์ต', value: 'port' },
                { text: 'ประเภทลูกค้า', value: 'customer_type' },
                { text: 'ฐานทุน', value: 'customer_base' },
                { text: 'ทำรายการโดย', value: 'employee_no' },
                { text: 'ข้อมูลวันที่', value: 'updated_date' }
            ],

            visibleColumns: ['select', 'action', 'updated_date', 'customer_no', 'customer_name', 'stock_no', 'created_date', 'price', 'amount', 'money', 'dividend_amount', 'balance_dividend', 'closing_price', 'present_price', 'total', 'present_profit', 'percent', 'total_percent', 'port', 'from_no', 'type_no', 'base_no', 'comment', 'employee_no', 'detail'],

            headers: [
                {
                    text: '',
                    value: 'select',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: '',
                    value: 'action',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ข้อมูลวันที่',
                    value: 'updated_date',
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'รหัสสมาชิก',
                    value: 'customer_no',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ชื่อเล่น',
                    value: 'customer_name',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ชื่อหุ้นที่ติด',
                    value: 'stock_no',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ที่มาที่ไป',
                    value: 'from_no',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'วันที่ซื้อหุ้น',
                    value: 'created_date',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ราคาที่ติด',
                    value: 'price',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'จำนวนที่ติด',
                    value: 'amount',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'จำนวนเงิน',
                    value: 'money',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'จำนวนปันผล',
                    value: 'dividend_amount',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ยอดเงินปันผล',
                    value: 'balance_dividend',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ราคาปิด',
                    value: 'closing_price',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'มูลค่าปัจจุบัน',
                    value: 'present_price',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'มูลค่าปัจจุบัน(รวมยอดเงินปันผล)',
                    value: 'total',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'กำไร/ขาดทุน ปัจจุบัน',
                    value: 'present_profit',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'เปอร์เซ็น กำไร/ขาดทุน ปัจจุบัน',
                    value: 'total_percent',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ประเภทพอร์ต',
                    value: 'port',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ทำรายการโดย',
                    value: 'employee_no',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ความเห็นลูกค้า',
                    value: 'comment',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ประเภทลูกค้า',
                    value: 'type_no',
                    sortable: false,
                    align: 'center',
                    cellClass: 'text-center',
                },

                {
                    text: 'ฐานทุน',
                    value: 'base_no',
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
        };
    },

    computed: {
        filtered() {
            let filteredDetails = this.details.map(detail => {
                const transactions = detail.transactions || [];
                const type1Transactions = transactions.filter(t => t.type === 1 && t.stock_detail_no === detail.no);

                return {
                    ...detail,
                    type1Transactions: type1Transactions,
                };
            });

            this.savedSearches.forEach(search => {
                filteredDetails = filteredDetails.filter(detail => {
                    return this.applySearchFilter(detail, search);
                });
            });

            return filteredDetails;
        },

        filteredHeaders() {
            return this.headers.filter(header => this.visibleColumns.includes(header.value));
        },
    },

    methods: {
        toggleSelectItems() {
            this.isSelectingItems = !this.isSelectingItems;
        },

        getCurrentItem(id) {
            return this.stocks.find(item => item.no === id);
        },

        async deleteSelectedItems() {
            this.handleConfirm = async () => {
                const selectedIds = this.selectedItems;

                for (let i = 0; i < selectedIds.length; i++) {
                    try {
                        await this.$store.dispatch('api/detail/deleteDetail', selectedIds[i]);

                        this.currentItem = this.getCurrentItem(selectedIds[i]);

                        this.recordLog();
                    } catch (error) {
                        console.error(`Error deleting item with id ${selectedIds[i]}:`, error);
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

        toggleOpen(item) {
            item.isOpen = !item.isOpen;
        },

        openEditAllDialog(employee) {
            this.editAllData = employee;
            this.editAllDialog = true;
        },

        showEditDialog(item) {
            this.selectedEmployee = item;
            this.editDialogOpen = true;
        },

        getSearchItems(type) {
            if (type === 'stock_no') {
                return this.details
                    .filter(detail => detail.amount > 0 && this.getStockByNo(detail.stock_no)?.stock)
                    .map(detail => this.getStockByNo(detail.stock_no).stock);
            } else if (type === 'customer_name') {
                return this.details
                    .filter(detail => detail.amount > 0 && this.getCustomerByNo(detail.customer_no)?.nickname)
                    .map(detail => this.getCustomerByNo(detail.customer_no).nickname);
            } else if (type === 'customer_no') {
                return this.details
                    .filter(detail => detail.amount > 0 && this.getCustomerByNo(detail.customer_no)?.id)
                    .map(detail => this.getCustomerByNo(detail.customer_no).id);
            } else if (type === 'employee_no') {
                return this.details
                    .filter(detail => detail.amount > 0 && this.getEmployeeByNo(detail.employee_no)?.fname + ' ' + this.getEmployeeByNo(detail.employee_no)?.lname)
                    .map(detail => this.getEmployeeByNo(detail.employee_no)?.fname + ' ' + this.getEmployeeByNo(detail.employee_no)?.lname);
            } else if (type === 'port') {
                return this.details
                    .filter(detail => detail.amount > 0 && this.getPortText(detail.total_percent).text)
                    .map(detail => this.getPortText(detail.total_percent).text);
            } else if (type === 'customer_base') {
                return this.details
                    .filter(detail => detail.amount > 0 && this.getBaseByNo(this.getCustomerByNo(detail.customer_no)?.base_no)?.base)
                    .map(detail => this.getBaseByNo(this.getCustomerByNo(detail.customer_no)?.base_no)?.base || 'ยังไม่ระบุ');
            } else if (type === 'customer_type') {
                return this.details
                    .filter(detail => detail.amount > 0 && this.getTypeByNo(this.getCustomerByNo(detail.customer_no)?.type_no)?.type)
                    .map(detail => this.getTypeByNo(this.getCustomerByNo(detail.customer_no)?.type_no)?.type || 'ยังไม่ระบุ');
            } else if (type === 'stock_from') {
                return this.details
                    .filter(detail => detail.amount > 0 && this.getFromByNo(detail.from_no)?.from)
                    .map(detail => this.getFromByNo(detail.from_no)?.from || 'ยังไม่ระบุ');
            }
            return [];
        },

        showConfirmDialog(action, item) {
            this.currentAction = action;
            this.currentItem = item;
            this.modalConfirmOpen = true;
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
                        this.$router.push('/app/data/detail');
                    } else if (RankID === '2') {
                        this.$router.push('/app/data/detail');
                    } else if (RankID === '3') {
                        this.$router.push('/app/data/detail');
                    } else {
                        this.$router.push('/auth');
                    }
                }
            } else {
                this.$router.push('/');
            }
        },

        async fetchEmployeeData() {
            this.employees = await this.$store.dispatch('api/employee/getEmployee');
        },

        getEmployeeByNo(empNo) {
            return this.employees.find(employee => employee.no === empNo);
        },

        async fetchBaseData() {
            this.bases = await this.$store.dispatch('api/base/getBase');
        },

        getBaseByNo(baseNo) {
            return this.bases.find(base => base.no === baseNo);
        },

        async fetchTypeData() {
            this.types = await this.$store.dispatch('api/type/getType');
        },

        getTypeByNo(typeNo) {
            return this.types.find(type => type.no === typeNo);
        },

        async fetchDetailData() {
            try {
                await this.fetchStockData();
                this.details = await this.$store.dispatch('api/detail/getDetail');

                if (Array.isArray(this.details) && this.details.length > 0) {
                    for (const detail of this.details) {
                        detail.isOpen = false;
                        if (detail.stock_no) {
                            let closingPriceData = null;

                            const prices = await this.$store.dispatch('api/price/getPrice', {
                                stock_no: detail.stock_no
                            });

                            const priceData = prices.filter(p => p.stock_no === detail.stock_no);

                            const latestPriceData = priceData.reduce((latest, current) => {
                                return moment(current.created_date).isAfter(moment(latest.created_date)) ? current : latest;
                            }, priceData[0]);

                            closingPriceData = latestPriceData ? latestPriceData.price : null;

                            let detail_total_Dividend = new Decimal(0);
                            let balance_dividend = 0;
                            let transaction_total_Dividend = 0;
                            let present_price = 0;
                            let total = 0;
                            let transactionTotalSum = 0;
                            let transactionDividendTotalSum = 0;
                            let transactionAmountSum = 0;
                            let transactionnumberOfDividends = 0;
                            const detailamount = detail.amount;

                            if (detail.created_date) {
                                const dividendData = await this.$store.dispatch('api/dividend/getDividend', {
                                    stock_no: detail.stock_no,
                                    created_date: detail.created_date
                                });

                                const filteredDividendData = dividendData.filter(dividend => {
                                    const dividendDate = moment(dividend.created_date);
                                    return dividend.stock_no === detail.stock_no && dividendDate.isSameOrAfter(moment(detail.created_date));
                                });

                                detail_total_Dividend = filteredDividendData.reduce((sum, dividend) =>
                                    sum.plus(new Decimal(dividend.dividend || 0)), new Decimal(0)
                                );
                                balance_dividend = detail.amount * detail_total_Dividend.toNumber();
                            }

                            const transactions = await this.$store.dispatch('api/transaction/getTransaction', { stock_detail_no: detail.no });

                            const type1Transactions = transactions.filter(t => t.type === 1 && t.stock_detail_no === detail.no);
                            const type2Transactions = transactions.filter(t => t.type === 2 && t.stock_detail_no === detail.no);

                            detail.transactions = type1Transactions;
                            let remainingAmount = 0;

                            const sortedType1Transactions = type1Transactions.sort((a, b) => moment(b.created_date).diff(moment(a.created_date)));

                            for (const type1 of sortedType1Transactions) {
                                let remainingAmount = type1.amount;

                                for (const type2 of type2Transactions) {
                                    if (moment(type2.created_date).isAfter(moment(type1.created_date)) && type2.amount > 0) {
                                        if (type2.amount >= remainingAmount) {
                                            type2.amount -= remainingAmount;
                                            remainingAmount = 0;
                                            break;
                                        } else {
                                            remainingAmount -= type2.amount;
                                            type2.amount = 0;
                                        }
                                    }
                                }

                                type1.amount = remainingAmount;
                            }

                            detail.transactions = type1Transactions.filter(type1 => type1.amount > 0);
                            const remainingType2Amount = type2Transactions.reduce((sum, type2) => sum + type2.amount, 0);

                            if (remainingType2Amount > 0) {
                                detail.amount -= remainingType2Amount;
                            }

                            for (const transaction of [...sortedType1Transactions]) {
                                if (transaction.amount > 0) {
                                    const commissionData = await this.$store.dispatch('api/commission/getCommission', { no: transaction.commission_id });
                                    const commission = commissionData.length > 0 ? commissionData[0] : null;
                                    let transactiontotalDividend = new Decimal(0);

                                    if (commission && transaction.created_date) {
                                        const dividendData = await this.$store.dispatch('api/dividend/getDividend', {
                                            stock_no: detail.stock_no,
                                            created_date: transaction.created_date
                                        });

                                        const filteredDividendData = dividendData.filter(dividend => {
                                            const dividendDate = moment(dividend.created_date);
                                            return dividend.stock_no === detail.stock_no && dividendDate.isSameOrAfter(moment(transaction.created_date));
                                        });

                                        transactiontotalDividend = filteredDividendData.reduce((sum, dividend) =>
                                            sum.plus(new Decimal(dividend.dividend || 0)), new Decimal(0)
                                        );
                                        transactionnumberOfDividends = filteredDividendData.length;
                                        transaction.dividend_amount = transactiontotalDividend.toNumber();

                                        const transactionmoney = transaction.price * transaction.amount;
                                        const transactioncomfee = transactionmoney * commission.commission;
                                        const transactionvat = transactioncomfee * 0.07;
                                        const transactiontotal = transactionmoney + transactioncomfee + transactionvat;
                                        const transactionamount = transaction.amount;

                                        const transactionbalancedividend = transaction.amount * transactiontotalDividend.toNumber();
                                        const transactionpresentprice = transaction.amount * closingPriceData;
                                        const transactionresult = transactionbalancedividend + transactionpresentprice;

                                        transaction.money = transactiontotal.toLocaleString(2);
                                        transaction.balance_dividend = transactionbalancedividend.toLocaleString(2);
                                        transaction.present_price = transactionpresentprice.toLocaleString(2);
                                        transaction.total = transactionresult.toLocaleString(2);
                                        transaction.present_profit = (transactionresult - transactiontotal).toLocaleString(2);
                                        transaction.total_percent = (((transactionresult - transactiontotal) / transactiontotal) * 100).toLocaleString(2);

                                        transactionTotalSum += transactiontotal;
                                        transactionAmountSum += transactionamount;
                                        transactionDividendTotalSum += transactionbalancedividend;
                                        transaction_total_Dividend += transactiontotalDividend.toNumber();
                                    } else {
                                        console.warn(`No commission found for commission_id: ${transaction.commission_id}`);
                                    }
                                }
                            }

                            const detailprice = detail.price;
                            const detailmoney = detailamount * detailprice;
                            const detailpresent_price = detailamount * closingPriceData;
                            const detailtotal = detailpresent_price + balance_dividend;

                            detail.detailupdated_date = detail.updated_date;
                            detail.detailamount = detailamount;
                            detail.detailprice = detailprice;
                            detail.detaildividend_amount = detail_total_Dividend.toNumber();
                            detail.detailmoney = detailmoney.toLocaleString(2);
                            detail.detailpresent_price = detailpresent_price.toLocaleString(2);
                            detail.detailtotal = detailtotal.toLocaleString(2);
                            detail.detailbalance_dividend = balance_dividend.toLocaleString(2);
                            detail.detailpresent_profit = (detailtotal - detailmoney).toLocaleString(2);
                            detail.detailtotal_percent = (((detailtotal - detailmoney) / detailmoney) * 100).toLocaleString(2);
                            detail.detailemployee_no = detail.employee_no;

                            const lasted_updated_date = transactions
                                .filter(transaction => transaction.stock_detail_no === detail.no)
                                .map(transaction => transaction.updated_date);

                            const latest_updated_date = lasted_updated_date.length > 0
                                ? moment.max(lasted_updated_date.map(date => moment(date)))
                                : moment(detail.updated_date);

                            const lasted_employee_no = lasted_updated_date.length > 0
                                ? transactions
                                    .filter(transaction => transaction.stock_detail_no === detail.no)
                                    .map(transaction => transaction.employee_no)
                                    .pop()
                                : detail.employee_no;

                            const money = (detail.price * detail.amount) + transactionTotalSum;
                            const amount = detail.amount + transactionAmountSum;
                            const price = money / amount;
                            const balance = balance_dividend + transactionDividendTotalSum;
                            present_price = amount * closingPriceData;
                            total = present_price + balance;

                            detail.updated_date = latest_updated_date;
                            detail.price = price;
                            detail.amount = amount;
                            detail.money = money.toLocaleString(2);
                            detail.totalprice = price;
                            detail.dividend_amount = ((detail_total_Dividend.toNumber() + transaction_total_Dividend) / (1 + transactionnumberOfDividends)).toLocaleString(2);
                            detail.balance_dividend = balance.toLocaleString(2);
                            detail.closing_price = closingPriceData;
                            detail.present_price = present_price.toLocaleString(2);
                            detail.total = total.toLocaleString(2);
                            detail.present_profit = (total - money).toLocaleString(2);
                            detail.total_percent = (((total - money) / money) * 100).toLocaleString(2);
                            detail.employee_no = lasted_employee_no;
                            detail.type1Transactions = type1Transactions;

                            const dividendmoney = money - (transactionDividendTotalSum + balance_dividend);
                            const dividendprice = dividendmoney / amount;

                            detail.dividendprice = dividendprice;
                            detail.dividendmoney = dividendmoney.toLocaleString(2);
                        }
                    }

                    this.details = this.details.filter(detail => detail.amount !== 0);
                } else {
                    console.error("ข้อมูล details ไม่มีข้อมูลหรือไม่ใช่อาร์เรย์");
                }
            } catch (warning) {
                console.error("Error fetching data:", warning);
                this.modal.warning.message = 'ไม่สามารถดึงข้อมูลได้';
                this.modal.warning.open = true;
            }
        },

        getDetailsByNo(detailNo) {
            return this.details.find(detail => detail.no === detailNo);
        },

        async fetchCustomerData() {
            this.customers = await this.$store.dispatch('api/customer/getCustomer');
        },

        getCustomerByNo(custNo) {
            return this.customers.find(customer => customer.no === custNo);
        },

        async fetchStockData() {
            this.stocks = await this.$store.dispatch('api/stock/getStock');
        },

        getStockByNo(stockNo) {
            return this.stocks.find(stock => stock.no === stockNo);
        },

        async fetchFromData() {
            this.froms = await this.$store.dispatch('api/from/getFrom');
        },

        getFromByNo(fromNo) {
            return this.froms.find(from => from.no === fromNo);
        },

        getFromText(from) {
            if (from === 'หุ้นเก่า') {
                return { text: 'หุ้นเก่า', color: '#ffc800' };
            } else if (from === 'หุ้นใหม่') {
                return { text: 'หุ้นใหม่', color: '#38b6ff' };
            } else if (from === 'หุ้นแก้เกม') {
                return { text: 'หุ้นแก้เกม', color: '#ff914d' };
            } else {
                return { text: '', color: 'inherit' };
            }
        },

        getPortText(total_percent) {
            let port, color;
            if (total_percent >= 0) {
                port = 'กำไร';
                color = '#c1ff72';
            } else if (total_percent >= -10 && total_percent < 0) {
                port = 'แก้เกมได้';
                color = '#85d7df';
            } else if (total_percent >= -19.99 && total_percent <= -10.01) {
                port = 'ระวัง';
                color = '#ffde59';
            } else {
                port = 'ถือ';
                color = '#ff5757';
            }
            return { text: port, color: color };
        },

        getColorForNumber(value) {
            const numericValue = parseFloat(value);
            if (numericValue < 0) {
                return '#e50211';
            } else if (numericValue >= 0) {
                return '#24b224';
            } else {
                return 'inherit';
            }
        },

        getColorForPercent(value) {
            const numericValue = parseFloat(value);
            if (numericValue >= 0) {
                return '#24b224';
            } else if (numericValue >= -10 && value < 0) {
                return '#38b6ff';
            } else if (numericValue >= -19.99 && value <= -10.01) {
                return '#ffc800';
            } else {
                return '#e50211';
            }
        },

        formatDateTime(date) {
            if (moment(date).isValid()) {
                return moment(date).format('YYYY-MM-DD HH:mm');
            }
            return 'ยังไม่ระบุวัน';
        },

        formatDate(date) {
            if (moment(date).isValid()) {
                return moment(date).format('YYYY-MM-DD');
            }
            return 'ยังไม่ระบุวัน';
        },

        getDateColor(date) {
            if (moment(date).isValid()) {
                return '#ffcc64';
            }
            return '#f5464c';
        },

        openDetail(item) {
            this.selectedItemDetail = item.detail;
            this.dialog = true;
        },

        onSearchTypeChange() {
            this.isSearchFieldVisible = this.searchType !== 'updated_date' && this.searchType !== 'port';
        },

        validateDateRange() {
            const start = moment(this.startDateTime);
            const end = moment(this.endDateTime);

            if (start.isValid() && end.isValid() && start.isAfter(end)) {
                this.modal.warning.open = true;
                return false;
            }
            return true;
        },

        addSearch() {
            if (!this.validateDateRange()) {
                return;
            }

            if (this.searchType === 'customer_no' || this.searchType === 'customer_name' || this.searchType === 'stock_no' || this.searchType === 'stock_from'
                || this.searchType === 'employee_no' || this.searchType === 'port' || this.searchType === 'customer_base' || this.searchType === 'customer_type') {
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
                this.searchType === 'customer_no' ? this.selectedCustomerIDs :
                    this.searchType === 'customer_name' ? this.selectedCustomerNames :
                        this.searchType === 'stock_no' ? this.selectedStocks :
                            this.searchType === 'stock_from' ? this.selectedFroms :
                                this.searchType === 'employee_no' ? this.selectedEmployees :
                                    this.searchType === 'port' ? this.selectedPorts :
                                        this.searchType === 'customer_base' ? this.selectedBases :
                                            this.searchType === 'customer_type' ? this.selectedTypes : [];

            if (selectedItems.length > 0) {
                this.savedSearches.push({
                    query: selectedItems,
                    type: this.searchType,
                    start: this.startDateTime,
                    end: this.endDateTime
                });

                if (this.searchType === 'customer_no') {
                    this.selectedCustomerIDs = [];
                } else if (this.searchType === 'customer_name') {
                    this.selectedCustomerNames = [];
                } else if (this.searchType === 'stock_no') {
                    this.selectedStocks = [];
                } else if (this.searchType === 'stock_from') {
                    this.selectedFroms = [];
                } else if (this.searchType === 'employee_no') {
                    this.selectedEmployees = [];
                } else if (this.searchType === 'port') {
                    this.selectedPorts = [];
                } else if (this.searchType === 'customer_base') {
                    this.selectedBases = [];
                } else if (this.searchType === 'customer_type') {
                    this.selectedTypes = [];
                }

                this.startDateTime = '';
                this.endDateTime = '';
            }
        },

        applySearchFilter(detail, search) {
            let queryMatched = true;

            let field;
            if (search.type === 'customer_no') {
                field = this.getCustomerByNo(detail.customer_no).id;
            } else if (search.type === 'customer_name') {
                field = this.getCustomerByNo(detail.customer_no).nickname || 'ยังไม่ระบุ';
            } else if (search.type === 'stock_no') {
                field = this.getStockByNo(detail.stock_no).stock || 'ยังไม่ระบุ';
            } else if (search.type === 'employee_no') {
                field = this.getEmployeeByNo(detail.employee_no)?.fname + ' ' + this.getEmployeeByNo(detail.employee_no)?.lname || 'ยังไม่ระบุ';
            } else if (search.type === 'port') {
                field = this.getPortText(detail.total_percent).text || 'ยังไม่ระบุ';
            } else if (search.type === 'customer_base') {
                field = this.getBaseByNo(this.getCustomerByNo(detail.customer_no)?.base_no)?.base || 'ยังไม่ระบุ';
            } else if (search.type === 'customer_type') {
                field = this.getTypeByNo(this.getCustomerByNo(detail.customer_no)?.type_no)?.type || 'ยังไม่ระบุ';
            } else if (search.type === 'stock_from') {
                field = this.getFromByNo(detail.from_no)?.from || 'ยังไม่ระบุ';
            } else {
                field = detail[search.type];
            }

            if (search.type === 'customer_no' || search.type === 'customer_name' || search.type === 'stock_no' || search.type === 'stock_from'
                || search.type === 'employee_no' || search.type === 'port' || search.type === 'customer_base' || search.type === 'customer_type') {
                queryMatched = search.query.some(query => {
                    const lowerCaseField = typeof field === 'string' ? field.toLowerCase() : '';
                    return lowerCaseField === query.toLowerCase();
                });
            } else if (search.type === 'updated_date') {
                return this.checkTimeRange(detail, search);
            } else {
                const searchQuery = search.query.toLowerCase();
                queryMatched = typeof field === 'string' && field.toLowerCase() === searchQuery;
            }

            return queryMatched;
        },


        checkTimeRange(detail, search) {
            const detailTime = moment(detail.updated_date);
            const startTime = moment(search.start);
            const endTime = moment(search.end);
            return (!startTime.isValid() || detailTime.isSameOrAfter(startTime)) &&
                (!endTime.isValid() || detailTime.isSameOrBefore(endTime));
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
            const worksheet = workbook.addWorksheet('Sheet1');

            const headers = this.filteredHeaders
                .filter(header => header.value !== 'detail' && header.value !== 'action' && header.value !== 'select')
                .map(header => ({
                    header: header.text,
                    key: header.value,
                    style: { font: { name: 'Angsana New', size: 16 } }
                }));

            worksheet.columns = headers;

            this.filtered.forEach((item, index) => {
                const rowData = {};
                this.filteredHeaders.forEach(header => {
                    if (header.value === 'updated_date') {
                        rowData[header.value] = moment(item[header.value]).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm');
                    } else if (header.value === 'created_date') {
                        rowData[header.value] = moment(item[header.value]).tz('Asia/Bangkok').format('YYYY-MM-DD');
                    } else if (header.value === 'price') {
                        rowData[header.value] = item.price.toLocaleString(2);
                    } else if (header.value === 'amount') {
                        rowData[header.value] = item.amount.toLocaleString(2);
                    } else if (header.value === 'money') {
                        rowData[header.value] = item.money;
                    } else if (header.value === 'total_percent') {
                        rowData[header.value] = item.total_percent + '%';
                    } else if (header.value === 'present_profit') {
                        rowData[header.value] = item.present_profit;
                    } else if (header.value === 'total') {
                        rowData[header.value] = item.total;
                    } else if (header.value === 'dividend_amount') {
                        rowData[header.value] = item.dividend_amount;
                    } else if (header.value === 'present_price') {
                        rowData[header.value] = item.present_price;
                    } else if (header.value === 'balance_dividend') {
                        rowData[header.value] = item.balance_dividend;
                    } else if (header.value === 'from_no') {
                        rowData[header.value] = this.getFromByNo(item.from_no).from;
                    } else if (header.value === 'stock_no') {
                        rowData[header.value] = this.getStockByNo(item.stock_no).stock;
                    } else if (header.value === 'customer_no') {
                        rowData[header.value] = this.getCustomerByNo(item.customer_no).id;
                    } else if (header.value === 'customer_name') {
                        rowData[header.value] = this.getCustomerByNo(item.customer_no).nickname;
                    } else if (header.value === 'port') {
                        rowData[header.value] = this.getPortText(item.total_percent).text;
                    } else if (header.value === 'employee_no') {
                        rowData[header.value] = this.getEmployeeByNo(item.employee_no).fname + ' ' + this.getEmployeeByNo(item.employee_no).lname;
                    } else if (header.value !== 'detail' && header.value !== 'action' && header.value !== 'select') {
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
                link.setAttribute('download', `ข้อมูลหุ้นของลูกค้า-${currentDate}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        },

        goBack() {
            window.location.reload();
        },

        recordLog() {
            const stock = this.getStockByNo(this.currentItem.stock_no);
            const from = this.getFromByNo(this.currentItem.from_no);
            const customer = this.getCustomerByNo(this.currentItem.customer_no)
            const log = {
                customer_no: `${customer ? customer.id : 'ไม่พบรหัสลูกค้า'}`,
                emp_name: this.$auth.user.fname + ' ' + this.$auth.user.lname,
                emp_email: this.$auth.user.email,
                detail: this.currentAction === 'delete'
                    ? `ชื่อหุ้น : ${stock ? stock.name : 'ไม่พบชื่อหุ้น'}\nที่มาที่ไป : ${from ? from.from : 'ไม่พบที่มาที่ไป'}\nราคาที่ติด : ${this.currentItem.price}\nจำนวนที่ติด : ${this.currentItem.amount}`
                    : `ชื่อหุ้น : ${stock ? stock.name : 'ไม่พบชื่อหุ้น'}\nที่มาที่ไป : ${from ? from.from : 'ไม่พบที่มาที่ไป'}\nราคาที่ติด : ${this.currentItem.price}\nจำนวนที่ติด : ${this.currentItem.amount}`,
                type: 1,
                picture: this.$auth.user.picture || 'Unknown',
                action: this.currentAction === 'delete'
                    ? 'ลบข้อมูลหุ้นของลูกค้า'
                    : 'ไม่ลบข้อมูลหุ้นของลูกค้า',
                time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };
            this.$store.dispatch('api/log/addLogs', log);
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

.tab-icon-two {
    cursor: pointer;
    margin-right: 24px;
    margin-left: 0px;
}

.tab-icon-three {
    cursor: pointer;
    margin-right: 8px;
    margin-left: 0px;
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
    padding: 0 0;
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
    flex: 1 0 20%;
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

.icon-tab {
    font-size: 120% !important;
}

.custom-list-item {
    padding: 0.1px 8px;
}

.custom-list {
    padding: 0.4px 2px;
}

.custom-card {
    max-width: 1200px;
    width: 100%;
    margin: auto;
}
</style>