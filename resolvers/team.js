import formatErrors from '../formatErrors';
import requiresAuth from '../permissions';

export default {
    Query: {
        allTeams: requiresAuth.createResolver(async (parent, args, { models, user }) => {
            // const teams = await models.Team.findAll({ owner: user.id }, { raw: true })
            return models.Team.findAll({ owner: user.id }, { raw: true })

        }),
    },
    Mutation: {
        createTeam: requiresAuth.createResolver(async (parent, args, { models, user }) => {
            try {
                await models.Team.create({ ...args, owner: user.id });
                return {
                    ok: true
                };
            } catch (err) {
                console.log(err);
                return {
                    ok: false,
                    errors: formatErrors(err, models)
                };
            }
        }),
    },
    Team: {
        channels: ({ id }, args, { models, user }) => {
            return models.Channel.findAll({ teamId: id })
        }
    }
};
