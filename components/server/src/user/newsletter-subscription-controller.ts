/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import * as express from 'express';
import { inject, injectable } from "inversify";
import { UserDB } from "@gitpod/gitpod-db/lib";

@injectable()
export class NewsletterSubscriptionController {
    @inject(UserDB) protected readonly userDb: UserDB;

    get apiRouter(): express.Router {
        const router = express.Router();

        router.get("/unsubscribe", async (req: express.Request, res: express.Response) => {

            console.log(req.query)
            const email: string = req.query.email;
            const newsletterType: string = req.query.type;

            const userWithEmailExists = await this.userDb.findUsersByEmail(email);
            if (userWithEmailExists) {
            }


            res.send(`Checking ${newsletterType} subscription for ${userWithEmailExists.length} email which is ${userWithEmailExists[0].fullName}`);
        })

        return router;
    }
}