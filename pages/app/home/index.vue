<template>
  <div>
    <div>
      <EmployeeNew v-model="EmployeeDataOpen" />
      <FollowDetail :open="DetailDataOpen" :data="DetailData" @update:edit="DetailDataOpen = false" />
      <DividendWidget :stockNo="selectedStockNo" v-model="DividendDataOpen" />
      <PriceWidget :stockNo="selectedStockNo" v-model="PriceDataOpen" />
    </div>
    <v-container class="fill-height" fluid justify="center" align="center">
      <v-row justify="space-evenly">
        <v-col cols="12" sm="6" md="4" lg="6">
          <v-card>
            <v-card-title class="d-flex align-center justify-center">ราคาปิด</v-card-title>
            <v-card-text>
              <v-simple-table>
                <thead>
                  <tr>
                    <th class="text-center">เวลา</th>
                    <th class="text-center">ชื่อหุ้น</th>
                    <th class="text-center">ราคาปิด</th>
                    <th class="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in randomPrice.slice(0, 3)" :key="index">
                    <td class="text-center">{{ formatDateTime(item.created_date) }}</td>
                    <td class="text-center">{{ getStockName(item.stock_no) }}</td>
                    <td class="text-center">{{ item.price.toLocaleString(2) }}</td>
                    <td class="text-center">
                      <v-icon color="#85d7df" @click="OpenPriceData(item.stock_no)">mdi-eye</v-icon>
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4" lg="6">
          <v-card>
            <v-card-title class="d-flex align-center justify-center">เงินปันผล</v-card-title>
            <v-card-text>
              <v-simple-table>
                <thead>
                  <tr>
                    <th class="text-center">วันที่จ่ายปันผล</th>
                    <th class="text-center">ชื่อหุ้น</th>
                    <th class="text-center">จำนวน</th>
                    <th class="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in randomDividend.slice(0, 3)" :key="index">
                    <td class="text-center">{{ formatDate(item.created_date) }}</td>
                    <td class="text-center">{{ getStockName(item.stock_no) }}</td>
                    <td class="text-center">{{ item.dividend.toLocaleString(2) }}</td>
                    <td class="text-center">
                      <v-icon color="#85d7df" @click="OpenDividendData(item.stock_no)">mdi-eye</v-icon>
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4" lg="6">
          <v-card>
            <v-card-title class="d-flex align-center justify-center">คำร้องขอสมัครสมาชิก</v-card-title>
            <v-card-text>
              <v-simple-table>
                <thead>
                  <tr>
                    <th class="text-center">เวลา</th>
                    <th class="text-center">อีเมล</th>
                    <th class="text-center">ชื่อ</th>
                    <th class="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="randomEmployee.length > 0">
                    <tr v-for="(item, index) in randomEmployee.slice(0, 3)" :key="index">
                      <td class="text-center">{{ formatDateTime(item.created_date) }}</td>
                      <td class="text-center">{{ item.email }}</td>
                      <td class="text-center">{{ item.fname + ' ' + item.lname }}</td>
                      <td class="text-center">
                        <v-icon left color="#24b224" @click="EmployeeDataOpen = true">mdi-home-plus</v-icon>
                      </td>
                    </tr>
                  </template>
                  <template v-else>
                    <tr>
                      <td colspan="4" class="text-center">ไม่มีคำร้องขอสมัครสมาชิกในขณะนี้</td>
                    </tr>
                  </template>
                </tbody>
              </v-simple-table>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4" lg="6">
          <v-card>
            <v-card-title class="d-flex align-center justify-center">หุ้นที่ถึงเป้าแล้ว</v-card-title>
            <v-card-text>
              <v-simple-table>
                <thead>
                  <tr>
                    <th class="text-center">เวลาที่ถึงเป้า</th>
                    <th class="text-center">ชื่อหุ้น</th>
                    <th class="text-center">สิ่งที่ถึงเป้า</th>
                    <th class="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="randomFollow.length > 0">
                    <tr v-for="(item, index) in randomFollow.slice(0, 3)" :key="index">
                      <td class="text-center">{{ formatDateTime(item.updated_date) }}</td>
                      <td class="text-center">{{ getStockName(item.stock_no) }}</td>
                      <td class="text-center">{{ getReachText(item.reach) }}</td>
                      <td class="text-center">
                        <v-icon @click="openDetailData(item)" color="#85d7df">mdi-eye</v-icon>
                      </td>
                    </tr>
                  </template>
                  <template v-else>
                    <tr>
                      <td colspan="3" class="text-center">ไม่มีหุ้นที่ถึงเป้าในขณะนี้</td>
                    </tr>
                  </template>
                </tbody>
              </v-simple-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

  </div>
</template>

<script>
import moment from 'moment-timezone';
import 'moment/locale/th'

