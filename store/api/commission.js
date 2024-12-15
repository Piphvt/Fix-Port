export const actions = {
    async getCommission({ getters }, data) {
        return await this.$axios
            .get('commission', data)
            .then((res) => res.data)
    },
    async addCommission({ getters }, data) {
        return await this.$axios
            .post('commission', data)
            .then((res) => res.data)
    },
    async updateCommission({ getters }, data) {
        return await this.$axios
            .$put(`commission/update-commission/${data.no}`, data)
            .then((res) => res.data)
    },
    async deleteCommission({ getters }, no) {
        return await this.$axios
            .delete(`commission/${no}`)
            .then((res) => res.data)
    }
}