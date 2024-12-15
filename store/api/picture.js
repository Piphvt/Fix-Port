export const actions = {
    async getProfile({ getters }, data) {
        return await this.$axios
        .get('picture/profile', data)
        .then((res) => res.data)
    },
    async getDefault({ getters }, data) {
        return await this.$axios
        .get('picture/default', data)
        .then((res) => res.data)
    },        
    async downloadPicture({ getters }, data) {
        return await this.$axios
        .get('picture/profile/download/:picture', data)
        .then((res) => res.data)
    },
    async uploadPicture({ getters }, data) {
        return await this.$axios
        .post('picture/profile', data)
        .then((res) => res.data)
    },
    async getPicture({ getters }, data) {
        return await this.$axios
            .get('picture', data)
            .then((res) => res.data)
    },
    async updatePicture({ getters }, data) {
        return await this.$axios
        .put('picture/update-picture/:no', data)
        .then((res) => res.data)
    },
    async deleteProfile({ getters }, no) {
        return await this.$axios
        .delete(`picture/picture/${no}`)
        .then((res) => res.data)
    },
}