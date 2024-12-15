export const actions = {
    async getLog({ getters }, data) {
        return await this.$axios
            .get('log', data)
            .then((res) => res.data)
    },
    async getLogByType({ getters }, no) {
        return await this.$axios
            .get(`log/type/${no}`)
            .then((res) => res.data)
    },
    async addLog({ getters }, data) {
        return await this.$axios
            .post('log', data)
            .then((res) => res.data)
    },
    async deleteLog({ getters }, no) {
        return await this.$axios
          .delete(`log/${no}`)
          .then((res) => res.data)
      },
}