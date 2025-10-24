import express from 'express'

const router = express.Router()

// Placeholder routes for messages
router.get('/', (req, res) => {
  res.json({ message: 'Message route placeholder' })
})

export default router
