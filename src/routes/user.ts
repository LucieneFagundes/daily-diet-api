import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import { knex } from '../database'
import { z } from 'zod'
import { hash } from 'bcryptjs'

export async function userRoutes(app: FastifyInstance) {
  // List all users - temporarily
  app.get('/', async (request, reply) => {
    const users = await knex('users').select()

    return reply.status(200).send({ users })
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

    await knex('users').insert({
      id: randomUUID(),
      username,
      password: hashPassword,
    })

    return reply.status(201).send()
  })
}
