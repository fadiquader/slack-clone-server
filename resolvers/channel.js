import formatErrors from '../formatErrors';
import requiresAuth from '../permissions';

export default {
    Mutation: {
        createChannel: requiresAuth.createResolver( async (parent, args, {models, user}) => {
            try {
                const team = await models.Team.findOne({ where: { id: args.teamId }}, { raw: true })
                if(team && team.owner !== user.id) {
                    throw new Error('name')
                }
                const channel = await models.Channel.create(args);
                return {
                    ok: true,
                    channel
                };
            } catch (err) {
                let errors = [];
                if(err.message === 'not owner'){
                    errors.push({
                        path: 'team',
                        message: "your do not have previlige to create channel in this team"
                    })
                } else  {
                    errors = formatErrors(err, models)
                }
                return {
                    ok: false,
                    errors
                };
            }
        }),
    }
};