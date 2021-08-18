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

            const newsletterProperties: {[key:string]: string} = {
                changelog: "unsubscribed_changelog",
                devx: "unsubscribed_devx"
            }

            const email: string = req.query.email;
            // What happens if wrong type
            const newsletterType: string = req.query.type;

            // if (newsletterType !== "changelog" && newsletterType !== "devx" ) {
            //     return;
            // }

            const user = (await this.userDb.findUsersByEmail(email))[0];

            // check if newsletterType exists in newsletterProperties

            if (user) {
                await this.gitpodServer.updateLoggedInUser(user);

                this.analytics.track({
                    userId: user.id,
                    event: "notification_change",
                    properties: {
                        [newsletterProperties[newsletterType]]: true,
                    }
                });
            }
            else {
                this.analytics.track({
                    userId: "no-user",
                    event: "notification_change",
                    properties: {
                        [newsletterProperties[newsletterType]]: true,
                    }
                });
            }

            res.send(`Checking ${newsletterType} subscription which is ${user.fullName}`);
        })

        return router;
    }
}