export default {

  layout: 'user',
  middleware: 'auth',

  async mounted() {
    await this.checkRank();
    await this.fetchEmployeeData();
    await this.fetchPriceData();
    await this.fetchDividendData();
    await this.fetchStockData();
    await this.fetchFollowData();

    this.updateRandomData();

    setInterval(() => {
      this.updateRandomData();
    }, 3000);
  },

  data() {
    return {
      selectedStockNo: null,
      DividendDataOpen: false,
      PriceDataOpen: false,

      EmployeeDataOpen: false,
      DetailDataOpen: false,
      DetailData: {},

      prices: [],
      dividends: [],
      employees: [],
      stocks: [],
      follows: [],

      randomPrice: [],
      randomDividend: [],
      randomFollow: [],
      randomEmployee: [],
    };
  },

  methods: {
    updateRandomData() {
      if (this.prices.length > 0) {
        const randomPriceIndexes = [];
        while (randomPriceIndexes.length < 3 && randomPriceIndexes.length < this.prices.length) {
          const randomPriceIndex = Math.floor(Math.random() * this.prices.length);
          if (!randomPriceIndexes.includes(randomPriceIndex)) {
            randomPriceIndexes.push(randomPriceIndex);
          }
        }

        this.randomPrice = randomPriceIndexes.map(index => this.prices[index]);
      }

      if (this.dividends.length > 0) {
        const randomDividendIndexes = [];
        while (randomDividendIndexes.length < 3 && randomDividendIndexes.length < this.dividends.length) {
          const randomDividendIndex = Math.floor(Math.random() * this.dividends.length);
          if (!randomDividendIndexes.includes(randomDividendIndex)) {
            randomDividendIndexes.push(randomDividendIndex);
          }
        }

        this.randomDividend = randomDividendIndexes.map(index => this.dividends[index]);
      }


      if (this.follows.length > 0) {
        const randomFollowIndexes = [];
        while (randomFollowIndexes.length < 3 && randomFollowIndexes.length < this.follows.length) {
          const randomFollowIndex = Math.floor(Math.random() * this.follows.length);
          if (!randomFollowIndexes.includes(randomFollowIndex)) {
            randomFollowIndexes.push(randomFollowIndex);
          }
        }

        this.randomFollow = randomFollowIndexes.map(index => this.follows[index]);
      } else {
        this.randomFollow = [];
      }

      if (this.employees.length > 0) {
        const randomEmployeeIndexes = [];
        while (randomEmployeeIndexes.length < 3 && randomEmployeeIndexes.length < this.employees.length) {
          const randomEmployeeIndex = Math.floor(Math.random() * this.employees.length);
          if (!randomEmployeeIndexes.includes(randomEmployeeIndex)) {
            randomEmployeeIndexes.push(randomEmployeeIndex);
          }
        }

        this.randomEmployee = randomEmployeeIndexes.map(index => this.employees[index]);
      } else {
        this.randomEmployee = [];
      }

    },

    openDetailData(item) {
      this.DetailData = item;
      this.DetailDataOpen = true;
    },

    OpenDividendData(stockNo) {
      this.selectedStockNo = stockNo;
      this.DividendDataOpen = true;
    },

    OpenPriceData(stockNo) {
      this.selectedStockNo = stockNo;
      this.PriceDataOpen = true;
    },

    async fetchEmployeeData() {
      this.employees = await this.$store.dispatch('api/employee/getEmployeeByStatus', '2');
    },

    async fetchFollowData() {
      this.follows = await this.$store.dispatch('api/follow/getFollowByResult', '2');
    },

    async fetchPriceData() {
      try {
        const allPrices = await this.$store.dispatch('api/price/getPrice');

        const latestPrices = allPrices.reduce((acc, current) => {
          const existing = acc.find(item => item.stock_no === current.stock_no);

          if (!existing) {
            acc.push(current);
          } else {
            if (new Date(current.created_date) > new Date(existing.created_date)) {
              const index = acc.indexOf(existing);
              acc[index] = current;
            }
          }

          return acc;
        }, []);

        this.prices = latestPrices;

      } catch (error) {
        console.error('Error fetching price data:', error);
      }
    },

    async fetchDividendData() {
      try {
        const allDividends = await this.$store.dispatch('api/dividend/getDividend');

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const recentDividends = allDividends.filter(dividend => {
          const dividendDate = new Date(dividend.created_date);
          return dividendDate >= oneYearAgo;
        });

        this.dividends = recentDividends;

      } catch (error) {
        console.error('Error fetching dividend data:', error);
      }
    },

    async fetchStockData() {
      this.stocks = await this.$store.dispatch('api/stock/getStock');
    },

    getStockName(stockId) {
      const stock = this.stocks.find(s => s.no === stockId);
      return stock ? stock.stock : '';
    },

    getReachText(reach) {
      if (reach === 1) {
        return 'Low Price';
      } else if (reach === 2) {
        return 'Up Price';
      } else {
        return '-';
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
            this.$router.push('/app/home');
          } else if (RankID === '2') {
            this.$router.push('/app/home');
          } else if (RankID === '3') {
            this.$router.push('/app/home');
          } else {
            this.$router.push('/auth');
          }
        }
      } else {
        this.$router.push('/auth');
      }
    },

  }
}

</script>

<style scoped>
@keyframes shake {
  0% {
    transform: rotate(0deg);
  }

  25% {
    transform: rotate(-10deg);
  }

  50% {
    transform: rotate(10deg);
  }

  75% {
    transform: rotate(-10deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

.small-bell-icon {
  font-size: 1.2rem;
  vertical-align: middle;
  color: #ffc800;
  animation: shake 0.8s ease infinite;
}
</style>
