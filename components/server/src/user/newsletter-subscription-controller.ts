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
            const newsletterType: string = req.query.type; //What happens if wrong type
            const acceptedNewsletterTypes: string[] = ["changelog", "devx"];
            const newsletterProperties: {[key:string]: {[key: string]: string}} = {
                changelog: {
                    property: "unsubscribed_changelog",
                    value: "allowsChangelogMail"
                },
                devx: {
                    property: "unsubscribed_devx",
                    value: "allowsDevxMail"
                }
            }

            if (acceptedNewsletterTypes.includes(newsletterType)) {
                res.sendStatus(422);
            }

            const user = (await this.userDb.findUsersByEmail(email))[0];

            if (user) {
                await this.gitpodServer.updateLoggedInUser(user);

                this.analytics.track({
                    userId: user.id,
                    event: "notification_change",
                    properties: {
                        [newsletterProperties[newsletterType].property]: true,
                    }
                });
            }
            else {
                this.analytics.track({
                    userId: "no-user",
                    event: "notification_change",
                    properties: {
                        [newsletterProperties[newsletterType].property]: true,
                    }
                });
            }

            console.log("logging ", {
                userId: "no-user",
                event: "notification_change",
                properties: {
                    [newsletterProperties[newsletterType].property]: true,
                }
            });

            res.send(`Checking ${newsletterType} subscription which is ${user.fullName}`);
        })

        return router;
    }
}