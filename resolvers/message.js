import formatErrors from '../formatErrors';
import requiresAuth from '../permissions';
import { PubSub, withFilter } from 'graphql-subscriptions';

const pubsub = new PubSub();
const NEW_CHANNEL_MESSAGE = 'NEW_CHANNEL_MESSAGE';

export default {
    Subscription: {
        newChannelMessage: {
            subscribe: withFilter(
                () => pubsub.asyncIterator(NEW_CHANNEL_MESSAGE),
                (payload, args) => payload.channelId === args.channelId,
            ),
        },
    },
    Message: {
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
        createMessage: async (parent, args, { models, user }) => {
            try {
                const message = await models.Message.create({
                    ...args,
                    userId: user.id,
                });

                const asyncFunc = async () => {
                    const currentUser = await models.User.findOne({
                        where: {
                            id: user.id,
                        },
                    });

                    pubsub.publish(NEW_CHANNEL_MESSAGE, {
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