/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import * as express from 'express';
import { inject, injectable } from "inversify";
import { UserDB } from "@gitpod/gitpod-db/lib";
import { GitpodServer } from "@gitpod/gitpod-protocol";
import { IAnalyticsWriter } from "@gitpod/gitpod-protocol/lib/analytics";

@injectable()
export class NewsletterSubscriptionController {
    @inject(UserDB) protected readonly userDb: UserDB;
    @inject(GitpodServer) protected readonly gitpodServer: GitpodServer;
    @inject(IAnalyticsWriter) protected readonly analytics: IAnalyticsWriter;

    get apiRouter(): express.Router {
        const router = express.Router();

        router.get("/unsubscribe", async (req: express.Request, res: express.Response) => {

            const email: string = req.query.email;
            const newsletterType: string = req.query.type;

            const user = await this.userDb.findUsersByEmail(email);

            const newsletterProperties = {
                changelog: ["unsubscribed_devx", "allowsChangelogMail"],
                devx: ["unsubscribed_changelog", "allowsDevXMail"]
            }

            if (user[0]) {
                await this.gitpodServer.updateLoggedInUser(user[0]);

                this.analytics.track({
                    userId: user[0].id,
                    event: "notification_change",
                    properties: {
                        [newsletterProperties[newsletterType][0]]: !newsletterProperties[newsletterType][1],
                    }
                });
            }
            else {
                this.analytics.track({
                    userId: "no-user",
                    event: "notification_change",
                    properties: {
                        [newsletterProperties[newsletterType][0]]: !newsletterProperties[newsletterType][1],
                    }
                });
            }


            res.send(`Checking ${newsletterType} subscription for ${user.length} email which is ${user[0].fullName}`);
        })

        return router;
    }
}