import { app } from './app'

app
  .listen({
    port: 3000,
  })
  .then(() => {
    console.log('Server is listening on port 3000')
  })
