export const actions = {
    async getBase({ getters }, data) {
        return await this.$axios
            .get('base', data)
            .then((res) => res.data)
    },
    async addBase({ getters }, data) {
        return await this.$axios
            .post('base', data)
            .then((res) => res.data)
    },
    async updateBase({ getters }, data) {
        return await this.$axios
            .$put(`base/update-base/${data.no}`, data)
            .then((res) => res.data)
    },
    async deleteBase({ getters }, no) {
        return await this.$axios
            .delete(`base/${no}`)
            .then((res) => res.data)
    }
}