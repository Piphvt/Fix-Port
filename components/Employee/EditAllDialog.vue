<template>

  <div>
    <ModalConfirm :open="modal.confirm.open" :message="modal.confirm.message" :confirm.sync="modal.confirm.open"
      :method="handleConfirmMethod" />
    <ModalComplete :open="modal.complete.open" :message="modal.complete.message" :complete.sync="modal.complete.open"
      :method="goBack" />
    <ModalWarning :open="modal.warning.open" :message="modal.warning.message" :warning.sync="modal.warning.open" />

    <v-dialog persistent :retain-focus="false" v-model="open" v-if="data" max-width="400" max-height="300"
      content-class="rounded-xl">
      <v-card class="rounded-xl">
        <v-card-title class="card-title-center mb-3">แก้ไขรายละเอียดสมาชิก</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row>
              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                <v-text-field v-model="formData.fname"
                  :rules="[(v) => !!v || 'โปรดกรอกชื่อเล่น', (v) => /^[\u0E00-\u0E7F]+$/.test(v) || 'ชื่อเล่นต้องเป็นภาษาไทยเท่านั้น']"
                  label="ชื่อเล่น" dense outlined required />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-text-field v-model="formData.lname"
                  :rules="[(v) => !!v || 'โปรดกรอกชื่อ', (v) => /^[\u0E00-\u0E7F]+$/.test(v) || 'ชื่อต้องเป็นภาษาไทยเท่านั้น']"
                  label="ชื่อ" dense outlined required />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                <v-text-field v-model="formData.email"
                  :rules="[(v) => !!v || 'โปรดกรอกอีเมล', (v) => /.+@.+\..+/.test(v) || 'โปรดกรอกอีเมลที่ถูกต้อง']"
                  label="อีเมล" dense outlined required />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-text-field v-model="formData.phone"
                  :rules="[(v) => !!v || 'โปรดกรอกเบอร์โทรศัพท์', (v) => (v && v.length === 10) || 'เบอร์โทรศัพท์ต้องมี 10 หลัก', (v) => /^0/.test(v) || 'เบอร์โทรศัพท์ต้องมี 10 หลัก']"
                  label="เบอร์โทรศัพท์" dense outlined required />
              </v-col>

              <v-col cols="6" sm="5" class="pa-0 mr-8 ml-4">
                <v-select v-model="formData.rank_no" :items="rankOptions" :item-text="item => item.text"
                  :item-value="item => item.value" :rules="[(v) => !!v || 'โปรดเลือกตำแหน่ง']" label="ตำแหน่ง" dense
                  outlined required>
                  <template v-slot:item="data">
                    <v-icon left>
                      {{ data.item.icon }}
                    </v-icon>
                    {{ data.item.text }}
                  </template>
                </v-select>
              </v-col>

              <v-col cols="6" sm="5" class="pa-0">
                <v-select v-model="formData.gender" :items="genderOptions" :item-text="item => item.text"
                  :item-value="item => item.value" :rules="[(v) => !!v || 'โปรดเลือกเพศ']" label="เพศ" dense outlined
                  required>
                  <template v-slot:item="data">
                    <v-icon left>
                      {{ data.item.icon }}
                    </v-icon>
                    {{ data.item.text }}
                  </template>
                </v-select>

              </v-col>
              <v-col cols="5" sm="11" class="pa-0 ml-4">
                <v-select v-model="formData.status" :items="statusOptions" :rules="[(v) => !!v || 'โปรดเลือกสถานะ']"
                  label="สถานะ" dense outlined required>
                  <template v-slot:item="data">
                    <v-icon left :style="{ color: data.item.color }">
                      {{ data.item.icon }}
                    </v-icon>
                    {{ data.item.text }}
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </v-form>
          <v-card-actions class="card-title-center pa-0">
            <v-btn @click="confirm"
              :disabled="!valid || !hasChanges || !formData.fname || !formData.lname || !formData.phone || !formData.email || !formData.rank_no || !formData.status"
              depressed color="#24b224" class="font-weight-medium mr-2">
              บันทึก
            </v-btn>
            <v-btn color="#e50211" @click="cancel" class="font-weight-medium">ยกเลิก
            </v-btn>
          </v-card-actions>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>

</template>

<script>

import moment from 'moment';
moment.locale('th');

