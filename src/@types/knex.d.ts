// eslint-disable-next-line
import knex from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      username: string
      password: string
      created_at: string
    }
    meals: {
      id: string
      name: string
      description: string
      diet: string
      time: string
      created_at: string
      user_id: string
    }
  }
}
