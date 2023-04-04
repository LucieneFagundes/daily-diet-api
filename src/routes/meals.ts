import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const sessionId = request.cookies.sessionId
      const meals = await knex('meals').where('user_id', sessionId).select()

      return { meals }
    },
  )

  app.post(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        diet: z.enum(['y', 'n']),
        time: z.string(),
      })

      const newMealRequest = createMealBodySchema.parse(request.body)

      const sessionId = request.cookies.sessionId

      await knex('meals').insert({
        id: randomUUID(),
        name: newMealRequest.name,
        description: newMealRequest.description,
        time: newMealRequest.time,
        user_id: sessionId,
      })

      return reply.status(201).send()
    },
  )
}
