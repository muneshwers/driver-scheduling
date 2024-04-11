import { users } from '../data.js';
import { redirect } from '@sveltejs/kit';


export const actions = {
    default: async ({request}) => {
        const data = await request.formData();
        const username = data.get('username');
        const password = data.get('password');

        let userLogin = users.find((user) => user.username == username);

        if (userLogin.username == username && userLogin.password == password) {
            console.log("Login Successful");
            const data = { isLoggedIn: true };
            redirect(303, `/?isLoggedIn=${data.isLoggedIn}`);
            
        }
    }
}