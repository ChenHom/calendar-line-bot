import express, { Application, Request, Response } from 'express'
import * as line from '@line/bot-sdk'
import dotenv from 'dotenv'

dotenv.config();

const app: Application = express();
const port = process.env.PORT;
const lineConfig = {
    channelAccessToken: process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_BOT_CHANNEL_SECRET || '',
}

const client = new line.Client(lineConfig)

const textEventHandler = async (event: line.WebhookEvent): Promise<line.MessageAPIResponseBase | undefined> => {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return;
    }

    const { text } = event.message;

    const response: line.TextMessage = { 'type': 'text', text }

    await client.replyMessage(event.replyToken, response)
}

app.get(
    '/',
    async (_: Request, res: Response): Promise<Response> =>
        res.status(200).json({ "status": "success", "message": "connected successfully" })
)

app.post(
    '/hook',
    line.middleware(lineConfig),
    async (req: Request, res: Response): Promise<Response> => {
        const events: line.WebhookEvent[] = req.body.events

        const results = await Promise.all(
            events.map(async (event: line.WebhookEvent) => {
                try {
                    await textEventHandler(event)
                } catch (error) {
                    if (error instanceof Error) {
                        console.error(error)
                    }

                    return res.status(500).json({ "status": "error" })
                }
            })
        )

        return res.status(200).json({ "status": "success", results })
    })

app.listen(port, () => {
    console.log(`⚡️ [server]: Server is running at http://localhost:${port}`);
})
