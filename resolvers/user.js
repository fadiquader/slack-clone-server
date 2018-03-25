import formatErrors from '../formatErrors';
import { tryLogin } from "../auth";
import  requiresAuth from "../permissions";

export default {
    User: {
      teams: (parent, args, { models, user }) =>
          models.sequelize.query(
              `
                SELECT * FROM teams as team JOIN members as member ON team.id=member.team_id WHERE member.user_id=${user.id} 
              `,
              { model: models.Team, raw: true })
    },
    Query: {
        me: requiresAuth.createResolver(async (parent, args, { models, user }) => {
            return models.User.findOne({ where: { id: user.id } })
        }),
        getUser: requiresAuth.createResolver(async (parent, args, { models, user }) => {
            return models.User.findOne({ where: { id: args.userId }})
        })
        ,
        allUsers: (parent, args, { models }) => models.User.findAll(),
        allTeams: requiresAuth.createResolver(async (parent, args, { models, user }) => {
            // const teams = await models.Team.findAll({ owner: user.id }, { raw: true })
            return models.Team.findAll({ owner: user.id }, { raw: true })
        }),
        inviteTeams: requiresAuth.createResolver(async (parent, args, { models, user }) => {
            return models.sequelize.query(
                `
                SELECT * FROM teams JOIN members ON id=team_id WHERE user_id=${user.id} 
                `,
                { model: models.Team })
            // return models.Team.findAll(
            //     {
            //         include: [
            //             {
            //                 model: models.User,
            //                 where: { id: user.id },
            //             },
            //         ],
            //     },
            //     { raw: true },
            // )
        }),
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