import { withFilter } from 'graphql-subscriptions';

import formatErrors from '../formatErrors';
import requiresAuth, {
    requiresTeamAccess,
    directMessageSubscriptions
} from '../permissions';
import pubSub from '../pubsub'

const NEW_DIRECT_MESSAGE = 'NEW_DIRECT_MESSAGE';

export default {
    DirectMessage: {
        sender: ({ sender, senderId }, args, { models }) => {
            if(sender) return sender;
            return models.User.findOne({ where: { id: senderId } })
        }
    },
    Subscription: {
        newDirectMessage: {
            subscribe: directMessageSubscriptions.createResolver(withFilter(
                () => pubSub .asyncIterator(NEW_DIRECT_MESSAGE),
                (payload, args, context) => (payload.teamId === args.teamId)
                    && ((payload.senderId === context.user.id && payload.receiverId === args.userId) ||
                        (payload.senderId === args.userId && payload.receiverId === context.user.id)) ,
                    // context.user === args.channelId,
                ),
            ),
        },
    },
    Query: {
        directMessages: requiresAuth.createResolver(async (parent, { offset, teamId, otherUserId }, { models, user }) => {
            return models.DirectMessage.findAll({
              order: [['created_at', 'DESC']],
              where: {
                teamId, [models.sequelize.Op.or]: [
                  {
                    [models.sequelize.Op.and]: [{ receiverId: otherUserId, }, { senderId: user.id }]
                  }, {
                    [models.sequelize.Op.and]: [{ receiverId:  user.id, }, { senderId: otherUserId }]
                  }
                ]},
              limit: 10,
              offset
            }, {
              raw: true
            },);
        })
    },
    Mutation: {
        createDirectMessage: async (parent, args, { models, user }) => {
            try {
                const directMessage = await models.DirectMessage.create({
                    ...args,
                    senderId: user.id,
                });

                pubSub.publish(NEW_DIRECT_MESSAGE, {
                    teamId: args.teamId,
                    senderId: user.id,
                    receiverId: args.receiverId,
                    newDirectMessage: {
                        ...directMessage.dataValues,
                        sender: {
                            username: user.username,
                        },
                    },
                });

                return true;
            } catch (err) {
                console.log(err);
                return false;
            }
        },
    },
};