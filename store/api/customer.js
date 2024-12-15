export const actions = {
    async getCustomer({ getters }, data) {
        return await this.$axios
            .get('customer', data)
            .then((res) => res.data)
    },
    async addCustomer({ getters }, data) {
        return await this.$axios
            .post('customer', data)
            .then((res) => res.data)
    },
    async updateCustomer({ getters }, data) {
        return await this.$axios
            .$put(`customer/update-customer/${data.no}`, data)
            .then((res) => res.data)
    },
    async deleteCustomer({ getters }, no) {
        return await this.$axios
            .delete(`customer/${no}`)
            .then((res) => res.data)
    }
}