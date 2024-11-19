<template>
    <div>
      <!-- Modal สำหรับกรอก OTP -->
      <ModalVerify :open.sync="modal.verify.open" :message="modal.verify.message" @confirm="handleVerify" />
      
      <v-container>
        <!-- ฟอร์มสำหรับกรอกอีเมล -->
        <v-form @submit.prevent="handleSubmit">
          <v-text-field v-model="email" label="Enter your email" type="email" required></v-text-field>
          <v-btn type="submit" color="primary">Submit</v-btn>
        </v-form>
      </v-container>
    </div>
  </template>
  
  <script>
  // import ModalVerify.vue มาใช้ (ตรวจสอบว่าคุณได้สร้างหรือ import โมดัลนี้เข้ามาแล้ว)
  
  export default {
    data() {
      return {
        email: '', // email ที่กรอกในฟอร์ม
        modal: {
          verify: {
            open: false, // ควบคุมการแสดง/ซ่อนของ Modal
            message: '', // ข้อความที่จะแสดงใน Modal
          }
        }
      };
    },
    methods: {
      async handleSubmit() {
        try {
          // ส่งคำขอไปยังเซิร์ฟเวอร์เพื่อขอ OTP
          const response = await this.$axios.post('/auth/forgot-password', { email: this.email });
          console.log('OTP sent:', response.data);
  
          // ตั้งค่าข้อความและเปิด Modal สำหรับกรอก OTP
          this.modal.verify.message = 'กรุณากรอก OTP ที่ส่งไปยังอีเมลของคุณ';
          this.modal.verify.open = true; // เปิด Modal
  
        } catch (error) {
          console.error('Error:', error.response?.data?.message || error);
          alert('Error sending reset password request');
        }
      },
  
      async handleVerify(additionalInfo) {
        try {
          // เมื่อ OTP ถูกกรอกและ Confirm
          console.log('OTP Confirmed with additional info:', additionalInfo);
  
          // ส่งข้อมูล OTP ที่กรอกมานั้นไปยังเซิร์ฟเวอร์เพื่อตรวจสอบ
          const response = await this.$axios.post('/auth/verify-otp', {
            email: this.email, // ส่งอีเมล
            otp: additionalInfo, // ส่ง OTP ที่กรอก
          });
  
          console.log(response.data); // หากยืนยันสำเร็จ
  
          // หลังจากยืนยัน OTP สำเร็จ ให้ไปยังหน้าสำหรับรีเซ็ตรหัสผ่าน
          this.$router.push('/auth/reset-password');
        } catch (error) {
          console.error('Error verifying OTP:', error.response?.data?.message || error);
          alert('Invalid OTP, please try again.');
        }
      }
    }
  };
  </script>
  