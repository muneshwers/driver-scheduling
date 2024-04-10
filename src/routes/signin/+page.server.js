import { users } from '../data.js';

export const actions = {
    default: async ({request}) => {
        const data = await request.formData();
        const username = data.get('username');
        const password = data.get('password');

        let userLogin = users.find((user) => user.username == username);

        if (userLogin.username == username && userLogin.password == password) {
            document.write("Sign in Success");
        }
    }
}