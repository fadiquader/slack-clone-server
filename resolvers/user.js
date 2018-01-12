import formatErrors from '../formatErrors';
import { tryLogin } from "../auth";

export default {
    Query: {
        getUser: (parent, { id }, { models }) => models.User.findOne({ where: { id } }),
        allUsers: (parent, args, { models }) => models.User.findAll(),
    },
    Mutation: {
        register: async (parent, { password, ...otherArgs }, { models }) => {
            try {
                if(password.length < 5 || password.length > 100) {
                    return {
                        ok: false,
                        errors: [{
                            path: 'password',
                            message: 'the password should be between 5 and 100 characters long'
                        }]
                    }
                }
                const user = await models.User.create({ ...otherArgs, password });
                return {
                    ok: true,
                    user
                };
            } catch (err) {
                return {
                    ok: false,
                    errors: formatErrors(err, models)
                };
            }
        },
        login: async (parent, { email, password }, { models, SECRET, SECRET2 }) => {
            return tryLogin(email, password, models, SECRET, SECRET2)
        },
    },
};