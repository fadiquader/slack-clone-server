export default `
  
  type Team {
    owner: User!
    members: [User!]!
    channels: [Channel!]!
  }
  type Channel {
    id:Int!
    public: Boolean!
    messages: [Message!]!
    team: Team!
    users: [User!]!
  }
  type Message {
    id: Int!
    text: String!
    user: User!
    channer: Channel!  
  }
  type User {
    id: Int!
    username: String!
    email: String!
    messages: Message!
    teams: [Team!]!
  }
  type Query {
    hi: String
  }
  
`