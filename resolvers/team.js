import formatErrors from '../formatErrors';
import requiresAuth from '../permissions';

export default {
    Query: {
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
        createTeam: requiresAuth.createResolver(async (parent, args, { models, user }) => {
            try {
                const response = await models.sequelize.transaction(async () => {
                    const team = await models.Team.create({ ...args, owner: user.id });
                    const channel = await models.Channel.create({
                        name: 'general',
                        public: true,
                        teamId: team.id
                    });
                    return team;
                });

                return {
                    ok: true,
                    team: response
                };
            } catch (err) {
                console.log(err);
                return {
                    ok: false,
                    errors: formatErrors(err, models)
                };
            }
        }),
        addTeamMember: requiresAuth.createResolver(async (parent, { email, teamId }, { models, user }) => {
            try {
                // const owner = await models.User.findOne({ where: { id: user.id }}, { raw: true });
                const [team, userToAdd] = await Promise.all([
                    models.Team.findOne({ where: { id: teamId }}, { raw: true }),
                    models.User.findOne({ where: { email } }, { raw: true })
                ]);
                if(user.id != team.owner) throw new Error('not owner');
                else if(!userToAdd) throw new Error('no user');
                await models.Member.create({ userId: userToAdd.id, teamId });
                return {
                    ok: true,
                };
            } catch (err) {
                let errors = [];
                switch (err.message) {
                    case 'not owner':
                        errors.push({ path: 'email', message: `You can't add member to the team`})
                        break;
                    case 'no user':
                        errors.push({ path: 'email', message: `couldn't find user with this email.`})
                        break;
                    default:
                        errors = formatErrors(err, models);
                }
                return {
                    ok: false,
                    errors
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
