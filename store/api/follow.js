export const actions = {
    async getFollow({ getters }, data) {
        return await this.$axios
            .get('follow', data)
            .then((res) => res.data)
    },
    async getFollowResult({ getters }, no) {
        return await this.$axios
            .get(`follow/result/${no}`)
            .then((res) => res.data)
    },
    async addFollow({ getters }, data) {
        return await this.$axios
            .post('follow', data)
            .then((res) => res.data)
    },
    async updateFollow({ getters }, data) {
        return await this.$axios
            .$put(`follow/update-follow/${data.no}`, data)
            .then((res) => res.data)
    },
    async deleteFollow({ getters }, no) {
        return await this.$axios
            .delete(`follow/${no}`)
            .then((res) => res.data)
    },
}