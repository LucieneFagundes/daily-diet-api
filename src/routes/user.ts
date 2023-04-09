import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import { knex } from '../database'
import { z } from 'zod'
import { compare, hash } from 'bcryptjs'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function userRoutes(app: FastifyInstance) {
  // Login
  app.post('/login', async (request, reply) => {
    const requestUserBodySchema = z.object({
      username: z.string(),
      password: z.string(),
    })

    const { username, password } = requestUserBodySchema.parse(request.body)

    const user = await knex('users')
      .where('username', username)
      .first()
      .select('id', 'username', 'password')

    if (!user?.username) {
      throw new Error(`Username or password wrong`)
    }

    const passwordMatch = await compare(user.password, password)

    if (passwordMatch) {
      throw new Error(`Username or password wrong`)
    }

    const sessionId = user.id

    return reply
      .status(200)
      .cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 12, // 12 hours
      })
      .send()
  })

  // Create a new user
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      username: z.string().min(5, {
        message: 'Username too short, please enter a valid username',
      }),
      password: z.string().min(8, {
        message: 'Password too short, please enter a valid password',
      }),
    })

    const { username, password } = createUserBodySchema.parse(request.body)

    const hashPassword = await hash(password, 8)

    const user = await knex('users')
      .insert({
        id: randomUUID(),
        username,
        password: hashPassword,
      })
      .returning('*')

    const sessionId = user[0].id

    return reply
      .status(201)
      .cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 12, // 12 hours
      })
      .send()
  })

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const totalMeals = await knex('meals')
        .where({
          user_id: sessionId,
        })
        .count('id', { as: 'totalMeals' })
        .first()

      const totalMealsOnDiet = await knex('meals')
        .where({
          user_id: sessionId,
          diet: 'y',
        })
        .count('diet', { as: 'totalMealsOnDiet' })
        .first()

      const totalMealsNotOnDiet = await knex('meals')
        .where({
          user_id: sessionId,
          diet: 'n',
        })
        .count('diet', { as: 'totalMealsNotOnDiet' })
        .first()

      const meals = await knex('meals')
        .where({ user_id: sessionId })
        .orderBy('time')
        .select('diet')

      const bestSequenceMeal = meals.map((item) => item.diet)

      const minRecovery = 1
      let count = 0
      let recovery = 0

      for (let i = 0; i < bestSequenceMeal.length; i++) {
        if (bestSequenceMeal[i] === 'y') {
          count++
        }

        if (bestSequenceMeal[i] === 'n') {
          if (count >= minRecovery && count > recovery) {
            recovery = count
          }
          count = 0
        }

        if (count >= minRecovery && count > recovery) {
          recovery = count
        }
      }

      const summary = []
      summary.push(totalMeals)
      summary.push(totalMealsOnDiet)
      summary.push(totalMealsNotOnDiet)
      summary.push({ bestSequence: recovery })

      return summary
    },
  )
}
