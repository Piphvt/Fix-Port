<template>
  <div>
    <v-app :style="appBackgroundStyle">
      <v-app-bar :clipped-left="clipped" fixed app :color="navBarColor" dark>
        <v-toolbar-title class="d-flex align-center" @click="home">
          <v-img :src="`${$config.API_URL}/file/default/logo.png`" max-width="120" contain class="logo-img" />
        </v-toolbar-title>

        <v-spacer />
        <div class="d-flex" style="align-items: center">
          <v-btn @click="toggleTheme" rounded class="theme-toggle-btn">
            <h4>
              <v-icon :class="iconColor">
                {{ $vuetify.theme.dark ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
              </v-icon>
            </h4>
          </v-btn>
          <v-btn text @click="gotoLogin" rounded :class="loginBtnClass">
            เข้าสู่ระบบ
          </v-btn>
        </div>
      </v-app-bar>

      <v-main>
        <v-container>
          <nuxt />
        </v-container>
      </v-main>
    </v-app>
  </div>
</template>

<script>
export default {
  data() {
    return {
      clipped: false,
      fixed: false,
    };
  },

  methods: {
    gotoLogin() {
      this.$router.push('/auth');
    },

    toggleTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    },

    home() {
      this.$router.push('/');
    },
  },

  computed: {
    iconColor() {
      return this.$vuetify.theme.dark ? 'night-icon' : 'day-icon';
    },

    loginBtnClass() {
      return this.$vuetify.theme.dark ? 'login-btn-night' : 'login-btn-day';
    },

    navBarColor() {
      return this.$vuetify.theme.dark ? '#545454' : '#fff6ea';
    },

    appBackgroundStyle() {
      const backgroundUrl = `${this.$config.API_URL}/file/default/background.png`;
      return {
        backgroundColor: this.$vuetify.theme.dark ? '#545454' : '#fff6ea',
        backgroundImage: `url('${backgroundUrl}')`,
        backgroundSize: '45%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    },
  },
};
</script>

<style scoped>
.logo-img {
  cursor: pointer;
}

.theme-toggle-btn {
  background-color: #000000 !important;
  margin-right: 8px;
}

.day-icon {
  color: #ffc800 !important;
}

.night-icon {
  color: #85d7df !important;
}

.login-btn-night {
  background-color: #000000 !important;
  color: #85d7df !important;
}

.login-btn-day {
  background-color: #000000 !important;
  color: #ffc800 !important;
}
</style>
