export default `
  type Team {
    id: Int!
    name: String!
    members: [User!]!
    directMessageMembers: [User!]!
    channels: [Channel!]!
    admin: Boolean!
  }
  
  type CreateTeamResponse {
    ok: Boolean!
    team: Team
    errors: [Error!]
  }

  type VoidResponse {
    ok: Boolean!
    errors: [Error!]
  }
  
  type Query {
    allTeams: [Team!]
    inviteTeams: [Team!]
    getTeamMembers(teamId: Int!): [User!]!
  }
  
  type Mutation {
    createTeam(name: String!): CreateTeamResponse!
    addTeamMember(email: String!, teamId: Int!): VoidResponse!
  }
`;