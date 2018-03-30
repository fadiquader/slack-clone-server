import formatErrors from '../formatErrors';
import requiresAuth from '../permissions';

export default {
    Query: {
        getTeamMembers: requiresAuth.createResolver(async (parent, { teamId }, { models, user }) => {
            return models.sequelize.query(
                `
                SELECT * FROM users as u JOIN members as member ON member.user_id=u.id WHERE member.team_id=${teamId}
              `,
                { model: models.User, raw: true })
        }),
    },
    Mutation: {
        createTeam: requiresAuth.createResolver(async (parent, args, { models, user }) => {
            try {
                const response = await models.sequelize.transaction(async (transaction) => {
                    const team = await models.Team.create({ ...args }, { transaction });
                    const channel = await models.Channel.create({
                        name: 'general',
                        public: true,
                        teamId: team.id
                    }, {
                      transaction
                    });
                    await models.Member.create({ teamId: team.id, userId: user.id, admin: true }, { transaction })
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
                const [member, userToAdd] = await Promise.all([
                    models.Member.findOne({ where: { teamId, userId: user.id }}, { raw: true }),
                    models.User.findOne({ where: { email } }, { raw: true })
                ]);
                if(!member.admin) throw new Error('not owner');
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
      channels: ({ id }, args, { channelLoader }) => channelLoader.load(id),
      directMessageMembers: ({ id }, args, { models, user }) => {
            // distinct => we don't multipe users with same id
            return models.sequelize.query(`select distinct on (u.id) u.id, u.username from users as u join direct_messages as dm on (u.id=dm.receiver_id) where (:currentUserId=dm.sender_id or :currentUserId=dm.sender_id) and dm.team_id=:teamId`, {
                replacements: { currentUserId: user.id, teamId: id },
                model: models.User,
                raw: true
            })
        }
    }
};

