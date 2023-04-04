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

  app.get(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)
      const { sessionId } = request.cookies

      const meal = await knex('meals').where({ id, user_id: sessionId }).first()

      console.log(meal)
      console.log(sessionId)
      if (!meal) {
        return reply.status(400).send({
          message: 'Refeição não encontrada',
        })
      }

      return { meal }
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)
      const { sessionId } = request.cookies

      await knex('meals').where({ id, user_id: sessionId }).delete()
    },
  )

  app.patch(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {},
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
