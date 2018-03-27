import axios from 'axios';
import { XMLHttpRequest } from 'xmlhttprequest';

global.XMLHttpRequest = XMLHttpRequest;
describe('user resolvers', () => {
  test('allUsers', async () => {
    const res = await axios.post('http://localhost:3001/graphql', {
            query: `
         query {
          allUsers {
            id
            username
            email
          }
        }
            `
        })

    const { data } = res

    // expect(data).toMatchObject({
    //   "data": {
    //     "allUsers": []
    //   }
    // })
  })

  test('create user', async () => {
    const res = await axios.post('http://localhost:3001/graphql', {
      query:
        `mutation {
          register(username: "test5", email: "test5@gmail.com", password: "123456") {
            ok
            user {
              username
            }
            errors {
              message
            }
          }
        }`
    })

    const { data } = res
    expect(data).toMatchObject({
      "data": {
        "register": {
          "ok": true,
          "user": {
            "username": "test5"
          },
          "errors": null
        }
      }
    })
  })
})