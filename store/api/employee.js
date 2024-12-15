export const actions = {
    async getEmployee({ getters }, data) {
      return await this.$axios
        .get('employee', data)
        .then((res) => res.data)
    },
    async updateEmployee({ getters }, data) {
      return await this.$axios
        .$put(`employee/update-employee/${data.no}`, data)
        .then((res) => res.data)
    },
    async updateEmployeeAll({ getters }, data) {
      return await this.$axios
        .put(`employee/update-employee-all/${data.no}`, data)
        .then((res) => res.data)
    },
    async updateEmployeeStatus({ getters }, data) {
      return await this.$axios
        .put(`employee/update-employee-status/${data.no}`, data)
        .then((res) => res.data)
    },
    async deleteEmployee({ getters }, no) {
      return await this.$axios
        .delete(`employee/${no}`)
        .then((res) => res.data)
    },
    async updatePassword({ getters }, data) {
      return await this.$axios
        .put(`employee/update-password/${data.no}`, data)
        .then((res) => res.data)
    },
    async getEmployeesStatus({ getters }, no) {
      return await this.$axios
        .get(`employee/status/${no}`)
        .then((res) => res.data)
    },
    async register({ getters }, data) {
      return await this.$axios
        .post('auth/register', data)
        .then((res) => res.data)
    }
}