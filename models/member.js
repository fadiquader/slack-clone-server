import bcrypt from 'bcrypt';

export default (sequelize, DataTypes) => {
    const Member = sequelize.define('member', {
    });

    return Member;
};