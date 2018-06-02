import formatErrors from '../formatErrors';
import requiresAuth from '../permissions';

export default {
  Mutation: {
    createChannel: requiresAuth.createResolver(async (parent, args, { models, user }) => {
      try {
        const member = await models.Member.findOne({ where: { teamId: args.teamId, userId: user.id } }, { raw: true });
        if (!member.admin) {
          throw new Error('name');
        }
        const channel = await models.Channel.create(args);
        return {
          ok: true,
          channel,
        };
      } catch (err) {
        let errors = [];
        if (err.message === 'not owner') {
          errors.push({
            path: 'team',
            message: 'your do not have previlige to create channel in this team',
          });
        } else {
          errors = formatErrors(err, models);
        }
        return {
          ok: false,
          errors,
        };
      }
    }),
  },
};
