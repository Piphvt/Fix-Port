export const actions = {
    async getPrice({ getters }, data) {
        return await this.$axios
            .get('price', data)
            .then((res) => res.data)
    },
    async addPrice({ getters }, data) {
        return await this.$axios
            .post('price', data)
            .then((res) => res.data)
    },
    async updatePrice({ getters }, data) {
        return await this.$axios
            .$put(`price/update-price/${data.no}`, data)
            .then((res) => res.data)
    },
    async deletePrice({ getters }, no) {
        return await this.$axios
            .delete(`price/${no}`)
            .then((res) => res.data)
    }
}