export default {

  props: {
    method: { type: Function },
    open: {
      required: true,
    },
    data: {
      required: true,
    },
  },

  data() {
    return {

      modal: {
        confirm: {
          open: false,
          message: 'ยืนยันการแก้ไขข้อมูล?',
        },
        complete: {
          open: false,
          message: 'แก้ไขข้อมูลสำเร็จ',
        },
        warning: {
          open: false,
          message: 'มีผู้ใช้งานอีเมลนี้แล้ว',
        },
      },

      formData: {},
      valid: false,
      genderOptions: [],
      rankOptions: [],
      statusOptions: [],
      originalData: {},

    };
  },

  computed: {
    hasChanges() {
      return JSON.stringify(this.formData) !== JSON.stringify(this.originalData);
    }
  },

  mounted() {
    this.setGenderOptions();
    this.setRankOptions();
    this.setStatusOptions();
    this.formData = JSON.parse(JSON.stringify(this.data));
    this.originalData = JSON.parse(JSON.stringify(this.data));
    document.addEventListener('keydown', this.handleKeydown);
  },

  watch: {
    data: {
      handler(newData) {
        this.formData = JSON.parse(JSON.stringify(newData));
        this.originalData = JSON.parse(JSON.stringify(newData));
      },
      deep: true,
      immediate: true
    }
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    async setRankOptions() {
      try {
        this.ranks = await this.$store.dispatch('api/rank/getRank');

        const rankIcons = {
          'ผู้พัฒนา': 'mdi-account-tie',
          'แอดมิน': 'mdi-account-hard-hat',
          'พนักงานทั่วไป': 'mdi-account'
        };

        const allRanks = this.ranks.map(rank => ({
          value: rank.no,
          text: rank.rank,
          icon: rankIcons[rank.rank] || 'mdi-account'
        }));

        const prioritizedRanks = ['ผู้พัฒนา', 'แอดมิน', 'พนักงานทั่วไป'];
        this.rankOptions = prioritizedRanks.reduce((acc, rankName) => {
          const rank = allRanks.find(r => r.text === rankName);
          if (rank) acc.push(rank);
          return acc;
        }, []).concat(allRanks.filter(r => !prioritizedRanks.includes(r.text)));

        if (this.data && this.data.rank_no) {
          const selectedRank = this.rankOptions.find(r => r.value === this.data.rank_no);
          this.rankOptions = selectedRank
            ? [selectedRank, ...this.rankOptions.filter(r => r.value !== this.data.rank_no)]
            : this.rankOptions;
        }
      } catch (warning) {
      }
    },

    async confirm() {
      const currentRank = this.getRankName(this.$auth.user.rank_no);
      const targetRank = this.getRankName(this.originalData.rank_no);
      const isSelfEdit = this.$auth.user.email === this.formData.email;

      const openWarning = (message) => {
        this.modal.warning.open = true;
        this.modal.warning.message = message;
      };

      if (currentRank === 'ผู้พัฒนา') {
        if (targetRank === 'ผู้พัฒนา' && !isSelfEdit) {
          openWarning('ไม่สามารถแก้ไขข้อมูลของผู้พัฒนาคนอื่นได้');
          return;
        }
      }

      if (isSelfEdit && this.originalData.rank_no !== this.formData.rank_no) {
        openWarning('ไม่สามารถเปลี่ยนตำแหน่งของตัวเองได้');
        return;
      }

      if (currentRank === 'แอดมิน') {
        if (targetRank === 'ผู้พัฒนา') {
          openWarning('ไม่สามารถแก้ไขข้อมูลของผู้พัฒนาได้');
          return;
        }

        if (isSelfEdit) {
        } else {
          if (targetRank === 'แอดมิน') {
            openWarning('ไม่สามารถแก้ไขข้อมูลของแอดมินคนอื่นได้');
            return;
          }

          if (targetRank === 'พนักงานทั่วไป') {
            if (this.originalData.rank_no !== this.formData.rank_no) {
              openWarning('ไม่สามารถเปลี่ยนตำแหน่งของพนักงานทั่วไปได้');
              return;
            }
          }
        }
      }

      this.modal.confirm.open = true;
      await new Promise((resolve) => {
        this.$watch('modal.confirm.open', (newValue) => {
          if (!newValue) {
            resolve();
          }
        });
      });

      if (!this.modal.confirm.open) {
        return;
      }

      await this.updateData();
    },

    async updateData() {
      try {
        const req = await this.$store.dispatch('api/employee/updateEmployeeAll', this.formData);
        this.modal.complete.open = true;
        this.formData = { ...this.data }; 
        this.recordLog();
      } catch (warning) {
        this.modal.warning.open = true;
      }
    },

    setGenderOptions() {
      const allGenders = [
        { text: 'ชาย', value: 'ชาย', icon: 'mdi-face-man' },
        { text: 'หญิง', value: 'หญิง', icon: 'mdi-face-woman' },
        { text: 'ไม่ระบุ', value: 'ไม่ระบุ', icon: 'mdi-not-equal-variant' }
      ];

      if (this.data && this.data.gender) {
        this.genderOptions = [
          { text: this.data.gender, value: this.data.gender, icon: this.getGenderIcon(this.data.gender) },
          ...allGenders.filter(g => g.value !== this.data.gender)
        ];
      } else {
        this.genderOptions = allGenders;
      }
    },

    getGenderIcon(gender) {
      switch (gender) {
        case 'ชาย':
          return 'mdi-face-man';
        case 'หญิง':
          return 'mdi-face-woman';
        case 'ไม่ระบุ':
          return 'mdi-not-equal-variant';
        default:
          return '';
      }
    },

    getRankName(rankId) {
      const rank = this.ranks.find(r => r.no === rankId);
      return rank ? rank.rank : 'ไม่ทราบ';
    },

    setStatusOptions() {
      const allStatuses = [
        { value: 1, text: 'อนุมัติผู้ใช้งานแล้ว', color: '#24b224', icon: 'mdi-check-circle' },
        { value: 2, text: 'ยังไม่อนุมัติผู้ใช้งาน', color: '#e50211', icon: 'mdi-close-circle' },
      ];

      if (this.data && this.data.status) {
        const selectedStatus = allStatuses.find(s => s.value === this.data.status);
        this.statusOptions = selectedStatus
          ? [selectedStatus, ...allStatuses.filter(s => s.value !== this.data.status)]
          : allStatuses;
      } else {
        this.statusOptions = allStatuses;
      }
    },

    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.cancel();
      }
    },

    cancel() {
      this.modal.confirm.open = false;
      this.$emit('update:edit', false);
    },

    goBack() {
      window.location.reload();
    },

    handleConfirmMethod() {
      this.modal.confirm.open = false;
      this.updateData();
    },

    getStatusText(statusId) {
      const statuses = {
        1: 'อนุมัติผู้ใช้งานแล้ว',
        2: 'ยังไม่อนุมัติผู้ใช้งาน',
      };
      return statuses[statusId] || 'ไม่ทราบ';
    },

    recordLog() {
      const Employee_Name = this.$auth.user.fname + ' ' + this.$auth.user.lname;
      const Employee_Email = this.$auth.user.email;
      const Employee_Picture = this.$auth.user.picture;
      const changes = [];
      if (this.formData.fname !== this.originalData.fname) {
        changes.push('ชื่อเล่น : ' + this.formData.fname + '\n');
      }
      if (this.formData.lname !== this.originalData.lname) {
        changes.push('ชื่อ : ' + this.formData.lname + '\n');
      }
      if (this.formData.phone !== this.originalData.phone) {
        changes.push('เบอร์โทรศัพท์ : ' + this.formData.phone + '\n');
      }
      if (this.formData.gender !== this.originalData.gender) {
        changes.push('เพศ : ' + this.formData.gender + '\n');
      }
      if (this.formData.email !== this.originalData.email) {
        changes.push('อีเมล : ' + this.formData.email + '\n');
      }

      const rankText = this.getRankName(this.formData.rank_no);
      const originalRankText = this.getRankName(this.originalData.rank_no);
      if (rankText !== originalRankText) {
        changes.push('ตำแหน่ง : ' + rankText + '\n');
      }

      const statusText = this.getStatusText(this.formData.status);
      const originalStatusText = this.getStatusText(this.originalData.status);
      if (statusText !== originalStatusText) {
        changes.push('สถานะ : ' + statusText + '\n');
      }

      const log = {
        action: 'แก้ไขข้อมูลผู้ใช้งาน',
        name: this.originalData.fname + ' '+this.originalData.lname,
        detail: changes.join(''),
        type: 4,
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

.file-input {
  margin-bottom: 0px !important;
}

.v-card-actions {
  padding: 0 !important;
}

.v-btn {
  margin-top: 0px !important;
}
</style>
