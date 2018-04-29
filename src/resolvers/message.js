import { withFilter } from 'graphql-subscriptions';
import formatErrors from '../formatErrors';
import requiresAuth, { requiresTeamAccess } from '../permissions';
import pubSub from '../pubSub'
const NEW_CHANNEL_MESSAGE = 'NEW_CHANNEL_MESSAGE';

export default {
    Subscription: {
        newChannelMessage: {
            subscribe: requiresTeamAccess.createResolver(withFilter(
                () => pubSub.asyncIterator(NEW_CHANNEL_MESSAGE),
                (payload, args) => payload.channelId === args.channelId,
                ),
            ),
        },
    },
    Message: {
      url: (parent, args, { serverUrl }) => `${process.env.SERVER_URL || 'http://localhost:3001'}/${parent.url}`,
        user: ({ user, userId }, args, { models }) => {
            if(user) return user;
            return models.User.findOne({ where: { id: userId } })
        }
    },
    Query: {
        messages: requiresAuth.createResolver(async (parent, { channelId }, { models, user }) => {
            return models.Message.findAll(
                { order: [['created_at', 'ASC']], where: { channelId } },
                { raw: true },
            );
        })
    },
    Mutation: {
        createMessage: async (parent, { file, ...args }, { models, user }) => {
            try {
              const messageData = args;
              if(file) {
                messageData.filetype = file.type,
                messageData.url = file.path
              }
                const message = await models.Message.create({
                    ...messageData,
                    userId: user.id,
                });

                const asyncFunc = async () => {
                    const currentUser = await models.User.findOne({
                        where: {
                            id: user.id,
                        },
                    });

                    pubSub.publish(NEW_CHANNEL_MESSAGE, {
                        channelId: args.channelId,
                        newChannelMessage: {
                            ...message.dataValues,
                            user: currentUser.dataValues,
                        },
                    });
                };

                asyncFunc();
                return true;
            } catch (err) {
                // console.log(err);
                return false;
            }
        },
    },
};