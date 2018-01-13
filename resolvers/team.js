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
                const team = await models.Team.create({ ...args, owner: user.id });
                const channel = await models.Channel.create({
                    name: 'general',
                    public: true,
                    teamId: team.id
                });
                return {
                    ok: true,
                    team
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
            return models.Channel.findAll({ where: { teamId: id } })
        }
    }
};
