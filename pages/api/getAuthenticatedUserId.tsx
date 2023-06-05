import { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const { sessionId, userId } = getAuth(req)

  if (!sessionId) {
    return res.status(401).json({ id: null })
  }

  return res.status(200).json({ id: userId })
}

export default handler
